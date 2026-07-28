const { body } = require("express-validator");

const createOrderValidation = [
    body("businessId")
        .notEmpty()
        .withMessage("Business ID is required"),

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

    body("paymentMethod")
        .isIn(["Cash", "Card", "UPI", "Net Banking"])
        .withMessage("Invalid payment method")
];

const updateOrderStatusValidation = [
    body("status")
        .isIn([
            "Pending",
            "Confirmed",
            "Preparing",
            "Out for Delivery",
            "Delivered",
            "Cancelled"
        ])
        .withMessage("Invalid order status")
];
module.exports = {
    createOrderValidation,
    updateOrderStatusValidation
};