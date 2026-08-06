const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const validateObjectId = require("../middleware/validateObjectId");

const {
    createProductValidation,
    updateProductValidation,
    bulkCreateProductsValidation
} = require("../validators/productValidator");

const {
    createProduct,
    bulkCreateProducts,
    getProductsByBusiness,
    getProductById,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");

router.post(
    "/:businessId/bulk",
    authMiddleware,
    validateObjectId("businessId"),
    ...bulkCreateProductsValidation,
    bulkCreateProducts
);

router.post(
    "/:businessId",
    authMiddleware,
    validateObjectId("businessId"),
    upload.single("image"),
    ...createProductValidation,
    createProduct
);

router.get(
    "/business/:businessId",
    validateObjectId("businessId"),
    getProductsByBusiness
);

router.get("/:productId", validateObjectId("productId"), getProductById);

router.put(
    "/:productId",
    authMiddleware,
    validateObjectId("productId"),
    upload.single("image"),
    ...updateProductValidation,
    updateProduct
);

router.delete(
    "/:productId",
    authMiddleware,
    validateObjectId("productId"),
    deleteProduct
);

module.exports = router;
