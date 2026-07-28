const Product = require("../models/Product");
const Business = require("../models/Business");
const { validationResult } = require("express-validator");
const asyncHandler = require("../middleware/asyncHandler");

const createProduct = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { businessId } = req.params;
        const business = await Business.findById(businessId);

        if (!business) {
            return res.status(404).json({ success: false, message: "Business not found" });
        }

        if (business.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Product image is required" });
        }

        const { productName, description, price, stock } = req.body;
        const product = await Product.create({
            productName,
            description,
            price,
            stock,
            image: req.file.path,
            business: businessId
        });

        res.status(201).json({ success: true, message: "Product created successfully", product });
   
});

const getProductsByBusiness = asyncHandler(async (req, res) => {
    const { businessId } = req.params;
    const products = await Product.find({ business: businessId });
        res.status(200).json({ success: true, products });
   
});

const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.productId);
    if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.status(200).json({ success: true, product });
    
});

const updateProduct = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const product = await Product.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const business = await Business.findById(product.business);
        if (business.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        const updateData = { ...req.body };
        if (req.file) {
            updateData.image = req.file.path;
        }

        const updatedProduct = await Product.findByIdAndUpdate(req.params.productId, updateData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, message: "Product updated successfully", product: updatedProduct });
    
});

const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.productId);
    if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const business = await Business.findById(product.business);
        if (business.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }

        await Product.findByIdAndDelete(req.params.productId);
        res.status(200).json({ success: true, message: "Product deleted successfully" });
    
});

module.exports = {
    createProduct,
    getProductsByBusiness,
    getProductById,
    updateProduct,
    deleteProduct
};
