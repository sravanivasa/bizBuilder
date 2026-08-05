const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");
const { createOrderValidation, updateOrderStatusValidation } = require("../validators/orderValidator");

const {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder
} = require("../controllers/orderController");

router.post("/", authMiddleware, ...createOrderValidation, createOrder);
router.get("/", authMiddleware, getMyOrders);
router.get("/:id", authMiddleware, validateObjectId("id"), getOrderById);
router.put(
    "/:id",
    authMiddleware,
    validateObjectId("id"),
    ...updateOrderStatusValidation,
    updateOrderStatus
);
router.delete("/:id", authMiddleware, validateObjectId("id"), deleteOrder);

module.exports = router;
