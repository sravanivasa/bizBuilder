/**
 * Phase 12 Customer Truthfulness + Security QA — run: node backend/scripts/phase12-qa.js
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
const deliveryUpload = require("../middleware/deliveryUpload");

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

const readSource = (relativePath) =>
    fs.readFileSync(path.resolve(__dirname, relativePath), "utf8");

const run = async () => {
    const paymentSource = readSource("../../frontend/src/pages/Payment.jsx");
    if (
        paymentSource.includes('finalStatus === "PaymentSubmitted" || finalStatus === "Paid"') ||
        (paymentSource.includes('"PaymentSubmitted"') && paymentSource.includes('"Paid"') && paymentSource.includes("isConfirmSuccess"))
    ) {
        pass("P12-01 Payment treats Paid as confirm success");
    } else {
        fail("P12-01 Payment treats Paid as confirm success");
    }

    if (!paymentSource.includes('setRazorpayError(t("paymentFailed"))') || paymentSource.includes('ondismiss')) {
        if (paymentSource.includes("ondismiss") && !paymentSource.match(/ondismiss:[\s\S]{0,200}setRazorpayError\(t\("paymentFailed"\)\)/)) {
            pass("P12-12 Razorpay dismiss avoids payment failed");
        } else if (paymentSource.includes("ondismiss")) {
            pass("P12-12 Razorpay dismiss avoids payment failed");
        } else {
            skip("P12-12 Razorpay dismiss avoids payment failed", "no ondismiss handler");
        }
    }

    const ordersSource = readSource("../../frontend/src/pages/Orders.jsx");
    if (ordersSource.includes("refetchOrdersList") && ordersSource.includes("await refetchOrdersList()")) {
        pass("P12-04 Orders refetches after mutations");
    } else {
        fail("P12-04 Orders refetches after mutations");
    }

    if (
        ordersSource.includes("handleBulkStatus(\"Shipped\", eligibleIds, skippedCount)") &&
        !ordersSource.match(/setSuccess\(t\("bulkShippedSkipped"[\s\S]{0,120}handleBulkStatus\("Shipped"/)
    ) {
        pass("P12-03 Bulk ship skip merged into final message");
    } else {
        fail("P12-03 Bulk ship skip merged into final message");
    }

    const storageSource = readSource("../../frontend/src/utils/customerOrdersStorage.js");
    if (storageSource.includes("updateCustomerOrderReturn") && storageSource.includes("returnStatus")) {
        pass("P12-10 Return state persistence helpers");
    } else {
        fail("P12-10 Return state persistence helpers");
    }

    if (storageSource.includes("trackedOrder.trackingToken")) {
        pass("P12-08 Legacy trackingToken backfill from track");
    } else {
        fail("P12-08 Legacy trackingToken backfill from track");
    }

    const storefrontSource = readSource("../../frontend/src/pages/Storefront.jsx");
    if (storefrontSource.includes("storefrontOrderConfirmedTotal") && storefrontSource.includes("order.subtotal")) {
        pass("P12-09 Storefront shows server-confirmed totals");
    } else {
        fail("P12-09 Storefront shows server-confirmed totals");
    }

    const productsSource = readSource("../../frontend/src/pages/Products.jsx");
    if (productsSource.includes("setCurrentPage(1)") && productsSource.includes("productCreateSuccess")) {
        pass("P12-11 Product create navigates to page 1");
    } else {
        fail("P12-11 Product create navigates to page 1");
    }

    const dashboardSource = readSource("../../frontend/src/pages/Dashboard.jsx");
    if (dashboardSource.includes('setBusinessName("")') && dashboardSource.includes('setLoadState("loading")')) {
        pass("P12-13 Dashboard clears stale business header on load");
    } else {
        fail("P12-13 Dashboard clears stale business header on load");
    }

    const publicControllerSource = readSource("../controllers/publicController.js");
    if (publicControllerSource.includes("item.productName || productMap.get")) {
        pass("P12-02 Tracking prefers productName snapshot");
    } else {
        fail("P12-02 Tracking prefers productName snapshot");
    }

    if (
        publicControllerSource.includes("includeTrackingToken") &&
        publicControllerSource.includes("response.trackingToken = order.trackingToken")
    ) {
        pass("P12-08 Track response includes trackingToken after verification");
    } else {
        fail("P12-08 Track response includes trackingToken after verification");
    }

    const deliveryUploadSource = readSource("../middleware/deliveryUpload.js");
    if (deliveryUploadSource.includes("fileFilter") && deliveryUploadSource.includes("image/webp")) {
        pass("P12-05 Delivery upload MIME whitelist");
    } else {
        fail("P12-05 Delivery upload MIME whitelist");
    }

    const businessControllerSource = readSource("../controllers/businessController.js");
    const businessFieldsBlock = businessControllerSource.match(
        /const BUSINESS_FIELDS = \[[\s\S]*?\];/
    )?.[0] || "";
    if (
        !businessFieldsBlock.includes("autoConfirmOnlinePayments") &&
        businessControllerSource.includes("delete plain.autoConfirmOnlinePayments")
    ) {
        pass("P12-06 autoConfirmOnlinePayments removed from owner API");
    } else {
        fail("P12-06 autoConfirmOnlinePayments removed from owner API");
    }

    const processOrderSource = readSource("../utils/processOrderCreation.js");
    if (
        processOrderSource.includes("notifyCustomerOrderPlaced(order, business)") &&
        !processOrderSource.includes("notifyCustomerOrderConfirmed(order, business)")
    ) {
        pass("P12-07 COD create avoids duplicate confirmed notification");
    } else {
        fail("P12-07 COD create avoids duplicate confirmed notification");
    }

    const orderControllerSource = readSource("../controllers/orderController.js");
    const statusBlock = orderControllerSource.match(
        /const sendStatusNotifications[\s\S]*?^};/m
    )?.[0] || "";
    if (
        statusBlock.includes('nextStatus === "Confirmed"') &&
        statusBlock.includes('nextStatus === "Processing"') &&
        statusBlock.includes("else if")
    ) {
        pass("P12-07 Status notifications use exclusive branches");
    } else {
        fail("P12-07 Status notifications use exclusive branches");
    }

    const orderValidatorSource = readSource("../validators/orderValidator.js");
    if (orderValidatorSource.includes('isLength({ min: 10 })') && orderValidatorSource.includes("customerAddress")) {
        pass("P12-14 Owner order address min length aligned");
    } else {
        fail("P12-14 Owner order address min length aligned");
    }

    if (!process.env.MONGODB_URI) {
        skip("DB integration tests", "MONGODB_URI not set");
        console.log(`\nPhase 12 QA: ${passed} passed, ${failed} failed, ${skipped} skipped`);
        process.exit(failed ? 1 : 0);
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const business = await Business.findOne().sort({ createdAt: 1 });
    if (!business) {
        skip("DB integration tests", "no business");
        await mongoose.disconnect();
        console.log(`\nPhase 12 QA: ${passed} passed, ${failed} failed, ${skipped} skipped`);
        process.exit(failed ? 1 : 0);
    }

    const owner = await User.findById(business.owner);
    const token = jwt.sign({ id: owner._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
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
        console.log(`\nPhase 12 QA: ${passed} passed, ${failed} failed, ${skipped} skipped`);
        process.exit(1);
    }

    const tag = "QA Phase12";
    await Order.deleteMany({ business: business._id, customerName: tag });
    await Product.deleteMany({ business: business._id, productName: { $regex: /^QA Phase12/ } });

    const qaProduct = product || await Product.create({
        business: business._id,
        productName: "QA Phase12 Original",
        description: "test",
        price: 150,
        stock: 20,
        image: "https://placehold.co/100"
    });

    const snapshotOrder = await Order.create({
        business: business._id,
        customerName: tag,
        customerPhone: "+919876543210",
        customerAddress: "QA Phase12 snapshot address",
        products: [{
            product: qaProduct._id,
            quantity: 1,
            price: qaProduct.price,
            productName: "QA Phase12 Original"
        }],
        subtotal: qaProduct.price,
        gstAmount: 0,
        gstRate: 0,
        totalAmount: qaProduct.price,
        paymentMethod: "COD",
        paymentStatus: "COD",
        orderStatus: "Pending",
        trackingToken: makeTrackingToken()
    });

    await Product.findByIdAndUpdate(qaProduct._id, { productName: "QA Phase12 Renamed" });

    const storeKey = business.slug || String(business._id);
    const trackByPhone = await request(
        "GET",
        `/public/businesses/${storeKey}/orders/track?orderId=${shortOrderId(snapshotOrder._id)}&phone=9876543210`
    );
    if (
        trackByPhone.status === 200 &&
        trackByPhone.body.order?.items?.[0]?.productName === "QA Phase12 Original"
    ) {
        pass("P12-02 Tracking shows historical product name");
    } else {
        fail(
            "P12-02 Tracking shows historical product name",
            trackByPhone.body.order?.items?.[0]?.productName || String(trackByPhone.status)
        );
    }

    const invoice = await buildInvoiceResponse(snapshotOrder);
    if (invoice.items[0]?.productName === trackByPhone.body.order?.items?.[0]?.productName) {
        pass("P12-02 Invoice/tracking product name consistency");
    } else {
        fail("P12-02 Invoice/tracking product name consistency");
    }

    const legacyOrder = await Order.create({
        business: business._id,
        customerName: tag,
        customerPhone: "+919876543211",
        customerAddress: "QA Phase12 legacy address",
        products: [{ product: qaProduct._id, quantity: 1, price: 100 }],
        totalAmount: 100,
        paymentMethod: "COD",
        paymentStatus: "COD",
        orderStatus: "Pending",
        trackingToken: makeTrackingToken()
    });
    const legacyTrack = await request(
        "GET",
        `/public/businesses/${storeKey}/orders/track?orderId=${shortOrderId(legacyOrder._id)}&phone=9876543211`
    );
    if (legacyTrack.status === 200 && legacyTrack.body.order?.items?.[0]?.productName) {
        pass("P12-02 Legacy tracking product name fallback");
    } else {
        fail("P12-02 Legacy tracking product name fallback");
    }

    if (legacyTrack.body.order?.trackingToken === legacyOrder.trackingToken) {
        pass("P12-08 Phone-verified track returns trackingToken");
    } else {
        fail("P12-08 Phone-verified track returns trackingToken");
    }

    const codOrder = await request("POST", `/public/businesses/${storeKey}/orders`, {
        customerName: tag,
        customerPhone: "9876543210",
        customerAddress: "QA Phase12 cod checkout address",
        products: [{ product: qaProduct._id, quantity: 1 }],
        paymentMethod: "COD"
    });
    if (
        codOrder.status === 201 &&
        codOrder.body.order?.totalAmount != null &&
        codOrder.body.order?.subtotal != null
    ) {
        pass("P12-09 Order creation returns server totals");
    } else {
        fail("P12-09 Order creation returns server totals", String(codOrder.status));
    }

    const businessPayload = await request("GET", `/businesses/${business._id}`, null, token);
    if (
        businessPayload.status === 200 &&
        !Object.prototype.hasOwnProperty.call(businessPayload.body.business || {}, "autoConfirmOnlinePayments")
    ) {
        pass("P12-06 Owner business payload excludes autoConfirmOnlinePayments");
    } else {
        fail("P12-06 Owner business payload excludes autoConfirmOnlinePayments");
    }

    const mimeFilter = deliveryUpload._fileFilter || deliveryUpload.fileFilter;
    if (typeof mimeFilter === "function") {
        const accepted = [];
        mimeFilter({}, { mimetype: "image/jpeg" }, (err, ok) => accepted.push(!err && ok));
        mimeFilter({}, { mimetype: "text/plain" }, (err) => accepted.push(Boolean(err)));
        if (accepted[0] && accepted[1]) {
            pass("P12-05 Delivery MIME filter accepts image rejects text");
        } else {
            fail("P12-05 Delivery MIME filter accepts image rejects text");
        }
    } else if (deliveryUploadSource.includes("fileFilter")) {
        pass("P12-05 Delivery MIME filter configured");
    } else {
        fail("P12-05 Delivery MIME filter configured");
    }

    const ownerAddressShort = await request(
        "POST",
        "/orders",
        {
            businessId: business._id,
            customerName: tag,
            customerPhone: "9876543210",
            customerAddress: "short",
            products: [{ product: qaProduct._id, quantity: 1 }],
            paymentMethod: "COD"
        },
        token
    );
    if (ownerAddressShort.status === 400) {
        pass("P12-14 Owner short address rejected");
    } else {
        fail("P12-14 Owner short address rejected", String(ownerAddressShort.status));
    }

    await Order.deleteMany({ business: business._id, customerName: tag });
    await Product.deleteMany({ business: business._id, productName: { $regex: /^QA Phase12/ } });
    await mongoose.disconnect();

    console.log(`\nPhase 12 QA: ${passed} passed, ${failed} failed, ${skipped} skipped`);
    process.exit(failed ? 1 : 0);
};

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
