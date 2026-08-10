const crypto = require("crypto");

const OTP_EXPIRY_HOURS = 24;

const generateDeliveryOtp = () => String(crypto.randomInt(1000, 10000));

const getDeliveryOtpExpiry = () => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + OTP_EXPIRY_HOURS);
    return expiresAt;
};

const isDeliveryOtpValid = (order, otp) => {
    if (!order.deliveryOtp || !otp) {
        return false;
    }

    if (order.deliveryOtpExpiresAt && new Date() > order.deliveryOtpExpiresAt) {
        return false;
    }

    return String(order.deliveryOtp) === String(otp).trim();
};

module.exports = {
    OTP_EXPIRY_HOURS,
    generateDeliveryOtp,
    getDeliveryOtpExpiry,
    isDeliveryOtpValid
};
