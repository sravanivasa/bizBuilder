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
    buildUpiPayLink,
    buildAppPayLink
};
