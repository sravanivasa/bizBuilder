const {
    normalizeOrderStatus,
    isTerminalOrderStatus
} = require("./orderStatus");
const { isOnlinePaymentMethod } = require("./paymentMethods");

const FULFILLMENT_STATUSES = new Set(["Shipped", "OutForDelivery", "Delivered", "Completed"]);

const ALLOWED_ORDER_TRANSITIONS = {
    New: new Set(["Processing", "Cancelled"]),
    Processing: new Set(["Shipped", "OutForDelivery", "Cancelled"]),
    Shipped: new Set(["OutForDelivery", "Delivered", "Cancelled"]),
    OutForDelivery: new Set(["Delivered", "Cancelled"]),
    Delivered: new Set(),
    Cancelled: new Set()
};

const isFulfillmentStatus = (status) =>
    FULFILLMENT_STATUSES.has(status) || FULFILLMENT_STATUSES.has(normalizeOrderStatus(status));

/**
 * Returns an error message when an order-status transition is invalid, or null when allowed.
 * Central guard for owner status updates, delivery OTP, and delivery-detail status changes.
 */
const getOrderStatusTransitionError = (order, nextStatus) => {
    if (!order || !nextStatus) {
        return "Invalid order status transition.";
    }

    const currentStatus = order.orderStatus;

    if (nextStatus === "Cancelled" && order.paymentStatus === "Paid") {
        return "Paid orders cannot be cancelled. Use the refund process first.";
    }

    if (isTerminalOrderStatus(currentStatus)) {
        return "Cannot update status of completed, delivered, or cancelled orders.";
    }

    const normalizedCurrent = normalizeOrderStatus(currentStatus);
    const normalizedNext = normalizeOrderStatus(nextStatus);

    if (normalizedCurrent === normalizedNext) {
        // Lateral moves within the same lifecycle phase (e.g. Confirmed → Preparing).
    } else {
        const allowedTargets = ALLOWED_ORDER_TRANSITIONS[normalizedCurrent];

        if (!allowedTargets || !allowedTargets.has(normalizedNext)) {
            return `Cannot change order status from ${currentStatus} to ${nextStatus}.`;
        }
    }

    if (isOnlinePaymentMethod(order.paymentMethod) && isFulfillmentStatus(nextStatus)) {
        if (order.paymentStatus !== "Paid") {
            if (normalizedNext === "Delivered" || nextStatus === "Delivered" || nextStatus === "Completed") {
                return "Online orders must be paid before they can be marked as delivered.";
            }

            return "Online orders must be paid before shipping or delivery.";
        }
    }

    return null;
};

module.exports = {
    FULFILLMENT_STATUSES,
    getOrderStatusTransitionError
};
