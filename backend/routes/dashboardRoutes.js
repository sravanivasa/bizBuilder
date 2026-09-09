const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { dashboardSummaryValidation } = require("../validators/dashboardValidator");
const { getDashboardSummary } = require("../controllers/dashboardController");

router.get("/summary", authMiddleware, ...dashboardSummaryValidation, getDashboardSummary);

module.exports = router;
