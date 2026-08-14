const { body } = require("express-validator");

const createBusinessValidation = [
    body("businessName").trim().notEmpty().withMessage("Business name is required"),
    body("category").trim().notEmpty().withMessage("Category is required"),
    body("phoneNumber").trim().notEmpty().withMessage("Phone number is required"),
    body("address").trim().notEmpty().withMessage("Address is required"),
    body("description").optional().isString(),
    body("email").optional().isEmail().withMessage("Invalid email address"),
    body("website").optional().isURL().withMessage("Invalid website URL"),
    body("logo").optional().isString(),
    body("gstin")
        .optional()
        .trim()
        .isLength({ max: 15 })
        .withMessage("GSTIN must be at most 15 characters"),
    body("gstEnabled").optional().isBoolean().withMessage("gstEnabled must be a boolean"),
    body("gstRate")
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage("GST rate must be between 0 and 100"),
    body("upiId")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("UPI ID must be at most 100 characters"),
    body("bankAccountName")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Account holder name must be at most 100 characters"),
    body("bankName")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Bank name must be at most 100 characters"),
    body("bankAccountNumber")
        .optional()
        .trim()
        .isLength({ max: 30 })
        .withMessage("Account number must be at most 30 characters"),
    body("bankIfsc")
        .optional()
        .trim()
        .isLength({ max: 11 })
        .withMessage("IFSC code must be at most 11 characters"),
    body("autoConfirmOnlinePayments")
        .optional()
        .isBoolean()
        .withMessage("autoConfirmOnlinePayments must be a boolean"),
    body("razorpayEnabled")
        .optional()
        .isBoolean()
        .withMessage("razorpayEnabled must be a boolean"),
    body("razorpayKeyId")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Razorpay Key ID must be at most 100 characters"),
    body("razorpayKeySecret")
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage("Razorpay Key Secret must be at most 200 characters")
];

const updateBusinessValidation = [
    body("businessName").optional().trim().notEmpty().withMessage("Business name cannot be empty"),
    body("category").optional().trim().notEmpty().withMessage("Category cannot be empty"),
    body("phoneNumber").optional().trim().notEmpty().withMessage("Phone number cannot be empty"),
    body("address").optional().trim().notEmpty().withMessage("Address cannot be empty"),
    body("description").optional().isString(),
    body("email").optional().isEmail().withMessage("Invalid email address"),
    body("website").optional().isURL().withMessage("Invalid website URL"),
    body("logo").optional().isString(),
    body("gstin")
        .optional()
        .trim()
        .isLength({ max: 15 })
        .withMessage("GSTIN must be at most 15 characters"),
    body("gstEnabled").optional().isBoolean().withMessage("gstEnabled must be a boolean"),
    body("gstRate")
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage("GST rate must be between 0 and 100"),
    body("upiId")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("UPI ID must be at most 100 characters"),
    body("bankAccountName")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Account holder name must be at most 100 characters"),
    body("bankName")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Bank name must be at most 100 characters"),
    body("bankAccountNumber")
        .optional()
        .trim()
        .isLength({ max: 30 })
        .withMessage("Account number must be at most 30 characters"),
    body("bankIfsc")
        .optional()
        .trim()
        .isLength({ max: 11 })
        .withMessage("IFSC code must be at most 11 characters"),
    body("autoConfirmOnlinePayments")
        .optional()
        .isBoolean()
        .withMessage("autoConfirmOnlinePayments must be a boolean"),
    body("razorpayEnabled")
        .optional()
        .isBoolean()
        .withMessage("razorpayEnabled must be a boolean"),
    body("razorpayKeyId")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Razorpay Key ID must be at most 100 characters"),
    body("razorpayKeySecret")
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage("Razorpay Key Secret must be at most 200 characters")
];

module.exports = {
    createBusinessValidation,
    updateBusinessValidation
};
