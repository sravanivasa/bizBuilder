/**
 * Razorpay payment flow (dual-path confirmation):
 *
 * 1. Checkout creates a BizBuilder order (paymentStatus: AwaitingPayment).
 * 2. Customer clicks Pay → backend creates a Razorpay order (amount from MongoDB).
 * 3. Primary path: browser handler → POST /api/public/orders/pay/:token/verify
 * 4. Reliability path: Razorpay webhook payment.captured → POST /api/webhooks/razorpay
 * 5. Both paths call markOrderPaymentPaid (idempotent).
 */
const Razorpay = require("razorpay");
const crypto = require("crypto");

const getRazorpayCredentials = (business) => {
    if (business?.razorpayEnabled && business?.razorpayKeyId && business?.razorpayKeySecret) {
        return {
            keyId: business.razorpayKeyId,
            keySecret: business.razorpayKeySecret,
            source: "business"
        };
    }

    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        return {
            keyId: process.env.RAZORPAY_KEY_ID,
            keySecret: process.env.RAZORPAY_KEY_SECRET,
            source: "platform"
        };
    }

    return null;
};

const isRazorpayConfigured = (business) =>
    Boolean(business?.razorpayEnabled && getRazorpayCredentials(business));

const createRazorpayClient = (credentials) =>
    new Razorpay({
        key_id: credentials.keyId,
        key_secret: credentials.keySecret
    });

const amountToPaise = (amount) => Math.round(Number(amount) * 100);

const createRazorpayOrder = async ({ business, amount, receipt }) => {
    const credentials = getRazorpayCredentials(business);

    if (!credentials) {
        const error = new Error("Razorpay is not configured for this shop");
        error.statusCode = 400;
        throw error;
    }

    const razorpay = createRazorpayClient(credentials);
    const razorpayOrder = await razorpay.orders.create({
        amount: amountToPaise(amount),
        currency: "INR",
        receipt: String(receipt).slice(0, 40)
    });

    return {
        credentials,
        razorpayOrder
    };
};

const verifyPaymentSignature = ({ orderId, paymentId, signature, keySecret }) => {
    const payload = `${orderId}|${paymentId}`;
    const expected = crypto.createHmac("sha256", keySecret).update(payload).digest("hex");
    return expected === signature;
};

const verifyWebhookSignature = (body, signature, secret) => {
    if (!secret || !signature) {
        return false;
    }

    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    return expected === signature;
};

module.exports = {
    getRazorpayCredentials,
    isRazorpayConfigured,
    createRazorpayOrder,
    verifyPaymentSignature,
    verifyWebhookSignature,
    amountToPaise
};
