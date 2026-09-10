/**
 * Stage 1 order status migration — modifies orderStatus only.
 *
 * Usage:
 *   node backend/scripts/migrate-order-status-stage1.js           # dry-run (default)
 *   node backend/scripts/migrate-order-status-stage1.js --execute # apply changes
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const Order = require("../models/Orders");

const MIGRATION_MAP = {
    Pending: "New",
    Confirmed: "Processing",
    Preparing: "Processing",
    Completed: "Delivered"
};

const LEGACY_STATUSES = Object.keys(MIGRATION_MAP);

const FINANCIAL_FIELDS = [
    "paymentStatus",
    "totalAmount",
    "subtotal",
    "gstAmount",
    "gstRate",
    "paidAt",
    "razorpayOrderId",
    "razorpayPaymentId"
];

const execute = process.argv.includes("--execute");

const countByStatus = async (statuses) => {
    const results = {};

    for (const status of statuses) {
        results[status] = await Order.countDocuments({ orderStatus: status });
    }

    return results;
};

const snapshotFinancialFields = async (orderIds) => {
    if (!orderIds.length) {
        return new Map();
    }

    const orders = await Order.find({ _id: { $in: orderIds } })
        .select(FINANCIAL_FIELDS.join(" "))
        .lean();

    return new Map(orders.map((order) => [String(order._id), order]));
};

const run = async () => {
    const mongoUri = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI;

    if (!mongoUri) {
        console.error("MONGODB_URI or MONGODB_URI_TEST is required");
        process.exit(1);
    }

    await mongoose.connect(mongoUri);

    console.log(`Mode: ${execute ? "EXECUTE" : "DRY-RUN"}`);
    console.log(`Database: ${mongoose.connection.db.databaseName}`);

    const legacyCounts = await countByStatus(LEGACY_STATUSES);
    const canonicalStatuses = ["New", "Processing", "Shipped", "OutForDelivery", "Delivered", "Cancelled"];
    const canonicalBefore = await countByStatus(canonicalStatuses);

    console.log("\nLegacy status counts (before):");
    for (const [status, count] of Object.entries(legacyCounts)) {
        console.log(`  ${status}: ${count}`);
    }

    console.log("\nCanonical status counts (before):");
    for (const [status, count] of Object.entries(canonicalBefore)) {
        console.log(`  ${status}: ${count}`);
    }

    const toMigrate = [];

    for (const [from, to] of Object.entries(MIGRATION_MAP)) {
        const orders = await Order.find({ orderStatus: from }).select("_id orderStatus").lean();

        for (const order of orders) {
            toMigrate.push({ _id: order._id, from, to });
        }
    }

    console.log(`\nRecords that would change: ${toMigrate.length}`);

    if (!toMigrate.length) {
        console.log("Nothing to migrate.");
        await mongoose.disconnect();
        process.exit(0);
    }

    const expectedAfter = { ...canonicalBefore };

    for (const row of toMigrate) {
        expectedAfter[row.to] = (expectedAfter[row.to] || 0) + 1;
        console.log(`  ${row._id}: ${row.from} → ${row.to}`);
    }

    console.log("\nExpected canonical counts after migration:");
    for (const status of canonicalStatuses) {
        console.log(`  ${status}: ${expectedAfter[status] || 0}`);
    }

    if (!execute) {
        console.log("\nDry-run complete. Pass --execute to apply changes.");
        await mongoose.disconnect();
        process.exit(0);
    }

    const migrateIds = toMigrate.map((row) => row._id);
    const financialBefore = await snapshotFinancialFields(migrateIds);

    let modified = 0;

    for (const [from, to] of Object.entries(MIGRATION_MAP)) {
        const result = await Order.updateMany(
            { orderStatus: from },
            { $set: { orderStatus: to } },
            { timestamps: false }
        );
        modified += result.modifiedCount;
    }

    const financialAfter = await snapshotFinancialFields(migrateIds);

    let financialMismatch = false;

    for (const id of migrateIds) {
        const before = financialBefore.get(String(id));
        const after = financialAfter.get(String(id));

        if (!before || !after) {
            continue;
        }

        for (const field of FINANCIAL_FIELDS) {
            const beforeVal = before[field];
            const afterVal = after[field];

            const beforeSerialized =
                beforeVal instanceof Date ? beforeVal.toISOString() : beforeVal;
            const afterSerialized =
                afterVal instanceof Date ? afterVal.toISOString() : afterVal;

            if (beforeSerialized !== afterSerialized) {
                console.error(
                    `Financial field changed on ${id}: ${field} ${beforeSerialized} → ${afterSerialized}`
                );
                financialMismatch = true;
            }
        }
    }

    const legacyAfter = await countByStatus(LEGACY_STATUSES);

    console.log(`\nModified documents: ${modified}`);
    console.log("Legacy status counts (after):");

    for (const [status, count] of Object.entries(legacyAfter)) {
        console.log(`  ${status}: ${count}`);
    }

    if (financialMismatch) {
        console.error("\nFAIL: Financial fields were modified during migration.");
        await mongoose.disconnect();
        process.exit(1);
    }

    console.log("\nPASS: Financial fields unchanged.");
    await mongoose.disconnect();
    process.exit(0);
};

run().catch((error) => {
    console.error("Migration failed:", error.message);
    process.exit(1);
});
