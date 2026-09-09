/**
 * Phase 10 Search & Filters QA — run: node backend/scripts/phase10-qa.js
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
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Expense = require("../models/Expense");
const Business = require("../models/Business");
const User = require("../models/User");
const { getTodayInBusinessTimezone, shiftExpenseDate } = require("../utils/expenseDate");
const { shortOrderId } = require("../utils/orderListQuery");
const { normalizePhoneForMatch } = require("../utils/phoneValidation");

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

const run = async () => {
    if (!process.env.MONGODB_URI) {
        console.log("SKIP  DB tests — MONGODB_URI not set");
        process.exit(0);
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const business = await Business.findOne().sort({ createdAt: 1 });
    if (!business) {
        console.log("SKIP  remaining — no business");
        await mongoose.disconnect();
        process.exit(failed ? 1 : 0);
    }

    const owner = await User.findById(business.owner);
    const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const otherBusiness = await Business.findOne({ owner: { $ne: business.owner } });
    const product = await Product.findOne({ business: business._id });

    let serverUp = true;
    try {
        await fetch(`${BASE.replace("/api", "")}/api/health`);
    } catch {
        serverUp = false;
        fail("HTTP server available", "start backend");
    }

    if (!serverUp) {
        await mongoose.disconnect();
        process.exit(1);
    }

    const unauth = [
        ["products", `/products/business/${business._id}`],
        ["orders", "/orders"],
        ["customers", `/customers?businessId=${business._id}`],
        ["expenses", `/expenses?businessId=${business._id}`]
    ];

    for (const [label, path] of unauth) {
        const res = await request("GET", path);
        if (res.status === 401) pass(`Unauthenticated ${label} rejected`);
        else fail(`Unauthenticated ${label} rejected`, String(res.status));
    }

    if (otherBusiness) {
        const crossOrder = await request(
            "GET",
            `/orders?businessId=${otherBusiness._id}`,
            null,
            token
        );
        if (crossOrder.status === 403) pass("Cross-owner orders business rejected");
        else fail("Cross-owner orders business rejected", String(crossOrder.status));

        const crossProduct = await request(
            "GET",
            `/products/business/${otherBusiness._id}`,
            null,
            token
        );
        if (crossProduct.status === 403) pass("Cross-owner products business rejected");
        else fail("Cross-owner products business rejected", String(crossProduct.status));
    } else {
        pass("Cross-owner rejection", "only one owner — skipped");
    }

    const tag = "QA Phase10";
    const today = getTodayInBusinessTimezone();
    const yesterday = shiftExpenseDate(today, -1);

    await Product.deleteMany({ business: business._id, productName: { $regex: /^QA Phase10/ } });
    await Order.deleteMany({ business: business._id, customerName: tag });
    await Customer.deleteMany({ business: business._id, name: { $regex: /^QA Phase10/ } });
    await Expense.deleteMany({ business: business._id, description: { $regex: /^QA Phase10/ } });

    const productA = await Product.create({
        business: business._id,
        productName: "QA Phase10 Alpha Widget",
        description: "special gadget",
        price: 100,
        stock: 10,
        image: "https://placehold.co/100"
    });
    const productB = await Product.create({
        business: business._id,
        productName: "QA Phase10 Beta Item",
        description: "other thing",
        price: 50,
        stock: 5,
        image: "https://placehold.co/100"
    });

    const searchProd = await request(
        "GET",
        `/products/business/${business._id}?search=Alpha&page=1&limit=12`,
        null,
        token
    );
    if (
        searchProd.status === 200 &&
        searchProd.body.products?.length === 1 &&
        searchProd.body.products[0].productName.includes("Alpha")
    ) {
        pass("Product server search");
    } else {
        fail("Product server search", JSON.stringify(searchProd.body.products?.map((p) => p.productName)));
    }

    if (searchProd.body.pagination?.total === 1) pass("Product pagination total");
    else fail("Product pagination total", String(searchProd.body.pagination?.total));

    const badProductPage = await request(
        "GET",
        `/products/business/${business._id}?page=0&limit=200`,
        null,
        token
    );
    if (badProductPage.status === 400) pass("Product invalid pagination rejected");
    else fail("Product invalid pagination rejected", String(badProductPage.status));

    const longSearch = "x".repeat(101);
    const longProd = await request(
        "GET",
        `/products/business/${business._id}?search=${longSearch}`,
        null,
        token
    );
    if (longProd.status === 400) pass("Product search length limit");
    else fail("Product search length limit", String(longProd.status));

    const fixtureCreatedAt = new Date(`${today}T12:00:00+05:30`);
    const paidOrder = await Order.create({
        business: business._id,
        customerName: tag,
        customerPhone: "9876501234",
        customerAddress: "QA",
        products: [{ product: productA._id, quantity: 1, price: 100 }],
        totalAmount: 100,
        paymentMethod: "GPay",
        paymentStatus: "Paid",
        orderStatus: "Delivered",
        trackingToken: makeTrackingToken(),
        razorpayOrderId: "order_secret_test",
        razorpayPaymentId: "pay_secret_test",
        createdAt: fixtureCreatedAt
    });
    await Order.create({
        business: business._id,
        customerName: tag,
        customerPhone: "9876509999",
        customerAddress: "QA",
        products: [{ product: productA._id, quantity: 1, price: 200 }],
        totalAmount: 200,
        paymentMethod: "GPay",
        paymentStatus: "AwaitingPayment",
        orderStatus: "Pending",
        trackingToken: makeTrackingToken(),
        createdAt: fixtureCreatedAt
    });
    if (otherBusiness) {
        await Order.create({
            business: otherBusiness._id,
            customerName: tag,
            customerPhone: "9876511111",
            customerAddress: "QA",
            products: [{ product: product?._id || productA._id, quantity: 1, price: 1 }],
            totalAmount: 1,
            paymentStatus: "Paid",
            orderStatus: "Delivered",
            trackingToken: makeTrackingToken(),
            createdAt: fixtureCreatedAt
        });
    }

    const defaultOrders = await request("GET", "/orders", null, token);
    if (
        defaultOrders.status === 200 &&
        defaultOrders.body.businessId === String(business._id) &&
        defaultOrders.body.orders?.every((o) => String(o.business) === String(business._id))
    ) {
        pass("Orders default business scoped");
    } else {
        fail("Orders default business scoped");
    }

    const explicitOrders = await request(
        "GET",
        `/orders?businessId=${business._id}&paymentStatus=Paid&page=1&limit=50`,
        null,
        token
    );
    const paidOnly = explicitOrders.body.orders || [];
    if (
        explicitOrders.status === 200 &&
        paidOnly.length >= 1 &&
        paidOnly.every((o) => o.paymentStatus === "Paid")
    ) {
        pass("Orders payment status filter");
    } else {
        fail("Orders payment status filter");
    }

    const searchOrder = await request(
        "GET",
        `/orders?businessId=${business._id}&search=${shortOrderId(paidOrder._id)}`,
        null,
        token
    );
    if (
        searchOrder.status === 200 &&
        searchOrder.body.orders?.some((o) => String(o._id) === String(paidOrder._id))
    ) {
        pass("Orders short ID search");
    } else {
        fail("Orders short ID search");
    }

    const statusFilter = await request(
        "GET",
        `/orders?businessId=${business._id}&orderStatus=Delivered&page=1&limit=50`,
        null,
        token
    );
    if (
        statusFilter.status === 200 &&
        statusFilter.body.orders?.length >= 1 &&
        statusFilter.body.orders.every((o) => o.orderStatus === "Delivered")
    ) {
        pass("Orders order status filter");
    } else {
        fail("Orders order status filter");
    }

    const methodFilter = await request(
        "GET",
        `/orders?businessId=${business._id}&paymentMethod=GPay&page=1&limit=50`,
        null,
        token
    );
    if (
        methodFilter.status === 200 &&
        methodFilter.body.orders?.length >= 1 &&
        methodFilter.body.orders.every((o) => o.paymentMethod === "GPay")
    ) {
        pass("Orders payment method filter");
    } else {
        fail("Orders payment method filter");
    }

    const dateFilter = await request(
        "GET",
        `/orders?businessId=${business._id}&dateFrom=${today}&dateTo=${today}&page=1&limit=50`,
        null,
        token
    );
    if (dateFilter.status === 200 && dateFilter.body.pagination?.total >= 2) {
        pass("Orders date range filter");
    } else {
        fail("Orders date range filter", String(dateFilter.body.pagination?.total));
    }

    const orderPage1 = await request(
        "GET",
        `/orders?businessId=${business._id}&search=${tag}&page=1&limit=1`,
        null,
        token
    );
    const orderPage2 = await request(
        "GET",
        `/orders?businessId=${business._id}&search=${tag}&page=2&limit=1`,
        null,
        token
    );
    if (
        orderPage1.status === 200 &&
        orderPage2.status === 200 &&
        orderPage1.body.pagination?.total >= 2 &&
        orderPage1.body.orders?.length === 1 &&
        orderPage2.body.orders?.length === 1 &&
        String(orderPage1.body.orders[0]._id) !== String(orderPage2.body.orders[0]._id)
    ) {
        pass("Orders pagination");
    } else {
        fail("Orders pagination");
    }

    if (orderPage1.body.pagination?.total >= 2) pass("Orders pagination total");
    else fail("Orders pagination total", String(orderPage1.body.pagination?.total));

    if (otherBusiness) {
        const leakSearch = await request(
            "GET",
            `/orders?businessId=${business._id}&search=${tag}`,
            null,
            token
        );
        const leaked = (leakSearch.body.orders || []).some(
            (o) => String(o.business) === String(otherBusiness._id)
        );
        if (leakSearch.status === 200 && !leaked) pass("Cross-business search isolation");
        else fail("Cross-business search isolation");
    } else {
        pass("Cross-business search isolation", "skipped");
    }

    const combo = await request(
        "GET",
        `/orders?businessId=${business._id}&search=${tag}&orderStatus=Delivered&paymentStatus=Paid`,
        null,
        token
    );
    if (
        combo.status === 200 &&
        combo.body.orders?.length >= 1 &&
        combo.body.pagination?.total === combo.body.orders.length
    ) {
        pass("Orders search + filter combination");
    } else {
        fail("Orders search + filter combination");
    }

    const badStatus = await request(
        "GET",
        `/orders?businessId=${business._id}&orderStatus=NotAStatus`,
        null,
        token
    );
    if (badStatus.status === 400) pass("Orders invalid status rejected");
    else fail("Orders invalid status rejected", String(badStatus.status));

    const badPayment = await request(
        "GET",
        `/orders?businessId=${business._id}&paymentStatus=NotPaid`,
        null,
        token
    );
    if (badPayment.status === 400) pass("Orders invalid payment status rejected");
    else fail("Orders invalid payment status rejected", String(badPayment.status));

    const badMethod = await request(
        "GET",
        `/orders?businessId=${business._id}&paymentMethod=Bitcoin`,
        null,
        token
    );
    if (badMethod.status === 400) pass("Orders invalid payment method rejected");
    else fail("Orders invalid payment method rejected", String(badMethod.status));

    const badDate = await request(
        "GET",
        `/orders?businessId=${business._id}&dateFrom=2026-02-30`,
        null,
        token
    );
    if (badDate.status === 400) pass("Orders invalid date rejected");
    else fail("Orders invalid date rejected", String(badDate.status));

    const reversedDate = await request(
        "GET",
        `/orders?businessId=${business._id}&dateFrom=${today}&dateTo=${yesterday}`,
        null,
        token
    );
    if (reversedDate.status === 400) pass("Orders reversed date rejected");
    else fail("Orders reversed date rejected", String(reversedDate.status));

    const listOrder = explicitOrders.body.orders?.[0];
    if (listOrder) {
        const sensitive = ["trackingToken", "deliveryToken", "deliveryOtp", "razorpayOrderId", "razorpayPaymentId"];
        const leaked = sensitive.filter((field) => listOrder[field] != null);
        if (leaked.length === 0) pass("Orders sensitive fields stripped");
        else fail("Orders sensitive fields stripped", leaked.join(", "));
    } else {
        fail("Orders sensitive fields stripped", "no order returned");
    }

    const emptySearch = await request(
        "GET",
        `/orders?businessId=${business._id}&search=zzzznotfoundphase10`,
        null,
        token
    );
    if (emptySearch.status === 200 && emptySearch.body.pagination?.total === 0) {
        pass("Orders empty search truthful");
    } else {
        fail("Orders empty search truthful", String(emptySearch.body.pagination?.total));
    }

    const customer = await Customer.create({
        business: business._id,
        name: "QA Phase10 Customer",
        phone: "+919876501111",
        phoneNormalized: normalizePhoneForMatch("9876501111"),
        email: "phase10qa@example.com",
        isActive: true
    });

    const nameSearch = await request(
        "GET",
        `/customers?businessId=${business._id}&search=Phase10 Customer`,
        null,
        token
    );
    if (nameSearch.status === 200 && nameSearch.body.pagination?.total >= 1) {
        pass("Customer name search");
    } else {
        fail("Customer name search");
    }

    const phonePrefix = await request(
        "GET",
        `/customers?businessId=${business._id}&search=987650`,
        null,
        token
    );
    if (phonePrefix.status === 200 && phonePrefix.body.pagination?.total >= 1) {
        pass("Customer phone prefix search");
    } else {
        fail("Customer phone prefix search");
    }

    const emailSearch = await request(
        "GET",
        `/customers?businessId=${business._id}&search=phase10qa@example.com`,
        null,
        token
    );
    if (emailSearch.status === 200 && emailSearch.body.pagination?.total >= 1) {
        pass("Customer email search");
    } else {
        fail("Customer email search");
    }

    const inactiveCustomer = await Customer.create({
        business: business._id,
        name: "QA Phase10 Inactive",
        phone: "+919876502222",
        phoneNormalized: normalizePhoneForMatch("9876502222"),
        email: "inactive-phase10@example.com",
        isActive: false
    });

    const activeOnly = await request(
        "GET",
        `/customers?businessId=${business._id}&search=Phase10&active=true`,
        null,
        token
    );
    const inactiveOnly = await request(
        "GET",
        `/customers?businessId=${business._id}&search=Phase10&active=false`,
        null,
        token
    );
    if (
        activeOnly.status === 200 &&
        activeOnly.body.pagination?.total >= 1 &&
        activeOnly.body.customers?.every((c) => c.isActive)
    ) {
        pass("Customer active filter");
    } else {
        fail("Customer active filter");
    }

    if (
        inactiveOnly.status === 200 &&
        inactiveOnly.body.pagination?.total >= 1 &&
        inactiveOnly.body.customers?.every((c) => !c.isActive)
    ) {
        pass("Customer inactive filter");
    } else {
        fail("Customer inactive filter");
    }

    const customerPage = await request(
        "GET",
        `/customers?businessId=${business._id}&search=Phase10&active=all&page=1&limit=1`,
        null,
        token
    );
    if (
        customerPage.status === 200 &&
        customerPage.body.pagination?.total >= 2 &&
        customerPage.body.customers?.length === 1
    ) {
        pass("Customer pagination total parity");
    } else {
        fail("Customer pagination total parity", String(customerPage.body.pagination?.total));
    }

    const longCustomerSearch = await request(
        "GET",
        `/customers?businessId=${business._id}&search=${"y".repeat(101)}`,
        null,
        token
    );
    if (longCustomerSearch.status === 400) pass("Customer search length limit");
    else fail("Customer search length limit", String(longCustomerSearch.status));

    await Expense.create({
        business: business._id,
        amount: 50,
        category: "Misc",
        expenseDate: today,
        description: "QA Phase10 office supplies",
        isActive: true
    });
    await Expense.create({
        business: business._id,
        amount: 75,
        category: "Rent",
        expenseDate: today,
        description: "QA Phase10 unrelated",
        isActive: false
    });

    const expenseCategory = await request(
        "GET",
        `/expenses?businessId=${business._id}&category=Misc&active=true`,
        null,
        token
    );
    if (expenseCategory.status === 200 && expenseCategory.body.pagination?.total >= 1) {
        pass("Expense category filter");
    } else {
        fail("Expense category filter");
    }

    const expenseDateRange = await request(
        "GET",
        `/expenses?businessId=${business._id}&from=${today}&to=${today}&active=true`,
        null,
        token
    );
    if (expenseDateRange.status === 200 && expenseDateRange.body.pagination?.total >= 1) {
        pass("Expense date range filter");
    } else {
        fail("Expense date range filter");
    }

    const expenseActive = await request(
        "GET",
        `/expenses?businessId=${business._id}&active=false&search=QA Phase10`,
        null,
        token
    );
    if (
        expenseActive.status === 200 &&
        expenseActive.body.pagination?.total === 1 &&
        expenseActive.body.expenses?.[0]?.isActive === false
    ) {
        pass("Expense active filter");
    } else {
        fail("Expense active filter", String(expenseActive.body.pagination?.total));
    }

    const expensePage = await request(
        "GET",
        `/expenses?businessId=${business._id}&search=QA Phase10&active=all&page=1&limit=1`,
        null,
        token
    );
    if (
        expensePage.status === 200 &&
        expensePage.body.pagination?.total >= 2 &&
        expensePage.body.expenses?.length === 1
    ) {
        pass("Expense pagination total parity");
    } else {
        fail("Expense pagination total parity", String(expensePage.body.pagination?.total));
    }

    const reversedExpenseDate = await request(
        "GET",
        `/expenses?businessId=${business._id}&from=${today}&to=${yesterday}`,
        null,
        token
    );
    if (reversedExpenseDate.status === 400) pass("Expense reversed date rejected");
    else fail("Expense reversed date rejected", String(reversedExpenseDate.status));

    const expenseSearch = await request(
        "GET",
        `/expenses?businessId=${business._id}&search=office&active=true`,
        null,
        token
    );
    if (
        expenseSearch.status === 200 &&
        expenseSearch.body.pagination?.total === 1 &&
        expenseSearch.body.expenses?.[0]?.description.includes("office")
    ) {
        pass("Expense description search");
    } else {
        fail("Expense description search", String(expenseSearch.body.pagination?.total));
    }

    const badCategory = await request(
        "GET",
        `/expenses?businessId=${business._id}&category=InvalidCat`,
        null,
        token
    );
    if (badCategory.status === 400) pass("Expense invalid category rejected");
    else fail("Expense invalid category rejected", String(badCategory.status));

    const badExpenseDate = await request(
        "GET",
        `/expenses?businessId=${business._id}&from=2026-13-01`,
        null,
        token
    );
    if (badExpenseDate.status === 400) pass("Expense invalid date rejected");
    else fail("Expense invalid date rejected", String(badExpenseDate.status));

    await Product.deleteMany({ _id: { $in: [productA._id, productB._id] } });
    await Order.deleteMany({ business: business._id, customerName: tag });
    await Customer.findByIdAndDelete(customer._id);
    await Customer.findByIdAndDelete(inactiveCustomer._id);
    await Expense.deleteMany({ business: business._id, description: { $regex: /^QA Phase10/ } });

    await mongoose.disconnect();
    console.log(`\nPhase 10 QA: ${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
