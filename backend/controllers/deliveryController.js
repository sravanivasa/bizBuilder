const Order = require("../models/Orders");
const Product = require("../models/Product");
const { validationResult } = require("express-validator");
const asyncHandler = require("../middleware/asyncHandler");
const { appendDeliveryTimeline } = require("../utils/deliveryTimeline");
const { isDeliveryOtpValid } = require("../utils/deliveryOtp");
const { isTerminalOrderStatus } = require("../utils/orderStatus");
const {
    notifyCustomerOrderDelivered
} = require("../services/whatsappService");

const shortOrderId = (orderId) => String(orderId).slice(-6).toUpperCase();

const buildDeliveryOrderResponse = async (order) => {
    const productIds = order.products.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } }).select("productName");

    const productMap = new Map(products.map((product) => [String(product._id), product.productName]));

    const items = order.products.map((item) => ({
        productName: productMap.get(String(item.product)) || "Product",
        quantity: item.quantity,
        price: item.price,
        lineTotal: item.price * item.quantity
    }));

    return {
        orderId: order._id,
        shortOrderId: shortOrderId(order._id),
        orderStatus: order.orderStatus,
        deliveryType: order.deliveryType || null,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        items,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        deliveryPhoto: order.deliveryPhoto || null,
        hasOtp: Boolean(order.deliveryOtp),
        createdAt: order.createdAt
    };
};

const getDeliveryOrder = asyncHandler(async (req, res) => {
    const { deliveryToken } = req.params;

    if (!deliveryToken || deliveryToken.length < 32) {
        return res.status(400).json({
            success: false,
            message: "Invalid delivery token"
        });
    }

    const order = await Order.findOne({ deliveryToken });

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Delivery order not found"
        });
    }

    if (isTerminalOrderStatus(order.orderStatus)) {
        return res.status(400).json({
            success: false,
            message: "This delivery is already completed"
        });
    }

    const deliveryOrder = await buildDeliveryOrderResponse(order);

    res.status(200).json({
        success: true,
        message: "Delivery order fetched successfully",
        order: deliveryOrder
    });
});

const uploadDeliveryPhoto = asyncHandler(async (req, res) => {
    const { deliveryToken } = req.params;

    if (!deliveryToken || deliveryToken.length < 32) {
        return res.status(400).json({
            success: false,
            message: "Invalid delivery token"
        });
    }

    if (!req.file?.path) {
        return res.status(400).json({
            success: false,
            message: "Photo file is required"
        });
    }

    const order = await Order.findOne({ deliveryToken });

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Delivery order not found"
        });
    }

    if (isTerminalOrderStatus(order.orderStatus)) {
        return res.status(400).json({
            success: false,
            message: "This delivery is already completed"
        });
    }

    order.deliveryPhoto = req.file.path;
    appendDeliveryTimeline(order, {
        status: order.orderStatus,
        note: "Delivery photo uploaded",
        photo: req.file.path
    });
    await order.save();

    res.status(200).json({
        success: true,
        message: "Delivery photo uploaded successfully",
        deliveryPhoto: order.deliveryPhoto
    });
});

const verifyDeliveryOtp = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const { deliveryToken } = req.params;
    const { otp } = req.body;

    if (!deliveryToken || deliveryToken.length < 32) {
        return res.status(400).json({
            success: false,
            message: "Invalid delivery token"
        });
    }

    const order = await Order.findOne({ deliveryToken });

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Delivery order not found"
        });
    }

    if (isTerminalOrderStatus(order.orderStatus)) {
        return res.status(400).json({
            success: false,
            message: "This delivery is already completed"
        });
    }

    if (!isDeliveryOtpValid(order, otp)) {
        return res.status(400).json({
            success: false,
            message: "Invalid or expired OTP"
        });
    }

    const Business = require("../models/Business");
    const business = await Business.findById(order.business).select("businessName slug");

    order.orderStatus = "Delivered";
    order.deliveryOtp = undefined;
    order.deliveryOtpExpiresAt = undefined;
    appendDeliveryTimeline(order, {
        status: "Delivered",
        note: "OTP verified — order delivered",
        photo: order.deliveryPhoto || null
    });
    await order.save();

    notifyCustomerOrderDelivered(order, business);

    const deliveryOrder = await buildDeliveryOrderResponse(order);

    res.status(200).json({
        success: true,
        message: "Order marked as delivered",
        order: deliveryOrder
    });
});

module.exports = {
    getDeliveryOrder,
    uploadDeliveryPhoto,
    verifyDeliveryOtp
};
