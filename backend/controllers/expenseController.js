const Expense = require("../models/Expense");
const Business = require("../models/Business");
const { validationResult } = require("express-validator");
const asyncHandler = require("../middleware/asyncHandler");
const pickFields = require("../utils/pickFields");
const { roundMoney } = require("../utils/gstCalculation");
const {
    BUSINESS_TIMEZONE,
    getTodayInBusinessTimezone,
    getMonthRangeInBusinessTimezone
} = require("../utils/expenseDate");
const { parseExpenseAmount } = require("../validators/expenseValidator");

const EXPENSE_RESPONSE_FIELDS = [
    "_id",
    "business",
    "amount",
    "category",
    "expenseDate",
    "description",
    "isActive",
    "createdAt",
    "updatedAt"
];

const formatExpense = (expense) =>
    pickFields(expense.toObject ? expense.toObject() : expense, EXPENSE_RESPONSE_FIELDS);

const ensureBusinessOwner = async (businessId, userId) => {
    const business = await Business.findOne({ _id: businessId, owner: userId });

    if (!business) {
        return null;
    }

    return business;
};

const findExpenseForOwner = async (expenseId, userId) => {
    const expense = await Expense.findById(expenseId);

    if (!expense) {
        return { error: { status: 404, message: "Expense not found" } };
    }

    const business = await ensureBusinessOwner(expense.business, userId);

    if (!business) {
        return { error: { status: 403, message: "Forbidden" } };
    }

    return { expense, business };
};

const buildExpenseFilter = ({
    businessId,
    active = "true",
    category,
    from,
    to,
    search
}) => {
    const filter = { business: businessId };

    if (active === "true") {
        filter.isActive = true;
    } else if (active === "false") {
        filter.isActive = false;
    }

    if (category) {
        filter.category = category;
    }

    if (from || to) {
        filter.expenseDate = {};

        if (from) {
            filter.expenseDate.$gte = from;
        }

        if (to) {
            filter.expenseDate.$lte = to;
        }
    }

    const trimmedSearch = search?.trim();

    if (trimmedSearch) {
        const { escapeRegex } = require("../utils/phoneValidation");
        filter.description = { $regex: escapeRegex(trimmedSearch), $options: "i" };
    }

    return filter;
};

const aggregateExpenseTotal = async (match) => {
    const [result] = await Expense.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                total: { $sum: "$amount" }
            }
        }
    ]);

    return roundMoney(result?.total || 0);
};

const createExpense = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const { businessId, amount, category, expenseDate, description } = req.body;
    const business = await ensureBusinessOwner(businessId, req.user._id);

    if (!business) {
        return res.status(403).json({
            success: false,
            message: "Forbidden"
        });
    }

    const parsedAmount = parseExpenseAmount(amount);

    if (parsedAmount === null) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: [{ msg: "Amount must be a positive number up to 999,999.99" }]
        });
    }

    const expense = await Expense.create({
        business: businessId,
        amount: parsedAmount,
        category: category.trim(),
        expenseDate: expenseDate.trim(),
        description: description?.trim() || "",
        isActive: true
    });

    res.status(201).json({
        success: true,
        message: "Expense created successfully",
        expense: formatExpense(expense)
    });
});

const listExpenses = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const { businessId, category, from, to, active = "true", search } = req.query;

    if (from && to && from > to) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: [{ msg: "from date must be on or before to date" }]
        });
    }

    const business = await ensureBusinessOwner(businessId, req.user._id);

    if (!business) {
        return res.status(403).json({
            success: false,
            message: "Forbidden"
        });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const filter = buildExpenseFilter({
        businessId: business._id,
        active,
        category,
        from,
        to,
        search
    });

    const total = await Expense.countDocuments(filter);
    const expenses = await Expense.find(filter)
        .sort({ expenseDate: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    res.status(200).json({
        success: true,
        message: "Expenses fetched successfully",
        expenses: expenses.map(formatExpense),
        pagination: {
            page,
            limit,
            total
        }
    });
});

const getExpenseSummary = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const { businessId } = req.query;
    const business = await ensureBusinessOwner(businessId, req.user._id);

    if (!business) {
        return res.status(403).json({
            success: false,
            message: "Forbidden"
        });
    }

    const businessObjectId = business._id;
    const today = getTodayInBusinessTimezone();
    const monthRange = getMonthRangeInBusinessTimezone();
    const activeMatch = { business: businessObjectId, isActive: true };

    const todayTotal = await aggregateExpenseTotal({
        ...activeMatch,
        expenseDate: today
    });

    const monthTotal = await aggregateExpenseTotal({
        ...activeMatch,
        expenseDate: { $gte: monthRange.start, $lte: monthRange.end }
    });

    res.status(200).json({
        success: true,
        message: "Expense summary fetched successfully",
        summary: {
            todayTotal,
            monthTotal,
            timezone: BUSINESS_TIMEZONE,
            today,
            monthStart: monthRange.start,
            monthEnd: monthRange.end
        }
    });
});

const getExpense = asyncHandler(async (req, res) => {
    const lookup = await findExpenseForOwner(req.params.id, req.user._id);

    if (lookup.error) {
        return res.status(lookup.error.status).json({
            success: false,
            message: lookup.error.message
        });
    }

    res.status(200).json({
        success: true,
        message: "Expense fetched successfully",
        expense: formatExpense(lookup.expense)
    });
});

const updateExpense = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const lookup = await findExpenseForOwner(req.params.id, req.user._id);

    if (lookup.error) {
        return res.status(lookup.error.status).json({
            success: false,
            message: lookup.error.message
        });
    }

    const expense = lookup.expense;
    const { amount, category, expenseDate, description } = req.body;

    if (amount !== undefined) {
        const parsedAmount = parseExpenseAmount(amount);

        if (parsedAmount === null) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: [{ msg: "Amount must be a positive number up to 999,999.99" }]
            });
        }

        expense.amount = parsedAmount;
    }

    if (category !== undefined) {
        expense.category = category.trim();
    }

    if (expenseDate !== undefined) {
        expense.expenseDate = expenseDate.trim();
    }

    if (description !== undefined) {
        expense.description = description.trim();
    }

    await expense.save();

    res.status(200).json({
        success: true,
        message: "Expense updated successfully",
        expense: formatExpense(expense)
    });
});

const deleteExpense = asyncHandler(async (req, res) => {
    const lookup = await findExpenseForOwner(req.params.id, req.user._id);

    if (lookup.error) {
        return res.status(lookup.error.status).json({
            success: false,
            message: lookup.error.message
        });
    }

    const expense = lookup.expense;

    if (!expense.isActive) {
        return res.status(200).json({
            success: true,
            message: "Expense is already deactivated",
            expense: formatExpense(expense)
        });
    }

    expense.isActive = false;
    await expense.save();

    res.status(200).json({
        success: true,
        message: "Expense deactivated successfully",
        expense: formatExpense(expense)
    });
});

module.exports = {
    createExpense,
    listExpenses,
    getExpenseSummary,
    getExpense,
    updateExpense,
    deleteExpense
};
