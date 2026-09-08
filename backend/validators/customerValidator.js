const { body, query } = require("express-validator");
const { isValidIndianPhone } = require("../utils/phoneValidation");

const CUSTOMER_NAME_MIN = 2;
const CUSTOMER_NAME_MAX = 100;
const ADDRESS_MAX = 500;
const NOTES_MAX = 1000;

const customerPhoneValidation = (fieldName = "phone") =>
    body(fieldName)
        .trim()
        .notEmpty()
        .withMessage("Customer phone is required")
        .custom((value) => {
            if (!isValidIndianPhone(value)) {
                throw new Error("Enter a valid 10-digit Indian mobile number");
            }

            return true;
        });

const createCustomerValidation = [
    body("businessId")
        .isMongoId()
        .withMessage("Invalid business ID"),

    body("name")
        .trim()
        .notEmpty()
        .withMessage("Customer name is required")
        .isLength({ min: CUSTOMER_NAME_MIN, max: CUSTOMER_NAME_MAX })
        .withMessage(
            `Customer name must be between ${CUSTOMER_NAME_MIN} and ${CUSTOMER_NAME_MAX} characters`
        ),

    customerPhoneValidation("phone"),

    body("email")
        .optional({ checkFalsy: true })
        .trim()
        .isEmail()
        .withMessage("Enter a valid email address"),

    body("defaultAddress")
        .optional()
        .trim()
        .isLength({ max: ADDRESS_MAX })
        .withMessage(`Address must be at most ${ADDRESS_MAX} characters`),

    body("notes")
        .optional()
        .trim()
        .isLength({ max: NOTES_MAX })
        .withMessage(`Notes must be at most ${NOTES_MAX} characters`)
];

const updateCustomerValidation = [
    body("name")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Customer name cannot be empty")
        .isLength({ min: CUSTOMER_NAME_MIN, max: CUSTOMER_NAME_MAX })
        .withMessage(
            `Customer name must be between ${CUSTOMER_NAME_MIN} and ${CUSTOMER_NAME_MAX} characters`
        ),

    body("phone")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Customer phone cannot be empty")
        .custom((value) => {
            if (!isValidIndianPhone(value)) {
                throw new Error("Enter a valid 10-digit Indian mobile number");
            }

            return true;
        }),

    body("email")
        .optional({ checkFalsy: true })
        .trim()
        .isEmail()
        .withMessage("Enter a valid email address"),

    body("defaultAddress")
        .optional()
        .trim()
        .isLength({ max: ADDRESS_MAX })
        .withMessage(`Address must be at most ${ADDRESS_MAX} characters`),

    body("notes")
        .optional()
        .trim()
        .isLength({ max: NOTES_MAX })
        .withMessage(`Notes must be at most ${NOTES_MAX} characters`)
];

const listCustomersValidation = [
    query("businessId")
        .isMongoId()
        .withMessage("Invalid business ID"),

    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),

    query("search")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Search query is too long"),

    query("active")
        .optional()
        .isIn(["true", "false", "all"])
        .withMessage("Active filter must be true, false, or all")
];

const listCustomerOrdersValidation = [
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100")
];

module.exports = {
    createCustomerValidation,
    updateCustomerValidation,
    listCustomersValidation,
    listCustomerOrdersValidation
};
