const Product = require("../models/Product");
const Business = require("../models/Business");
const { validationResult } = require("express-validator");

const createProduct = async (req, res) => {
    try {
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const getProductsByBusiness = async (req, res) => {
    try {
        const { businessId } = req.params;
        const products = await Product.find({ business: businessId });
        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.status(200).json({ success: true, product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const updateProduct = async (req, res) => {
    try {
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const deleteProduct = async (req, res) => {
    try {
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = {
    createProduct,
    getProductsByBusiness,
    getProductById,
    updateProduct,
    deleteProduct
};
