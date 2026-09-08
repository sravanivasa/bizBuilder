const crypto = require("crypto");

const OTP_EXPIRY_HOURS = 24;
const NEW_OTP_MIN = 100000;
const NEW_OTP_MAX = 1000000;

const generateDeliveryOtp = () => String(crypto.randomInt(NEW_OTP_MIN, NEW_OTP_MAX));

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

    const stored = String(order.deliveryOtp).trim();
    const provided = String(otp).trim();

    if (stored.length !== provided.length) {
        return false;
    }

    try {
        return crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(provided));
    } catch {
        return false;
    }
};

module.exports = {
    OTP_EXPIRY_HOURS,
    generateDeliveryOtp,
    getDeliveryOtpExpiry,
    isDeliveryOtpValid
};
