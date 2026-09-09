const { query } = require("express-validator");

const dashboardSummaryValidation = [
    query("businessId")
        .optional()
        .isMongoId()
        .withMessage("Invalid business ID")
];

module.exports = {
    dashboardSummaryValidation
};
