const express = require('express');
const { Review } = require('../models/review');
const { Product } = require('../models/product');
const { Order } = require('../models/order');
const { OrderItem } = require('../models/order-item');
const mongoose = require('mongoose');
const router = express.Router();

// Helper function to check if user has purchased a product
const checkUserPurchase = async (userId, productId) => {
    const userOrders = await Order.find({ user: userId }).populate({ path: 'orderItems' });
    
    for (const order of userOrders) {
        for (const item of order.orderItems) {
            const itemProductId = item.product ? item.product.toString() : null;
            if (itemProductId === productId) {
                return true;
            }
        }
    }
    return false;
};

// GET reviews for a product
router.get(`/product/:productId`, async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.productId })
            .populate('user', 'name')
            .sort({ dateCreated: -1 });

        res.send(reviews);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// CHECK if user can review a product (has purchased it)
router.get(`/check/:productId/:userId`, async (req, res) => {
    try {
        const { productId, userId } = req.params;

        // Check if user already reviewed
        const existingReview = await Review.findOne({
            user: userId,
            product: productId,
        });

        if (existingReview) {
            return res.send({
                canReview: false,
                hasReviewed: true,
                existingReview,
            });
        }

        // Check if user has purchased this product
        const hasPurchased = await checkUserPurchase(userId, productId);

        res.send({
            canReview: hasPurchased,
            hasReviewed: false,
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST a new review
router.post(`/`, async (req, res) => {
    try {
        const { user, product: productId, rating, comment } = req.body;

        if (!user || !productId || !rating) {
            return res
                .status(400)
                .send('User, product, and rating are required');
        }

        // Verify the user purchased this product
        const hasPurchased = await checkUserPurchase(user, productId);

        if (!hasPurchased) {
            return res
                .status(403)
                .send('You can only review products you have purchased');
        }

        // Check for existing review
        const existingReview = await Review.findOne({
            user,
            product: productId,
        });
        if (existingReview) {
            return res
                .status(400)
                .send('You have already reviewed this product');
        }

        let review = new Review({
            user,
            product: productId,
            rating,
            comment,
            verifiedPurchase: true,
        });

        review = await review.save();

        // Update product rating and numReviews
        const allReviews = await Review.find({ product: productId });
        const avgRating =
            allReviews.reduce((sum, r) => sum + r.rating, 0) /
            allReviews.length;

        await Product.findByIdAndUpdate(productId, {
            rating: Math.round(avgRating * 10) / 10,
            numReviews: allReviews.length,
        });

        review = await Review.findById(review._id).populate('user', 'name');

        res.status(201).send(review);
    } catch (err) {
        if (err.code === 11000) {
            return res
                .status(400)
                .send('You have already reviewed this product');
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT update an existing review
router.put(`/:id`, async (req, res) => {
    try {
        const { rating, comment, user } = req.body;

        if (!rating) {
            return res.status(400).send('Rating is required');
        }

        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).send('Review not found');
        }

        // Ensure the user owns this review
        if (review.user.toString() !== user) {
            return res.status(403).send('You can only edit your own reviews');
        }

        review.rating = rating;
        review.comment = comment || '';
        await review.save();

        // Recalculate product rating
        const allReviews = await Review.find({ product: review.product });
        const avgRating =
            allReviews.reduce((sum, r) => sum + r.rating, 0) /
            allReviews.length;

        await Product.findByIdAndUpdate(review.product, {
            rating: Math.round(avgRating * 10) / 10,
            numReviews: allReviews.length,
        });

        const updatedReview = await Review.findById(req.params.id).populate('user', 'name');
        res.send(updatedReview);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
