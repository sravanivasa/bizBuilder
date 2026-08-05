const { body } = require("express-validator");

const createBusinessValidation = [
    body("businessName").trim().notEmpty().withMessage("Business name is required"),
    body("category").trim().notEmpty().withMessage("Category is required"),
    body("phoneNumber").trim().notEmpty().withMessage("Phone number is required"),
    body("address").trim().notEmpty().withMessage("Address is required"),
    body("description").optional().isString(),
    body("email").optional().isEmail().withMessage("Invalid email address"),
    body("website").optional().isURL().withMessage("Invalid website URL"),
    body("logo").optional().isString()
];

const updateBusinessValidation = [
    body("businessName").optional().trim().notEmpty().withMessage("Business name cannot be empty"),
    body("category").optional().trim().notEmpty().withMessage("Category cannot be empty"),
    body("phoneNumber").optional().trim().notEmpty().withMessage("Phone number cannot be empty"),
    body("address").optional().trim().notEmpty().withMessage("Address cannot be empty"),
    body("description").optional().isString(),
    body("email").optional().isEmail().withMessage("Invalid email address"),
    body("website").optional().isURL().withMessage("Invalid website URL"),
    body("logo").optional().isString()
];

module.exports = {
    createBusinessValidation,
    updateBusinessValidation
};
