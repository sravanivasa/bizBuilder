const { validationResult } = require("express-validator");
const asyncHandler = require("../middleware/asyncHandler");
const { ensureBusinessSlug } = require("../utils/resolveBusiness");
const { roundMoney } = require("../utils/gstCalculation");
const {
    BUSINESS_TIMEZONE,
    getTodayInBusinessTimezone,
    getMonthRangeInBusinessTimezone,
    getIstDayCreatedAtRange,
    getIstMonthCreatedAtRange
} = require("../utils/expenseDate");
const {
    buildRealizedRevenueMatch,
    buildTodayOrdersMatch,
    buildPendingOrdersMatch,
    aggregateOrderRevenue,
    countOrders,
    aggregateExpenseTotal
} = require("../utils/dashboardMetrics");
const { resolveOwnerBusiness } = require("../utils/tenantAuthorization");

const getDashboardSummary = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const { businessId } = req.query;
    const resolved = await resolveOwnerBusiness(req.user._id, businessId);

    if (resolved.error) {
        return res.status(resolved.error.status).json({
            success: false,
            message: resolved.error.message
        });
    }

    const business = resolved.business;

    const businessWithSlug = await ensureBusinessSlug(business);
    const businessObjectId = businessWithSlug._id;
    const today = getTodayInBusinessTimezone();
    const monthRange = getMonthRangeInBusinessTimezone();
    const todayCreatedAtRange = getIstDayCreatedAtRange(today);
    const monthCreatedAtRange = getIstMonthCreatedAtRange(monthRange.start, monthRange.end);
    const activeExpenseMatch = { business: businessObjectId, isActive: true };

    const [
        todayRevenue,
        monthRevenue,
        todayOrders,
        pendingOrders,
        todayExpenses,
        monthExpenses
    ] = await Promise.all([
        aggregateOrderRevenue(buildRealizedRevenueMatch(businessObjectId, todayCreatedAtRange)),
        aggregateOrderRevenue(buildRealizedRevenueMatch(businessObjectId, monthCreatedAtRange)),
        countOrders(buildTodayOrdersMatch(businessObjectId, todayCreatedAtRange)),
        countOrders(buildPendingOrdersMatch(businessObjectId)),
        aggregateExpenseTotal({
            ...activeExpenseMatch,
            expenseDate: today
        }),
        aggregateExpenseTotal({
            ...activeExpenseMatch,
            expenseDate: { $gte: monthRange.start, $lte: monthRange.end }
        })
    ]);

    const todayProfit = roundMoney(todayRevenue - todayExpenses);
    const monthProfit = roundMoney(monthRevenue - monthExpenses);

    res.status(200).json({
        success: true,
        message: "Dashboard summary fetched successfully",
        summary: {
            todayRevenue,
            monthRevenue,
            todayOrders,
            pendingOrders,
            todayExpenses,
            monthExpenses,
            todayProfit,
            monthProfit,
            businessName: businessWithSlug.businessName,
            businessId: String(businessObjectId),
            businessSlug: businessWithSlug.slug || null,
            timezone: BUSINESS_TIMEZONE,
            today,
            monthStart: monthRange.start,
            monthEnd: monthRange.end
        }
    });
});

module.exports = {
    getDashboardSummary
};
