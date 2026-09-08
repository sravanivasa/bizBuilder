/**
 * Phase 8 Expenses Module QA — run: node backend/scripts/phase8-qa.js
 * Requires MONGODB_URI; optional live server at QA_BASE_URL for HTTP tests.
 */
const path = require("path");
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
const Expense = require("../models/Expense");
const Business = require("../models/Business");
const User = require("../models/User");
const { EXPENSE_CATEGORIES } = require("../constants/expenseCategories");
const { parseExpenseAmount } = require("../validators/expenseValidator");
const {
    getTodayInBusinessTimezone,
    getMonthRangeInBusinessTimezone,
    shiftExpenseDate,
    isValidExpenseDateString
} = require("../utils/expenseDate");
const { roundMoney } = require("../utils/gstCalculation");

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

const run = async () => {
    if (!process.env.MONGODB_URI) {
        console.log("SKIP  DB tests — MONGODB_URI not set");
        process.exit(0);
    }

    if (EXPENSE_CATEGORIES.length === 7 && EXPENSE_CATEGORIES.includes("Misc")) {
        pass("Category enum defined");
    } else {
        fail("Category enum defined");
    }

    if (isValidExpenseDateString("2026-08-20") && !isValidExpenseDateString("2026-13-01")) {
        pass("Date validation helper");
    } else {
        fail("Date validation helper");
    }

    if (parseExpenseAmount(100.555) === 100.56 && parseExpenseAmount(0) === null) {
        pass("Amount parsing and rounding");
    } else {
        fail("Amount parsing and rounding");
    }

    if (parseExpenseAmount(-10) === null && parseExpenseAmount(Infinity) === null) {
        pass("Negative and Infinity rejected");
    } else {
        fail("Negative and Infinity rejected");
    }

    if (parseExpenseAmount(1000000) === null) {
        pass("Excessive amount rejected");
    } else {
        fail("Excessive amount rejected");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const business = await Business.findOne();
    if (!business) {
        console.log("SKIP  remaining — no business in DB");
        await mongoose.disconnect();
        process.exit(failed ? 1 : 0);
    }

    const owner = await User.findById(business.owner);
    const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const otherBusiness = await Business.findOne({ owner: { $ne: business.owner } });

    const today = getTodayInBusinessTimezone();
    const yesterday = shiftExpenseDate(today, -1);
    const monthRange = getMonthRangeInBusinessTimezone();
    const previousMonthDate = shiftExpenseDate(monthRange.start, -1);
    const fixtureDate = "2026-08-20";

    await Expense.deleteMany({
        business: business._id,
        description: { $regex: /^QA Phase8/ }
    });

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

    const noAuth = await request("GET", `/expenses/summary?businessId=${business._id}`);
    if (noAuth.status === 401) {
        pass("HTTP unauthorized rejected");
    } else {
        fail("HTTP unauthorized rejected", String(noAuth.status));
    }

    const badId = await request("GET", "/expenses/notanid", null, token);
    if (badId.status === 400) {
        pass("HTTP invalid ObjectId rejected");
    } else {
        fail("HTTP invalid ObjectId rejected", String(badId.status));
    }

    const createRes = await request(
        "POST",
        "/expenses",
        {
            businessId: String(business._id),
            amount: 100.5,
            category: "Rent",
            expenseDate: fixtureDate,
            description: "QA Phase8 fixture"
        },
        token
    );

    if (createRes.status === 201 && createRes.body.expense?.expenseDate === fixtureDate) {
        pass("Create expense preserves business calendar date");
    } else {
        fail("Create expense preserves business calendar date", JSON.stringify(createRes.body).slice(0, 120));
    }

    const expenseId = createRes.body.expense?._id;

    await Expense.create({
        business: business._id,
        amount: 100,
        category: "Misc",
        expenseDate: today,
        description: "QA Phase8 today",
        isActive: true
    });

    const dupToday = await Expense.findOne({ business: business._id, description: "QA Phase8 today" });

    await Expense.create({
        business: business._id,
        amount: 200,
        category: "Utilities",
        expenseDate: yesterday,
        description: "QA Phase8 yesterday",
        isActive: true
    });

    await Expense.create({
        business: business._id,
        amount: 300,
        category: "Transport",
        expenseDate: monthRange.start,
        description: "QA Phase8 month start",
        isActive: true
    });

    await Expense.create({
        business: business._id,
        amount: 400,
        category: "Marketing",
        expenseDate: previousMonthDate,
        description: "QA Phase8 previous month",
        isActive: true
    });

    const summaryRes = await request("GET", `/expenses/summary?businessId=${business._id}`, null, token);
    const expectedToday = roundMoney(100);
    const expectedMonth = roundMoney(100 + 200 + 300);

    if (
        summaryRes.status === 200 &&
        summaryRes.body.summary?.todayTotal === expectedToday &&
        summaryRes.body.summary?.monthTotal === expectedMonth &&
        summaryRes.body.summary?.timezone === "Asia/Kolkata"
    ) {
        pass("Summary today/month totals", `today=${expectedToday} month=${expectedMonth}`);
    } else {
        fail(
            "Summary today/month totals",
            JSON.stringify({
                today: summaryRes.body.summary?.todayTotal,
                expectedToday,
                month: summaryRes.body.summary?.monthTotal,
                expectedMonth
            })
        );
    }

    const listRes = await request(
        "GET",
        `/expenses?businessId=${business._id}&page=1&limit=2&category=Rent`,
        null,
        token
    );

    if (listRes.status === 200 && listRes.body.pagination?.total === 1) {
        pass("List category filter and pagination total");
    } else {
        fail("List category filter", JSON.stringify(listRes.body.pagination));
    }

    const rangeRes = await request(
        "GET",
        `/expenses?businessId=${business._id}&from=${monthRange.start}&to=${monthRange.end}&active=true`,
        null,
        token
    );

    if (rangeRes.status === 200 && rangeRes.body.pagination?.total === 3) {
        pass("List date range filter");
    } else {
        fail("List date range filter", String(rangeRes.body.pagination?.total));
    }

    const getRes = await request("GET", `/expenses/${expenseId}`, null, token);
    if (getRes.status === 200 && getRes.body.expense?._id) {
        pass("Get expense by id");
    } else {
        fail("Get expense by id", String(getRes.status));
    }

    const updateRes = await request(
        "PUT",
        `/expenses/${expenseId}`,
        { amount: 250.25, description: "QA Phase8 updated" },
        token
    );

    if (updateRes.status === 200 && updateRes.body.expense?.amount === 250.25) {
        pass("Update expense amount");
    } else {
        fail("Update expense amount", JSON.stringify(updateRes.body.expense));
    }

    const deleteRes = await request("DELETE", `/expenses/${expenseId}`, null, token);
    if (deleteRes.status === 200 && deleteRes.body.expense?.isActive === false) {
        pass("Soft delete expense");
    } else {
        fail("Soft delete expense", String(deleteRes.status));
    }

    const afterDeleteSummary = await request(
        "GET",
        `/expenses/summary?businessId=${business._id}`,
        null,
        token
    );

    if (afterDeleteSummary.body.summary?.monthTotal === expectedMonth) {
        pass("Inactive expense excluded from summary");
    } else {
        fail(
            "Inactive expense excluded from summary",
            `${afterDeleteSummary.body.summary?.monthTotal} vs ${expectedMonth}`
        );
    }

    const stillExists = await Expense.findById(expenseId);
    if (stillExists && stillExists.isActive === false) {
        pass("Soft delete retains DB record");
    } else {
        fail("Soft delete retains DB record");
    }

    if (otherBusiness) {
        const otherOwner = await User.findById(otherBusiness.owner);
        const otherToken = jwt.sign({ id: otherOwner._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        const crossGet = await request("GET", `/expenses/${dupToday._id}`, null, otherToken);
        if (crossGet.status === 403) {
            pass("Cross-business get forbidden");
        } else {
            fail("Cross-business get forbidden", String(crossGet.status));
        }

        const crossUpdate = await request(
            "PUT",
            `/expenses/${dupToday._id}`,
            { amount: 1 },
            otherToken
        );
        if (crossUpdate.status === 403) {
            pass("Cross-business update forbidden");
        } else {
            fail("Cross-business update forbidden", String(crossUpdate.status));
        }

        const crossDelete = await request("DELETE", `/expenses/${dupToday._id}`, null, otherToken);
        if (crossDelete.status === 403) {
            pass("Cross-business delete forbidden");
        } else {
            fail("Cross-business delete forbidden", String(crossDelete.status));
        }

        const crossSummary = await request(
            "GET",
            `/expenses/summary?businessId=${business._id}`,
            null,
            otherToken
        );
        if (crossSummary.status === 403) {
            pass("Cross-business summary forbidden");
        } else {
            fail("Cross-business summary forbidden", String(crossSummary.status));
        }
    } else {
        pass("Cross-business tests", "single owner in DB — skipped");
    }

    const zeroRes = await request(
        "POST",
        "/expenses",
        {
            businessId: String(business._id),
            amount: 0,
            category: "Misc",
            expenseDate: today
        },
        token
    );
    if (zeroRes.status === 400) {
        pass("Zero amount rejected");
    } else {
        fail("Zero amount rejected", String(zeroRes.status));
    }

    const invalidCategoryRes = await request(
        "POST",
        "/expenses",
        {
            businessId: String(business._id),
            amount: 50,
            category: "Hacked",
            expenseDate: today
        },
        token
    );
    if (invalidCategoryRes.status === 400) {
        pass("Invalid category rejected");
    } else {
        fail("Invalid category rejected", String(invalidCategoryRes.status));
    }

    const fakeBiz = new mongoose.Types.ObjectId();
    const crossList = await request("GET", `/expenses?businessId=${fakeBiz}`, null, token);
    if (crossList.status === 403) {
        pass("Cross-business list forbidden");
    } else {
        fail("Cross-business list forbidden", String(crossList.status));
    }

    const persisted = await Expense.findById(expenseId);
    if (persisted?.expenseDate === fixtureDate) {
        pass("Persisted expenseDate unchanged in DB");
    } else {
        fail("Persisted expenseDate unchanged in DB", persisted?.expenseDate);
    }

    await Expense.deleteMany({
        business: business._id,
        description: { $regex: /^QA Phase8/ }
    });
    await Expense.deleteMany({ business: business._id, expenseDate: fixtureDate });

    await mongoose.disconnect();
    console.log(`\nPhase 8 QA: ${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
