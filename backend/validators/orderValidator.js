const { body } = require("express-validator");

const ORDER_STATUSES = [
    "Pending",
    "Confirmed",
    "Preparing",
    "Completed",
    "Cancelled",
    "Delivered"
];

const createOrderValidation = [
    body("businessId")
        .isMongoId()
        .withMessage("Invalid business ID"),

    body("customerName")
        .trim()
        .notEmpty()
        .withMessage("Customer name is required"),

    body("customerPhone")
        .trim()
        .notEmpty()
        .withMessage("Customer phone is required"),

    body("customerAddress")
        .trim()
        .notEmpty()
        .withMessage("Customer address is required"),

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
        .optional()
        .isIn(["Cash", "Card", "UPI"])
        .withMessage("Invalid payment method")
];

const updateOrderStatusValidation = [
    body("orderStatus")
        .isIn(ORDER_STATUSES)
        .withMessage("Invalid order status")
];

module.exports = {
    createOrderValidation,
    updateOrderStatusValidation
};
