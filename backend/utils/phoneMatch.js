const normalizePhoneForMatch = (phone) => {
    if (!phone || typeof phone !== "string") {
        return "";
    }

    const digits = phone.replace(/\D/g, "");
    return digits.slice(-10);
};

const isPhoneSearchInput = (value) => {
    const trimmed = String(value || "").trim();

    if (!trimmed) {
        return false;
    }

    if (!/^[\d\s+\-()]+$/.test(trimmed)) {
        return false;
    }

    return trimmed.replace(/\D/g, "").length >= 3;
};

const phonesMatch = (phoneA, phoneB) => {
    const normalizedA = normalizePhoneForMatch(phoneA);
    const normalizedB = normalizePhoneForMatch(phoneB);

    if (!normalizedA || !normalizedB) {
        return false;
    }

    return normalizedA === normalizedB;
};

module.exports = {
    normalizePhoneForMatch,
    phonesMatch,
    isPhoneSearchInput
};
