const { query } = require("express-validator");
const { PRODUCT_LIST_SORT_FIELDS } = require("../utils/productListQuery");

const listProductsValidation = [
    query("search")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Search query is too long"),

    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),

    query("sort")
        .optional()
        .isIn(Object.keys(PRODUCT_LIST_SORT_FIELDS))
        .withMessage("Invalid sort field"),

    query("sortDir")
        .optional()
        .isIn(["asc", "desc"])
        .withMessage("Sort direction must be asc or desc")
];

module.exports = {
    listProductsValidation
};
