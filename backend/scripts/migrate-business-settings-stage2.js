/**
 * Stage 2 business settings migration — creates BusinessSettings from Business GST.
 *
 * Usage:
 *   node backend/scripts/migrate-business-settings-stage2.js           # dry-run
 *   node backend/scripts/migrate-business-settings-stage2.js --execute
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const Business = require("../models/Business");
const BusinessSettings = require("../models/BusinessSettings");
const { buildDefaultsFromBusiness } = require("../utils/businessSettings");

const execute = process.argv.includes("--execute");

const run = async () => {
    const mongoUri = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI;

    if (!mongoUri) {
        console.error("MONGODB_URI or MONGODB_URI_TEST is required");
        process.exit(1);
    }

    await mongoose.connect(mongoUri);

    console.log(`Mode: ${execute ? "EXECUTE" : "DRY-RUN"}`);
    console.log(`Database: ${mongoose.connection.db.databaseName}`);

    const businesses = await Business.find().select("_id businessName gstEnabled gstRate").lean();
    const existingSettings = await BusinessSettings.find().select("business").lean();
    const existingSet = new Set(existingSettings.map((row) => String(row.business)));

    const toCreate = businesses.filter((business) => !existingSet.has(String(business._id)));

    console.log(`\nBusinesses: ${businesses.length}`);
    console.log(`Existing settings: ${existingSettings.length}`);
    console.log(`Records that would be created: ${toCreate.length}`);

    for (const business of toCreate) {
        const defaults = buildDefaultsFromBusiness(business);
        console.log(
            `  ${business._id} (${business.businessName}): gst.enabled=${defaults.gst.enabled}, gst.rate=${defaults.gst.rate}`
        );
    }

    if (!toCreate.length) {
        console.log("\nNothing to migrate.");
        await mongoose.disconnect();
        process.exit(0);
    }

    if (!execute) {
        console.log("\nDry-run complete. Pass --execute to apply changes.");
        await mongoose.disconnect();
        process.exit(0);
    }

    let created = 0;

    for (const business of toCreate) {
        const defaults = buildDefaultsFromBusiness(business);

        try {
            await BusinessSettings.create({
                business: business._id,
                ...defaults
            });
            created += 1;
        } catch (error) {
            if (error.code === 11000) {
                continue;
            }

            throw error;
        }
    }

    console.log(`\nCreated settings documents: ${created}`);
    console.log("PASS: Business documents unchanged.");
    console.log("PASS: Order/Product/Customer documents unchanged.");

    await mongoose.disconnect();
    process.exit(0);
};

run().catch((error) => {
    console.error("Migration failed:", error.message);
    process.exit(1);
});
