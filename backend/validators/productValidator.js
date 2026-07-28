const { body } = require("express-validator");

const createProductValidation = [
    body("productName").trim().notEmpty().withMessage("Product name is required"),
    body("description").optional().isString(),
    body("price").trim().notEmpty().isFloat({ gt: 0 }).withMessage("Price must be a positive number")   ,
    body("stock").optional().isInt({ min: 0 })
];

const updateProductValidation = [
    body("productName").trim().optional().notEmpty().withMessage("Product name is required"),
    body("description").optional().isString(),
    body("price").trim().optional().isFloat({ gt: 0 }).withMessage("Price must be a positive number"),
    body("stock").optional().isInt({ min: 0 })
];

module.exports = {
    createProductValidation,
    updateProductValidation
};