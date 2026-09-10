const crypto = require("crypto");

const MAX_REQUEST_ID_LENGTH = 128;
const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]+$/;

const generateRequestId = () => crypto.randomUUID();

const requestIdMiddleware = (req, res, next) => {
    const incoming = req.headers["x-request-id"];

    let requestId = generateRequestId();

    if (typeof incoming === "string") {
        const trimmed = incoming.trim();

        if (
            trimmed.length > 0 &&
            trimmed.length <= MAX_REQUEST_ID_LENGTH &&
            SAFE_REQUEST_ID.test(trimmed)
        ) {
            requestId = trimmed;
        }
    }

    req.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);
    next();
};

module.exports = requestIdMiddleware;
