const Order = require("../models/Orders");
const Product = require("../models/Product");
const Business = require("../models/Business");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const asyncHandler = require("../middleware/asyncHandler");
const pickFields = require("../utils/pickFields");
const { phonesMatch, normalizePhoneForMatch } = require("../utils/phoneMatch");
const { createOrderForBusiness } = require("../utils/processOrderCreation");
const { resolveBusiness } = require("../utils/resolveBusiness");
const { buildOrderTrackUrl, buildOrderPayUrl } = require("../utils/orderTrackUrl");
const {
    findOrderByTrackingToken,
    isPaymentAvailable,
    assertPublicCapability,
    PUBLIC_CAPABILITIES
} = require("../utils/publicOrderCapability");
const { buildInvoiceResponse } = require("../utils/invoiceBuilder");
const { normalizeReturnStatus } = require("../utils/returnStatus");
const {
    isOnlinePaymentMethod,
    buildUpiPayLink,
    buildAppPayLink
} = require("../utils/paymentMethods");
const {
    isRazorpayConfigured,
    createRazorpayOrder,
    verifyPaymentSignature,
    getRazorpayCredentials,
    fetchRazorpayPayment,
    amountToPaise
} = require("../utils/razorpayService");
const { markOrderPaymentPaid } = require("../utils/markPaymentPaid");
const {
    resolveBusinessGstConfig,
    getPublicReturnsSummary
} = require("../utils/businessSettings");
const {
    canRequestReturn,
    getReturnPolicyForOrder,
    isReturnWindowOpen
} = require("../utils/returnPolicy");
const {
    isConfigured: isWhatsAppConfigured,
    notifyCustomerOrderConfirmed,
    notifyCustomerOrderPreparing,
    notifyCustomerOrderDelivered,
    notifyCustomerOrderCancelled,
    notifyCustomerReturnApproved,
    notifyOwnerPaymentSubmitted
} = require("../services/whatsappService");

const PUBLIC_BUSINESS_FIELDS = [
    "businessName",
    "category",
    "phoneNumber",
    "address",
    "slug",
    "gstEnabled",
    "gstRate"
];

const shortOrderId = (orderId) => String(orderId).slice(-6).toUpperCase();

const findOrderByIdOrShort = async (businessId, orderId) => {
    if (mongoose.Types.ObjectId.isValid(orderId) && String(orderId).length === 24) {
        return Order.findOne({ _id: orderId, business: businessId });
    }

    const normalizedShortId = String(orderId).trim().toUpperCase();
    const orders = await Order.find({ business: businessId }).select("_id");

    const match = orders.find(
        (order) => shortOrderId(order._id) === normalizedShortId
    );

    if (!match) {
        return null;
    }

    return Order.findById(match._id);
};

/**
 * Global phone+short-order-id lookup across all businesses.
 * Stage 1 note: medium-risk cross-tenant enumeration surface — preserved for
 * backward-compatible customer tracking; deprecate in a future deliberate ADR.
 */
const findOrderByIdOrShortGlobal = async (orderId, phone) => {
    const normalizedShortId = String(orderId).trim().toUpperCase();

    if (mongoose.Types.ObjectId.isValid(orderId) && String(orderId).length === 24) {
        const order = await Order.findById(orderId);
        if (order && phonesMatch(order.customerPhone, phone)) {
            return order;
        }
        return null;
    }

    if (!normalizePhoneForMatch(phone)) {
        return null;
    }

    const candidates = await Order.find({
        $expr: {
            $eq: [
                {
                    $toUpper: {
                        $substr: [
                            { $toString: "$_id" },
                            { $subtract: [{ $strLenCP: { $toString: "$_id" } }, 6] },
                            6
                        ]
                    }
                },
                normalizedShortId
            ]
        }
    });

    const match = candidates.find((order) => phonesMatch(order.customerPhone, phone));

    return match || null;
};

const buildTrackedOrderResponse = async (order, { includeTrackingToken = false } = {}) => {
    const business = await Business.findById(order.business).select(PUBLIC_BUSINESS_FIELDS.join(" "));

    const productIds = order.products.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } }).select("productName");

    const productMap = new Map(products.map((product) => [String(product._id), product.productName]));

    const items = order.products.map((item) => ({
        productName: item.productName || productMap.get(String(item.product)) || "Product",
        quantity: item.quantity,
        price: item.price,
        lineTotal: item.price * item.quantity
    }));

    const response = {
        orderId: order._id,
        shortOrderId: shortOrderId(order._id),
        businessId: String(order.business),
        orderStatus: order.orderStatus,
        returnStatus: normalizeReturnStatus(order.returnStatus),
        returnReason: order.returnReason || null,
        returnPhotos: order.returnPhotos || [],
        returnVideo: order.returnVideo || null,
        subtotal: order.subtotal != null ? order.subtotal : order.totalAmount,
        gstAmount: order.gstAmount || 0,
        gstRate: order.gstRate || 0,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        paymentSubmittedAt: order.paymentSubmittedAt || null,
        customerName: order.customerName,
        items,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        returnRequestedAt: order.returnRequestedAt || null,
        returnResolvedAt: order.returnResolvedAt || null,
        returnTrackingId: order.returnTrackingId || null,
        returnCourier: order.returnCourier || null,
        returnShippedAt: order.returnShippedAt || null,
        returnDeliveredAt: order.returnDeliveredAt || null,
        deliveryType: order.deliveryType || null,
        courierName: order.courierName || null,
        trackingId: order.trackingId || null,
        trackingUrl: order.trackingUrl || null,
        deliveryPhoto: order.deliveryPhoto || null,
        deliveryTimeline: order.deliveryTimeline || [],
        returnPolicy: getReturnPolicyForOrder(order),
        canRequestReturn: canRequestReturn(order),
        business: business
            ? pickFields(business.toObject(), PUBLIC_BUSINESS_FIELDS)
            : { businessName: "Shop" }
    };

    if (includeTrackingToken) {
        response.trackingToken = order.trackingToken || null;
    }

    return response;
};

const buildPublicOrderConfirmation = (order) => ({
    _id: order._id,
    shortOrderId: shortOrderId(order._id),
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    subtotal: order.subtotal != null ? order.subtotal : order.totalAmount,
    gstAmount: order.gstAmount || 0,
    gstRate: order.gstRate || 0,
    totalAmount: order.totalAmount,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt
});

const getPublicBusiness = asyncHandler(async (req, res) => {
    const business = await resolveBusiness(req.params.idOrSlug);

    if (!business) {
        return res.status(404).json({
            success: false,
            message: "Business not found"
        });
    }

    const gstConfig = await resolveBusinessGstConfig(business._id);
    const returns = await getPublicReturnsSummary(business._id);

    res.status(200).json({
        success: true,
        message: "Business fetched successfully",
        business: {
            _id: business._id,
            ...pickFields(business.toObject(), PUBLIC_BUSINESS_FIELDS),
            gstEnabled: gstConfig.gstEnabled,
            gstRate: gstConfig.gstRate,
            returns
        }
    });
});

const getPublicProducts = asyncHandler(async (req, res) => {
    const business = await resolveBusiness(req.params.idOrSlug);

    if (!business) {
        return res.status(404).json({
            success: false,
            message: "Business not found"
        });
    }

    const products = await Product.find({ business: business._id, stock: { $gt: 0 } })
        .select("productName description price stock image")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "Products fetched successfully",
        products
    });
});

const createPublicOrder = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const business = await resolveBusiness(req.params.idOrSlug);

    if (!business) {
        return res.status(404).json({
            success: false,
            message: "Business not found"
        });
    }

    const businessId = String(business._id);
    const {
        customerName,
        customerPhone,
        customerAddress,
        products,
        paymentMethod = "Cash"
    } = req.body;

    try {
        const order = await createOrderForBusiness({
            businessId,
            customerName,
            customerPhone,
            customerAddress,
            products,
            paymentMethod,
            isWhatsAppSameAsPhone: true
        });

        const trackingUrl = buildOrderTrackUrl(order, business);
        const payUrl = isOnlinePaymentMethod(order.paymentMethod)
            ? buildOrderPayUrl(order, business)
            : null;

        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order: buildPublicOrderConfirmation(order),
            trackingUrl,
            payUrl,
            whatsappEnabled: isWhatsAppConfigured()
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const message = error.statusCode ? error.message : "Could not place order";

        return res.status(statusCode).json({
            success: false,
            message
        });
    }
});

const trackPublicOrderByToken = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const lookup = await findOrderByTrackingToken(Order, token);

    if (lookup.error) {
        return res.status(lookup.error.status).json({
            success: false,
            message: lookup.error.message
        });
    }

    const trackedOrder = await buildTrackedOrderResponse(lookup.order);

    res.status(200).json({
        success: true,
        message: "Order tracked successfully",
        order: trackedOrder
    });
});

const trackPublicOrderGlobal = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const { orderId, phone } = req.query;

    const order = await findOrderByIdOrShortGlobal(orderId, phone);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    const trackedOrder = await buildTrackedOrderResponse(order, { includeTrackingToken: true });

    res.status(200).json({
        success: true,
        message: "Order tracked successfully",
        order: trackedOrder
    });
});

const trackPublicOrder = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const { orderId, phone } = req.query;

    const business = await resolveBusiness(req.params.idOrSlug);

    if (!business) {
        return res.status(404).json({
            success: false,
            message: "Business not found"
        });
    }

    const businessId = String(business._id);
    const order = await findOrderByIdOrShort(businessId, orderId);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    if (!phonesMatch(order.customerPhone, phone)) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    const trackedOrder = await buildTrackedOrderResponse(order, { includeTrackingToken: true });

    res.status(200).json({
        success: true,
        message: "Order tracked successfully",
        order: trackedOrder
    });
});

const requestPublicReturn = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const { orderId } = req.params;
    const { phone, reason } = req.body;

    const business = await resolveBusiness(req.params.idOrSlug);

    if (!business) {
        return res.status(404).json({
            success: false,
            message: "Business not found"
        });
    }

    const businessId = String(business._id);
    const order = await findOrderByIdOrShort(businessId, orderId);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    if (!phonesMatch(order.customerPhone, phone)) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    if (!canRequestReturn(order)) {
        const policy = getReturnPolicyForOrder(order);

        if (!policy.enabled) {
            return res.status(400).json({
                success: false,
                message: "Returns are not available for this order"
            });
        }

        if (!isReturnWindowOpen(order, policy)) {
            return res.status(400).json({
                success: false,
                message: `Return window has closed (${policy.windowDays} days)`
            });
        }

        return res.status(400).json({
            success: false,
            message: "Returns are only available for delivered or completed orders"
        });
    }

    if (order.returnStatus && order.returnStatus !== "None") {
        return res.status(400).json({
            success: false,
            message: "A return request already exists for this order"
        });
    }

    const photoFiles = req.files?.photos || [];
    const videoFile = req.files?.video?.[0];

    if (photoFiles.length > 5) {
        return res.status(400).json({
            success: false,
            message: "You can upload at most 5 photos"
        });
    }

    order.returnStatus = "Requested";
    order.returnReason = reason?.trim() || "";
    order.returnPhotos = photoFiles.map((file) => file.path).filter(Boolean);
    order.returnVideo = videoFile?.path || null;
    order.returnRequestedAt = new Date();
    await order.save();

    const trackedOrder = await buildTrackedOrderResponse(order);

    res.status(200).json({
        success: true,
        message: "Return request submitted successfully",
        order: trackedOrder
    });
});

const getPublicInvoiceByToken = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const lookup = await findOrderByTrackingToken(Order, token);

    if (lookup.error) {
        return res.status(lookup.error.status).json({
            success: false,
            message: lookup.error.message
        });
    }

    const order = lookup.order;
    const invoiceError = assertPublicCapability(order, PUBLIC_CAPABILITIES.INVOICE);

    if (invoiceError) {
        return res.status(invoiceError.status).json({
            success: false,
            message: invoiceError.message
        });
    }

    const invoice = await buildInvoiceResponse(order);

    res.status(200).json({
        success: true,
        message: "Invoice fetched successfully",
        invoice
    });
});

const PAYMENT_BUSINESS_FIELDS = [
    "_id",
    "businessName",
    "slug",
    "phoneNumber",
    "upiId",
    "bankAccountName",
    "bankName",
    "bankAccountNumber",
    "bankIfsc"
];

const PAYMENT_PAGE_BUSINESS_BASE_FIELDS = ["_id", "businessName", "slug"];

const PAYMENT_PAGE_NETBANKING_FIELDS = [
    "bankAccountName",
    "bankName",
    "bankAccountNumber",
    "bankIfsc"
];

const UPI_PAYMENT_METHODS = ["GPay", "PhonePe", "UPI"];

const buildPaymentPageBusiness = (business, order, { razorpayConfigured }) => {
    if (!business) {
        return { businessName: "Shop" };
    }

    const plain = business.toObject();
    const response = pickFields(plain, PAYMENT_PAGE_BUSINESS_BASE_FIELDS);
    const isManualFallback = !razorpayConfigured;
    const isNetBanking = order.paymentMethod === "NetBanking";
    const isUpiMethod = UPI_PAYMENT_METHODS.includes(order.paymentMethod);

    if (isManualFallback && isNetBanking) {
        Object.assign(response, pickFields(plain, PAYMENT_PAGE_NETBANKING_FIELDS));
    }

    if (isManualFallback && isUpiMethod && plain.upiId) {
        response.upiId = plain.upiId;
    }

    return response;
};

const getPaymentPage = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const lookup = await findOrderByTrackingToken(Order, token);

    if (lookup.error) {
        return res.status(lookup.error.status).json({
            success: false,
            message: lookup.error.message
        });
    }

    const order = lookup.order;
    const payCapabilityError = assertPublicCapability(order, PUBLIC_CAPABILITIES.PAY);

    if (payCapabilityError) {
        return res.status(payCapabilityError.status).json({
            success: false,
            message: payCapabilityError.message
        });
    }

    const paymentAvailable = isPaymentAvailable(order);

    const business = await Business.findById(order.business)
        .select(`${PAYMENT_BUSINESS_FIELDS.join(" ")} razorpayEnabled razorpayKeyId`)
        .select("+razorpayKeySecret");

    const razorpayConfigured = isRazorpayConfigured(business);
    const razorpayCredentials = getRazorpayCredentials(business);
    const isNetBanking = order.paymentMethod === "NetBanking";
    const isUpiMethod = UPI_PAYMENT_METHODS.includes(order.paymentMethod);
    const shouldExposeUpiArtifacts =
        paymentAvailable &&
        Boolean(business?.upiId && order.totalAmount) &&
        !isNetBanking &&
        (isUpiMethod || razorpayConfigured);

    const upiLink = shouldExposeUpiArtifacts
        ? buildUpiPayLink({
              upiId: business.upiId,
              businessName: business.businessName,
              amount: order.totalAmount
          })
        : null;

    res.status(200).json({
        success: true,
        message: "Payment page loaded",
        payment: {
            orderId: order._id,
            shortOrderId: shortOrderId(order._id),
            orderStatus: order.orderStatus,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            paymentAvailable,
            paymentSubmittedAt: order.paymentSubmittedAt || null,
            totalAmount: order.totalAmount,
            subtotal: order.subtotal != null ? order.subtotal : order.totalAmount,
            gstAmount: order.gstAmount || 0,
            gstRate: order.gstRate || 0,
            customerName: order.customerName,
            razorpayConfigured: paymentAvailable && razorpayConfigured,
            razorpayKeyId: paymentAvailable && razorpayCredentials?.keyId ? razorpayCredentials.keyId : null,
            upiLink,
            business: buildPaymentPageBusiness(business, order, { razorpayConfigured }),
            appPayLink: upiLink ? buildAppPayLink(order.paymentMethod, upiLink) : null,
            qrCodeUrl: upiLink
                ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`
                : null
        }
    });
});

const confirmPayment = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const lookup = await findOrderByTrackingToken(Order, token);

    if (lookup.error) {
        return res.status(lookup.error.status).json({
            success: false,
            message: lookup.error.message
        });
    }

    const order = lookup.order;
    const mutateError = assertPublicCapability(order, PUBLIC_CAPABILITIES.PAY_MUTATE);

    if (mutateError) {
        return res.status(mutateError.status).json({
            success: false,
            message: mutateError.message
        });
    }

    if (order.paymentStatus === "Paid" || order.paymentStatus === "PaymentSubmitted") {
        return res.status(200).json({
            success: true,
            message: "Payment already submitted",
            paymentStatus: order.paymentStatus,
            paymentSubmittedAt: order.paymentSubmittedAt || null
        });
    }

    const business = await Business.findById(order.business).select(
        PAYMENT_BUSINESS_FIELDS.join(" ")
    );

    const now = new Date();
    order.paymentSubmittedAt = now;
    order.paymentStatus = "PaymentSubmitted";
    await order.save();

    notifyOwnerPaymentSubmitted(order, business);

    res.status(200).json({
        success: true,
        message: "Payment submitted successfully",
        paymentStatus: order.paymentStatus,
        paymentSubmittedAt: order.paymentSubmittedAt
    });
});

const createRazorpayOrderForPayment = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const lookup = await findOrderByTrackingToken(Order, token);

    if (lookup.error) {
        return res.status(lookup.error.status).json({
            success: false,
            message: lookup.error.message
        });
    }

    const order = lookup.order;
    const mutateError = assertPublicCapability(order, PUBLIC_CAPABILITIES.PAY_MUTATE);

    if (mutateError) {
        return res.status(mutateError.status).json({
            success: false,
            message: mutateError.message
        });
    }

    if (order.paymentStatus === "Paid") {
        return res.status(400).json({
            success: false,
            message: "This order is already paid"
        });
    }

    if (order.paymentStatus !== "AwaitingPayment") {
        return res.status(400).json({
            success: false,
            message: "This order is not awaiting payment"
        });
    }

    const business = await Business.findById(order.business)
        .select("businessName razorpayEnabled razorpayKeyId")
        .select("+razorpayKeySecret");

    if (!isRazorpayConfigured(business)) {
        return res.status(400).json({
            success: false,
            message: "Razorpay is not configured for this shop"
        });
    }

    try {
        const { credentials, razorpayOrder } = await createRazorpayOrder({
            business,
            amount: order.totalAmount,
            receipt: shortOrderId(order._id)
        });

        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        res.status(200).json({
            success: true,
            message: "Razorpay order created",
            keyId: credentials.keyId,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            orderId: order._id,
            businessName: business.businessName
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({
            success: false,
            message: error.statusCode ? error.message : "Could not create Razorpay order"
        });
    }
});

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const { token } = req.params;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const lookup = await findOrderByTrackingToken(Order, token);

    if (lookup.error) {
        return res.status(lookup.error.status).json({
            success: false,
            message: lookup.error.message
        });
    }

    const order = lookup.order;
    const mutateError = assertPublicCapability(order, PUBLIC_CAPABILITIES.PAY_MUTATE);

    if (mutateError) {
        return res.status(mutateError.status).json({
            success: false,
            message: mutateError.message
        });
    }

    if (order.paymentStatus === "Paid") {
        return res.status(200).json({
            success: true,
            message: "Payment already confirmed",
            payment: {
                orderId: order._id,
                shortOrderId: shortOrderId(order._id),
                paymentStatus: order.paymentStatus,
                razorpayPaymentId: order.razorpayPaymentId || null,
                paidAt: order.paidAt || null
            }
        });
    }

    const business = await Business.findById(order.business)
        .select("businessName razorpayEnabled razorpayKeyId")
        .select("+razorpayKeySecret");

    const credentials = getRazorpayCredentials(business);

    if (!credentials) {
        return res.status(400).json({
            success: false,
            message: "Razorpay is not configured for this shop"
        });
    }

    if (!order.razorpayOrderId) {
        return res.status(400).json({
            success: false,
            message: "Payment session not found for this order. Please start payment again."
        });
    }

    if (order.razorpayOrderId !== razorpay_order_id) {
        return res.status(400).json({
            success: false,
            message: "Payment order mismatch"
        });
    }

    const isValid = verifyPaymentSignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        keySecret: credentials.keySecret
    });

    if (!isValid) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment signature"
        });
    }

    let razorpayPayment;

    try {
        razorpayPayment = await fetchRazorpayPayment(credentials, razorpay_payment_id);
    } catch {
        return res.status(400).json({
            success: false,
            message: "Could not verify payment amount"
        });
    }

    if (razorpayPayment.order_id !== razorpay_order_id) {
        return res.status(400).json({
            success: false,
            message: "Payment does not belong to this order"
        });
    }

    if (razorpayPayment.status !== "captured") {
        return res.status(400).json({
            success: false,
            message: "Payment has not been captured yet"
        });
    }

    if (amountToPaise(order.totalAmount) !== Number(razorpayPayment.amount)) {
        return res.status(400).json({
            success: false,
            message: "Payment amount mismatch"
        });
    }

    const paymentResult = await markOrderPaymentPaid(order, business, {
        razorpayPaymentId: razorpay_payment_id,
        note: "Payment confirmed via Razorpay"
    });

    if (paymentResult.cancelled) {
        return res.status(400).json({
            success: false,
            message: "This order has been cancelled"
        });
    }

    const paidOrder = paymentResult.order;

    res.status(200).json({
        success: true,
        message: "Payment confirmed",
        payment: {
            orderId: paidOrder._id,
            shortOrderId: shortOrderId(paidOrder._id),
            paymentStatus: paidOrder.paymentStatus,
            orderStatus: paidOrder.orderStatus,
            razorpayPaymentId: paidOrder.razorpayPaymentId,
            paidAt: paidOrder.paidAt
        }
    });
});

module.exports = {
    getPublicBusiness,
    getPublicProducts,
    createPublicOrder,
    trackPublicOrderByToken,
    trackPublicOrderGlobal,
    trackPublicOrder,
    requestPublicReturn,
    getPublicInvoiceByToken,
    getPaymentPage,
    confirmPayment,
    createRazorpayOrderForPayment,
    verifyRazorpayPayment
};
