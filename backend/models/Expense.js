const mongoose = require("mongoose");
const { EXPENSE_CATEGORIES } = require("../constants/expenseCategories");

const expenseSchema = new mongoose.Schema(
    {
        business: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Business",
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0.01,
            max: 999999.99
        },
        category: {
            type: String,
            required: true,
            enum: EXPENSE_CATEGORIES,
            trim: true
        },
        // Business-calendar date (YYYY-MM-DD) in Asia/Kolkata semantics — not UTC-shifted.
        expenseDate: {
            type: String,
            required: true,
            trim: true,
            match: /^\d{4}-\d{2}-\d{2}$/
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ""
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

expenseSchema.index({ business: 1, expenseDate: -1 });
expenseSchema.index({ business: 1, isActive: 1, expenseDate: -1 });

module.exports = mongoose.model("Expense", expenseSchema);
