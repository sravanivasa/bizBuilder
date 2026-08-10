const express = require("express");
const router = express.Router();

const validateObjectId = require("../middleware/validateObjectId");
const { publicOrderValidation } = require("../validators/publicValidator");
const {
    getPublicBusiness,
    getPublicProducts,
    createPublicOrder
} = require("../controllers/publicController");

router.get("/businesses/:id", validateObjectId("id"), getPublicBusiness);
router.get(
    "/businesses/:businessId/products",
    validateObjectId("businessId"),
    getPublicProducts
);
router.post(
    "/businesses/:businessId/orders",
    validateObjectId("businessId"),
    ...publicOrderValidation,
    createPublicOrder
);

module.exports = router;
