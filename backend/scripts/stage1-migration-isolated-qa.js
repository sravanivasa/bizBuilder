/**
 * Stage 1 migration isolated QA — uses a dedicated MongoDB database only.
 * Does NOT touch the primary application database.
 *
 * Usage: node backend/scripts/stage1-migration-isolated-qa.js
 */
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const Order = require("../models/Orders");
const Business = require("../models/Business");
const Product = require("../models/Product");

const MIGRATION_MAP = {
    Pending: "New",
    Confirmed: "Processing",
    Preparing: "Processing",
    Completed: "Delivered"
};

const PROTECTED_FIELDS = [
    "paymentStatus",
    "totalAmount",
    "subtotal",
    "gstAmount",
    "gstRate",
    "paidAt",
    "razorpayOrderId",
    "razorpayPaymentId",
    "customer",
    "stockRestoredAt",
    "createdAt",
    "updatedAt"
];

const buildIsolatedUri = () => {
    const base = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI;

    if (!base) {
        throw new Error("MONGODB_URI_TEST or MONGODB_URI required");
    }

    // MongoDB database names are limited to 38 bytes.
    const isolatedDb = `bb_s1_mig_${Date.now().toString(36)}`;

    if (base.includes("mongodb+srv://") || base.includes("mongodb://")) {
        const [withoutQuery, query = ""] = base.split("?");
        const slash = withoutQuery.lastIndexOf("/");
        const prefix =
            slash > "mongodb://".length ? withoutQuery.slice(0, slash) : withoutQuery;
        const suffix = query ? `?${query}` : "";
        return { uri: `${prefix}/${isolatedDb}${suffix}`, dbName: isolatedDb };
    }

    throw new Error("Unsupported MongoDB URI format");
};

const serialize = (value) => {
    if (value instanceof Date) {
        return value.toISOString();
    }

    if (value && value._id) {
        return String(value._id);
    }

    return value;
};

const snapshotOrders = async (ids) => {
    const orders = await Order.find({ _id: { $in: ids } }).lean();
    const map = new Map();

    for (const order of orders) {
        const row = {};

        for (const field of PROTECTED_FIELDS) {
            row[field] = serialize(order[field]);
        }

        map.set(String(order._id), row);
    }

    return map;
};

const runMigrationScript = (uri, execute) => {
    const args = ["scripts/migrate-order-status-stage1.js"];

    if (execute) {
        args.push("--execute");
    }

    const result = spawnSync("node", args, {
        cwd: path.resolve(__dirname, ".."),
        env: { ...process.env, MONGODB_URI_TEST: uri, MONGODB_URI: uri },
        encoding: "utf8"
    });

    return {
        status: result.status,
        stdout: result.stdout,
        stderr: result.stderr
    };
};

const fail = (message) => {
    console.error(`FAIL  ${message}`);
    process.exit(1);
};

const pass = (message) => {
    console.log(`PASS  ${message}`);
};

const run = async () => {
    const { uri, dbName } = buildIsolatedUri();
    console.log(`Isolated database: ${dbName}`);
    console.log("(connection string not printed)");

    await mongoose.connect(uri);

    const business = await Business.create({
        businessName: "Stage1 Migration QA Business",
        slug: `stage1-migration-qa-${Date.now()}`,
        category: "Food",
        phoneNumber: "9876543210",
        address: "Migration QA Address",
        owner: new mongoose.Types.ObjectId()
    });

    const product = await Product.create({
        business: business._id,
        productName: "Migration QA Product",
        description: "qa",
        price: 100,
        stock: 5,
        image: "https://placehold.co/100"
    });

    const seedStatuses = [
        "Pending",
        "Confirmed",
        "Preparing",
        "Completed",
        "New",
        "Processing",
        "Shipped",
        "OutForDelivery",
        "Delivered",
        "Cancelled"
    ];

    const seeded = [];

    for (const orderStatus of seedStatuses) {
        const order = await Order.create({
            business: business._id,
            customerName: `Migration QA ${orderStatus}`,
            customerPhone: "9000000001",
            customerAddress: "Migration QA customer address",
            products: [
                {
                    product: product._id,
                    quantity: 1,
                    price: 100,
                    productName: product.productName
                }
            ],
            subtotal: 100,
            gstAmount: 0,
            gstRate: 0,
            totalAmount: 100,
            paymentMethod: orderStatus === "Confirmed" ? "UPI" : "COD",
            paymentStatus: orderStatus === "Confirmed" ? "Paid" : "COD",
            paidAt: orderStatus === "Confirmed" ? new Date("2026-01-01T00:00:00.000Z") : null,
            razorpayOrderId: orderStatus === "Confirmed" ? "order_test_123" : null,
            razorpayPaymentId: orderStatus === "Confirmed" ? "pay_test_123" : null,
            orderStatus,
            stockRestoredAt: null,
            trackingToken: crypto.randomBytes(32).toString("hex")
        });

        seeded.push(order._id);
    }

    const beforeSnapshot = await snapshotOrders(seeded);
    const beforeStatuses = await Order.find({ _id: { $in: seeded } })
        .select("orderStatus")
        .lean();

    const dryRun = runMigrationScript(uri, false);

    if (dryRun.status !== 0) {
        fail(`dry-run exited ${dryRun.status}: ${dryRun.stderr || dryRun.stdout}`);
    }

    pass("migration dry-run completed");

    const afterDryRunStatuses = await Order.find({ _id: { $in: seeded } })
        .select("orderStatus")
        .lean();

    if (JSON.stringify(beforeStatuses) !== JSON.stringify(afterDryRunStatuses)) {
        fail("dry-run modified orderStatus values");
    }

    pass("dry-run made no database changes");

    const execute1 = runMigrationScript(uri, true);

    if (execute1.status !== 0) {
        fail(`first execute exited ${execute1.status}: ${execute1.stderr || execute1.stdout}`);
    }

    pass("first migration execute completed");

    const migrated = await Order.find({ _id: { $in: seeded } }).lean();
    const expected = {
        Pending: "New",
        Confirmed: "Processing",
        Preparing: "Processing",
        Completed: "Delivered",
        New: "New",
        Processing: "Processing",
        Shipped: "Shipped",
        OutForDelivery: "OutForDelivery",
        Delivered: "Delivered",
        Cancelled: "Cancelled"
    };

    for (const order of migrated) {
        const seed = beforeStatuses.find((row) => String(row._id) === String(order._id));
        const from = seed.orderStatus;
        const want = expected[from];

        if (order.orderStatus !== want) {
            fail(`${from} should map to ${want}, got ${order.orderStatus}`);
        }
    }

    pass("status mappings verified after execute");

    const afterExecuteSnapshot = await snapshotOrders(seeded);

    for (const id of seeded.map(String)) {
        const before = beforeSnapshot.get(id);
        const after = afterExecuteSnapshot.get(id);

        for (const field of PROTECTED_FIELDS) {
            if (before[field] !== after[field]) {
                fail(`protected field ${field} changed on ${id}`);
            }
        }
    }

    pass("protected fields unchanged after execute");

    const execute2 = runMigrationScript(uri, true);

    if (execute2.status !== 0) {
        fail(`second execute exited ${execute2.status}: ${execute2.stderr || execute2.stdout}`);
    }

    if (!/Modified documents: 0|Nothing to migrate|Legacy status counts \(after\):\n  Pending: 0/.test(execute2.stdout)) {
        if (!execute2.stdout.includes("Modified documents: 0")) {
            fail(`second execute was not idempotent: ${execute2.stdout}`);
        }
    }

    pass("second migration execute changed 0 additional records");

    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();

    console.log("\nStage 1 migration isolated QA: ALL PASS");
    process.exit(0);
};

run().catch(async (error) => {
    console.error("Stage 1 migration isolated QA error:", error.message);

    try {
        await mongoose.disconnect();
    } catch {
        // ignore
    }

    process.exit(1);
});
