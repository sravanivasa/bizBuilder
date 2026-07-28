const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
    createProductValidation,
    updateProductValidation
} = require("../validators/productValidator");

const {
    createProduct,
    getProductsByBusiness,
    getProductById,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");

// Create Product
router.post(
    "/:businessId",
    authMiddleware,
    upload.single("image"),
    ...createProductValidation,
    createProduct
);

// Get Products of Business
router.get(
    "/business/:businessId",
    getProductsByBusiness
);

// Get Product By ID
router.get(
    "/:productId",
    getProductById
);

// Update Product
router.put(
    "/:productId",
    authMiddleware,
    upload.single("image"),
    ...updateProductValidation,
    updateProduct
);

// Delete Product
router.delete(
    "/:productId",
    authMiddleware,
    deleteProduct
);

module.exports = router;