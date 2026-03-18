const { Order } = require('../models/order');
const express = require('express');
const { OrderItem } = require('../models/order-item');
const { Product } = require('../models/product');
const router = express.Router();

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
    const orderItemsIds = Promise.all(req.body.orderItems.map(async (orderItem) => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product || orderItem._id || orderItem.id
        })

        newOrderItem = await newOrderItem.save();
        return newOrderItem.id;
    }))

    const orderItemsIdsResolved = await orderItemsIds;

    const totalPrice = Number(req.body.totalPrice);
    const computedTotalPrice = await computeOrderTotalFromItems(req.body.orderItems || []);
    const finalTotalPrice = Number.isFinite(totalPrice) && totalPrice > 0 ? totalPrice : computedTotalPrice;

    let order = new Order({
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
    })
    order = await order.save();

    if (!order)
        return res.status(400).send('the order cannot be created!')

    return res.status(201).json(order)
})



router.put('/:id', async (req, res) => {
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status
        },
        { new: true }
    )

    if (!order)
        return res.status(400).send('the order cannot be update!')

    res.send(order);
})

router.put('/:id/cancel', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Check if order is in pending status (status "3")
        if (order.status !== "3") {
            return res.status(400).json({ success: false, message: 'Only pending orders can be cancelled' });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            {
                status: "4", // 4 = cancelled
                cancelReason: req.body.cancelReason,
                cancelledAt: new Date()
            },
            { new: true }
        );

        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
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