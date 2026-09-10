const SENSITIVE_KEY_PATTERN =
    /(password|secret|token|authorization|jwt|otp|credential|api[_-]?key|mongodb|uri)/i;

const REDACTED = "[REDACTED]";

const sanitizeValue = (value) => {
    if (value === null || value === undefined) {
        return value;
    }

    if (typeof value === "string") {
        if (value.length > 500) {
            return `${value.slice(0, 500)}…`;
        }

        return value;
    }

    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }

    if (typeof value === "object") {
        return sanitizeMeta(value);
    }

    return value;
};

const sanitizeMeta = (meta = {}) => {
    const sanitized = {};

    for (const [key, value] of Object.entries(meta)) {
        if (SENSITIVE_KEY_PATTERN.test(key)) {
            sanitized[key] = REDACTED;
        } else {
            sanitized[key] = sanitizeValue(value);
        }
    }

    return sanitized;
};

const write = (level, message, meta = {}) => {
    const entry = {
        level,
        message,
        timestamp: new Date().toISOString(),
        ...sanitizeMeta(meta)
    };

    const line = JSON.stringify(entry);

    if (level === "error") {
        console.error(line);
        return;
    }

    if (level === "warn") {
        console.warn(line);
        return;
    }

    console.log(line);
};

const logInfo = (message, meta) => write("info", message, meta);
const logWarn = (message, meta) => write("warn", message, meta);
const logError = (message, meta) => write("error", message, meta);

module.exports = {
    logInfo,
    logWarn,
    logError,
    sanitizeMeta
};
