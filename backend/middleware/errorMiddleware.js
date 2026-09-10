const { logError } = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
    logError(err.message || "Unhandled error", {
        requestId: req.requestId,
        event: "http.error",
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
        path: req.path,
        method: req.method
    });

    if (err.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: "Invalid ID format"
        });
    }

    if (err.code === 11000) {
        return res.status(409).json({
            success: false,
            message: "Duplicate value entered"
        });
    }

    if (err.name === "ValidationError") {
        return res.status(400).json({
            success: false,
            message: Object.values(err.errors)
                .map((item) => item.message)
                .join(", ")
        });
    }

    const statusCode = err.statusCode || 500;
    const message =
        statusCode === 500 && process.env.NODE_ENV === "production"
            ? "Server Error"
            : err.message || "Server Error";

    res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = errorHandler;
