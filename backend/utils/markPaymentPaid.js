const Order = require("../models/Orders");
const { appendDeliveryTimeline } = require("./deliveryTimeline");
const {
    notifyCustomerPaymentConfirmed,
    notifyOwnerPaymentReceived
} = require("../services/whatsappService");

/** Shared by browser verify endpoint and Razorpay webhook — idempotent. */
const markOrderPaymentPaid = async (order, business, { razorpayPaymentId, note = "Payment confirmed via Razorpay" } = {}) => {
    const current = await Order.findById(order._id);

    if (!current) {
        return { alreadyPaid: false, cancelled: false, order };
    }

    if (current.paymentStatus === "Paid") {
        return { alreadyPaid: true, order: current };
    }

    if (current.orderStatus === "Cancelled") {
        return { alreadyPaid: false, cancelled: true, order: current };
    }

    const setFields = {
        paymentStatus: "Paid",
        paidAt: new Date()
    };

    if (razorpayPaymentId) {
        setFields.razorpayPaymentId = razorpayPaymentId;
    }

    const updated = await Order.findOneAndUpdate(
        { _id: current._id, paymentStatus: { $ne: "Paid" }, orderStatus: { $ne: "Cancelled" } },
        { $set: setFields },
        { new: true }
    );

    if (!updated) {
        const latest = await Order.findById(current._id);

        if (latest?.orderStatus === "Cancelled") {
            return { alreadyPaid: false, cancelled: true, order: latest };
        }

        return { alreadyPaid: true, order: latest || current };
    }

    if (updated.orderStatus === "Pending" || updated.orderStatus === "New") {
        updated.orderStatus = "Processing";
        appendDeliveryTimeline(updated, {
            status: "Processing",
            note
        });
        await updated.save();
    }

    notifyCustomerPaymentConfirmed(updated, business);
    notifyOwnerPaymentReceived(updated, business);

    return { alreadyPaid: false, order: updated };
};

module.exports = {
    markOrderPaymentPaid
};
