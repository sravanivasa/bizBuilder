const Order = require("../models/Orders");
const Business = require("../models/Business");
const Product = require("../models/Product");
const { validationResult } = require("express-validator");
const asyncHandler = require("../middleware/asyncHandler");
const aggregateOrderProducts = require("../utils/aggregateOrderProducts");
const { decrementStock, restoreStock } = require("../utils/orderInventory");

const TERMINAL_ORDER_STATUSES = ["Delivered", "Cancelled", "Completed"];
const DELETABLE_ORDER_STATUSES = ["Pending", "Cancelled"];

const createOrder = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const {
        businessId,
        customerName,
        customerPhone,
        customerAddress,
        products,
        paymentMethod = "Cash"
    } = req.body;

    const business = await Business.findById(businessId);

    if (!business) {
        return res.status(404).json({
            success: false,
            message: "Business not found"
        });
    }

    if (business.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Forbidden"
        });
    }

    const aggregatedProducts = aggregateOrderProducts(products);
    const orderProducts = [];
    let totalAmount = 0;

    for (const item of aggregatedProducts) {
        const product = await Product.findById(item.product);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (product.business.toString() !== businessId) {
            return res.status(400).json({
                success: false,
                message: `${product.productName} does not belong to this business`
            });
        }

        if (item.quantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: `${product.productName} is out of stock`
            });
        }

        totalAmount += product.price * item.quantity;
        orderProducts.push({
            product: product._id,
            quantity: item.quantity,
            price: product.price
        });
    }

    let decrementedItems = [];

    try {
        decrementedItems = await decrementStock(aggregatedProducts);

        const order = await Order.create({
            business: businessId,
            customerName,
            customerPhone,
            customerAddress,
            products: orderProducts,
            totalAmount,
            paymentMethod
        });

        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order
        });
    } catch (error) {
        if (decrementedItems.length) {
            await restoreStock(decrementedItems);
        }

        throw error;
    }
});

const getMyOrders = asyncHandler(async (req, res) => {
    const businesses = await Business.find({ owner: req.user._id }).select("_id");

    if (!businesses.length) {
        return res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            orders: []
        });
    }

    const businessIds = businesses.map((business) => business._id);
    const orders = await Order.find({ business: { $in: businessIds } }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "Orders fetched successfully",
        orders
    });
});

const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    const business = await Business.findById(order.business);
    if (!business) {
        return res.status(404).json({
            success: false,
            message: "Business not found"
        });
    }

    if (business.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Forbidden"
        });
    }

    res.status(200).json({
        success: true,
        message: "Order fetched successfully",
        order
    });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    const business = await Business.findById(order.business);
    if (!business) {
        return res.status(404).json({
            success: false,
            message: "Business not found"
        });
    }

    if (business.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Forbidden"
        });
    }

    if (TERMINAL_ORDER_STATUSES.includes(order.orderStatus)) {
        return res.status(400).json({
            success: false,
            message: "Cannot update status of completed, delivered, or cancelled orders"
        });
    }

    const nextStatus = req.body.orderStatus;
    const previousStatus = order.orderStatus;

    if (nextStatus === "Cancelled" && previousStatus !== "Cancelled") {
        await restoreStock(order.products);
    }

    order.orderStatus = nextStatus;
    await order.save();

    res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        order
    });
});

const deleteOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    const business = await Business.findById(order.business);
    if (!business) {
        return res.status(404).json({
            success: false,
            message: "Business not found"
        });
    }

    if (business.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Forbidden"
        });
    }

    if (!DELETABLE_ORDER_STATUSES.includes(order.orderStatus)) {
        return res.status(400).json({
            success: false,
            message: "Only pending or cancelled orders can be deleted"
        });
    }

    if (order.orderStatus === "Pending") {
        await restoreStock(order.products);
    }

    await order.deleteOne();

    res.status(200).json({
        success: true,
        message: "Order deleted successfully"
    });
});

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder
};
