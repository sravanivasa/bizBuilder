const { body } = require("express-validator");

const registerValidation = [
    body("name")
        .trim()
        .notEmpty().withMessage("Name is required"),
    body("email")
        .trim()
        .isEmail().withMessage("Please provide a valid email address")
        .normalizeEmail(),
    body("password")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long")
];

const loginValidation = [
    body("email")
        .trim()
        .isEmail().withMessage("Please provide a valid email address")
        .normalizeEmail(),
    body("password")
        .notEmpty().withMessage("Password is required")
];

module.exports = {
    registerValidation,
    loginValidation
};
