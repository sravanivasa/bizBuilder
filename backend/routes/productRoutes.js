const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Business = require('../models/Business');
const authMiddleware = require('../middleware/authMiddleware');

// Create a new product
router.post('/:businessId',authMiddleware, async (req, res) => {
    try{

        const{ businessId } = req.params;
        const business = await Business.findById(businessId);
        if(!business){
            return res.status(404).json({ 
                success: false,
                message: 'Business not found' });
        }
        if(business.owner.toString() !== req.user._id.toString()){
            return res.status(403).json({ 
                success: false,
                message: 'You are not authorized to add products to this business' });
        }

        const { productName, description, price, image, stock } = req.body;
        const product = await Product.create({
            productName,
            description,
            price,
            image,
            stock,
            business: business._id
        });
        
        return res.status(201).json({ 
            success: true,
            message: 'Product created successfully', product }); 
    }catch (error) {
        
        console.error(error);
        return res.status(500).json({
            success: false,
             message: 'Server error'
            });
    }


});
// Get all products for a business
router.get('/:businessId/products', async (req, res) => {
    try{
        const { businessId } = req.params;
        const business = await Business.findById(businessId);
        if(!business){
            return res.status(404).json({ 
                success: false,
                message: 'Business not found' });
        }
        const products = await Product.find({ business: businessId });
        if(products.length === 0){
            return res.status(200).json({ 
                success: true,
                message: 'No products found for this business', products: [] });
        }
        return res.status(200).json({ 
            success: true,
            message: 'Products fetched successfully', products });  

    }catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
             message: "Server error"
            });
    }
});
// Get a product by id
router.get('/:productId', async (req, res) => {
    try{

        const { productId } = req.params;
        
        const product = await Product.findById(productId);
        if(!product){
            return res.status(404).json({ 
                success: false,
                message: 'Product not found' });
        }
        return res.status(200).json({ 
            success: true,
            message: 'Product fetched successfully', product });

    }catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
             message: "Server error"
            });
    }
});
// update a product
router.put('/:productId',authMiddleware, async (req, res) => {
    try{

        const { productId } = req.params;
        const product = await Product.findById(productId);
        if(!product){
            return res.status(404).json({ 
                success: false,
                message: 'Product not found' });
        }
        const business = await Business.findById(product.business);
        if(!business){
            return res.status(404).json({ 
                success: false,
                message: 'Business not found' });
        }
        if(business.owner.toString() !== req.user._id.toString()){
            return res.status(403).json({ 
                success: false,
                message: 'You are not authorized to update this product' });
        }
        const updatedProduct = await Product.findByIdAndUpdate(
            productId, 
            req.body, 
            { new: true   }
        );
        return res.status(200).json({ 
            success: true,
            message: 'Product updated successfully', 
            updatedProduct 
        });
    }catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
             message: "Server error"
            });
    }
});
// delete a product
router.delete('/:productId',authMiddleware, async (req, res) => {
    try{

        const { productId } = req.params;
        const product = await Product.findById(productId);
        if(!product){
            return res.status(404).json({ 
                success: false,
                message: 'Product not found' });
        }
        const business = await Business.findById(product.business);
        if(!business){
            return res.status(404).json({ 
                success: false,
                message: 'Business not found' });
        }
        if(business.owner.toString() !== req.user._id.toString()){
            return res.status(403).json({ 
                success: false,
                message: 'You are not authorized to delete this product' });
        }
        await Product.findByIdAndDelete(productId);
        return res.status(200).json({ 
            success: true,
            message: 'Product deleted successfully' });

    }catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
             message: "Server error"
            });
    }
});