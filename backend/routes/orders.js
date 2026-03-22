const { Order } = require('../models/order');
const express = require('express');
const { OrderItem } = require('../models/order-item');
const { Product } = require('../models/product');
const { User } = require('../models/user');
const { sendOrderStatusNotification } = require('../helpers/push-notifications');
const router = express.Router();
const mongoose = require('mongoose');

const normalizeIncomingOrderItems = (orderItems = []) => {
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        throw new Error('Order must contain at least one item');
    }

    return orderItems.map((orderItem) => {
        const rawProductId = orderItem?.product?._id || orderItem?.product?.id || orderItem?.product || orderItem?._id || orderItem?.id;
        const quantity = Number(orderItem?.quantity);

        if (!rawProductId || !mongoose.isValidObjectId(rawProductId)) {
            throw new Error('Invalid product in order items');
        }

        if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new Error('Invalid quantity in order items');
        }

        return {
            product: rawProductId.toString(),
            quantity,
        };
    });
};

const groupOrderItemsByProduct = (orderItems = []) => {
    const grouped = new Map();

    for (const item of orderItems) {
        const previousQuantity = grouped.get(item.product) || 0;
        grouped.set(item.product, previousQuantity + item.quantity);
    }

    return grouped;
};

const computeOrderTotalFromItems = async (orderItems = []) => {
    let total = 0;

    for (const orderItem of orderItems) {
        const quantity = Number(orderItem?.quantity) || 0;
        let unitPrice = 0;

        if (orderItem?.product && typeof orderItem.product === 'object' && orderItem.product.price !== undefined) {
            unitPrice = Number(orderItem.product.price) || 0;
        } else {
            const productId = orderItem?.product || orderItem?._id || orderItem?.id;
            if (productId) {
                const product = await Product.findById(productId).select('price');
                unitPrice = Number(product?.price) || 0;
            }
        }

        total += quantity * unitPrice;
    }

    return Number(total.toFixed(2));
};

const withResolvedTotal = async (order) => {
    if (!order) {
        return order;
    }

    const normalizedTotal = Number(order.totalPrice);
    if (Number.isFinite(normalizedTotal) && normalizedTotal > 0) {
        return order;
    }

    const computedTotal = await computeOrderTotalFromItems(order.orderItems || []);
    order.totalPrice = computedTotal;
    return order;
};

router.get(`/`, async (req, res) => {
    const orderList = await Order.find()
        .populate('user', 'name')
        .populate({
            path: 'orderItems',
            populate: {
                path: 'product',
                select: 'price'
            }
        })
        .sort({ 'dateOrdered': -1 });

    if (!orderList) {
        return res.status(500).json({ success: false })
    }

    const orderListWithTotals = await Promise.all(orderList.map((order) => withResolvedTotal(order)));

    res.status(200).json(orderListWithTotals)
})

router.get(`/:id`, async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name')
        .populate({
            path: 'orderItems', 
            populate: {
                path: 'product', 
                populate: 'category'
            }
        });

    if (!order) {
       return res.status(500).json({ success: false })
    }

    const orderWithTotal = await withResolvedTotal(order);
    res.send(orderWithTotal);
})

router.post('/', async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const normalizedItems = normalizeIncomingOrderItems(req.body.orderItems || []);
        const groupedItems = groupOrderItemsByProduct(normalizedItems);
        const productIds = Array.from(groupedItems.keys());

        const products = await Product.find({ _id: { $in: productIds } })
            .select('price countInStock')
            .session(session);

        if (products.length !== productIds.length) {
            throw new Error('One or more products do not exist');
        }

        const productById = new Map(products.map((product) => [product._id.toString(), product]));

        for (const [productId, quantity] of groupedItems.entries()) {
            const product = productById.get(productId);
            if (!product || Number(product.countInStock) < quantity) {
                throw new Error('Insufficient stock for one or more products');
            }
        }

        for (const [productId, quantity] of groupedItems.entries()) {
            const updateStockResult = await Product.updateOne(
                { _id: productId, countInStock: { $gte: quantity } },
                { $inc: { countInStock: -quantity } },
                { session }
            );

            if (updateStockResult.modifiedCount !== 1) {
                throw new Error('Stock update conflict. Please try again.');
            }
        }

        const createdOrderItems = await OrderItem.insertMany(
            normalizedItems.map((item) => ({
                quantity: item.quantity,
                product: item.product,
            })),
            { session }
        );

        const orderItemsIdsResolved = createdOrderItems.map((orderItem) => orderItem._id);

        const computedTotalPrice = normalizedItems.reduce((sum, item) => {
            const product = productById.get(item.product);
            const unitPrice = Number(product?.price) || 0;
            return sum + (unitPrice * item.quantity);
        }, 0);

        const totalPrice = Number(req.body.totalPrice);
        const finalTotalPrice = Number.isFinite(totalPrice) && totalPrice > 0
            ? totalPrice
            : Number(computedTotalPrice.toFixed(2));

        const [order] = await Order.create([{
            orderItems: orderItemsIdsResolved,
            shippingAddress1: req.body.shippingAddress1,
            shippingAddress2: req.body.shippingAddress2,
            city: req.body.city,
            zip: req.body.zip,
            country: req.body.country,
            phone: req.body.phone,
            status: req.body.status,
            totalPrice: finalTotalPrice,
            user: req.body.user,
        }], { session });

        await session.commitTransaction();
        return res.status(201).json(order);
    } catch (error) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: error.message || 'the order cannot be created!' });
    } finally {
        session.endSession();
    }
})



router.put('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            {
                status: req.body.status
            },
            { new: true }
        )

        if (!order)
            return res.status(400).send('the order cannot be update!')

        const orderWithUserToken = await Order.findById(order.id).populate('user', 'expoPushToken');
        const expoPushToken = orderWithUserToken?.user?.expoPushToken;

        if (expoPushToken) {
            const pushResult = await sendOrderStatusNotification({
                expoPushToken,
                orderId: order.id,
                status: order.status,
            });

            if (pushResult.shouldRemoveToken && orderWithUserToken?.user?._id) {
                await User.findByIdAndUpdate(orderWithUserToken.user._id, {
                    expoPushToken: '',
                    expoPushTokenUpdatedAt: new Date(),
                });
            }
        }

        res.send(order);
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
})

router.put('/:id/cancel', async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const order = await Order.findById(req.params.id)
            .populate('orderItems')
            .session(session);

        if (!order) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Check if order is in pending status (status "3")
        if (order.status !== "3") {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'Only pending orders can be cancelled' });
        }

        const normalizedItems = normalizeIncomingOrderItems(order.orderItems || []);
        const groupedItems = groupOrderItemsByProduct(normalizedItems);

        for (const [productId, quantity] of groupedItems.entries()) {
            await Product.updateOne(
                { _id: productId },
                { $inc: { countInStock: quantity } },
                { session }
            );
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            {
                status: "4", // 4 = cancelled
                cancelReason: req.body.cancelReason,
                cancelledAt: new Date()
            },
            { new: true, session }
        );

        await session.commitTransaction();

        res.status(200).json(updatedOrder);
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, error: error.message });
    } finally {
        session.endSession();
    }
})


router.delete('/:id', (req, res) => {
    Order.findByIdAndDelete(req.params.id).then(async order => {
        if (order) {
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndDelete(orderItem)
            })
            return res.status(200).json({ success: true, message: 'the order is deleted!' })
        } else {
            return res.status(404).json({ success: false, message: "order not found!" })
        }
    }).catch(err => {
        return res.status(500).json({ success: false, error: err })
    })
})

router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Order.aggregate([
        { $group: { _id: null, totalsales: { $sum: '$totalPrice' } } }
    ])

    if (!totalSales) {
        return res.status(400).send('The order sales cannot be generated')
    }

    res.send({ totalsales: totalSales.pop().totalsales })
})

router.get(`/get/count`, async (req, res) => {
    const orderCount = await Order.countDocuments((count) => count)

    if (!orderCount) {
        res.status(500).json({ success: false })
    }
    res.send({
        orderCount: orderCount
    });
})

router.get(`/my-orders/:id`, async (req, res) => {
    const userOrderList = await Order.find({ user: req.params.id }).populate({
        path: 'orderItems', populate: {
            path: 'product', populate: 'category'
        }
    }).sort({ 'dateOrdered': -1 });

    if (!userOrderList) {
        res.status(500).json({ success: false })
    }

    const userOrderListWithTotals = await Promise.all(userOrderList.map((order) => withResolvedTotal(order)));
    res.send(userOrderListWithTotals);
})



module.exports = router;