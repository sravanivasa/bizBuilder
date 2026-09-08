const rateLimit = require("express-rate-limit");

/** Stricter than global (100/15m) — limits automated public checkout spam. */
const publicOrderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: "Too many orders placed. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = publicOrderLimiter;
