
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

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
    updateOrderStatus
);

// Delete Order
router.delete(
    "/:id",
    authMiddleware,
    deleteOrder
);

module.exports = router;