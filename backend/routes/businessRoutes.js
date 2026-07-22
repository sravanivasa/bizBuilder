const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

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

// Create Business
router.post(
    "/",
    authMiddleware,
    ...createBusinessValidation,
    createBusiness
);

// Get Logged-in User Businesses
router.get(
    "/my-businesses",
    authMiddleware,
    getMyBusinesses
);

// Get Business By ID
router.get(
    "/:id",
    getBusinessById
);

// Update Business
router.put(
    "/:id",
    authMiddleware,
    ...updateBusinessValidation,
    updateBusiness
);

// Delete Business
router.delete(
    "/:id",
    authMiddleware,
    deleteBusiness
);

module.exports = router;