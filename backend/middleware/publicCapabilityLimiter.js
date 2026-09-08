const rateLimit = require("express-rate-limit");

const publicCapabilityLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: {
        success: false,
        message: "Too many requests. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = publicCapabilityLimiter;
