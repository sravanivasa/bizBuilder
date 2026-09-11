/**
 * Stage 2 business settings QA — run: node backend/scripts/stage2-settings-qa.js
 */
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Business = require("../models/Business");
const BusinessSettings = require("../models/BusinessSettings");
const Product = require("../models/Product");
const Order = require("../models/Orders");
const { createOrderForBusiness } = require("../utils/processOrderCreation");

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

const run = async () => {
    const mongoUri = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI;

    if (!mongoUri || !process.env.JWT_SECRET) {
        console.error("MONGODB_URI and JWT_SECRET are required");
        process.exit(1);
    }

    try {
        await fetch(`${BASE.replace("/api", "")}/api/health`);
    } catch {
        fail("HTTP server available", "start backend before running Stage 2 QA");
        process.exit(1);
    }

    await mongoose.connect(mongoUri);

    const tag = `stage2-${Date.now()}`;
    const passwordHash = await bcrypt.hash("Stage2QaPass123!", 10);

    const ownerA = await User.create({
        name: `Stage2 Owner A ${tag}`,
        email: `stage2-a-${tag}@test.local`,
        password: passwordHash
    });

    const ownerB = await User.create({
        name: `Stage2 Owner B ${tag}`,
        email: `stage2-b-${tag}@test.local`,
        password: passwordHash
    });

    const businessA = await Business.create({
        businessName: `Stage2 Business A ${tag}`,
        slug: `stage2-a-${tag}`,
        category: "Food",
        phoneNumber: "9876543210",
        address: "Stage2 QA Address A",
        owner: ownerA._id,
        gstEnabled: true,
        gstRate: 18
    });

    const businessB = await Business.create({
        businessName: `Stage2 Business B ${tag}`,
        slug: `stage2-b-${tag}`,
        category: "Food",
        phoneNumber: "9876543211",
        address: "Stage2 QA Address B",
        owner: ownerB._id
    });

    const productA = await Product.create({
        business: businessA._id,
        productName: `Stage2 Product ${tag}`,
        description: "stage2 qa",
        price: 100,
        stock: 10,
        image: "https://placehold.co/100"
    });

    const tokenA = jwt.sign({ id: ownerA._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const tokenB = jwt.sign({ id: ownerB._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    expectStatus(
        "A → A GET settings",
        (await request("GET", `/businesses/${businessA._id}/settings`, null, tokenA)).status,
        200
    );

    expectStatus(
        "B → A GET settings",
        (await request("GET", `/businesses/${businessA._id}/settings`, null, tokenB)).status,
        403
    );

    expectStatus(
        "A → B GET settings",
        (await request("GET", `/businesses/${businessB._id}/settings`, null, tokenA)).status,
        403
    );

    expectStatus(
        "invalid business ID",
        (await request("GET", "/businesses/notanid/settings", null, tokenA)).status,
        400
    );

    const missingBusinessId = new mongoose.Types.ObjectId();
    expectStatus(
        "missing business",
        (await request("GET", `/businesses/${missingBusinessId}/settings`, null, tokenA)).status,
        404
    );

    expectStatus(
        "GST rate 101 rejected",
        (
            await request(
                "PUT",
                `/businesses/${businessA._id}/settings`,
                { gst: { enabled: true, rate: 101 } },
                tokenA
            )
        ).status,
        400
    );

    expectStatus(
        "negative preparation rejected",
        (
            await request(
                "PUT",
                `/businesses/${businessA._id}/settings`,
                { delivery: { preparationMinutes: -1 } },
                tokenA
            )
        ).status,
        400
    );

    expectStatus(
        "invalid working day rejected",
        (
            await request(
                "PUT",
                `/businesses/${businessA._id}/settings`,
                { schedule: { workingDays: [9] } },
                tokenA
            )
        ).status,
        400
    );

    expectStatus(
        "duplicate working day rejected",
        (
            await request(
                "PUT",
                `/businesses/${businessA._id}/settings`,
                { schedule: { workingDays: [1, 1] } },
                tokenA
            )
        ).status,
        400
    );

    expectStatus(
        "open >= close rejected",
        (
            await request(
                "PUT",
                `/businesses/${businessA._id}/settings`,
                { schedule: { openTime: "21:00", closeTime: "09:00" } },
                tokenA
            )
        ).status,
        400
    );

    expectStatus(
        "invalid holiday rejected",
        (
            await request(
                "PUT",
                `/businesses/${businessA._id}/settings`,
                { schedule: { holidays: ["2026-13-40"] } },
                tokenA
            )
        ).status,
        400
    );

    expectStatus(
        "return window >365 rejected",
        (
            await request(
                "PUT",
                `/businesses/${businessA._id}/settings`,
                { returns: { windowDays: 400 } },
                tokenA
            )
        ).status,
        400
    );

    const massAssign = await request(
        "PUT",
        `/businesses/${businessB._id}/settings`,
        {
            _id: businessA._id,
            business: businessA._id,
            owner: ownerA._id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            schedule: { timezone: "UTC" }
        },
        tokenB
    );

    if (massAssign.status === 400) {
        pass("mass assignment rejected");
    } else {
        fail("mass assignment rejected", String(massAssign.status));
    }

    const defaultsRes = await request("GET", `/businesses/${businessB._id}/settings`, null, tokenB);

    if (
        defaultsRes.status === 200 &&
        defaultsRes.body.settings?.returns?.windowDays === 30 &&
        defaultsRes.body.settings?.delivery?.preparationMinutes === 30
    ) {
        pass("lazy-created defaults");
    } else {
        fail("lazy-created defaults", JSON.stringify(defaultsRes.body.settings));
    }

    const settingsCountBefore = await BusinessSettings.countDocuments({ business: businessB._id });
    await Promise.all([
        request("GET", `/businesses/${businessB._id}/settings`, null, tokenB),
        request("GET", `/businesses/${businessB._id}/settings`, null, tokenB)
    ]);
    const settingsCountAfter = await BusinessSettings.countDocuments({ business: businessB._id });

    if (settingsCountBefore === 1 && settingsCountAfter === 1) {
        pass("concurrent lazy-create single document");
    } else {
        fail("concurrent lazy-create single document", `${settingsCountBefore} -> ${settingsCountAfter}`);
    }

    await request(
        "PUT",
        `/businesses/${businessA._id}/settings`,
        { gst: { enabled: true, rate: 18 }, returns: { enabled: true, windowDays: 30 } },
        tokenA
    );

    const order1 = await createOrderForBusiness({
        businessId: businessA._id,
        customerName: "GST QA 1",
        customerPhone: "9000000101",
        customerAddress: "Stage2 QA customer address line",
        products: [{ product: productA._id, quantity: 1 }],
        paymentMethod: "COD"
    });

    if (order1.gstRate === 18 && order1.returnPolicySnapshot?.windowDays === 30) {
        pass("new order GST and return snapshot");
    } else {
        fail("new order GST and return snapshot", `gst=${order1.gstRate}, returns=${order1.returnPolicySnapshot?.windowDays}`);
    }

    await request(
        "PUT",
        `/businesses/${businessA._id}/settings`,
        { gst: { enabled: true, rate: 12 }, returns: { enabled: true, windowDays: 7 } },
        tokenA
    );

    const refreshedBusiness = await Business.findById(businessA._id);

    if (refreshedBusiness.gstRate === 12 && refreshedBusiness.gstEnabled === true) {
        pass("settings GST syncs to Business");
    } else {
        fail("settings GST syncs to Business", `gstRate=${refreshedBusiness.gstRate}`);
    }

    const order1After = await Order.findById(order1._id);

    if (order1After.gstRate === 18 && order1After.returnPolicySnapshot.windowDays === 30) {
        pass("historical order unchanged after settings change");
    } else {
        fail("historical order unchanged after settings change");
    }

    const order2 = await createOrderForBusiness({
        businessId: businessA._id,
        customerName: "GST QA 2",
        customerPhone: "9000000102",
        customerAddress: "Stage2 QA customer address line",
        products: [{ product: productA._id, quantity: 1 }],
        paymentMethod: "COD"
    });

    if (order2.gstRate === 12 && order2.returnPolicySnapshot?.windowDays === 7) {
        pass("new order uses updated settings");
    } else {
        fail("new order uses updated settings", `gst=${order2.gstRate}, returns=${order2.returnPolicySnapshot?.windowDays}`);
    }

    const legacyOrder = await Order.create({
        business: businessA._id,
        customerName: "Legacy Order",
        customerPhone: "9000000103",
        customerAddress: "Stage2 QA customer address line",
        products: [{ product: productA._id, quantity: 1, price: 100, productName: productA.productName }],
        totalAmount: 100,
        paymentMethod: "COD",
        paymentStatus: "COD",
        orderStatus: "Delivered",
        trackingToken: crypto.randomBytes(32).toString("hex")
    });

    if (!legacyOrder.returnPolicySnapshot?.windowDays) {
        pass("legacy order has no fabricated snapshot");
    } else {
        fail("legacy order has no fabricated snapshot");
    }

    const migrationDry = spawnSync("node", ["scripts/migrate-business-settings-stage2.js"], {
        cwd: path.resolve(__dirname, ".."),
        env: { ...process.env, MONGODB_URI_TEST: mongoUri, MONGODB_URI: mongoUri },
        encoding: "utf8"
    });

    if (migrationDry.status === 0) {
        pass("migration dry-run");
    } else {
        fail("migration dry-run", migrationDry.stderr || migrationDry.stdout);
    }

    await BusinessSettings.deleteMany({ business: businessA._id });

    const migrationExecute = spawnSync("node", ["scripts/migrate-business-settings-stage2.js", "--execute"], {
        cwd: path.resolve(__dirname, ".."),
        env: { ...process.env, MONGODB_URI_TEST: mongoUri, MONGODB_URI: mongoUri },
        encoding: "utf8"
    });

    const migrated = await BusinessSettings.findOne({ business: businessA._id });

    if (migrationExecute.status === 0 && migrated?.gst?.rate === 12) {
        pass("migration execute copies GST");
    } else {
        fail("migration execute copies GST");
    }

    const migrationSecond = spawnSync("node", ["scripts/migrate-business-settings-stage2.js", "--execute"], {
        cwd: path.resolve(__dirname, ".."),
        env: { ...process.env, MONGODB_URI_TEST: mongoUri, MONGODB_URI: mongoUri },
        encoding: "utf8"
    });

    if (migrationSecond.stdout.includes("Records that would be created: 0") || migrationSecond.stdout.includes("Nothing to migrate")) {
        pass("migration idempotent second run");
    } else {
        fail("migration idempotent second run", migrationSecond.stdout);
    }

    await Order.deleteMany({ _id: { $in: [order1._id, order2._id, legacyOrder._id] } });
    await Product.deleteMany({ _id: productA._id });
    await BusinessSettings.deleteMany({ business: { $in: [businessA._id, businessB._id] } });
    await Business.deleteMany({ _id: { $in: [businessA._id, businessB._id] } });
    await User.deleteMany({ _id: { $in: [ownerA._id, ownerB._id] } });

    await mongoose.disconnect();

    console.log(`\nStage 2 settings QA: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
};

run().catch(async (error) => {
    console.error("Stage 2 settings QA error:", error.message);

    try {
        await mongoose.disconnect();
    } catch {
        // ignore
    }

    process.exit(1);
});
