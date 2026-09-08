/**
 * Phase 7 Customer Module QA — run: node backend/scripts/phase7-qa.js
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
const Customer = require("../models/Customer");
const Order = require("../models/Orders");
const Business = require("../models/Business");
const User = require("../models/User");
const Product = require("../models/Product");
const { normalizePhoneForMatch, isValidIndianPhone, escapeRegex } = require("../utils/phoneValidation");
const { findOrCreateCustomerForOrder } = require("../utils/customerAssociation");
const { createOrderForBusiness } = require("../utils/processOrderCreation");

const run = async () => {
    if (!process.env.MONGODB_URI) {
        console.log("SKIP  DB tests — MONGODB_URI not set");
        process.exit(0);
    }

    await mongoose.connect(process.env.MONGODB_URI);

    // Phone validation
    if (isValidIndianPhone("9876543210") && normalizePhoneForMatch("+91 98765-43210") === "9876543210") {
        pass("Phone validation shared helper");
    } else {
        fail("Phone validation shared helper");
    }

    if (escapeRegex("a+b") === "a\\+b") {
        pass("Regex escape");
    } else {
        fail("Regex escape");
    }

    const business = await Business.findOne();
    if (!business) {
        console.log("SKIP  remaining — no business in DB");
        await mongoose.disconnect();
        process.exit(failed ? 1 : 0);
    }

    const product = await Product.findOne({ business: business._id, stock: { $gte: 2 } });
    const suffix = String(Date.now()).slice(-4);
    const phoneA = `987654${suffix}`;
    const phoneB = `987653${suffix}`;

    // Cleanup test customers
    await Customer.deleteMany({ business: business._id, phoneNormalized: { $in: [phoneA.slice(-10), phoneB.slice(-10)] } });

    const c1 = await Customer.create({
        business: business._id,
        name: "QA Customer A",
        phone: `+91${phoneA}`,
        phoneNormalized: normalizePhoneForMatch(phoneA),
        isActive: true
    });
    pass("Customer creation");

    try {
        await Customer.create({
            business: business._id,
            name: "Dup",
            phone: `+91${phoneA}`,
            phoneNormalized: normalizePhoneForMatch(phoneA),
            isActive: true
        });
        fail("Duplicate phone same business");
    } catch (e) {
        if (e.code === 11000) pass("Duplicate phone same business blocked");
        else fail("Duplicate phone same business", e.message);
    }

    const otherBusiness = await Business.findOne({ _id: { $ne: business._id } });
    if (otherBusiness) {
        const cross = await Customer.create({
            business: otherBusiness._id,
            name: "Cross Biz",
            phone: `+91${phoneA}`,
            phoneNormalized: normalizePhoneForMatch(phoneA),
            isActive: true
        });
        pass("Same phone different business allowed");
        await Customer.findByIdAndDelete(cross._id);
    } else {
        pass("Same phone different business", "only one business in DB — skipped");
    }

    c1.isActive = false;
    await c1.save();

    const reactivated = await findOrCreateCustomerForOrder({
        businessId: business._id,
        customerName: "Reactivated QA",
        customerPhone: phoneA,
        customerAddress: "QA Address Line"
    });
    if (reactivated.isActive && reactivated.name === "Reactivated QA") {
        pass("Inactive customer reactivated on order");
    } else {
        fail("Inactive customer reactivated on order");
    }

    if (!product) {
        console.log("SKIP  order link tests — no product with stock");
    } else {
        const order1 = await createOrderForBusiness({
            businessId: business._id,
            customerName: "Order QA 1",
            customerPhone: phoneB,
            customerAddress: "Addr 1",
            products: [{ product: product._id, quantity: 1 }],
            paymentMethod: "Cash"
        });

        const order2 = await createOrderForBusiness({
            businessId: business._id,
            customerName: "Order QA 2",
            customerPhone: phoneB,
            customerAddress: "Addr 2",
            products: [{ product: product._id, quantity: 1 }],
            paymentMethod: "Cash"
        });

        if (order1.customer && order2.customer && String(order1.customer) === String(order2.customer)) {
            pass("Second order reuses customer");
        } else {
            fail("Second order reuses customer");
        }

        if (order1.customerName === "Order QA 1" && order2.customerName === "Order QA 2") {
            pass("Order snapshots preserved independently");
        } else {
            fail("Order snapshots preserved independently");
        }

        const customer = await Customer.findById(order1.customer);
        customer.name = "Changed Name";
        await customer.save();

        const reloaded1 = await Order.findById(order1._id);
        if (reloaded1.customerName === "Order QA 1") {
            pass("Customer update does not change order snapshot");
        } else {
            fail("Customer update does not change order snapshot");
        }

        await Order.findByIdAndDelete(order1._id);
        await Order.findByIdAndDelete(order2._id);
    }

    await Customer.deleteMany({ business: business._id, phoneNormalized: { $in: [normalizePhoneForMatch(phoneA), normalizePhoneForMatch(phoneB)] } });

    await mongoose.disconnect();
    console.log(`\nPhase 7 QA: ${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
