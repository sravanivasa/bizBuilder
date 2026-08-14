const { appendDeliveryTimeline } = require("./deliveryTimeline");
const {
    notifyCustomerPaymentConfirmed,
    notifyOwnerPaymentReceived
} = require("../services/whatsappService");

/** Shared by browser verify endpoint and Razorpay webhook — idempotent. */
const markOrderPaymentPaid = async (order, business, { razorpayPaymentId, note = "Payment confirmed via Razorpay" } = {}) => {
    if (order.paymentStatus === "Paid") {
        return { alreadyPaid: true, order };
    }

    order.paymentStatus = "Paid";
    order.paidAt = new Date();

    if (razorpayPaymentId) {
        order.razorpayPaymentId = razorpayPaymentId;
    }

    if (order.orderStatus === "Pending" || order.orderStatus === "New") {
        order.orderStatus = "Confirmed";
        appendDeliveryTimeline(order, {
            status: "Confirmed",
            note
        });
    }

    await order.save();

    notifyCustomerPaymentConfirmed(order, business);
    notifyOwnerPaymentReceived(order, business);

    return { alreadyPaid: false, order };
};

module.exports = {
    markOrderPaymentPaid
};
