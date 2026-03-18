const express = require('express');
const { Product } = require('../models/product');
const { Category } = require('../models/category');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../helpers/cloudinary');

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: `${process.env.CLOUDINARY_UPLOAD_FOLDER || 'planterest'}/products`,
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
    },
});

const uploadOptions = multer({ storage: storage });

router.get(`/`, async (req, res) =>{
    let filter = {};
    if(req.query.categories)
    {
         filter = {category: req.query.categories.split(',')}
    }

    const productList = await Product.find(filter).populate('category');

    if(!productList) {
        res.status(500).json({success: false})
    } 
    res.send(productList);
})

router.get(`/get/count`, async (req, res) =>{
    const productCount = await Product.countDocuments((count) => count)

    if(!productCount) {
        res.status(500).json({success: false})
    } 
    res.send({
        productCount: productCount
    });
})

router.get(`/get/featured/:count`, async (req, res) =>{
    const count = req.params.count ? req.params.count : 0
    const products = await Product.find({isFeatured: true}).limit(+count);

    if(!products) {
        res.status(500).json({success: false})
    } 
    res.send(products);
})

router.put('/apply-discount', async (req, res) => {
    try {
        const { productIds, discountPercentage, discountDays } = req.body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).send('Invalid product IDs');
        }

        if (discountPercentage === undefined || discountPercentage < 0 || discountPercentage > 100) {
            return res.status(400).send('Invalid discount percentage (0-100)');
        }

        if (discountDays === undefined || discountDays < 0) {
            return res.status(400).send('Invalid discount days');
        }

        // Convert hex string IDs to MongoDB ObjectIds
        const objectIds = productIds.map(id => {
            try {
                return new mongoose.Types.ObjectId(id);
            } catch (e) {
                throw new Error(`Invalid product ID: ${id}`);
            }
        });

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + discountDays);

        const result = await Product.updateMany(
            { _id: { $in: objectIds } },
            {
                'discount.percentage': discountPercentage,
                'discount.endDate': endDate
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send('No products found with the provided IDs');
        }

        res.send({
            success: true,
            message: `Discount applied to ${result.modifiedCount} product(s)`,
            modifiedCount: result.modifiedCount,
            discountPercentage,
            endDate
        });

    } catch (error) {
        res.status(400).send('Error applying discount: ' + error.message);
    }
});

router.put('/remove-discount', async (req, res) => {
    try {
        const { productIds } = req.body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).send('Invalid product IDs');
        }

        // Convert hex string IDs to MongoDB ObjectIds
        const objectIds = productIds.map(id => {
            try {
                return new mongoose.Types.ObjectId(id);
            } catch (e) {
                throw new Error(`Invalid product ID: ${id}`);
            }
        });

        const result = await Product.updateMany(
            { _id: { $in: objectIds } },
            {
                'discount.percentage': 0,
                'discount.endDate': null
            }
        );

        res.send({
            success: true,
            message: `Discount removed from ${result.modifiedCount} product(s)`,
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        res.status(400).send('Error removing discount: ' + error.message);
    }
});

router.get(`/:id`, async (req, res) =>{
    const product = await Product.findById(req.params.id).populate('category');

    if(!product) {
        res.status(500).json({success: false})
    } 
    res.send(product);
})

router.post(`/`, uploadOptions.single('image'), async (req, res) => {
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid Category');

    const file = req.file;
    if (!file) return res.status(400).send('No image in the request');

    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: file.path,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured
    });

    product = await product.save();

    if (!product) return res.status(500).send('The product cannot be created');

    res.send(product);
});


router.put('/:id', uploadOptions.single('image'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product Id');
    }
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send('Invalid Category');

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(400).send('Invalid Product!');

    const file = req.file;
    let imagepath;

    if (file) {
        imagepath = file.path;
    } else {
        imagepath = product.image;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: imagepath,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category,
            countInStock: req.body.countInStock,
            rating: req.body.rating,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured
        },
        { new: true }
    );

    if (!updatedProduct) return res.status(500).send('the product cannot be updated!');

    res.send(updatedProduct);
});

router.delete('/:id', (req, res)=>{
    Product.findByIdAndDelete(req.params.id).then(product =>{
        if(product) {
            return res.status(200).json({success: true, message: 'the product is deleted!'})
        } else {
            return res.status(404).json({success: false , message: "product not found!"})
        }
    }).catch(err=>{
       return res.status(500).json({success: false, error: err}) 
    })
})

router.put('/gallery-images/:id', uploadOptions.array('images', 10), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Invalid Product Id');
    }
    const files = req.files;
    let imagesPaths = [];

    if (files) {
        imagesPaths = files.map((file) => file.path);
    }

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            images: imagesPaths
        },
        { new: true }
    );
        
    if (!product) return res.status(500).send('the gallery cannot be updated!');

    res.send(product);
});

module.exports=router;