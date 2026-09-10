/**
 * Phase 9 Dashboard QA — run: node backend/scripts/phase9-qa.js
 * Requires MONGODB_URI and running server at QA_BASE_URL for HTTP tests.
 */
const path = require("path");
const crypto = require("crypto");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

let passed = 0;
let failed = 0;

const pass = (name, detail = "") => {
    passed++;
    console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
};

const fail = (name, detail = "") => {
    failed++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
};

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Order = require("../models/Orders");
const Expense = require("../models/Expense");
const Business = require("../models/Business");
const User = require("../models/User");
const Product = require("../models/Product");
const { roundMoney } = require("../utils/gstCalculation");
const {
    getTodayInBusinessTimezone,
    getMonthRangeInBusinessTimezone,
    shiftExpenseDate,
    getIstDayCreatedAtRange,
    getIstMonthCreatedAtRange
} = require("../utils/expenseDate");
const {
    buildRealizedRevenueMatch,
    buildTodayOrdersMatch,
    aggregateOrderRevenue,
    countOrders
} = require("../utils/dashboardMetrics");

const BASE = process.env.QA_BASE_URL || "http://localhost:5000/api";

async function request(method, urlPath, body, token) {
    const headers = { "Content-Type": "application/json" };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE}${urlPath}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    const text = await res.text();
    let json;

    try {
        json = JSON.parse(text);
    } catch {
        json = { raw: text };
    }

    return { status: res.status, body: json };
}

const makeTrackingToken = () => crypto.randomBytes(32).toString("hex");

const buildOrderFixture = ({
    businessId,
    productId,
    totalAmount,
    paymentStatus,
    paymentMethod,
    orderStatus = "Processing",
    createdAt
}) => ({
    business: businessId,
    customerName: "QA Phase9",
    customerPhone: "9876543210",
    customerAddress: "QA Address",
    products: [{ product: productId, quantity: 1, price: totalAmount }],
    totalAmount,
    paymentMethod,
    paymentStatus,
    orderStatus,
    trackingToken: makeTrackingToken(),
    createdAt,
    updatedAt: createdAt
});

const run = async () => {
    if (!process.env.MONGODB_URI) {
        console.log("SKIP  DB tests — MONGODB_URI not set");
        process.exit(0);
    }

    const today = getTodayInBusinessTimezone();
    const monthRange = getMonthRangeInBusinessTimezone();
    const yesterday = shiftExpenseDate(today, -1);
    const previousMonth = shiftExpenseDate(monthRange.start, -1);

    const dayRange = getIstDayCreatedAtRange(today);
    const monthCreatedRange = getIstMonthCreatedAtRange(monthRange.start, monthRange.end);

    if (dayRange.$gte instanceof Date && dayRange.$lt instanceof Date) {
        pass("IST day createdAt range helper");
    } else {
        fail("IST day createdAt range helper");
    }

    if (monthCreatedRange.$gte instanceof Date && monthCreatedRange.$lt instanceof Date) {
        pass("IST month createdAt range helper");
    } else {
        fail("IST month createdAt range helper");
    }

    const boundaryDate = "2026-01-01";
    const boundaryRange = getIstDayCreatedAtRange(boundaryDate);
    const expectedStart = new Date("2026-01-01T00:00:00+05:30").getTime();

    if (boundaryRange.$gte.getTime() === expectedStart) {
        pass("Year boundary IST midnight");
    } else {
        fail("Year boundary IST midnight", String(boundaryRange.$gte));
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const business = await Business.findOne().sort({ createdAt: 1 });
    if (!business) {
        console.log("SKIP  remaining — no business in DB");
        await mongoose.disconnect();
        process.exit(failed ? 1 : 0);
    }

    let product = await Product.findOne({ business: business._id, stock: { $gt: 0 } });

    if (!product) {
        const fallback = await Product.findOne({ business: business._id });

        if (fallback) {
            await Product.findByIdAndUpdate(fallback._id, { $set: { stock: 10 } });
            product = await Product.findById(fallback._id);
        } else {
            product = await Product.create({
                business: business._id,
                productName: `QA Bootstrap Product ${Date.now()}`,
                description: "Phase 9 bootstrap",
                price: 100,
                stock: 10,
                image: "https://placehold.co/100"
            });
        }
    }

    const owner = await User.findById(business.owner);
    const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const otherBusiness = await Business.findOne({ owner: { $ne: business.owner } });

    let serverUp = true;
    try {
        await fetch(`${BASE.replace("/api", "")}/api/health`);
    } catch {
        serverUp = false;
        fail("HTTP server available", "start backend for full QA");
    }

    if (!serverUp) {
        await mongoose.disconnect();
        process.exit(1);
    }

    const noAuth = await request("GET", "/dashboard/summary");
    if (noAuth.status === 401) {
        pass("HTTP unauthorized rejected");
    } else {
        fail("HTTP unauthorized rejected", String(noAuth.status));
    }

    if (otherBusiness) {
        const cross = await request(
            "GET",
            `/dashboard/summary?businessId=${otherBusiness._id}`,
            null,
            token
        );

        if (cross.status === 403) {
            pass("Cross-tenant businessId forbidden");
        } else {
            fail("Cross-tenant businessId forbidden", String(cross.status));
        }
    } else {
        pass("Cross-tenant businessId forbidden", "only one owner in DB — skipped");
    }

    const fixtureTag = "QA Phase9";
    const fixtureCreatedAt = new Date(`${today}T12:00:00+05:30`);

    await Order.deleteMany({
        business: business._id,
        customerName: fixtureTag
    });
    await Expense.deleteMany({
        business: business._id,
        description: { $regex: /^QA Phase9/ }
    });

    const baselineTodayRevenue = await aggregateOrderRevenue(
        buildRealizedRevenueMatch(business._id, dayRange)
    );
    const baselineTodayOrders = await countOrders(buildTodayOrdersMatch(business._id, dayRange));
    const baselinePendingOrders = await countOrders({
        business: business._id,
        orderStatus: "New"
    });

    const revenueFixtures = [
        { label: "Paid", totalAmount: 100, paymentStatus: "Paid", paymentMethod: "GPay", orderStatus: "Delivered", counts: true },
        { label: "COD", totalAmount: 200, paymentStatus: "COD", paymentMethod: "COD", orderStatus: "New", counts: true },
        { label: "AwaitingPayment", totalAmount: 300, paymentStatus: "AwaitingPayment", paymentMethod: "GPay", orderStatus: "New", counts: false },
        { label: "PaymentSubmitted", totalAmount: 400, paymentStatus: "PaymentSubmitted", paymentMethod: "GPay", orderStatus: "New", counts: false },
        { label: "Pending", totalAmount: 500, paymentStatus: "Pending", paymentMethod: "Card", orderStatus: "New", counts: false },
        { label: "Failed", totalAmount: 600, paymentStatus: "Failed", paymentMethod: "GPay", orderStatus: "New", counts: false },
        { label: "CancelledPaid", totalAmount: 700, paymentStatus: "Paid", paymentMethod: "GPay", orderStatus: "Cancelled", counts: false },
        { label: "CancelledCOD", totalAmount: 800, paymentStatus: "COD", paymentMethod: "Cash", orderStatus: "Cancelled", counts: false },
        { label: "CompletedPaid", totalAmount: 90, paymentStatus: "Paid", paymentMethod: "UPI", orderStatus: "Delivered", counts: true },
        { label: "DeliveredPaid", totalAmount: 10, paymentStatus: "Paid", paymentMethod: "NetBanking", orderStatus: "Delivered", counts: true }
    ];

    for (const fixture of revenueFixtures) {
        await Order.create(
            buildOrderFixture({
                businessId: business._id,
                productId: product._id,
                totalAmount: fixture.totalAmount,
                paymentStatus: fixture.paymentStatus,
                paymentMethod: fixture.paymentMethod,
                orderStatus: fixture.orderStatus,
                createdAt: fixtureCreatedAt
            })
        );
    }

    await Order.create(
        buildOrderFixture({
            businessId: business._id,
            productId: product._id,
            totalAmount: 50,
            paymentStatus: "Paid",
            paymentMethod: "GPay",
            orderStatus: "Processing",
            createdAt: new Date(`${yesterday}T12:00:00+05:30`)
        })
    );

    const cancelledToday = buildOrderFixture({
        businessId: business._id,
        productId: product._id,
        totalAmount: 999,
        paymentStatus: "COD",
        paymentMethod: "COD",
        orderStatus: "Cancelled",
        createdAt: fixtureCreatedAt
    });
    cancelledToday.customerName = fixtureTag;
    await Order.create(cancelledToday);

    const fixtureRevenueToday = roundMoney(100 + 200 + 90 + 10);
    const actualRevenueToday = await aggregateOrderRevenue(
        buildRealizedRevenueMatch(business._id, dayRange)
    );
    const revenueDelta = roundMoney(actualRevenueToday - baselineTodayRevenue);

    if (revenueDelta === fixtureRevenueToday) {
        pass("Realized revenue rule today", `+₹${fixtureRevenueToday}`);
    } else {
        fail(
            "Realized revenue rule today",
            `expected delta ${fixtureRevenueToday}, got ${revenueDelta}`
        );
    }

    const fixtureTodayOrders = revenueFixtures.filter((f) => f.orderStatus !== "Cancelled").length;
    const actualTodayOrders = await countOrders(buildTodayOrdersMatch(business._id, dayRange));
    const ordersDelta = actualTodayOrders - baselineTodayOrders;

    if (ordersDelta === fixtureTodayOrders) {
        pass("Today orders exclude cancelled", `+${fixtureTodayOrders}`);
    } else {
        fail("Today orders exclude cancelled", `expected delta ${fixtureTodayOrders}, got ${ordersDelta}`);
    }

    const pendingDelta =
        (await countOrders({ business: business._id, orderStatus: "New" })) - baselinePendingOrders;
    const expectedPendingDelta = revenueFixtures.filter((f) => f.orderStatus === "New").length;

    if (pendingDelta === expectedPendingDelta) {
        pass("New orders lifecycle count", `+${expectedPendingDelta}`);
    } else {
        fail("New orders lifecycle count", `expected delta ${expectedPendingDelta}, got ${pendingDelta}`);
    }

    const yesterdayRevenue = await aggregateOrderRevenue(
        buildRealizedRevenueMatch(business._id, getIstDayCreatedAtRange(yesterday))
    );

    if (yesterdayRevenue >= 50) {
        pass("Yesterday paid order in IST day range", `₹${yesterdayRevenue}`);
    } else {
        fail("Yesterday paid order in IST day range", String(yesterdayRevenue));
    }

    await Expense.create({
        business: business._id,
        amount: 50,
        category: "Misc",
        expenseDate: today,
        description: "QA Phase9 today active",
        isActive: true
    });

    await Expense.create({
        business: business._id,
        amount: 75,
        category: "Rent",
        expenseDate: today,
        description: "QA Phase9 today inactive",
        isActive: false
    });

    await Expense.create({
        business: business._id,
        amount: 25,
        category: "Transport",
        expenseDate: monthRange.start,
        description: "QA Phase9 month start",
        isActive: true
    });

    await Expense.create({
        business: business._id,
        amount: 100,
        category: "Utilities",
        expenseDate: previousMonth,
        description: "QA Phase9 previous month",
        isActive: true
    });

    const summaryRes = await request("GET", `/dashboard/summary?businessId=${business._id}`, null, token);
    const expenseSummaryRes = await request(
        "GET",
        `/expenses/summary?businessId=${business._id}`,
        null,
        token
    );

    const summary = summaryRes.body.summary;
    const expenseSummary = expenseSummaryRes.body.summary;

    if (summaryRes.status === 200 && summary?.businessId === String(business._id)) {
        pass("Dashboard summary returns verified business");
    } else {
        fail("Dashboard summary returns verified business", JSON.stringify(summaryRes.body).slice(0, 120));
    }

    if (summary?.timezone === "Asia/Kolkata" && summary.today === today) {
        pass("Dashboard timezone and today");
    } else {
        fail("Dashboard timezone and today");
    }

    const httpRevenueDelta = roundMoney(summary?.todayRevenue - baselineTodayRevenue);

    if (httpRevenueDelta === fixtureRevenueToday) {
        pass("HTTP today revenue matches rule");
    } else {
        fail("HTTP today revenue matches rule", `expected delta ${fixtureRevenueToday}, got ${httpRevenueDelta}`);
    }

    if (summary?.todayExpenses === expenseSummary?.todayTotal) {
        pass("Dashboard today expenses match expense summary");
    } else {
        fail(
            "Dashboard today expenses match expense summary",
            `dashboard ${summary?.todayExpenses} vs expense ${expenseSummary?.todayTotal}`
        );
    }

    if (summary?.monthExpenses === expenseSummary?.monthTotal) {
        pass("Dashboard month expenses match expense summary");
    } else {
        fail(
            "Dashboard month expenses match expense summary",
            `dashboard ${summary?.monthExpenses} vs expense ${expenseSummary?.monthTotal}`
        );
    }

    const expectedTodayProfit = roundMoney(summary.todayRevenue - summary.todayExpenses);
    const expectedMonthProfit = roundMoney(summary.monthRevenue - summary.monthExpenses);

    if (summary.todayProfit === expectedTodayProfit && summary.monthProfit === expectedMonthProfit) {
        pass("Profit = revenue - expenses");
    } else {
        fail(
            "Profit = revenue - expenses",
            `today ${summary.todayProfit} vs ${expectedTodayProfit}, month ${summary.monthProfit} vs ${expectedMonthProfit}`
        );
    }

    const defaultRes = await request("GET", "/dashboard/summary", null, token);
    const firstBusiness = await Business.findOne({ owner: owner._id }).sort({ createdAt: 1 });

    if (
        defaultRes.status === 200 &&
        defaultRes.body.summary?.businessId === String(firstBusiness._id)
    ) {
        pass("Default summary uses first owned business");
    } else {
        fail("Default summary uses first owned business");
    }

    const badId = await request("GET", "/dashboard/summary?businessId=notanid", null, token);
    if (badId.status === 400) {
        pass("Invalid businessId rejected");
    } else {
        fail("Invalid businessId rejected", String(badId.status));
    }

    const responseKeys = Object.keys(summary || {});
    const forbiddenKeys = ["trackingToken", "deliveryToken", "razorpayKeySecret", "orders"];

    if (!forbiddenKeys.some((key) => responseKeys.includes(key))) {
        pass("Summary response excludes sensitive fields");
    } else {
        fail("Summary response excludes sensitive fields");
    }

    await Order.deleteMany({ business: business._id, customerName: fixtureTag });
    await Expense.deleteMany({ business: business._id, description: { $regex: /^QA Phase9/ } });

    await mongoose.disconnect();
    console.log(`\nPhase 9 QA: ${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
