const { normalizePhoneForMatch, isPhoneSearchInput } = require("./phoneMatch");

const normalizeIndianPhone = (value) => String(value || "").replace(/[\s-]/g, "");

const isValidIndianPhone = (value) => {
    const cleaned = normalizeIndianPhone(value);

    if (/^\+91[6-9]\d{9}$/.test(cleaned)) {
        return true;
    }

    if (/^91[6-9]\d{9}$/.test(cleaned)) {
        return true;
    }

    return /^[6-9]\d{9}$/.test(cleaned);
};

const formatPhoneForStorage = (value) => {
    const cleaned = normalizeIndianPhone(value);
    const normalized = normalizePhoneForMatch(cleaned);

    if (!normalized) {
        return cleaned.trim();
    }

    return `+91${normalized}`;
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports = {
    normalizeIndianPhone,
    isValidIndianPhone,
    formatPhoneForStorage,
    normalizePhoneForMatch,
    isPhoneSearchInput,
    escapeRegex
};
