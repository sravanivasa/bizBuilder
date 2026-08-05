const sanitizeValue = (value) => {
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }

    if (value && typeof value === "object") {
        return Object.entries(value).reduce((result, [key, nestedValue]) => {
            if (key.startsWith("$") || key.includes(".")) {
                return result;
            }

            result[key] = sanitizeValue(nestedValue);
            return result;
        }, {});
    }

    return value;
};

const sanitizeInput = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeValue(req.body);
    }

    if (req.params) {
        req.params = sanitizeValue(req.params);
    }

    if (req.query) {
        req.query = sanitizeValue(req.query);
    }

    next();
};

module.exports = sanitizeInput;
