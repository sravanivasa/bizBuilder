import { CHECKOUT_PAYMENT_METHODS } from "../constants/paymentMethods";

const CUSTOMER_NAME_MIN = 2;
const CUSTOMER_NAME_MAX = 100;
const ADDRESS_MIN = 10;

const CHECKOUT_ERROR_PARAMS = {
    checkoutNameMinLength: { min: CUSTOMER_NAME_MIN },
    checkoutNameMaxLength: { max: CUSTOMER_NAME_MAX },
    checkoutAddressMinLength: { min: ADDRESS_MIN }
};

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

export const getCheckoutFieldErrors = (checkout, cartItems) => {
    const errors = {};
    const name = checkout.customerName.trim();

    if (!name) {
        errors.customerName = "checkoutNameRequired";
    } else if (name.length < CUSTOMER_NAME_MIN) {
        errors.customerName = "checkoutNameMinLength";
    } else if (name.length > CUSTOMER_NAME_MAX) {
        errors.customerName = "checkoutNameMaxLength";
    }

    const phone = checkout.customerPhone.trim();
    if (!phone) {
        errors.customerPhone = "checkoutPhoneRequired";
    } else if (!isValidIndianPhone(phone)) {
        errors.customerPhone = "checkoutPhoneInvalid";
    }

    const address = checkout.customerAddress.trim();
    if (!address) {
        errors.customerAddress = "checkoutAddressRequired";
    } else if (address.length < ADDRESS_MIN) {
        errors.customerAddress = "checkoutAddressMinLength";
    }

    if (!checkout.paymentMethod || !CHECKOUT_PAYMENT_METHODS.includes(checkout.paymentMethod)) {
        errors.paymentMethod = "checkoutPaymentRequired";
    }

    if (!cartItems.length) {
        errors.cart = "checkoutCartEmpty";
    }

    return errors;
};

export const translateCheckoutFieldErrors = (errorKeys, t) => {
    return Object.fromEntries(
        Object.entries(errorKeys).map(([field, key]) => [
            field,
            t(key, CHECKOUT_ERROR_PARAMS[key] || {})
        ])
    );
};

export const canEnableCheckoutSubmit = (checkout, cartItems) => {
    return Object.keys(getCheckoutFieldErrors(checkout, cartItems)).length === 0;
};

export const validateCheckoutForm = (checkout, cartItems, t) => {
    return translateCheckoutFieldErrors(getCheckoutFieldErrors(checkout, cartItems), t);
};
