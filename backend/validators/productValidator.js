const { body } = require("express-validator");

const createProductValidation = [
    body("productName").trim().notEmpty().withMessage("Product name is required"),
    body("description").optional().isString(),
    body("price")
        .notEmpty()
        .withMessage("Price is required")
        .isFloat({ gt: 0 })
        .withMessage("Price must be a positive number"),
    body("stock")
        .notEmpty()
        .withMessage("Stock is required")
        .isInt({ min: 0 })
        .withMessage("Stock must be zero or greater")
];

const updateProductValidation = [
    body("productName")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Product name cannot be empty"),
    body("description").optional().isString(),
    body("price")
        .optional()
        .isFloat({ gt: 0 })
        .withMessage("Price must be a positive number"),
    body("stock")
        .optional()
        .isInt({ min: 0 })
        .withMessage("Stock must be zero or greater")
];

const bulkCreateProductsValidation = [
    body("products")
        .isArray({ min: 1 })
        .withMessage("Products array is required and must not be empty")
];

module.exports = {
    createProductValidation,
    updateProductValidation,
    bulkCreateProductsValidation
};
