const express = require("express");
const router = express.Router();

const publicCapabilityLimiter = require("../middleware/publicCapabilityLimiter");

const { publicOrderValidation, trackOrderValidation, returnRequestValidation, verifyRazorpayPaymentValidation } = require("../validators/publicValidator");
const { verifyDeliveryOtpValidation } = require("../validators/deliveryValidator");
const deliveryUpload = require("../middleware/deliveryUpload");
const returnUpload = require("../middleware/returnUpload");
const {
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
} = require("../controllers/publicController");
const {
    getDeliveryOrder,
    uploadDeliveryPhoto,
    verifyDeliveryOtp
} = require("../controllers/deliveryController");

router.get("/orders/track/:token", publicCapabilityLimiter, trackPublicOrderByToken);
router.get("/orders/invoice/:token", publicCapabilityLimiter, getPublicInvoiceByToken);
router.get("/orders/pay/:token", publicCapabilityLimiter, getPaymentPage);
router.post("/orders/pay/:token/confirm", publicCapabilityLimiter, confirmPayment);
router.post("/orders/pay/:token/razorpay-order", publicCapabilityLimiter, createRazorpayOrderForPayment);
router.post("/orders/pay/:token/verify", publicCapabilityLimiter, ...verifyRazorpayPaymentValidation, verifyRazorpayPayment);
router.get("/orders/track", publicCapabilityLimiter, ...trackOrderValidation, trackPublicOrderGlobal);

router.get("/deliver/:deliveryToken", getDeliveryOrder);
router.post(
    "/deliver/:deliveryToken/photo",
    deliveryUpload.single("photo"),
    uploadDeliveryPhoto
);
router.post(
    "/deliver/:deliveryToken/verify-otp",
    ...verifyDeliveryOtpValidation,
    verifyDeliveryOtp
);

router.get("/businesses/:idOrSlug", getPublicBusiness);
router.get("/businesses/:idOrSlug/products", getPublicProducts);
router.post("/businesses/:idOrSlug/orders", ...publicOrderValidation, createPublicOrder);
router.get("/businesses/:idOrSlug/orders/track", publicCapabilityLimiter, ...trackOrderValidation, trackPublicOrder);
router.post(
    "/businesses/:idOrSlug/orders/:orderId/return-request",
    returnUpload.fields([
        { name: "photos", maxCount: 5 },
        { name: "video", maxCount: 1 }
    ]),
    ...returnRequestValidation,
    requestPublicReturn
);

module.exports = router;
