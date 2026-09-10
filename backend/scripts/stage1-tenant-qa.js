/**
 * Stage 1 tenant isolation QA — permanent regression test.
 * Run: node backend/scripts/stage1-tenant-qa.js
 * Requires: MONGODB_URI (or MONGODB_URI_TEST), JWT_SECRET, running server at QA_BASE_URL
 */
const path = require("path");
const crypto = require("crypto");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Business = require("../models/Business");
const Product = require("../models/Product");
const Order = require("../models/Orders");
const Customer = require("../models/Customer");
const Expense = require("../models/Expense");

const BASE = process.env.QA_BASE_URL || "http://localhost:5000/api";

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

const expectStatus = (name, actual, expected) => {
    if (actual === expected) {
        pass(name, String(actual));
    } else {
        fail(name, `expected ${expected}, got ${actual}`);
    }
};

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
    const mongoUri = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI;

    if (!mongoUri) {
        console.error("MONGODB_URI or MONGODB_URI_TEST is required");
        process.exit(1);
    }

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is required");
        process.exit(1);
    }

    try {
        await fetch(`${BASE.replace("/api", "")}/api/health`);
    } catch {
        fail("HTTP server available", "start backend before running tenant QA");
        process.exit(1);
    }

    await mongoose.connect(mongoUri);

    const tag = `stage1-${Date.now()}`;
    const passwordHash = await bcrypt.hash("Stage1QaPass123!", 10);

    const ownerA = await User.create({
        name: `Stage1 Owner A ${tag}`,
        email: `stage1-a-${tag}@test.local`,
        password: passwordHash
    });

    const ownerB = await User.create({
        name: `Stage1 Owner B ${tag}`,
        email: `stage1-b-${tag}@test.local`,
        password: passwordHash
    });

    const businessA = await Business.create({
        businessName: `Stage1 Business A ${tag}`,
        slug: `stage1-a-${tag}`,
        category: "Food",
        phoneNumber: "9876543210",
        address: "Stage1 QA Address A",
        owner: ownerA._id
    });

    const businessB = await Business.create({
        businessName: `Stage1 Business B ${tag}`,
        slug: `stage1-b-${tag}`,
        category: "Food",
        phoneNumber: "9876543211",
        address: "Stage1 QA Address B",
        owner: ownerB._id
    });

    const productA = await Product.create({
        business: businessA._id,
        productName: `Stage1 Product A ${tag}`,
        description: "tenant qa",
        price: 100,
        stock: 10,
        image: "https://placehold.co/100"
    });

    const productB = await Product.create({
        business: businessB._id,
        productName: `Stage1 Product B ${tag}`,
        description: "tenant qa",
        price: 50,
        stock: 10,
        image: "https://placehold.co/100"
    });

    const customerA = await Customer.create({
        business: businessA._id,
        name: `Stage1 Customer A ${tag}`,
        phone: "9000000001",
        phoneNormalized: "9000000001",
        isActive: true
    });

    const expenseA = await Expense.create({
        business: businessA._id,
        amount: 25,
        category: "Misc",
        expenseDate: "2026-01-15",
        description: `Stage1 expense ${tag}`,
        isActive: true
    });

    await Expense.create({
        business: businessB._id,
        amount: 15,
        category: "Misc",
        expenseDate: "2026-01-15",
        description: `Stage1 expense B ${tag}`,
        isActive: true
    });

    const orderA = await Order.create({
        business: businessA._id,
        customer: customerA._id,
        customerName: customerA.name,
        customerPhone: customerA.phone,
        customerAddress: "Stage1 QA Address A",
        products: [{ product: productA._id, quantity: 1, price: 100, productName: productA.productName }],
        totalAmount: 100,
        paymentMethod: "COD",
        paymentStatus: "COD",
        orderStatus: "New",
        trackingToken: makeTrackingToken()
    });

    const tokenA = jwt.sign({ id: ownerA._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const tokenB = jwt.sign({ id: ownerB._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // --- Cross-tenant: Business ---
    expectStatus("Cross-tenant GET business", (await request("GET", `/businesses/${businessA._id}`, null, tokenB)).status, 403);
    expectStatus(
        "Cross-tenant PUT business",
        (await request("PUT", `/businesses/${businessA._id}`, { businessName: "Hacked" }, tokenB)).status,
        403
    );
    expectStatus(
        "Cross-tenant DELETE business",
        (await request("DELETE", `/businesses/${businessA._id}`, null, tokenB)).status,
        403
    );

    // --- Same-tenant: Business ---
    expectStatus(
        "Same-tenant GET business",
        (await request("GET", `/businesses/${businessA._id}`, null, tokenA)).status,
        200
    );

    // --- Cross-tenant: Product ---
    expectStatus(
        "Cross-tenant GET product",
        (await request("GET", `/products/${productA._id}`, null, tokenB)).status,
        403
    );
    expectStatus(
        "Cross-tenant PUT product",
        (await request("PUT", `/products/${productA._id}`, { price: 1 }, tokenB)).status,
        403
    );
    expectStatus(
        "Cross-tenant DELETE product",
        (await request("DELETE", `/products/${productA._id}`, null, tokenB)).status,
        403
    );
    expectStatus(
        "Cross-tenant bulk products",
        (
            await request(
                "POST",
                `/products/${businessA._id}/bulk`,
                { products: [{ productName: "Hack", price: 1, stock: 1 }] },
                tokenB
            )
        ).status,
        403
    );

    // --- Same-tenant: Product ---
    expectStatus(
        "Same-tenant GET product",
        (await request("GET", `/products/${productA._id}`, null, tokenA)).status,
        200
    );

    // --- Cross-tenant: Order ---
    expectStatus(
        "Cross-tenant GET order",
        (await request("GET", `/orders/${orderA._id}`, null, tokenB)).status,
        403
    );
    expectStatus(
        "Cross-tenant PUT order status",
        (await request("PUT", `/orders/${orderA._id}`, { orderStatus: "Processing" }, tokenB)).status,
        403
    );
    expectStatus(
        "Cross-tenant DELETE order",
        (await request("DELETE", `/orders/${orderA._id}`, null, tokenB)).status,
        403
    );
    expectStatus(
        "Cross-tenant PUT payment",
        (await request("PUT", `/orders/${orderA._id}/payment`, { paymentStatus: "Paid" }, tokenB)).status,
        403
    );

    // --- Same-tenant: Order ---
    expectStatus(
        "Same-tenant GET order",
        (await request("GET", `/orders/${orderA._id}`, null, tokenA)).status,
        200
    );

    // --- Cross-tenant: Customer ---
    expectStatus(
        "Cross-tenant GET customer",
        (await request("GET", `/customers/${customerA._id}`, null, tokenB)).status,
        403
    );
    expectStatus(
        "Cross-tenant PUT customer",
        (await request("PUT", `/customers/${customerA._id}`, { name: "Hacked" }, tokenB)).status,
        403
    );
    expectStatus(
        "Cross-tenant DELETE customer",
        (await request("DELETE", `/customers/${customerA._id}`, null, tokenB)).status,
        403
    );
    expectStatus(
        "Cross-tenant customer orders",
        (await request("GET", `/customers/${customerA._id}/orders`, null, tokenB)).status,
        403
    );

    // --- Same-tenant: Customer ---
    expectStatus(
        "Same-tenant GET customer",
        (await request("GET", `/customers/${customerA._id}`, null, tokenA)).status,
        200
    );

    // --- Cross-tenant: Expense ---
    expectStatus(
        "Cross-tenant GET expense",
        (await request("GET", `/expenses/${expenseA._id}`, null, tokenB)).status,
        403
    );
    expectStatus(
        "Cross-tenant PUT expense",
        (await request("PUT", `/expenses/${expenseA._id}`, { amount: 1 }, tokenB)).status,
        403
    );
    expectStatus(
        "Cross-tenant DELETE expense",
        (await request("DELETE", `/expenses/${expenseA._id}`, null, tokenB)).status,
        403
    );

    // --- Same-tenant: Expense ---
    expectStatus(
        "Same-tenant GET expense",
        (await request("GET", `/expenses/${expenseA._id}`, null, tokenA)).status,
        200
    );

    // --- Cross-tenant: Dashboard ---
    expectStatus(
        "Cross-tenant dashboard summary",
        (await request("GET", `/dashboard/summary?businessId=${businessA._id}`, null, tokenB)).status,
        403
    );

    // --- Same-tenant: Dashboard ---
    expectStatus(
        "Same-tenant dashboard summary",
        (await request("GET", `/dashboard/summary?businessId=${businessA._id}`, null, tokenA)).status,
        200
    );

    // --- Cleanup fixtures created by this script ---
    await Order.deleteMany({ _id: orderA._id });
    await Expense.deleteMany({ business: { $in: [businessA._id, businessB._id] } });
    await Customer.deleteMany({ _id: customerA._id });
    await Product.deleteMany({ _id: { $in: [productA._id, productB._id] } });
    await Business.deleteMany({ _id: { $in: [businessA._id, businessB._id] } });
    await User.deleteMany({ _id: { $in: [ownerA._id, ownerB._id] } });

    await mongoose.disconnect();

    console.log(`\nStage 1 tenant QA: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
};

run().catch(async (error) => {
    console.error("Stage 1 tenant QA error:", error.message);
    try {
        await mongoose.disconnect();
    } catch {
        // ignore
    }
    process.exit(1);
});
