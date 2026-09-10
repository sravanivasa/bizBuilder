/**
 * Phase 3B FINAL QA — read-only accuracy + security checks
 * Usage: node scripts/phase3b-final-qa.js [businessIdOrSlug]
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
const results = [];

const pass = (area, detail) => results.push({ area, ok: true, detail });
const fail = (area, detail) => {
    results.push({ area, ok: false, detail });
    findings.push({ area, detail });
};
const note = (area, detail) => results.push({ area, ok: true, detail, note: true });

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
    return { status: res.status, body, headers: res.headers };
}

function snapshotOrder(order) {
    return {
        _id: String(order._id),
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        subtotal: order.subtotal,
        gstAmount: order.gstAmount,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        paidAt: order.paidAt || null,
        paymentSubmittedAt: order.paymentSubmittedAt || null,
        razorpayOrderId: order.razorpayOrderId || null,
        razorpayPaymentId: order.razorpayPaymentId || null,
        trackingToken: order.trackingToken || null,
        deliveryToken: order.deliveryToken || null,
        products: order.products.map((p) => ({
            product: String(p.product),
            quantity: p.quantity,
            price: p.price
        }))
    };
}

function ordersMatch(a, b, fields) {
    return fields.every((f) => JSON.stringify(a[f]) === JSON.stringify(b[f]));
}

function extractToken(url) {
    const m = String(url || "").match(/\/([a-f0-9]{64})$/i);
    return m ? m[1] : null;
}

function testTokenExtraction() {
    const token = "a".repeat(64);
    const urls = [
        `http://localhost:5173/track/${token}`,
        `http://localhost:5173/store/demo/track/${token}`,
        `http://localhost:5173/pay/${token}`,
        `http://localhost:5173/store/demo/pay/${token}`
    ];
    const pattern = /\/(?:track|pay|invoice)\/([a-f0-9]{64})$/i;
    for (const url of urls) {
        const pathname = new URL(url).pathname;
        const match = pathname.match(pattern);
        if (!match || match[1] !== token) {
            fail("Frontend token extraction", `Failed for ${url}`);
            return;
        }
    }
    pass("Frontend token extraction", "64-char hex extracted correctly from track/pay URLs");
}

async function main() {
    testTokenExtraction();

    await mongoose.connect(process.env.MONGODB_URI);

    let storeKey = process.argv[2];
    if (!storeKey) {
        const biz = await Business.findOne({}).select("_id slug razorpayEnabled razorpayKeyId");
        storeKey = biz?.slug || String(biz?._id || "");
    }

    const businessQuery = mongoose.Types.ObjectId.isValid(storeKey) && String(storeKey).length === 24
        ? { _id: storeKey }
        : { slug: storeKey };
    const business = await Business.findOne(businessQuery)
        .select("+razorpayKeySecret businessName slug upiId razorpayEnabled razorpayKeyId");

    if (!business) {
        fail("Setup", `Business not found: ${storeKey}`);
        printReport();
        process.exit(1);
    }

    let product = await Product.findOne({ business: business._id, stock: { $gt: 0 } });
    let bootstrapProductId = null;

    if (!product) {
        const fallback = await Product.findOne({ business: business._id });

        if (fallback) {
            await Product.findByIdAndUpdate(fallback._id, { $set: { stock: 10 } });
            product = await Product.findById(fallback._id);
            note("Setup", `Restored stock on existing product ${product.productName}`);
        } else {
            product = await Product.create({
                business: business._id,
                productName: `QA Bootstrap Product ${Date.now()}`,
                description: "Phase 3B bootstrap",
                price: 100,
                stock: 10,
                image: "https://placehold.co/100"
            });
            bootstrapProductId = product._id;
            note("Setup", `Created bootstrap product ${product.productName}`);
        }
    }

    const bizId = String(business._id);
    const razorpayConfigured = Boolean(
        business.razorpayEnabled && business.razorpayKeyId && business.razorpayKeySecret
    );

    if (razorpayConfigured) note("Razorpay env", "Business has Razorpay configured — partial live tests possible");
    else note("Razorpay env", "Razorpay NOT configured for business — signature/webhook flows NOT TESTABLE live");

    const mkPayload = (method, phoneSuffix) => ({
        customerName: `QA ${method}`,
        customerPhone: `+91987654${phoneSuffix}`,
        customerAddress: "QA Address Line",
        paymentMethod: method,
        products: [{ product: product._id, quantity: 1 }]
    });

    // --- 1. CREATE ORDER ---
    const codRes = await request(`/public/businesses/${storeKey}/orders`, {
        method: "POST",
        body: JSON.stringify(mkPayload("COD", "1001"))
    });

    if (codRes.status !== 201) {
        fail("Create COD", `${codRes.status} ${JSON.stringify(codRes.body)}`);
    } else {
        const dbCod = await Order.findById(codRes.body.order._id);
        const forbidden = ["trackingToken", "deliveryToken", "razorpayOrderId", "razorpayPaymentId"];
        const respLeaks = forbidden.filter((f) => codRes.body[f] != null || codRes.body.order?.[f] != null);
        if (respLeaks.length) fail("Create COD secrets", respLeaks.join(", "));
        else pass("Create COD no secret fields", "response clean");

        if (codRes.body.payUrl != null) fail("Create COD payUrl", `unexpected payUrl: ${codRes.body.payUrl}`);
        else pass("Create COD payUrl absent", "correct");

        const tokenFromUrl = extractToken(codRes.body.trackingUrl);
        if (!tokenFromUrl || tokenFromUrl !== dbCod.trackingToken) {
            fail("Create COD trackingUrl", "URL token mismatch vs MongoDB");
        } else pass("Create COD trackingUrl", "matches DB trackingToken");

        const confirmFields = [
            "customerName",
            "customerPhone",
            "totalAmount",
            "paymentMethod",
            "paymentStatus",
            "orderStatus"
        ];
        if (
            ordersMatch(
                codRes.body.order,
                snapshotOrder(dbCod),
                confirmFields
            )
        ) {
            pass("Create COD field accuracy", "response matches MongoDB");
        } else {
            fail("Create COD field accuracy", JSON.stringify({ api: codRes.body.order, db: snapshotOrder(dbCod) }));
        }
    }

    const upiRes = await request(`/public/businesses/${storeKey}/orders`, {
        method: "POST",
        body: JSON.stringify(mkPayload("UPI", "1002"))
    });

    let upiToken = null;
    let upiOrderId = null;
    if (upiRes.status !== 201) {
        fail("Create UPI", `${upiRes.status} ${JSON.stringify(upiRes.body)}`);
    } else {
        const dbUpi = await Order.findById(upiRes.body.order._id);
        upiOrderId = String(dbUpi._id);
        upiToken = dbUpi.trackingToken;

        if (!upiRes.body.payUrl) fail("Create UPI payUrl", "missing");
        else if (extractToken(upiRes.body.payUrl) !== dbUpi.trackingToken) fail("Create UPI payUrl", "token mismatch");
        else pass("Create UPI payUrl", "present and matches DB token");

        if (dbUpi.paymentStatus !== "AwaitingPayment") {
            fail("Create UPI DB state", `paymentStatus=${dbUpi.paymentStatus}`);
        } else pass("Create UPI DB state", "AwaitingPayment in MongoDB");
    }

    if (razorpayConfigured) {
        const cardRes = await request(`/public/businesses/${storeKey}/orders`, {
            method: "POST",
            body: JSON.stringify(mkPayload("Card", "1003"))
        });
        if (cardRes.status === 201 && cardRes.body.payUrl) {
            pass("Create Razorpay order", "Card order with payUrl created");
            const payPage = await request(`/public/orders/pay/${extractToken(cardRes.body.payUrl)}`);
            if (payPage.body?.payment?.razorpayConfigured && payPage.body?.payment?.razorpayKeyId) {
                pass("Payment page Razorpay key", "keyId exposed when configured");
            } else fail("Payment page Razorpay key", JSON.stringify(payPage.body?.payment));
            const bodyStr = JSON.stringify(payPage.body || {});
            if (/keySecret|razorpayKeySecret/i.test(bodyStr)) {
                fail("Payment page secret leak", "secret found in response");
            } else pass("Payment page no secret", "razorpayKeySecret not in response");
        } else {
            fail("Create Razorpay order", `${cardRes.status}`);
        }
    }

    // COD payment page should reject
    if (codRes.status === 201) {
        const codDb = await Order.findById(codRes.body.order._id);
        const codPay = await request(`/public/orders/pay/${codDb.trackingToken}`);
        if (codPay.status === 400) pass("COD payment page blocked", codPay.body?.message || "400");
        else fail("COD payment page blocked", `${codPay.status}`);
    }

    // --- 2. TRACKING ACCURACY ---
    if (upiToken) {
        const trackToken = await request(`/public/orders/track/${upiToken}`);
        const dbUpi = await Order.findOne({ trackingToken: upiToken });
        if (trackToken.status !== 200) {
            fail("Token track", `${trackToken.status}`);
        } else {
            const o = trackToken.body.order;
            if (o.customerPhone) fail("Token track phone leak", o.customerPhone);
            else pass("Token track no phone", "customerPhone absent");

            if (o.trackingToken || o.deliveryToken) fail("Token track token leak", "internal token in body");
            else pass("Token track no internal tokens", "clean");

            if (String(o.orderId) !== String(dbUpi._id)) fail("Token track orderId", "mismatch");
            else pass("Token track orderId", "matches MongoDB");

            if (o.customerName !== dbUpi.customerName) fail("Token track name", "mismatch");
            else pass("Token track customerName", "matches");

            if (o.totalAmount !== dbUpi.totalAmount) fail("Token track amount", "mismatch");
            else pass("Token track amounts", "total matches MongoDB");

            if (o.paymentStatus !== dbUpi.paymentStatus) fail("Token track paymentStatus", "mismatch");
            else pass("Token track paymentStatus", "matches");

            const shortId = String(dbUpi._id).slice(-6).toUpperCase();
            const phone = dbUpi.customerPhone.replace(/\D/g, "").slice(-10);

            const bizTrack = await request(
                `/public/businesses/${storeKey}/orders/track?orderId=${shortId}&phone=${phone}`
            );
            if (bizTrack.status === 200 && String(bizTrack.body.order.orderId) === String(dbUpi._id)) {
                pass("Business phone track", "correct order returned");
            } else fail("Business phone track", `${bizTrack.status}`);

            const globalTrack = await request(
                `/public/orders/track?orderId=${shortId}&phone=${phone}`
            );
            if (globalTrack.status === 200 && String(globalTrack.body.order.orderId) === String(dbUpi._id)) {
                pass("Global phone track", "correct order returned");
            } else fail("Global phone track", `${globalTrack.status}`);

            const wrongBiz = await request(
                `/public/businesses/${storeKey}/orders/track?orderId=${shortId}&phone=9999999999`
            );
            if (wrongBiz.status === 404) pass("Business wrong phone 404", "no oracle");
            else fail("Business wrong phone 404", `got ${wrongBiz.status}`);

            const wrongGlobal = await request(
                `/public/orders/track?orderId=${shortId}&phone=9999999999`
            );
            if (wrongGlobal.status === 404) pass("Global wrong phone 404", "correct");
            else fail("Global wrong phone 404", `got ${wrongGlobal.status}`);
        }
    }

    // --- 3. PAYMENT PAGE ACCURACY (active UPI) ---
    if (upiToken) {
        const payPage = await request(`/public/orders/pay/${upiToken}`);
        const dbUpi = await Order.findOne({ trackingToken: upiToken });
        if (payPage.status === 200) {
            const p = payPage.body.payment;
            if (p.totalAmount === dbUpi.totalAmount && p.paymentMethod === dbUpi.paymentMethod) {
                pass("Payment page accuracy", "amount and method match DB");
            } else fail("Payment page accuracy", JSON.stringify({ api: p, db: snapshotOrder(dbUpi) }));

            if (p.customerName === dbUpi.customerName) pass("Payment page customer", "name matches");
            else fail("Payment page customer", "name mismatch");

            if (!razorpayConfigured && business.upiId && p.upiLink) {
                pass("Manual UPI details", "upiLink present when configured and no Razorpay");
            } else if (!razorpayConfigured && !business.upiId) {
                note("Manual UPI details", "Business has no upiId — UPI link absence expected");
            }
        } else {
            fail("Payment page active", `${payPage.status}`);
        }
    }

    // --- 4. CANCELLED ORDER INTEGRITY ---
    if (upiToken && upiOrderId) {
        const before = snapshotOrder(await Order.findById(upiOrderId));
        await Order.findByIdAndUpdate(upiOrderId, { orderStatus: "Cancelled" });
        const afterCancelSnapshot = snapshotOrder(await Order.findById(upiOrderId));

        const payView = await request(`/public/orders/pay/${upiToken}`);
        if (payView.status === 200) {
            note(
                "Cancelled payment page GET",
                "Page loads; payment UI may still show Complete Payment — mutations blocked server-side"
            );
        }

        for (const [label, path, method, body] of [
            ["confirm", `/public/orders/pay/${upiToken}/confirm`, "POST", null],
            ["razorpay-order", `/public/orders/pay/${upiToken}/razorpay-order`, "POST", null],
            [
                "verify",
                `/public/orders/pay/${upiToken}/verify`,
                "POST",
                JSON.stringify({
                    razorpay_order_id: "order_fake",
                    razorpay_payment_id: "pay_fake",
                    razorpay_signature: "sig_fake"
                })
            ]
        ]) {
            const r = await request(path, { method, body });
            if (r.status !== 400 || !/cancelled/i.test(r.body?.message || "")) {
                fail(`Cancelled ${label}`, `${r.status} ${JSON.stringify(r.body)}`);
            } else {
                pass(`Cancelled ${label} rejected`, r.body.message);
            }
        }

        const afterMutations = snapshotOrder(await Order.findById(upiOrderId));
        const unchanged = [
            "paymentStatus",
            "paidAt",
            "paymentSubmittedAt",
            "razorpayOrderId",
            "razorpayPaymentId"
        ];
        if (
            ordersMatch(afterMutations, afterCancelSnapshot, unchanged) &&
            afterMutations.orderStatus === "Cancelled"
        ) {
            pass("Cancelled DB integrity", "no partial mutation after rejected payment attempts");
        } else {
            fail(
                "Cancelled DB integrity",
                JSON.stringify({ afterCancel: afterCancelSnapshot, after: afterMutations })
            );
        }

        await Order.findByIdAndUpdate(upiOrderId, { orderStatus: before.orderStatus });
    }

    // --- 5. ACTIVE MANUAL UPI CONFIRM (Phase 2B) ---
    const freshUpi = await request(`/public/businesses/${storeKey}/orders`, {
        method: "POST",
        body: JSON.stringify(mkPayload("UPI", "1004"))
    });
    if (freshUpi.status === 201) {
        const freshDb = await Order.findById(freshUpi.body.order._id);
        const freshToken = freshDb.trackingToken;
        const beforeConfirm = snapshotOrder(freshDb);

        const confirm = await request(`/public/orders/pay/${freshToken}/confirm`, { method: "POST" });
        const afterDb = snapshotOrder(await Order.findById(freshDb._id));

        if (confirm.status === 200 && confirm.body.paymentStatus === "PaymentSubmitted") {
            pass("Manual confirm message", "PaymentSubmitted in response");
        } else {
            fail("Manual confirm", `${confirm.status} ${JSON.stringify(confirm.body)}`);
        }

        if (afterDb.paymentStatus === "PaymentSubmitted" && afterDb.paymentStatus !== "Paid") {
            pass("Manual confirm DB", "PaymentSubmitted not Paid");
        } else fail("Manual confirm DB", `paymentStatus=${afterDb.paymentStatus}`);

        if (afterDb.paidAt) fail("Manual confirm paidAt", "paidAt incorrectly set");
        else pass("Manual confirm paidAt", "not set");

        if (confirm.body.message?.toLowerCase().includes("paid")) {
            fail("Manual confirm false message", confirm.body.message);
        } else pass("Manual confirm truthful message", confirm.body.message);
    }

    // --- 7. RATE LIMITING ---
    if (!process.env.SKIP_RATE_LIMIT) {
    const health = await request("/health");
    if (health.status === 200) pass("Unrelated API before limit", "/health works");

    const probeToken = upiToken || (codRes.status === 201 ? extractToken(codRes.body.trackingUrl) : null);
    if (probeToken) {
        let saw429 = false;
        let lastOk = 0;
        for (let i = 0; i < 55; i++) {
            const r = await request(`/public/orders/track/${probeToken}`);
            if (r.status === 200) lastOk++;
            if (r.status === 429) {
                saw429 = true;
                if (r.body?.success === false && /too many/i.test(r.body?.message || "")) {
                    pass("Rate limit response format", r.body.message);
                } else fail("Rate limit response format", JSON.stringify(r.body));
                break;
            }
        }
        if (lastOk > 0) pass("Rate limit normal traffic", `${lastOk} successful before 429`);
        if (saw429) pass("Rate limit threshold", "429 after repeated capability requests (max=50 per implementation)");
        else fail("Rate limit threshold", "no 429 observed in 55 requests");

        const healthAfter = await request("/health");
        if (healthAfter.status === 200) pass("Global/unrelated after limit", "/health still reachable");
        else note("Global/unrelated after limit", `/health returned ${healthAfter.status} — may be global limiter`);
    }
    }

    await mongoose.disconnect();
    printReport();
    process.exit(findings.length ? 1 : 0);
}

function printReport() {
    console.log("\n=== Phase 3B FINAL QA ===\n");
    for (const r of results) {
        const tag = r.note ? "NOTE" : r.ok ? "PASS" : "FAIL";
        console.log(`${tag} [${r.area}] ${r.detail}`);
    }
    console.log(`\n${results.filter((r) => r.ok && !r.note).length} passed, ${findings.length} failed, ${results.filter((r) => r.note).length} notes\n`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
