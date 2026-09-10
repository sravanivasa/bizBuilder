const Order = require("../models/Orders");
const Business = require("../models/Business");
const asyncHandler = require("../middleware/asyncHandler");
const {
    getRazorpayCredentials,
    verifyWebhookSignature,
    amountToPaise
} = require("../utils/razorpayService");
const { markOrderPaymentPaid } = require("../utils/markPaymentPaid");
const { logInfo } = require("../utils/logger");

const handleRazorpayWebhook = asyncHandler(async (req, res) => {
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
        return res.status(503).json({
            success: false,
            message: "Webhook secret not configured"
        });
    }

    const rawBody = req.body;

    if (!Buffer.isBuffer(rawBody)) {
        return res.status(400).json({
            success: false,
            message: "Invalid webhook payload"
        });
    }

    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        return res.status(400).json({
            success: false,
            message: "Invalid webhook signature"
        });
    }

    let event;

    try {
        event = JSON.parse(rawBody.toString("utf8"));
    } catch {
        return res.status(400).json({
            success: false,
            message: "Invalid webhook JSON"
        });
    }

    if (event.event !== "payment.captured") {
        return res.status(200).json({ success: true, message: "Event ignored" });
    }

    const payment = event.payload?.payment?.entity;

    if (!payment?.order_id) {
        return res.status(200).json({ success: true, message: "No order reference" });
    }

    const order = await Order.findOne({ razorpayOrderId: payment.order_id });

    if (!order) {
        return res.status(200).json({ success: true, message: "Order not found" });
    }

    if (order.paymentStatus === "Paid") {
        logInfo("Razorpay webhook duplicate payment ignored", {
            requestId: req.requestId,
            event: "razorpay.webhook",
            orderId: String(order._id),
            razorpayOrderId: payment.order_id
        });
        return res.status(200).json({ success: true, message: "Already paid" });
    }

    if (order.orderStatus === "Cancelled") {
        logInfo("Razorpay webhook cancelled order ignored", {
            requestId: req.requestId,
            event: "razorpay.webhook",
            orderId: String(order._id),
            razorpayOrderId: payment.order_id
        });
        return res.status(200).json({ success: true, message: "Cancelled order ignored" });
    }

    const business = await Business.findById(order.business);
    const credentials = getRazorpayCredentials(business);

    if (!credentials) {
        return res.status(200).json({ success: true, message: "Razorpay not configured" });
    }

    if (amountToPaise(order.totalAmount) !== Number(payment.amount)) {
        return res.status(400).json({
            success: false,
            message: "Payment amount mismatch"
        });
    }

    const result = await markOrderPaymentPaid(order, business, {
        razorpayPaymentId: payment.id,
        note: "Payment confirmed via Razorpay webhook"
    });

    if (result.cancelled) {
        return res.status(200).json({ success: true, message: "Cancelled order ignored" });
    }

    logInfo("Razorpay webhook payment processed", {
        requestId: req.requestId,
        event: "razorpay.webhook",
        orderId: String(result.order?._id || order._id),
        razorpayOrderId: payment.order_id,
        alreadyPaid: result.alreadyPaid
    });

    res.status(200).json({ success: true, message: "Payment processed" });
});

module.exports = {
    handleRazorpayWebhook
};
