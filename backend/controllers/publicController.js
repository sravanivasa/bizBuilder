const Business = require("../models/Business");
const Product = require("../models/Product");
const { validationResult } = require("express-validator");
const asyncHandler = require("../middleware/asyncHandler");
const pickFields = require("../utils/pickFields");
const { createOrderForBusiness } = require("../utils/processOrderCreation");

const PUBLIC_BUSINESS_FIELDS = ["businessName", "category", "phoneNumber", "address"];

const getPublicBusiness = asyncHandler(async (req, res) => {
    const business = await Business.findById(req.params.id).select(PUBLIC_BUSINESS_FIELDS.join(" "));

    if (!business) {
        return res.status(404).json({
            success: false,
            message: "Business not found"
        });
    }

    res.status(200).json({
        success: true,
        message: "Business fetched successfully",
        business: pickFields(business.toObject(), PUBLIC_BUSINESS_FIELDS)
    });
});

const getPublicProducts = asyncHandler(async (req, res) => {
    const { businessId } = req.params;

    const business = await Business.findById(businessId).select("_id");

    if (!business) {
        return res.status(404).json({
            success: false,
            message: "Business not found"
        });
    }

    const products = await Product.find({ business: businessId, stock: { $gt: 0 } })
        .select("productName description price stock image")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "Products fetched successfully",
        products
    });
});

const createPublicOrder = asyncHandler(async (req, res) => {
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
        return res.status(404).json({
            success: false,
            message: "Business not found"
        });
    }

    const {
        customerName,
        customerPhone,
        customerAddress,
        products,
        paymentMethod = "Cash"
    } = req.body;

    try {
        const order = await createOrderForBusiness({
            businessId,
            customerName,
            customerPhone,
            customerAddress,
            products,
            paymentMethod,
            isWhatsAppSameAsPhone: true
        });

        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const message = error.statusCode ? error.message : "Could not place order";

        return res.status(statusCode).json({
            success: false,
            message
        });
    }
});

module.exports = {
    getPublicBusiness,
    getPublicProducts,
    createPublicOrder
};
