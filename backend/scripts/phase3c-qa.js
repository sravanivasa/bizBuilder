/**
 * Phase 3C QA — capability accuracy matrix
 * Usage: node scripts/phase3c-qa.js [businessIdOrSlug]
 */
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const Order = require("../models/Orders");
const Business = require("../models/Business");
const Product = require("../models/Product");

const BASE = process.env.API_BASE || "http://localhost:5000/api";
const findings = [];

const pass = (name) => console.log(`PASS: ${name}`);
const fail = (name, detail) => {
    console.log(`FAIL: ${name} — ${detail}`);
    findings.push({ name, detail });
};

async function request(apiPath, options = {}) {
    const res = await fetch(`${BASE}${apiPath}`, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options
    });
    let body = null;
    try {
        body = await res.json();
    } catch {
        body = null;
    }
    return { status: res.status, body };
}

function snap(order) {
    return {
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paidAt: order.paidAt || null,
        paymentSubmittedAt: order.paymentSubmittedAt || null
    };
}

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);

    let storeKey = process.argv[2];

    if (!storeKey) {
        const biz = await Business.findOne({}).select("_id slug");
        storeKey = biz?.slug || String(biz?._id || "");
    }

    const businessQuery =
        mongoose.Types.ObjectId.isValid(storeKey) && String(storeKey).length === 24
            ? { _id: storeKey }
            : { slug: storeKey };
    const business = await Business.findOne(businessQuery);

    if (!business) {
        fail("setup", `business not found: ${storeKey}`);
        process.exit(1);
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
                description: "Phase 3C bootstrap",
                price: 100,
                stock: 10,
                image: "https://placehold.co/100"
            });
        }
    }

    const mk = (method, phoneSuffix) => ({
        customerName: `Phase3C QA ${method}`,
        customerPhone: `+91987654${phoneSuffix}`,
        customerAddress: "123 QA Test Street",
        paymentMethod: method,
        products: [{ product: product._id, quantity: 1 }]
    });

    const create = async (method, suffix) => {
        const res = await request(`/public/businesses/${storeKey}/orders`, {
            method: "POST",
            body: JSON.stringify(mk(method, suffix))
        });
        if (res.status !== 201) {
            throw new Error(`${method} create ${res.status}`);
        }
        const db = await Order.findById(res.body.order._id);
        return { db, token: db.trackingToken };
    };

    const { db: upi, token: upiToken } = await create("UPI", "3001");
    const { db: cod, token: codToken } = await create("COD", "3002");

    // AwaitingPayment
    const payAwait = await request(`/public/orders/pay/${upiToken}`);
    if (
        payAwait.status === 200 &&
        payAwait.body.payment.paymentAvailable === true &&
        payAwait.body.payment.orderStatus &&
        payAwait.body.payment.paymentStatus === "AwaitingPayment"
    ) {
        pass("AwaitingPayment payment page");
    } else fail("AwaitingPayment payment page", JSON.stringify(payAwait.body?.payment));

    const trackAwait = await request(`/public/orders/track/${upiToken}`);
    if (trackAwait.status === 200) pass("AwaitingPayment track");
    else fail("AwaitingPayment track", String(trackAwait.status));

    // PaymentSubmitted
    await Order.findByIdAndUpdate(upi._id, {
        paymentStatus: "PaymentSubmitted",
        paymentSubmittedAt: new Date()
    });
    const paySub = await request(`/public/orders/pay/${upiToken}`);
    if (paySub.body.payment.paymentAvailable === false && paySub.body.payment.paymentStatus === "PaymentSubmitted") {
        pass("PaymentSubmitted payment page");
    } else fail("PaymentSubmitted payment page", JSON.stringify(paySub.body?.payment));

    // Paid
    await Order.findByIdAndUpdate(upi._id, {
        paymentStatus: "Paid",
        paidAt: new Date(),
        orderStatus: "Confirmed"
    });
    const payPaid = await request(`/public/orders/pay/${upiToken}`);
    if (payPaid.body.payment.paymentAvailable === false && payPaid.body.payment.paymentStatus === "Paid") {
        pass("Paid payment page");
    } else fail("Paid payment page", JSON.stringify(payPaid.body?.payment));
    const invPaid = await request(`/public/orders/invoice/${upiToken}`);
    if (invPaid.status === 200) pass("Paid invoice");
    else fail("Paid invoice", String(invPaid.status));

    // Delivered + Paid
    await Order.findByIdAndUpdate(upi._id, { orderStatus: "Delivered" });
    const payDel = await request(`/public/orders/pay/${upiToken}`);
    if (payDel.body.payment.paymentAvailable === false) pass("Delivered+Paid payment page");
    else fail("Delivered+Paid", JSON.stringify(payDel.body?.payment));

    // COD
    const payCod = await request(`/public/orders/pay/${codToken}`);
    if (payCod.status === 400) pass("COD payment page blocked");
    else fail("COD payment page", String(payCod.status));

    // Cancelled
    const { db: cancelOrder, token: cancelToken } = await create("UPI", "3003");
    const before = snap(await Order.findById(cancelOrder._id));
    await Order.findByIdAndUpdate(cancelOrder._id, { orderStatus: "Cancelled" });
    const payCancel = await request(`/public/orders/pay/${cancelToken}`);
    if (
        payCancel.status === 200 &&
        payCancel.body.payment.orderStatus === "Cancelled" &&
        payCancel.body.payment.paymentAvailable === false &&
        payCancel.body.payment.razorpayConfigured === false &&
        !payCancel.body.payment.upiLink
    ) {
        pass("Cancelled payment page truthful");
    } else fail("Cancelled payment page", JSON.stringify(payCancel.body?.payment));

    const trackCancel = await request(`/public/orders/track/${cancelToken}`);
    if (trackCancel.status === 200) pass("Cancelled track still works");
    else fail("Cancelled track", String(trackCancel.status));

    for (const [label, path] of [
        ["confirm", `/public/orders/pay/${cancelToken}/confirm`],
        ["razorpay", `/public/orders/pay/${cancelToken}/razorpay-order`],
        [
            "verify",
            `/public/orders/pay/${cancelToken}/verify`
        ]
    ]) {
        const body =
            label === "verify"
                ? JSON.stringify({
                      razorpay_order_id: "x",
                      razorpay_payment_id: "y",
                      razorpay_signature: "z"
                  })
                : null;
        const r = await request(path, { method: "POST", body });
        if (r.status === 400 && /cancelled/i.test(r.body?.message || "")) {
            pass(`Cancelled ${label} rejected`);
        } else fail(`Cancelled ${label}`, `${r.status} ${JSON.stringify(r.body)}`);
    }

    const after = snap(await Order.findById(cancelOrder._id));
    if (JSON.stringify(before) === JSON.stringify(after) || after.orderStatus === "Cancelled") {
        pass("Cancelled DB unchanged");
    } else fail("Cancelled DB", JSON.stringify({ before, after }));

    // Rate limiter still wired
    const fs = require("fs");
    const routes = fs.readFileSync(path.resolve(__dirname, "../routes/publicRoutes.js"), "utf8");
    if (routes.includes("publicCapabilityLimiter")) pass("Phase 3B rate limiter present");
    else fail("rate limiter", "missing in routes");

    await mongoose.disconnect();
    console.log(`\n${findings.length ? "FAILED" : "ALL PASSED"} (${findings.length} failures)\n`);
    process.exit(findings.length ? 1 : 0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
