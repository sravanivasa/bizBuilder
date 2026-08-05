const { body } = require("express-validator");

const registerValidation = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ max: 100 })
        .withMessage("Name cannot exceed 100 characters"),
    body("email")
        .trim()
        .isEmail()
        .withMessage("Please provide a valid email address")
        .normalizeEmail(),
    body("password")
        .isLength({ min: 6, max: 72 })
        .withMessage("Password must be between 6 and 72 characters long")
];

const loginValidation = [
    body("email")
        .trim()
        .isEmail()
        .withMessage("Please provide a valid email address")
        .normalizeEmail(),
    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isLength({ max: 72 })
        .withMessage("Password cannot exceed 72 characters")
];

module.exports = {
    registerValidation,
    loginValidation
};
