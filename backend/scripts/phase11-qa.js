/**
 * Phase 11 Security + Correctness QA — run: node backend/scripts/phase11-qa.js
 */
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

let passed = 0;
let failed = 0;
let skipped = 0;

const pass = (name, detail = "") => {
    passed++;
    console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
};

const fail = (name, detail = "") => {
    failed++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
};

const skip = (name, detail = "") => {
    skipped++;
    console.log(`SKIP  ${name}${detail ? ` — ${detail}` : ""}`);
};

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Order = require("../models/Orders");
const Product = require("../models/Product");
const Business = require("../models/Business");
const User = require("../models/User");
const { buildInvoiceResponse } = require("../utils/invoiceBuilder");
const { shortOrderId } = require("../utils/orderListQuery");
const { phonesMatch } = require("../utils/phoneMatch");
const { isInvoiceAvailable } = require("../utils/paymentMethods");
const { buildPendingOrdersMatch } = require("../utils/dashboardMetrics");

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
    const invalidToken = jwt.sign({ id: owner._id }, process.env.JWT_SECRET, { expiresIn: "-1s" });
    const product = await Product.findOne({ business: business._id, stock: { $gte: 2 } });

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

    const storagePath = path.resolve(__dirname, "../../frontend/src/utils/customerOrdersStorage.js");
    const storageSource = fs.readFileSync(storagePath, "utf8");
    if (storageSource.includes("trackingToken: order.trackingToken")) {
        pass("Customer storage persists trackingToken");
    } else if (storageSource.includes('trackingToken: order.trackingToken || ""')) {
        pass("Customer storage persists trackingToken");
    } else {
        fail("Customer storage persists trackingToken");
    }

    if (!storageSource.includes("deliveryToken") && !storageSource.includes("deliveryOtp")) {
        pass("Customer storage excludes delivery secrets");
    } else {
        fail("Customer storage excludes delivery secrets");
    }

    if (isInvoiceAvailable({ paymentStatus: "Paid" }) && isInvoiceAvailable({ paymentStatus: "COD" })) {
        pass("Invoice eligibility Paid/COD");
    } else {
        fail("Invoice eligibility Paid/COD");
    }

    if (!isInvoiceAvailable({ paymentStatus: "AwaitingPayment" })) {
        pass("Invoice ineligible for AwaitingPayment");
    } else {
        fail("Invoice ineligible for AwaitingPayment");
    }

    const profileValid = await request("GET", "/users/profile", null, token);
    if (profileValid.status === 200 && profileValid.body.user?.email) {
        pass("Valid JWT profile bootstrap");
    } else {
        fail("Valid JWT profile bootstrap", String(profileValid.status));
    }

    const profileInvalid = await request("GET", "/users/profile", null, invalidToken);
    if (profileInvalid.status === 401) {
        pass("Invalid JWT profile rejected");
    } else {
        fail("Invalid JWT profile rejected", String(profileInvalid.status));
    }

    const publicHealth = await request("GET", "/public/businesses/" + (business.slug || business._id));
    if (publicHealth.status === 200) {
        pass("Public request without auth unaffected");
    } else {
        fail("Public request without auth unaffected", String(publicHealth.status));
    }

    const tag = "QA Phase11";
    await Order.deleteMany({ business: business._id, customerName: tag });
    await Product.deleteMany({ business: business._id, productName: { $regex: /^QA Phase11/ } });

    const qaProduct = product || await Product.create({
        business: business._id,
        productName: "QA Phase11 Widget",
        description: "test",
        price: 120,
        stock: 20,
        image: "https://placehold.co/100"
    });

    const createdOrder = await Order.create({
        business: business._id,
        customerName: tag,
        customerPhone: "+919876543210",
        customerAddress: "QA Phase11 address line",
        products: [{
            product: qaProduct._id,
            quantity: 1,
            price: qaProduct.price,
            productName: "QA Phase11 Original Name"
        }],
        subtotal: qaProduct.price,
        gstAmount: 0,
        gstRate: 0,
        totalAmount: qaProduct.price,
        paymentMethod: "COD",
        paymentStatus: "COD",
        orderStatus: "New",
        trackingToken: makeTrackingToken()
    });

    const dbOrder = await Order.findById(createdOrder._id);
    if (dbOrder.products[0]?.productName === "QA Phase11 Original Name") {
        pass("Order line snapshots productName");
    } else {
        fail("Order line snapshots productName", dbOrder.products[0]?.productName || "missing");
    }

    await Product.findByIdAndUpdate(qaProduct._id, { productName: "QA Phase11 Renamed Name" });

    const invoice = await buildInvoiceResponse(dbOrder);
    if (invoice.items[0]?.productName === "QA Phase11 Original Name") {
        pass("Invoice uses order snapshot after rename");
    } else {
        fail("Invoice uses order snapshot after rename", invoice.items[0]?.productName);
    }

    if (invoice.totalAmount === dbOrder.totalAmount) {
        pass("Invoice totals unchanged");
    } else {
        fail("Invoice totals unchanged");
    }

    const legacyOrder = await Order.create({
        business: business._id,
        customerName: tag,
        customerPhone: "+919876543211",
        customerAddress: "QA Phase11 legacy",
        products: [{ product: qaProduct._id, quantity: 1, price: 100 }],
        totalAmount: 100,
        paymentMethod: "COD",
        paymentStatus: "COD",
        orderStatus: "New",
        trackingToken: makeTrackingToken()
    });
    const legacyInvoice = await buildInvoiceResponse(legacyOrder);
    if (legacyInvoice.items[0]?.productName) {
        pass("Legacy order invoice fallback");
    } else {
        fail("Legacy order invoice fallback");
    }

    const storeKey = business.slug || String(business._id);
    const cardOrder = await request("POST", `/public/businesses/${storeKey}/orders`, {
        customerName: tag,
        customerPhone: "9876543210",
        customerAddress: "QA Phase11 card test address",
        products: [{ product: qaProduct._id, quantity: 1 }],
        paymentMethod: "Card"
    });
    if (cardOrder.status === 400) {
        pass("Card payment method rejected");
    } else {
        fail("Card payment method rejected", String(cardOrder.status));
    }

    const codPublic = await request("POST", `/public/businesses/${storeKey}/orders`, {
        customerName: tag,
        customerPhone: "9876543210",
        customerAddress: "QA Phase11 cod test address",
        products: [{ product: qaProduct._id, quantity: 1 }],
        paymentMethod: "COD"
    });
    if (codPublic.status === 201 && codPublic.body.trackingUrl) {
        pass("Supported payment method still works");
        const created = await Order.findById(codPublic.body.order?._id);
        if (created?.products?.[0]?.productName) {
            pass("Public order snapshots productName");
        } else {
            fail("Public order snapshots productName");
        }
    } else {
        fail("Supported payment method still works", String(codPublic.status));
    }

    const trackOrder = await Order.create({
        business: business._id,
        customerName: tag,
        customerPhone: "+919876543299",
        customerAddress: "QA track",
        products: [{ product: qaProduct._id, quantity: 1, price: 50, productName: "Track Item" }],
        totalAmount: 50,
        paymentMethod: "COD",
        paymentStatus: "COD",
        orderStatus: "New",
        trackingToken: makeTrackingToken()
    });
    const shortId = shortOrderId(trackOrder._id);

    const goodTrack = await request(
        "GET",
        `/public/orders/track?orderId=${shortId}&phone=9876543299`
    );
    if (goodTrack.status === 200 && goodTrack.body.order?.orderId) {
        pass("Public track exact phone succeeds");
    } else {
        fail("Public track exact phone succeeds", String(goodTrack.status));
    }

    const badTrack = await request(
        "GET",
        `/public/orders/track?orderId=${shortId}&phone=9876543200`
    );
    if (badTrack.status === 404) {
        pass("Public track wrong phone fails");
    } else {
        fail("Public track wrong phone fails", String(badTrack.status));
    }

    const suffixOnly = await request(
        "GET",
        `/public/orders/track?orderId=${shortId}&phone=543299`
    );
    if (suffixOnly.status === 404 || suffixOnly.status === 400) {
        pass("Public track suffix-only phone fails");
    } else {
        fail("Public track suffix-only phone fails", String(suffixOnly.status));
    }

    const pendingMatch = buildPendingOrdersMatch(business._id);
    if (pendingMatch.orderStatus === "New") {
        pass("Dashboard pending uses New status only");
    } else {
        fail("Dashboard pending uses New status only");
    }

    const dashboard = await request("GET", `/dashboard/summary?businessId=${business._id}`, null, token);
    if (dashboard.status === 200 && typeof dashboard.body.summary?.pendingOrders === "number") {
        pass("Dashboard summary pending field present");
    } else {
        fail("Dashboard summary pending field present", String(dashboard.status));
    }

    const paginationProduct = await Product.create({
        business: business._id,
        productName: "QA Phase11 Pagination Product",
        description: "pagination",
        price: 10,
        stock: 1,
        image: "https://placehold.co/100"
    });

    const productsAfter = await request(
        "GET",
        `/products/business/${business._id}?search=QA Phase11 Pagination&page=1&limit=12`,
        null,
        token
    );
    if (productsAfter.status === 200 && productsAfter.body.pagination?.total === 1) {
        pass("Product pagination total reflects fixture");
    } else {
        fail("Product pagination total reflects fixture", String(productsAfter.body.pagination?.total));
    }

    await request("DELETE", `/products/${paginationProduct._id}`, null, token);
    const productsDeleted = await request(
        "GET",
        `/products/business/${business._id}?search=QA Phase11 Pagination&page=1&limit=12`,
        null,
        token
    );
    if (productsDeleted.body.pagination?.total === 0) {
        pass("Product pagination total after delete");
    } else {
        fail("Product pagination total after delete", String(productsDeleted.body.pagination?.total));
    }

    const listBefore = await request(
        "GET",
        `/orders?businessId=${business._id}&search=${tag}&page=1&limit=1`,
        null,
        token
    );
    const orderTotalBefore = listBefore.body.pagination?.total || 0;
    if (orderTotalBefore >= 1 && listBefore.body.orders?.length === 1) {
        pass("Order pagination page size");
    } else {
        fail("Order pagination page size");
    }

    const deletable = listBefore.body.orders?.[0];
    if (deletable && ["New", "Cancelled"].includes(deletable.orderStatus)) {
        await request("DELETE", `/orders/${deletable._id}`, null, token);
        const listAfter = await request(
            "GET",
            `/orders?businessId=${business._id}&search=${tag}&page=1&limit=1`,
            null,
            token
        );
        if (listAfter.body.pagination?.total === orderTotalBefore - 1) {
            pass("Order pagination total after delete");
        } else {
            fail("Order pagination total after delete", String(listAfter.body.pagination?.total));
        }
    } else {
        skip("Order pagination total after delete", "no deletable order");
    }

    const invoiceToken = createdOrder.trackingToken;
    const invoiceRes = await request("GET", `/public/orders/invoice/${invoiceToken}`);
    if (invoiceRes.status === 200) {
        pass("Invoice token capability works");
    } else {
        fail("Invoice token capability works", String(invoiceRes.status));
    }

    if (phonesMatch("+919876543210", "9876543210")) {
        pass("Phone normalization exact match helper");
    } else {
        fail("Phone normalization exact match helper");
    }

    await Order.deleteMany({ business: business._id, customerName: tag });
    await Product.deleteMany({ business: business._id, productName: { $regex: /^QA Phase11/ } });

    await mongoose.disconnect();
    console.log(`\nPhase 11 QA: ${passed} passed, ${failed} failed, ${skipped} skipped`);
    process.exit(failed ? 1 : 0);
};

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
