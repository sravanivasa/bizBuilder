const { body, query } = require("express-validator");

const CUSTOMER_NAME_MIN = 2;
const CUSTOMER_NAME_MAX = 100;
const ADDRESS_MIN = 10;

const normalizeIndianPhone = (value) => value.replace(/[\s-]/g, "");

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

const indianPhoneValidation = (fieldName, requiredMessage, location = "body") =>
    (location === "query" ? query(fieldName) : body(fieldName))
        .trim()
        .notEmpty()
        .withMessage(requiredMessage)
        .custom((value) => {
            if (!isValidIndianPhone(value)) {
                throw new Error("Enter a valid 10-digit Indian mobile number");
            }
            return true;
        });

const publicOrderValidation = [
    body("customerName")
        .trim()
        .notEmpty()
        .withMessage("Customer name is required")
        .isLength({ min: CUSTOMER_NAME_MIN, max: CUSTOMER_NAME_MAX })
        .withMessage(
            `Customer name must be between ${CUSTOMER_NAME_MIN} and ${CUSTOMER_NAME_MAX} characters`
        ),

    indianPhoneValidation("customerPhone", "Customer phone is required"),

    body("customerAddress")
        .trim()
        .notEmpty()
        .withMessage("Customer address is required")
        .isLength({ min: ADDRESS_MIN })
        .withMessage(`Customer address must be at least ${ADDRESS_MIN} characters`),

    body("products")
        .isArray({ min: 1 })
        .withMessage("At least one product is required"),

    body("products.*.product")
        .isMongoId()
        .withMessage("Each product ID must be valid"),

    body("products.*.quantity")
        .isInt({ min: 1 })
        .withMessage("Each product quantity must be at least 1"),

    body("paymentMethod")
        .notEmpty()
        .withMessage("Payment method is required")
        .isIn(["Cash", "Card", "UPI"])
        .withMessage("Invalid payment method")
];

const trackOrderValidation = [
    query("orderId")
        .trim()
        .notEmpty()
        .withMessage("Order ID is required")
        .isLength({ min: 6, max: 24 })
        .withMessage("Order ID must be 6 characters or a full order ID"),

    indianPhoneValidation("phone", "Phone number is required", "query")
];

const returnRequestValidation = [
    indianPhoneValidation("phone", "Phone number is required"),

    body("reason")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Return reason must be at most 500 characters")
];

module.exports = {
    publicOrderValidation,
    trackOrderValidation,
    returnRequestValidation
};
