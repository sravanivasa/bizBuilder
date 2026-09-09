const { body, query } = require("express-validator");
const { EXPENSE_CATEGORIES } = require("../constants/expenseCategories");
const { roundMoney } = require("../utils/gstCalculation");
const { isValidExpenseDateString } = require("../utils/expenseDate");

const MAX_EXPENSE_AMOUNT = 999999.99;
const DESCRIPTION_MAX = 500;

const parseExpenseAmount = (value) => {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    const numeric = Number(value);

    if (!Number.isFinite(numeric) || numeric <= 0 || numeric > MAX_EXPENSE_AMOUNT) {
        return null;
    }

    return roundMoney(numeric);
};

const expenseAmountValidation = (fieldName = "amount", required = true) => {
    const chain = body(fieldName);

    if (required) {
        chain.notEmpty().withMessage("Amount is required");
    } else {
        chain.optional();
    }

    return chain.custom((value) => {
        if (!required && (value === undefined || value === null || value === "")) {
            return true;
        }

        const parsed = parseExpenseAmount(value);

        if (parsed === null) {
            throw new Error(
                `Amount must be a positive number up to ${MAX_EXPENSE_AMOUNT.toLocaleString("en-IN")}`
            );
        }

        return true;
    });
};

const expenseDateValidation = (fieldName = "expenseDate", required = true) => {
    const chain = body(fieldName);

    if (required) {
        chain.notEmpty().withMessage("Expense date is required");
    } else {
        chain.optional();
    }

    return chain
        .trim()
        .custom((value) => {
            if (!required && (value === undefined || value === null || value === "")) {
                return true;
            }

            if (!isValidExpenseDateString(value)) {
                throw new Error("Expense date must be a valid date in YYYY-MM-DD format");
            }

            return true;
        });
};

const optionalDateQueryValidation = (fieldName) =>
    query(fieldName)
        .optional()
        .trim()
        .custom((value) => {
            if (!value) {
                return true;
            }

            if (!isValidExpenseDateString(value)) {
                throw new Error(`${fieldName} must be a valid date in YYYY-MM-DD format`);
            }

            return true;
        });

const createExpenseValidation = [
    body("businessId")
        .isMongoId()
        .withMessage("Invalid business ID"),

    expenseAmountValidation("amount", true),

    body("category")
        .trim()
        .notEmpty()
        .withMessage("Category is required")
        .isIn(EXPENSE_CATEGORIES)
        .withMessage("Invalid expense category"),

    expenseDateValidation("expenseDate", true),

    body("description")
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: DESCRIPTION_MAX })
        .withMessage(`Description must be at most ${DESCRIPTION_MAX} characters`)
];

const updateExpenseValidation = [
    expenseAmountValidation("amount", false),

    body("category")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Category cannot be empty")
        .isIn(EXPENSE_CATEGORIES)
        .withMessage("Invalid expense category"),

    expenseDateValidation("expenseDate", false),

    body("description")
        .optional()
        .trim()
        .isLength({ max: DESCRIPTION_MAX })
        .withMessage(`Description must be at most ${DESCRIPTION_MAX} characters`)
];

const listExpensesValidation = [
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

    query("category")
        .optional()
        .trim()
        .isIn(EXPENSE_CATEGORIES)
        .withMessage("Invalid expense category"),

    optionalDateQueryValidation("from"),
    optionalDateQueryValidation("to"),

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

const expenseSummaryValidation = [
    query("businessId")
        .isMongoId()
        .withMessage("Invalid business ID")
];

module.exports = {
    MAX_EXPENSE_AMOUNT,
    parseExpenseAmount,
    createExpenseValidation,
    updateExpenseValidation,
    listExpensesValidation,
    expenseSummaryValidation
};
