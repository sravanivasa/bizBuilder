const normalizeIndianPhoneDigits = (phone) => {
    if (!phone) {
        return "";
    }

    let digits = String(phone).replace(/\D/g, "");

    if (digits.length === 10) {
        digits = `91${digits}`;
    } else if (digits.length === 11 && digits.startsWith("0")) {
        digits = `91${digits.slice(1)}`;
    }

    return digits;
};

export const buildPhoneLink = (phone) => {
    const digits = normalizeIndianPhoneDigits(phone);
    return digits ? `tel:+${digits}` : "";
};

export const buildWhatsAppLink = (phone, message = "") => {
    const digits = normalizeIndianPhoneDigits(phone);
    if (!digits) {
        return "";
    }

    const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : "";
    return `https://wa.me/${digits}${encodedMessage}`;
};
