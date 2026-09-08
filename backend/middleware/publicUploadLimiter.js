const rateLimit = require("express-rate-limit");

/** Limits expensive public Cloudinary uploads (delivery photos, return evidence). */
const publicUploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: {
        success: false,
        message: "Too many uploads. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = publicUploadLimiter;
