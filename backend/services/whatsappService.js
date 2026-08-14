const Business = require("../models/Business");
const { buildOrderTrackUrl, buildOrderPayUrl } = require("../utils/orderTrackUrl");

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
        const amount = formatAmount(order.totalAmount);
        const { isOnlinePaymentMethod } = require("../utils/paymentMethods");

        const message = isOnlinePaymentMethod(order.paymentMethod)
            ? `New order #${orderId} - ${amount} - awaiting online payment. Customer will pay via UPI. Confirm in dashboard once received.`
            : `New order #${orderId} from ${order.customerName} - ${amount}. Customer: ${order.customerPhone}. Check BizBuilder dashboard.`;

        await sendWhatsAppMessage(business.phoneNumber, message);
    } catch (error) {
        console.error("[WhatsApp] Failed to notify owner:", error.message);
    }
};

const notifyOwnerPaymentSubmitted = async (order, business) => {
    try {
        const ownerPhone = business?.phoneNumber;

        if (!ownerPhone) {
            console.warn("[WhatsApp] Business has no phone number, skipping payment submitted alert");
            return;
        }

        const orderId = shortOrderId(order);
        const amount = formatAmount(order.totalAmount);
        const message = `New order #${orderId} - ${amount} - Customer initiated UPI payment. Please verify in your UPI app and confirm in dashboard.`;

        await sendWhatsAppMessage(ownerPhone, message);
    } catch (error) {
        console.error("[WhatsApp] Failed to notify owner (payment submitted):", error.message);
    }
};

const notifyOwnerPaymentReceived = async (order, business) => {
    try {
        const ownerPhone = business?.phoneNumber;

        if (!ownerPhone) {
            console.warn("[WhatsApp] Business has no phone number, skipping paid order alert");
            return;
        }

        const orderId = shortOrderId(order);
        const amount = formatAmount(order.totalAmount);
        const paymentRef = order.razorpayPaymentId ? ` Payment ID: ${order.razorpayPaymentId}.` : "";
        const message = `Payment received for order #${orderId} - ${amount}.${paymentRef} Order is confirmed in BizBuilder.`;

        await sendWhatsAppMessage(ownerPhone, message);
    } catch (error) {
        console.error("[WhatsApp] Failed to notify owner (payment received):", error.message);
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

const notifyCustomerPaymentConfirmed = async (order, business) => {
    try {
        const customerPhone = getCustomerWhatsAppNumber(order);

        if (!customerPhone) {
            console.warn("[WhatsApp] Order has no customer phone, skipping payment confirmed alert");
            return;
        }

        const orderId = shortOrderId(order);
        const trackUrl = buildOrderTrackUrl(order, business);
        const trackLine = trackUrl ? ` Track: ${trackUrl}` : "";
        const message = `Payment confirmed! Your order #${orderId} is confirmed.${trackLine}`;

        await sendWhatsAppMessage(customerPhone, message);
    } catch (error) {
        console.error("[WhatsApp] Failed to notify customer (payment confirmed):", error.message);
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

const notifyCustomerOrderPlaced = async (order, business) => {
    try {
        const customerPhone = getCustomerWhatsAppNumber(order);

        if (!customerPhone) {
            console.warn("[WhatsApp] Order has no customer phone, skipping placed alert");
            return;
        }

        const businessName = business?.businessName || "your seller";
        const orderId = shortOrderId(order);
        const trackUrl = buildOrderTrackUrl(order, business);
        const trackLine = trackUrl ? `\n\nTrack your order: ${trackUrl}` : "";
        const message = `Thank you! Your order #${orderId} from ${businessName} has been received. We will confirm it shortly. Total: ${formatAmount(order.totalAmount)}.${trackLine}`;

        await sendWhatsAppMessage(customerPhone, message);
    } catch (error) {
        console.error("[WhatsApp] Failed to notify customer (placed):", error.message);
    }
};

const notifyCustomerPaymentPending = async (order, business) => {
    try {
        const customerPhone = getCustomerWhatsAppNumber(order);

        if (!customerPhone) {
            console.warn("[WhatsApp] Order has no customer phone, skipping payment pending alert");
            return;
        }

        const businessName = business?.businessName || "your seller";
        const orderId = shortOrderId(order);
        const payUrl = buildOrderPayUrl(order, business);
        const payLine = payUrl ? `\n\nComplete payment: ${payUrl}` : "";
        const message = `Your order #${orderId} from ${businessName} is awaiting payment. Please complete payment to confirm your order. Total: ${formatAmount(order.totalAmount)}.${payLine}`;

        await sendWhatsAppMessage(customerPhone, message);
    } catch (error) {
        console.error("[WhatsApp] Failed to notify customer (payment pending):", error.message);
    }
};

const notifyCustomerOrderPreparing = async (order, business) => {
    try {
        const customerPhone = getCustomerWhatsAppNumber(order);

        if (!customerPhone) {
            console.warn("[WhatsApp] Order has no customer phone, skipping preparing alert");
            return;
        }

        const businessName = business?.businessName || "your seller";
        const orderId = shortOrderId(order);
        const message = `Your order #${orderId} from ${businessName} is being prepared. We will update you when it is ready.`;

        await sendWhatsAppMessage(customerPhone, message);
    } catch (error) {
        console.error("[WhatsApp] Failed to notify customer (preparing):", error.message);
    }
};

const notifyCustomerOrderCancelled = async (order, business) => {
    try {
        const customerPhone = getCustomerWhatsAppNumber(order);

        if (!customerPhone) {
            console.warn("[WhatsApp] Order has no customer phone, skipping cancelled alert");
            return;
        }

        const businessName = business?.businessName || "your seller";
        const orderId = shortOrderId(order);
        const message = `Your order #${orderId} from ${businessName} has been cancelled. If you have questions, please contact the shop.`;

        await sendWhatsAppMessage(customerPhone, message);
    } catch (error) {
        console.error("[WhatsApp] Failed to notify customer (cancelled):", error.message);
    }
};

const notifyCustomerReturnApproved = async (order, business) => {
    try {
        const customerPhone = getCustomerWhatsAppNumber(order);

        if (!customerPhone) {
            console.warn("[WhatsApp] Order has no customer phone, skipping return approved alert");
            return;
        }

        const businessName = business?.businessName || "your seller";
        const orderId = shortOrderId(order);
        const message = `Your return request for order #${orderId} from ${businessName} has been accepted. Please ship the item back to the shop.`;

        await sendWhatsAppMessage(customerPhone, message);
    } catch (error) {
        console.error("[WhatsApp] Failed to notify customer (return approved):", error.message);
    }
};

const notifyCustomerOrderProcessing = async (order, business) => {
    try {
        const customerPhone = getCustomerWhatsAppNumber(order);

        if (!customerPhone) {
            return;
        }

        const businessName = business?.businessName || "your seller";
        const orderId = shortOrderId(order);
        const message = `Your order #${orderId} from ${businessName} is being processed. We will update you soon.`;

        await sendWhatsAppMessage(customerPhone, message);
    } catch (error) {
        console.error("[WhatsApp] Failed to notify customer (processing):", error.message);
    }
};

const notifyCustomerOrderShipped = async (order, business) => {
    try {
        const customerPhone = getCustomerWhatsAppNumber(order);

        if (!customerPhone) {
            return;
        }

        const businessName = business?.businessName || "your seller";
        const orderId = shortOrderId(order);
        const message = `Your order #${orderId} from ${businessName} has been shipped!`;

        await sendWhatsAppMessage(customerPhone, message);
    } catch (error) {
        console.error("[WhatsApp] Failed to notify customer (shipped):", error.message);
    }
};

const notifyCustomerCourierTracking = async (order, business) => {
    try {
        if (!order.trackingId && !order.trackingUrl) {
            return;
        }

        const customerPhone = getCustomerWhatsAppNumber(order);

        if (!customerPhone) {
            return;
        }

        const businessName = business?.businessName || "your seller";
        const orderId = shortOrderId(order);
        const carrier = order.courierName ? `${order.courierName} ` : "";
        const trackingLine = order.trackingUrl
            ? `\n\nTrack: ${order.trackingUrl}`
            : order.trackingId
              ? `\n\nTracking ID: ${order.trackingId}`
              : "";

        const message = `Order #${orderId} from ${businessName} — ${carrier}tracking updated.${trackingLine}`;

        await sendWhatsAppMessage(customerPhone, message);
    } catch (error) {
        console.error("[WhatsApp] Failed to notify customer (courier tracking):", error.message);
    }
};

const notifyCustomerOutForDelivery = async (order, business) => {
    try {
        const customerPhone = getCustomerWhatsAppNumber(order);

        if (!customerPhone) {
            return;
        }

        const businessName = business?.businessName || "your seller";
        const orderId = shortOrderId(order);
        const isPickup = order.deliveryType === "pickup";
        const message = isPickup
            ? `Your order #${orderId} from ${businessName} is ready for pickup at the shop.`
            : `Your order #${orderId} from ${businessName} is out for delivery.`;

        await sendWhatsAppMessage(customerPhone, message);
    } catch (error) {
        console.error("[WhatsApp] Failed to notify customer (out for delivery):", error.message);
    }
};

const notifyCustomerDeliveryOtp = async (order, business) => {
    try {
        if (!order.deliveryOtp) {
            return;
        }

        const customerPhone = getCustomerWhatsAppNumber(order);

        if (!customerPhone) {
            return;
        }

        const businessName = business?.businessName || "your seller";
        const orderId = shortOrderId(order);
        const isPickup = order.deliveryType === "pickup";
        const action = isPickup ? "pickup" : "delivery";
        const message = `Your ${action} OTP for order #${orderId} from ${businessName} is: ${order.deliveryOtp}. Share this with the delivery person only when you receive your order.`;

        await sendWhatsAppMessage(customerPhone, message);
    } catch (error) {
        console.error("[WhatsApp] Failed to notify customer (delivery OTP):", error.message);
    }
};

const notifyDeliveryPersonLink = async (order, business, deliveryUrl) => {
    try {
        if (!order.deliveryPersonPhone || !deliveryUrl) {
            return;
        }

        const businessName = business?.businessName || "Shop";
        const orderId = shortOrderId(order);
        const message = `New delivery assignment from ${businessName} — Order #${orderId}.\n\nOpen delivery page: ${deliveryUrl}\n\nCustomer: ${order.customerName}, ${order.customerPhone}\nAddress: ${order.customerAddress}`;

        await sendWhatsAppMessage(order.deliveryPersonPhone, message);
    } catch (error) {
        console.error("[WhatsApp] Failed to notify delivery person:", error.message);
    }
};

module.exports = {
    normalizePhoneNumber,
    isConfigured,
    sendWhatsAppMessage,
    notifyOwnerNewOrder,
    notifyOwnerPaymentSubmitted,
    notifyOwnerPaymentReceived,
    notifyCustomerOrderPlaced,
    notifyCustomerPaymentPending,
    notifyCustomerPaymentConfirmed,
    notifyCustomerOrderConfirmed,
    notifyCustomerOrderPreparing,
    notifyCustomerOrderDelivered,
    notifyCustomerOrderCancelled,
    notifyCustomerReturnApproved,
    notifyCustomerOrderProcessing,
    notifyCustomerOrderShipped,
    notifyCustomerOutForDelivery,
    notifyCustomerDeliveryOtp,
    notifyDeliveryPersonLink,
    notifyCustomerCourierTracking
};
