const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const {
    createBusinessValidation,
    updateBusinessValidation
} = require("../validators/businessValidator");

const {
    createBusiness,
    getMyBusinesses,
    getBusinessById,
    updateBusiness,
    deleteBusiness
} = require("../controllers/businessController");
const {
    getBusinessSettings,
    updateBusinessSettings
} = require("../controllers/businessSettingsController");
const { updateBusinessSettingsValidation } = require("../validators/businessSettingsValidator");

router.post("/", authMiddleware, ...createBusinessValidation, createBusiness);
router.get("/my-businesses", authMiddleware, getMyBusinesses);
router.get(
    "/:businessId/settings",
    authMiddleware,
    validateObjectId("businessId"),
    getBusinessSettings
);
router.put(
    "/:businessId/settings",
    authMiddleware,
    validateObjectId("businessId"),
    ...updateBusinessSettingsValidation,
    updateBusinessSettings
);
router.get("/:id", authMiddleware, validateObjectId("id"), getBusinessById);
router.put(
    "/:id",
    authMiddleware,
    validateObjectId("id"),
    ...updateBusinessValidation,
    updateBusiness
);
router.delete("/:id", authMiddleware, validateObjectId("id"), deleteBusiness);

module.exports = router;
