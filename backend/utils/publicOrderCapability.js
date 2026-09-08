const { isOnlinePaymentMethod } = require("./paymentMethods");

const MIN_TRACKING_TOKEN_LENGTH = 32;

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

const getCancelledOrderPaymentError = (order) => {
    if (order.orderStatus === "Cancelled") {
        return {
            status: 400,
            message: "This order has been cancelled"
        };
    }

    return null;
};

const getOnlinePaymentMethodError = (order) => {
    if (!isOnlinePaymentMethod(order.paymentMethod)) {
        return {
            status: 400,
            message: "This order does not require online payment"
        };
    }

    return null;
};

module.exports = {
    MIN_TRACKING_TOKEN_LENGTH,
    isValidTrackingToken,
    findOrderByTrackingToken,
    getCancelledOrderPaymentError,
    getOnlinePaymentMethodError
};
