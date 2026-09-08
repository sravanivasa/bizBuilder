const rateLimit = require("express-rate-limit");

const OTP_VERIFY_WINDOW_MS = 15 * 60 * 1000;
const OTP_VERIFY_MAX_ATTEMPTS = 5;

const otpLimitMessage = {
    success: false,
    message: "Too many OTP attempts. Please try again after 15 minutes."
};

/** Per-IP cap on delivery OTP verification attempts. */
const deliveryOtpIpLimiter = rateLimit({
    windowMs: OTP_VERIFY_WINDOW_MS,
    max: OTP_VERIFY_MAX_ATTEMPTS,
    message: otpLimitMessage,
    standardHeaders: true,
    legacyHeaders: false
});

/** Per delivery-token cap — prevents distributed brute-force on a single order. */
const deliveryOtpTokenLimiter = rateLimit({
    windowMs: OTP_VERIFY_WINDOW_MS,
    max: OTP_VERIFY_MAX_ATTEMPTS,
    message: otpLimitMessage,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.params.deliveryToken || req.ip
});

module.exports = {
    deliveryOtpIpLimiter,
    deliveryOtpTokenLimiter
};
