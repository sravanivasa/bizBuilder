const Product = require("../models/Product");
const Business = require("../models/Business");
const { validationResult } = require("express-validator");
const asyncHandler = require("../middleware/asyncHandler");
const pickFields = require("../utils/pickFields");

const PRODUCT_FIELDS = ["productName", "description", "price", "stock", "image"];

const DEFAULT_PRODUCT_IMAGE =
    "https://placehold.co/600x400/e2e8f0/64748b?text=Product";

const assertBusinessOwner = async (product, userId, res) => {
    const business = await Business.findById(product.business);

    if (!business) {
        res.status(404).json({
            success: false,
            message: "Business not found"
        });
        return false;
    }

    if (business.owner.toString() !== userId.toString()) {
        res.status(403).json({
            success: false,
            message: "Forbidden"
        });
        return false;
    }

    return true;
};

const createProduct = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const { businessId } = req.params;
    const business = await Business.findById(businessId);

    if (!business) {
        return res.status(404).json({ success: false, message: "Business not found" });
    }

    if (business.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, message: "Product image is required" });
    }

    const product = await Product.create({
        ...pickFields(req.body, ["productName", "description", "price", "stock"]),
        image: req.file.path,
        business: businessId
    });

    res.status(201).json({
        success: true,
        message: "Product created successfully",
        product
    });
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
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const product = await Product.findById(req.params.productId);
    if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
    }

    const isOwner = await assertBusinessOwner(product, req.user._id, res);
    if (!isOwner) {
        return;
    }

    const updateData = pickFields(req.body, PRODUCT_FIELDS);
    if (req.file) {
        updateData.image = req.file.path;
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.productId, updateData, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product: updatedProduct
    });
});

const bulkCreateProducts = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const { businessId } = req.params;
    const business = await Business.findById(businessId);

    if (!business) {
        return res.status(404).json({ success: false, message: "Business not found" });
    }

    if (business.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const products = req.body.products;
    let created = 0;
    let failed = 0;
    const rowErrors = [];

    for (let index = 0; index < products.length; index++) {
        const row = products[index];
        const rowNumber = index + 1;
        const productName = String(row.productName ?? "").trim();

        if (!productName) {
            failed++;
            rowErrors.push({ row: rowNumber, message: "Product name is required" });
            continue;
        }

        const price = Number(row.price);
        if (!Number.isFinite(price) || price <= 0) {
            failed++;
            rowErrors.push({ row: rowNumber, message: "Price must be a positive number" });
            continue;
        }

        const stock = Number(row.stock);
        if (!Number.isInteger(stock) || stock < 0) {
            failed++;
            rowErrors.push({ row: rowNumber, message: "Stock must be zero or greater" });
            continue;
        }

        const imageUrl = String(row.imageUrl ?? "").trim();
        const image = imageUrl || DEFAULT_PRODUCT_IMAGE;
        const description = String(row.description ?? "").trim();

        try {
            await Product.create({
                productName,
                description,
                price,
                stock,
                image,
                business: businessId
            });
            created++;
        } catch (err) {
            failed++;
            rowErrors.push({ row: rowNumber, message: err.message || "Could not create product" });
        }
    }

    res.status(200).json({
        success: true,
        created,
        failed,
        errors: rowErrors
    });
});

const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.productId);
    if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
    }

    const isOwner = await assertBusinessOwner(product, req.user._id, res);
    if (!isOwner) {
        return;
    }

    await Product.findByIdAndDelete(req.params.productId);
    res.status(200).json({ success: true, message: "Product deleted successfully" });
});

module.exports = {
    createProduct,
    bulkCreateProducts,
    getProductsByBusiness,
    getProductById,
    updateProduct,
    deleteProduct
};
