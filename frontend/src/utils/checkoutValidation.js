const CUSTOMER_NAME_MIN = 2;
const CUSTOMER_NAME_MAX = 100;
const ADDRESS_MIN = 10;
const PAYMENT_METHODS = ["Cash", "UPI", "Card"];

export const normalizeIndianPhone = (value) => value.replace(/[\s-]/g, "");

export const isValidIndianPhone = (value) => {
    const cleaned = normalizeIndianPhone(value);
    if (/^\+91[6-9]\d{9}$/.test(cleaned)) {
        return true;
    }
    if (/^91[6-9]\d{9}$/.test(cleaned)) {
        return true;
    }
    return /^[6-9]\d{9}$/.test(cleaned);
};

export const formatIndianPhone = (value) => {
    const cleaned = normalizeIndianPhone(value);
    if (/^\+?91[6-9]\d{9}$/.test(cleaned)) {
        return cleaned.slice(-10);
    }
    return cleaned;
};

export const validateCheckoutForm = (checkout, cartItems, t) => {
    const errors = {};
    const name = checkout.customerName.trim();

    if (!name) {
        errors.customerName = t("validationCustomerNameRequired");
    } else if (name.length < CUSTOMER_NAME_MIN) {
        errors.customerName = t("validationCustomerNameMinLength", { min: CUSTOMER_NAME_MIN });
    } else if (name.length > CUSTOMER_NAME_MAX) {
        errors.customerName = t("validationCustomerNameMaxLength", { max: CUSTOMER_NAME_MAX });
    }

    const phone = checkout.customerPhone.trim();
    if (!phone) {
        errors.customerPhone = t("validationPhoneRequired");
    } else if (!isValidIndianPhone(phone)) {
        errors.customerPhone = t("validationPhoneInvalid");
    }

    const address = checkout.customerAddress.trim();
    if (!address) {
        errors.customerAddress = t("validationAddressRequired");
    } else if (address.length < ADDRESS_MIN) {
        errors.customerAddress = t("validationAddressMinLength", { min: ADDRESS_MIN });
    }

    if (!checkout.paymentMethod || !PAYMENT_METHODS.includes(checkout.paymentMethod)) {
        errors.paymentMethod = t("validationPaymentRequired");
    }

    if (!cartItems.length) {
        errors.cart = t("validationCartEmpty");
    }

    return errors;
};
