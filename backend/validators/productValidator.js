const { body } = require("express-validator");

const createProductValidation = [
    body("productName").notEmpty().withMessage("Product name is required"),
    body("description").optional().isString(),
    body("price").optional().isNumeric(),
    body("stock").optional().isInt({ min: 0 })
];

const updateProductValidation = [
    body("productName").optional().notEmpty().withMessage("Product name is required"),
    body("description").optional().isString(),
    body("price").optional().isNumeric(),
    body("stock").optional().isInt({ min: 0 })
];

module.exports = {
    createProductValidation,
    updateProductValidation
};