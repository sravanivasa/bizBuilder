const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {createOrderValidation, updateOrderStatusValidation} = require("../validators/orderValidator");

const {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder
} = require("../controllers/orderController");

// Create Order
router.post(
    "/",
    authMiddleware,
    createOrderValidation,
    createOrder
);

// Get All Orders of Logged-in Business Owner
router.get(
    "/",
    authMiddleware,
    getMyOrders
);

// Get Order By ID
router.get(
    "/:id",
    authMiddleware,
    getOrderById
);

// Update Order Status
router.put(
    "/:id",
    authMiddleware,
    updateOrderStatusValidation,
    updateOrderStatus
);

// Delete Order
router.delete(
    "/:id",
    authMiddleware,
    deleteOrder
);

module.exports = router;
