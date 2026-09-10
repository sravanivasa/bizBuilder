const Order = require("../models/Orders");
const Business = require("../models/Business");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const asyncHandler = require("../middleware/asyncHandler");
const { createOrderForBusiness } = require("../utils/processOrderCreation");
const { restoreStockOnce } = require("../utils/orderInventory");
const { TERMINAL_ORDER_STATUSES } = require("../utils/orderStatus");
const { buildCourierTrackingUrl } = require("../utils/courierTracking");
const { buildDeliveryPersonUrl } = require("../utils/deliveryUrl");
const { appendDeliveryTimeline } = require("../utils/deliveryTimeline");
const { buildInvoiceResponse } = require("../utils/invoiceBuilder");
const { normalizeReturnStatus } = require("../utils/returnStatus");
const { getPaymentStatusTransitionError, isInvoiceAvailable } = require("../utils/paymentMethods");
const { getOrderStatusTransitionError } = require("../utils/orderLifecycle");
const { markOrderPaymentPaid } = require("../utils/markPaymentPaid");
const { generateDeliveryOtp, getDeliveryOtpExpiry } = require("../utils/deliveryOtp");
const {
    notifyCustomerOrderConfirmed,
    notifyCustomerOrderPreparing,
    notifyCustomerOrderDelivered,
    notifyCustomerOrderCancelled,
    notifyCustomerReturnApproved,
    notifyCustomerOrderProcessing,
    notifyCustomerOrderShipped,
    notifyCustomerOutForDelivery,
    notifyCustomerDeliveryOtp,
    notifyDeliveryPersonLink,
    notifyCustomerCourierTracking
} = require("../services/whatsappService");
const {
    ensureOwnerOrder,
    findBusinessForOwner,
    resolveOwnerBusiness
} = require("../utils/tenantAuthorization");

const DELETABLE_ORDER_STATUSES = ["Pending", "New", "Cancelled"];

const generateDeliveryToken = () => crypto.randomBytes(32).toString("hex");

const attachDeliveryPersonUrl = (order) => {
    const plain = order.toObject ? order.toObject() : { ...order };
    delete plain.trackingToken;
    delete plain.deliveryToken;
    delete plain.deliveryOtp;
    plain.deliveryPersonUrl = buildDeliveryPersonUrl(order);
    return plain;
};

const issueDeliveryOtp = (order) => {
    order.deliveryOtp = generateDeliveryOtp();
    order.deliveryOtpExpiresAt = getDeliveryOtpExpiry();
};

const hasCourierTracking = (order) =>
    order.deliveryType === "courier" &&
    Boolean(order.trackingId?.trim() || order.courierName?.trim());

const applyOrderStatusUpdate = async (order, business, nextStatus) => {
    const previousStatus = order.orderStatus;

    if (TERMINAL_ORDER_STATUSES.includes(previousStatus)) {
        return { skipped: true, reason: "terminal" };
    }

    if (nextStatus === previousStatus) {
        return { skipped: true, reason: "unchanged" };
    }

    if (nextStatus === "Shipped" && !hasCourierTracking(order)) {
        return { skipped: true, reason: "no_courier_tracking" };
    }

    const transitionError = getOrderStatusTransitionError(order, nextStatus);

    if (transitionError) {
        return { skipped: true, reason: "invalid_transition", message: transitionError };
    }

    if (nextStatus === "Cancelled" && previousStatus !== "Cancelled") {
        await restoreStockOnce(order);
    }

    order.orderStatus = nextStatus;

    const timelineNote =
        nextStatus === "Shipped" && order.courierName
            ? `Shipped via ${order.courierName}${order.trackingId ? ` — ${order.trackingId}` : ""}`
            : nextStatus === "Cancelled"
              ? "Order cancelled by owner"
              : "Status updated by owner";

    appendDeliveryTimeline(order, { status: nextStatus, note: timelineNote });
    await order.save();

    sendStatusNotifications(order, business, nextStatus);

    return { updated: true, order: attachDeliveryPersonUrl(order) };
};

const sendStatusNotifications = (order, business, nextStatus) => {
    if (nextStatus === "Confirmed") {
        notifyCustomerOrderConfirmed(order, business);
    } else if (nextStatus === "Processing") {
        notifyCustomerOrderProcessing(order, business);
    } else if (nextStatus === "Preparing") {
        notifyCustomerOrderPreparing(order, business);
    } else if (nextStatus === "Delivered") {
        notifyCustomerOrderDelivered(order, business);
    } else if (nextStatus === "Cancelled") {
        notifyCustomerOrderCancelled(order, business);
    } else if (nextStatus === "Shipped") {
        notifyCustomerOrderShipped(order, business);
        notifyCustomerCourierTracking(order, business);
    } else if (nextStatus === "OutForDelivery") {
        notifyCustomerOutForDelivery(order, business);
        notifyCustomerDeliveryOtp(order, business);
    }
};

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

    const { business, error } = await findBusinessForOwner(businessId, req.user._id);

    if (error) {
        return res.status(error.status).json({
            success: false,
            message: error.message
        });
    }

    try {
        const order = await createOrderForBusiness({
            businessId,
            customerName,
            customerPhone,
            customerAddress,
            products,
            paymentMethod
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

const resolveOrderListBusiness = (userId, businessId) => resolveOwnerBusiness(userId, businessId);

const getMyOrders = asyncHandler(async (req, res) => {
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
        search,
        orderStatus,
        paymentStatus,
        paymentMethod,
        dateFrom,
        dateTo,
        sort,
        sortDir
    } = req.query;

    if (dateFrom && dateTo && dateFrom > dateTo) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: [{ msg: "dateFrom must be on or before dateTo" }]
        });
    }

    const businessLookup = await resolveOrderListBusiness(req.user._id, businessId);

    if (businessLookup.error) {
        return res.status(businessLookup.error.status).json({
            success: false,
            message: businessLookup.error.message
        });
    }

    const { parsePagination, buildPaginationMeta } = require("../utils/pagination");
    const {
        buildOrderListFilter,
        buildOrderListSort,
        formatOrderForOwnerList
    } = require("../utils/orderListQuery");

    const { page, limit, skip } = parsePagination(req.query, 12);
    const filter = buildOrderListFilter({
        businessId: businessLookup.business._id,
        search,
        orderStatus,
        paymentStatus,
        paymentMethod,
        dateFrom,
        dateTo
    });
    const sortSpec = buildOrderListSort(sort, sortDir);

    const [total, orders] = await Promise.all([
        Order.countDocuments(filter),
        Order.find(filter).sort(sortSpec).skip(skip).limit(limit)
    ]);

    res.status(200).json({
        success: true,
        message: "Orders fetched successfully",
        orders: orders.map(formatOrderForOwnerList),
        pagination: buildPaginationMeta(page, limit, total),
        businessId: String(businessLookup.business._id)
    });
});

const getOrderById = asyncHandler(async (req, res) => {
    const ownerContext = await ensureOwnerOrder(req.params.id, req.user._id);

    if (ownerContext.error) {
        return res.status(ownerContext.error.status).json({
            success: false,
            message: ownerContext.error.message
        });
    }

    const order = await Order.findById(ownerContext.order._id).select(
        "-trackingToken -deliveryToken -deliveryOtp"
    );

    res.status(200).json({
        success: true,
        message: "Order fetched successfully",
        order: attachDeliveryPersonUrl(order)
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

    const ownerContext = await ensureOwnerOrder(req.params.id, req.user._id);

    if (ownerContext.error) {
        return res.status(ownerContext.error.status).json({
            success: false,
            message: ownerContext.error.message
        });
    }

    const { order, business } = ownerContext;

    if (TERMINAL_ORDER_STATUSES.includes(order.orderStatus)) {
        return res.status(400).json({
            success: false,
            message: "Cannot update status of completed, delivered, or cancelled orders"
        });
    }

    const nextStatus = req.body.orderStatus;
    const result = await applyOrderStatusUpdate(order, business, nextStatus);

    if (result.skipped) {
        if (result.reason === "invalid_transition") {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        const messages = {
            terminal: "Cannot update status of completed, delivered, or cancelled orders",
            unchanged: "Order already has this status",
            no_courier_tracking: "Courier tracking is required before marking as shipped"
        };

        return res.status(400).json({
            success: false,
            message: messages[result.reason] || "Could not update order status"
        });
    }

    res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        order: result.order
    });
});

const bulkUpdateOrderStatus = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const { orderIds, orderStatus } = req.body;
    const uniqueIds = [...new Set(orderIds.map((id) => id.toString()))];

    const businesses = await Business.find({ owner: req.user._id }).select("_id");
    const businessIds = businesses.map((business) => business._id.toString());
    const businessMap = new Map(businesses.map((business) => [business._id.toString(), business]));

    const orders = await Order.find({ _id: { $in: uniqueIds } });

    if (orders.length !== uniqueIds.length) {
        return res.status(404).json({
            success: false,
            message: "One or more orders were not found"
        });
    }

    for (const order of orders) {
        const businessId = order.business.toString();

        if (!businessIds.includes(businessId)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden"
            });
        }
    }

    const updated = [];
    const skipped = [];

    for (const order of orders) {
        const business = businessMap.get(order.business.toString());
        const result = await applyOrderStatusUpdate(order, business, orderStatus);

        if (result.updated) {
            updated.push(result.order);
        } else {
            skipped.push({
                orderId: order._id,
                reason: result.reason,
                ...(result.message && { message: result.message })
            });
        }
    }

    res.status(200).json({
        success: true,
        message: "Bulk order status update completed",
        orderStatus,
        updatedCount: updated.length,
        skippedCount: skipped.length,
        orders: updated,
        skipped
    });
});

const updateReturnStatus = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const ownerContext = await ensureOwnerOrder(req.params.id, req.user._id);

    if (ownerContext.error) {
        return res.status(ownerContext.error.status).json({
            success: false,
            message: ownerContext.error.message
        });
    }

    const { order, business } = ownerContext;
    const { returnStatus, returnTrackingId, returnCourier } = req.body;
    const currentReturnStatus = normalizeReturnStatus(order.returnStatus);

    if (returnStatus === "Delivered") {
        if (!["Shipped", "Accepted"].includes(currentReturnStatus)) {
            return res.status(400).json({
                success: false,
                message: "Return must be accepted or shipped before marking as received"
            });
        }

        await restoreStockOnce(order);
        order.returnStatus = "Delivered";
        order.returnDeliveredAt = new Date();
        order.returnResolvedAt = new Date();
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Return marked as received and stock restored",
            order
        });
    }

    if (returnStatus === "Shipped") {
        if (currentReturnStatus !== "Accepted") {
            return res.status(400).json({
                success: false,
                message: "Return must be accepted before marking as shipped"
            });
        }

        order.returnStatus = "Shipped";
        order.returnShippedAt = new Date();
        if (returnTrackingId?.trim()) {
            order.returnTrackingId = returnTrackingId.trim();
        }
        if (returnCourier?.trim()) {
            order.returnCourier = returnCourier.trim();
        }
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Return marked as shipped",
            order
        });
    }

    if (currentReturnStatus !== "Requested") {
        return res.status(400).json({
            success: false,
            message: "No pending return request for this order"
        });
    }

    if (returnStatus === "Approved" || returnStatus === "Accepted") {
        order.returnStatus = "Accepted";
        await order.save();
        notifyCustomerReturnApproved(order, business);
    } else if (returnStatus === "Rejected") {
        order.returnStatus = "Rejected";
        order.returnResolvedAt = new Date();
        await order.save();
    } else {
        return res.status(400).json({
            success: false,
            message: "Invalid return status transition"
        });
    }

    res.status(200).json({
        success: true,
        message: "Return status updated successfully",
        order
    });
});

const deleteOrder = asyncHandler(async (req, res) => {
    const ownerContext = await ensureOwnerOrder(req.params.id, req.user._id);

    if (ownerContext.error) {
        return res.status(ownerContext.error.status).json({
            success: false,
            message: ownerContext.error.message
        });
    }

    const { order } = ownerContext;

    if (!DELETABLE_ORDER_STATUSES.includes(order.orderStatus)) {
        return res.status(400).json({
            success: false,
            message: "Only pending or cancelled orders can be deleted"
        });
    }

    if (order.orderStatus === "Pending" || order.orderStatus === "New") {
        await restoreStockOnce(order);
    }

    await order.deleteOne();

    res.status(200).json({
        success: true,
        message: "Order deleted successfully"
    });
});

const updateOrderDelivery = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const { order, business, error } = await ensureOwnerOrder(req.params.id, req.user._id);

    if (error) {
        return res.status(error.status).json({ success: false, message: error.message });
    }

    if (TERMINAL_ORDER_STATUSES.includes(order.orderStatus)) {
        return res.status(400).json({
            success: false,
            message: "Cannot update delivery for completed or cancelled orders"
        });
    }

    const {
        deliveryType,
        courierName,
        trackingId,
        trackingUrl,
        deliveryPersonName,
        deliveryPersonPhone,
        markShipped,
        markOutForDelivery,
        markReadyForPickup
    } = req.body;

    if (deliveryType) {
        order.deliveryType = deliveryType;
    }

    if (order.deliveryType === "courier") {
        if (courierName !== undefined) {
            order.courierName = courierName?.trim() || "";
        }
        if (trackingId !== undefined) {
            order.trackingId = trackingId?.trim() || "";
        }

        const autoUrl = buildCourierTrackingUrl(order.courierName, order.trackingId);
        order.trackingUrl = trackingUrl?.trim() || autoUrl || order.trackingUrl || "";

        if (markShipped) {
            const transitionError = getOrderStatusTransitionError(order, "Shipped");

            if (transitionError) {
                return res.status(400).json({
                    success: false,
                    message: transitionError
                });
            }

            if (!hasCourierTracking(order)) {
                return res.status(400).json({
                    success: false,
                    message: "Courier tracking is required before marking as shipped"
                });
            }

            order.orderStatus = "Shipped";
            appendDeliveryTimeline(order, {
                status: "Shipped",
                note: order.courierName
                    ? `Shipped via ${order.courierName}${order.trackingId ? ` — ${order.trackingId}` : ""}`
                    : "Order shipped"
            });
            notifyCustomerOrderShipped(order, business);
            notifyCustomerCourierTracking(order, business);
        }
    }

    if (order.deliveryType === "local") {
        if (deliveryPersonName !== undefined) {
            order.deliveryPersonName = deliveryPersonName?.trim() || "";
        }
        if (deliveryPersonPhone !== undefined) {
            order.deliveryPersonPhone = deliveryPersonPhone?.trim() || "";
        }

        if (!order.deliveryToken) {
            order.deliveryToken = generateDeliveryToken();
        }

        if (markOutForDelivery) {
            const transitionError = getOrderStatusTransitionError(order, "OutForDelivery");

            if (transitionError) {
                return res.status(400).json({
                    success: false,
                    message: transitionError
                });
            }

            order.orderStatus = "OutForDelivery";
            issueDeliveryOtp(order);
            appendDeliveryTimeline(order, {
                status: "OutForDelivery",
                note: order.deliveryPersonName
                    ? `Assigned to ${order.deliveryPersonName}`
                    : "Out for delivery"
            });
            notifyCustomerOutForDelivery(order, business);
            notifyCustomerDeliveryOtp(order, business);

            const deliveryUrl = buildDeliveryPersonUrl(order);
            if (deliveryUrl && order.deliveryPersonPhone) {
                notifyDeliveryPersonLink(order, business, deliveryUrl);
            }
        }
    }

    if (order.deliveryType === "pickup") {
        if (!order.deliveryToken) {
            order.deliveryToken = generateDeliveryToken();
        }

        if (markReadyForPickup) {
            const transitionError = getOrderStatusTransitionError(order, "OutForDelivery");

            if (transitionError) {
                return res.status(400).json({
                    success: false,
                    message: transitionError
                });
            }

            order.orderStatus = "OutForDelivery";
            issueDeliveryOtp(order);
            appendDeliveryTimeline(order, {
                status: "OutForDelivery",
                note: "Ready for pickup at shop"
            });
            notifyCustomerOutForDelivery(order, business);
            notifyCustomerDeliveryOtp(order, business);
        }
    }

    await order.save();

    const responseOrder = attachDeliveryPersonUrl(order);

    res.status(200).json({
        success: true,
        message: "Delivery details updated successfully",
        order: responseOrder
    });
});

const getOrderInvoice = asyncHandler(async (req, res) => {
    const ownerContext = await ensureOwnerOrder(req.params.id, req.user._id);

    if (ownerContext.error) {
        return res.status(ownerContext.error.status).json({
            success: false,
            message: ownerContext.error.message
        });
    }

    const { order } = ownerContext;

    if (!isInvoiceAvailable(order)) {
        return res.status(403).json({
            success: false,
            message: "Invoice available after payment is confirmed"
        });
    }

    const invoice = await buildInvoiceResponse(order);

    res.status(200).json({
        success: true,
        message: "Invoice fetched successfully",
        invoice
    });
});

const updatePaymentStatus = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const ownerContext = await ensureOwnerOrder(req.params.id, req.user._id);

    if (ownerContext.error) {
        return res.status(ownerContext.error.status).json({
            success: false,
            message: ownerContext.error.message
        });
    }

    const { order, business } = ownerContext;
    const { paymentStatus } = req.body;
    const transitionError = getPaymentStatusTransitionError(order, paymentStatus);

    if (transitionError) {
        return res.status(400).json({
            success: false,
            message: transitionError
        });
    }

    if (paymentStatus === "Paid") {
        const { order: paidOrder } = await markOrderPaymentPaid(order, business, {
            note: "Payment verified by owner"
        });

        return res.status(200).json({
            success: true,
            message: "Payment status updated successfully",
            order: attachDeliveryPersonUrl(paidOrder)
        });
    }

    if (order.paymentStatus !== paymentStatus) {
        order.paymentStatus = paymentStatus;

        if (paymentStatus === "PaymentSubmitted") {
            order.paymentSubmittedAt = new Date();
        }

        await order.save();
    }

    res.status(200).json({
        success: true,
        message: "Payment status updated successfully",
        order: attachDeliveryPersonUrl(order)
    });
});

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    bulkUpdateOrderStatus,
    updateReturnStatus,
    deleteOrder,
    updateOrderDelivery,
    getOrderInvoice,
    updatePaymentStatus
};
