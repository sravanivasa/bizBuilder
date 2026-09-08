const PAYMENT_METHODS = ["Cash", "COD", "GPay", "PhonePe", "NetBanking", "UPI", "Card"];

const ONLINE_PAYMENT_METHODS = ["GPay", "PhonePe", "NetBanking", "UPI"];

const COD_PAYMENT_METHODS = ["COD", "Cash"];

const PAYMENT_STATUSES = ["Pending", "AwaitingPayment", "PaymentSubmitted", "Paid", "Failed", "COD"];

const isOnlinePaymentMethod = (method) => ONLINE_PAYMENT_METHODS.includes(method);

const isCodPaymentMethod = (method) => COD_PAYMENT_METHODS.includes(method);

const getInitialPaymentStatus = (paymentMethod) => {
    if (isOnlinePaymentMethod(paymentMethod)) {
        return "AwaitingPayment";
    }

    if (isCodPaymentMethod(paymentMethod)) {
        return "COD";
    }

    return "Pending";
};

const isInvoiceAvailable = (order) => {
    if (!order) {
        return false;
    }

    return order.paymentStatus === "Paid" || order.paymentStatus === "COD";
};

const OWNER_PAYMENT_TRANSITIONS = {
    AwaitingPayment: ["PaymentSubmitted", "Paid"],
    PaymentSubmitted: ["Paid"],
    Pending: ["Paid"],
    Paid: ["Paid"],
    COD: ["COD"]
};

const getPaymentStatusTransitionError = (order, nextStatus) => {
    if (!order) {
        return "Order not found";
    }

    const currentStatus = order.paymentStatus;

    if (currentStatus === nextStatus) {
        return null;
    }

    if (currentStatus === "Paid") {
        return `Cannot change a Paid order to ${nextStatus}.`;
    }

    if (order.orderStatus === "Cancelled" && nextStatus === "Paid") {
        return "Cancelled orders cannot be marked as Paid.";
    }

    if (currentStatus === "COD") {
        if (nextStatus === "PaymentSubmitted") {
            return "COD orders cannot be moved to PaymentSubmitted.";
        }

        if (nextStatus === "AwaitingPayment") {
            return "COD orders cannot be moved to AwaitingPayment.";
        }

        return `COD orders cannot be changed to ${nextStatus}.`;
    }

    if (nextStatus === "COD" && isOnlinePaymentMethod(order.paymentMethod)) {
        return "Online payment orders cannot be set to COD payment status.";
    }

    const allowedTargets = OWNER_PAYMENT_TRANSITIONS[currentStatus];

    if (!allowedTargets || !allowedTargets.includes(nextStatus)) {
        return `Cannot change payment status from ${currentStatus} to ${nextStatus}.`;
    }

    return null;
};

const buildUpiPayLink = ({ upiId, businessName, amount }) => {
    const formattedAmount = Number(amount).toFixed(2);
    const params = new URLSearchParams({
        pa: upiId,
        pn: businessName || "Merchant",
        am: formattedAmount,
        cu: "INR",
        tn: "Order payment"
    });

    return `upi://pay?${params.toString()}`;
};

const buildAppPayLink = (paymentMethod, upiLink) => {
    const query = upiLink.replace(/^upi:\/\/pay\?/, "");

    if (paymentMethod === "GPay") {
        return `tez://upi/pay?${query}`;
    }

    if (paymentMethod === "PhonePe") {
        return `phonepe://pay?${query}`;
    }

    return upiLink;
};

module.exports = {
    PAYMENT_METHODS,
    ONLINE_PAYMENT_METHODS,
    COD_PAYMENT_METHODS,
    PAYMENT_STATUSES,
    isOnlinePaymentMethod,
    isCodPaymentMethod,
    getInitialPaymentStatus,
    isInvoiceAvailable,
    getPaymentStatusTransitionError,
    buildUpiPayLink,
    buildAppPayLink
};
