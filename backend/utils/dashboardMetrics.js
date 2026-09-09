const Order = require("../models/Orders");
const Expense = require("../models/Expense");
const { roundMoney } = require("./gstCalculation");

/**
 * Realized revenue: collected/recognized sales per existing payment lifecycle.
 * - Paid: verified online/card payments
 * - COD: Cash/COD orders (paymentStatus set at creation; invoice-eligible per isInvoiceAvailable)
 * Excludes Cancelled, AwaitingPayment, PaymentSubmitted, Pending, Failed.
 */
const REALIZED_REVENUE_PAYMENT_STATUSES = ["Paid", "COD"];

const buildRealizedRevenueMatch = (businessId, createdAtRange) => {
    const match = {
        business: businessId,
        orderStatus: { $ne: "Cancelled" },
        paymentStatus: { $in: REALIZED_REVENUE_PAYMENT_STATUSES }
    };

    if (createdAtRange) {
        match.createdAt = createdAtRange;
    }

    return match;
};

const buildTodayOrdersMatch = (businessId, createdAtRange) => ({
    business: businessId,
    orderStatus: { $ne: "Cancelled" },
    createdAt: createdAtRange
});

const buildPendingOrdersMatch = (businessId) => ({
    business: businessId,
    orderStatus: "Pending"
});

const aggregateOrderRevenue = async (match) => {
    const [result] = await Order.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                total: { $sum: "$totalAmount" }
            }
        }
    ]);

    return roundMoney(result?.total || 0);
};

const countOrders = async (match) => Order.countDocuments(match);

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

module.exports = {
    REALIZED_REVENUE_PAYMENT_STATUSES,
    buildRealizedRevenueMatch,
    buildTodayOrdersMatch,
    buildPendingOrdersMatch,
    aggregateOrderRevenue,
    countOrders,
    aggregateExpenseTotal
};
