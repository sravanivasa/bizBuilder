const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");
const {
    createExpenseValidation,
    updateExpenseValidation,
    listExpensesValidation,
    expenseSummaryValidation
} = require("../validators/expenseValidator");
const {
    createExpense,
    listExpenses,
    getExpenseSummary,
    getExpense,
    updateExpense,
    deleteExpense
} = require("../controllers/expenseController");

router.post("/", authMiddleware, ...createExpenseValidation, createExpense);
router.get("/summary", authMiddleware, ...expenseSummaryValidation, getExpenseSummary);
router.get("/", authMiddleware, ...listExpensesValidation, listExpenses);
router.get("/:id", authMiddleware, validateObjectId("id"), getExpense);
router.put(
    "/:id",
    authMiddleware,
    validateObjectId("id"),
    ...updateExpenseValidation,
    updateExpense
);
router.delete("/:id", authMiddleware, validateObjectId("id"), deleteExpense);

module.exports = router;
