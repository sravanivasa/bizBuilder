const { isOnlinePaymentMethod, isInvoiceAvailable } = require("./paymentMethods");

const MIN_TRACKING_TOKEN_LENGTH = 32;

const PUBLIC_CAPABILITIES = {
    TRACK: "track",
    PAY: "pay",
    PAY_MUTATE: "pay-mutate",
    INVOICE: "invoice"
};

const isValidTrackingToken = (token) =>
    Boolean(token && String(token).length >= MIN_TRACKING_TOKEN_LENGTH);

const findOrderByTrackingToken = async (Order, token) => {
    if (!isValidTrackingToken(token)) {
        return {
            error: {
                status: 400,
                message: "Invalid tracking token"
            }
        };
    }

    const order = await Order.findOne({ trackingToken: token });

    if (!order) {
        return {
            error: {
                status: 404,
                message: "Order not found"
            }
        };
    }

    return { order };
};

const isPaymentAvailable = (order) => {
    if (!order) {
        return false;
    }

    if (!isOnlinePaymentMethod(order.paymentMethod)) {
        return false;
    }

    if (order.orderStatus === "Cancelled") {
        return false;
    }

    return order.paymentStatus === "AwaitingPayment";
};

const assertPublicCapability = (order, capability) => {
    if (!order) {
        return {
            status: 404,
            message: "Order not found"
        };
    }

    switch (capability) {
        case PUBLIC_CAPABILITIES.TRACK:
            return null;

        case PUBLIC_CAPABILITIES.PAY:
            if (!isOnlinePaymentMethod(order.paymentMethod)) {
                return {
                    status: 400,
                    message: "This order does not require online payment"
                };
            }
            return null;

        case PUBLIC_CAPABILITIES.PAY_MUTATE: {
            if (order.orderStatus === "Cancelled") {
                return {
                    status: 400,
                    message: "This order has been cancelled"
                };
            }

            if (!isOnlinePaymentMethod(order.paymentMethod)) {
                return {
                    status: 400,
                    message: "This order does not require online payment"
                };
            }

            return null;
        }

        case PUBLIC_CAPABILITIES.INVOICE:
            if (!isInvoiceAvailable(order)) {
                return {
                    status: 403,
                    message: "Invoice available after payment is confirmed"
                };
            }
            return null;

        default:
            return {
                status: 500,
                message: "Invalid capability"
            };
    }
};

const getCancelledOrderPaymentError = (order) =>
    order?.orderStatus === "Cancelled"
        ? { status: 400, message: "This order has been cancelled" }
        : null;

const getOnlinePaymentMethodError = (order) =>
    !isOnlinePaymentMethod(order?.paymentMethod)
        ? { status: 400, message: "This order does not require online payment" }
        : null;

module.exports = {
    MIN_TRACKING_TOKEN_LENGTH,
    PUBLIC_CAPABILITIES,
    isValidTrackingToken,
    findOrderByTrackingToken,
    isPaymentAvailable,
    assertPublicCapability,
    getCancelledOrderPaymentError,
    getOnlinePaymentMethodError
};
