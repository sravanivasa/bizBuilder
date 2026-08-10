const Business = require("../models/Business");

const DEFAULT_API_VERSION = "v21.0";

/**
 * Normalize Indian mobile numbers to E.164 digits (no +) for WhatsApp Cloud API.
 * Examples: "9876543210" -> "919876543210", "+91 98765 43210" -> "919876543210"
 */
const normalizePhoneNumber = (phone) => {
    if (!phone || typeof phone !== "string") {
        return null;
    }

    let digits = phone.replace(/\D/g, "");

    if (!digits) {
        return null;
    }

    if (digits.length === 10 && /^[6-9]/.test(digits)) {
        digits = `91${digits}`;
    } else if (digits.length === 12 && digits.startsWith("91")) {
        // already normalized
    } else if (digits.length === 11 && digits.startsWith("0")) {
        digits = `91${digits.slice(1)}`;
    }

    if (digits.length !== 12 || !digits.startsWith("91")) {
        return null;
    }

    return digits;
};

const isConfigured = () =>
    Boolean(process.env.WHATSAPP_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

const getApiUrl = () => {
    const base =
        process.env.WHATSAPP_API_URL ||
        `https://graph.facebook.com/${DEFAULT_API_VERSION}`;
  return `${base.replace(/\/$/, "")}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
};

const shortOrderId = (order) =>
    order._id ? String(order._id).slice(-6).toUpperCase() : "UNKNOWN";

const formatAmount = (amount) => `₹${Number(amount).toLocaleString("en-IN")}`;

const getCustomerWhatsAppNumber = (order) =>
    order.customerWhatsApp || order.customerPhone;

const sendWhatsAppMessage = async (toPhone, body) => {
    const to = normalizePhoneNumber(toPhone);

    if (!to) {
        console.warn(`[WhatsApp] Invalid phone number, skipping: ${toPhone}`);
        return { skipped: true, reason: "invalid_phone" };
    }

    if (!isConfigured()) {
        console.log(`[WhatsApp] Skipped (no API credentials) -> ${to}: ${body}`);
        return { skipped: true, reason: "not_configured" };
    }

    const response = await fetch(getApiUrl(), {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body }
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`WhatsApp API ${response.status}: ${errorBody}`);
    }

    return response.json();
};

const notifyOwnerNewOrder = async (order, businessId) => {
    try {
        const business = await Business.findById(businessId).select(
            "businessName phoneNumber"
        );

        if (!business?.phoneNumber) {
            console.warn("[WhatsApp] Business has no phone number, skipping owner alert");
            return;
        }

        const orderId = shortOrderId(order);
        const message = `New order #${orderId} from ${order.customerName} - ${formatAmount(order.totalAmount)}. Customer: ${order.customerPhone}. Check BizBuilder dashboard.`;

        await sendWhatsAppMessage(business.phoneNumber, message);
    } catch (error) {
        console.error("[WhatsApp] Failed to notify owner:", error.message);
    }
};

const notifyCustomerOrderConfirmed = async (order, business) => {
    try {
        const customerPhone = getCustomerWhatsAppNumber(order);

        if (!customerPhone) {
            console.warn("[WhatsApp] Order has no customer phone, skipping confirmed alert");
            return;
        }

        const businessName = business?.businessName || "your seller";
        const orderId = shortOrderId(order);
        const message = `Your order #${orderId} from ${businessName} is confirmed! We will prepare it soon.`;

        await sendWhatsAppMessage(customerPhone, message);
    } catch (error) {
        console.error("[WhatsApp] Failed to notify customer (confirmed):", error.message);
    }
};

const notifyCustomerOrderDelivered = async (order, business) => {
    try {
        const customerPhone = getCustomerWhatsAppNumber(order);

        if (!customerPhone) {
            console.warn("[WhatsApp] Order has no customer phone, skipping delivered alert");
            return;
        }

        const businessName = business?.businessName || "your seller";
        const orderId = shortOrderId(order);
        const message = `Your order #${orderId} from ${businessName} has been delivered. Thank you!`;

        await sendWhatsAppMessage(customerPhone, message);
    } catch (error) {
        console.error("[WhatsApp] Failed to notify customer (delivered):", error.message);
    }
};

module.exports = {
    normalizePhoneNumber,
    isConfigured,
    sendWhatsAppMessage,
    notifyOwnerNewOrder,
    notifyCustomerOrderConfirmed,
    notifyCustomerOrderDelivered
};
