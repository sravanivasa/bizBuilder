const { query } = require("express-validator");
const { ALL_ORDER_STATUSES } = require("../utils/orderStatus");
const { PAYMENT_STATUSES, PAYMENT_METHODS } = require("../utils/paymentMethods");
const { ORDER_LIST_SORT_FIELDS, isValidExpenseDateString } = require("../utils/orderListQuery");

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

const listOrdersValidation = [
    query("businessId")
        .optional()
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

    query("orderStatus")
        .optional()
        .isIn(ALL_ORDER_STATUSES)
        .withMessage("Invalid order status"),

    query("paymentStatus")
        .optional()
        .isIn(PAYMENT_STATUSES)
        .withMessage("Invalid payment status"),

    query("paymentMethod")
        .optional()
        .isIn(PAYMENT_METHODS)
        .withMessage("Invalid payment method"),

    optionalDateQueryValidation("dateFrom"),
    optionalDateQueryValidation("dateTo"),

    query("sort")
        .optional()
        .isIn(Object.keys(ORDER_LIST_SORT_FIELDS))
        .withMessage("Invalid sort field"),

    query("sortDir")
        .optional()
        .isIn(["asc", "desc"])
        .withMessage("Sort direction must be asc or desc")
];

module.exports = {
    listOrdersValidation
};
