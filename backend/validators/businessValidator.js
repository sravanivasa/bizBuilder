const { body } = require("express-validator");

const createBusinessValidation = [
    body("businessName").notEmpty().withMessage("Business name is required"),
    body("category").optional().isString(),
    body("phoneNumber").optional().isString(),
    body("description").optional().isString(),
    body("address").optional().isString(),
    body("email").optional().isEmail(),
    body("website").optional().isURL(),
    body("logo").optional().isString()
];

const updateBusinessValidation = [
    body("businessName").optional().notEmpty().withMessage("Business name is required"),
    body("category").optional().isString(),
    body("phoneNumber").optional().isString(),
    body("description").optional().isString(),
    body("address").optional().isString(),
    body("email").optional().isEmail(),
    body("website").optional().isURL(),
    body("logo").optional().isString()
];

module.exports = {
    createBusinessValidation,
    updateBusinessValidation
};
