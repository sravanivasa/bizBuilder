const express = require("express");
const router = express.Router();

const { publicOrderValidation, trackOrderValidation, returnRequestValidation } = require("../validators/publicValidator");
const { verifyDeliveryOtpValidation } = require("../validators/deliveryValidator");
const deliveryUpload = require("../middleware/deliveryUpload");
const {
    getPublicBusiness,
    getPublicProducts,
    createPublicOrder,
    trackPublicOrderByToken,
    trackPublicOrderGlobal,
    trackPublicOrder,
    requestPublicReturn
} = require("../controllers/publicController");
const {
    getDeliveryOrder,
    uploadDeliveryPhoto,
    verifyDeliveryOtp
} = require("../controllers/deliveryController");

router.get("/orders/track/:token", trackPublicOrderByToken);
router.get("/orders/track", ...trackOrderValidation, trackPublicOrderGlobal);

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
router.get("/businesses/:idOrSlug/orders/track", ...trackOrderValidation, trackPublicOrder);
router.post(
    "/businesses/:idOrSlug/orders/:orderId/return-request",
    ...returnRequestValidation,
    requestPublicReturn
);

module.exports = router;
