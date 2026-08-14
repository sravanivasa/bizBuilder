const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");
const {
    createOrderValidation,
    updateOrderStatusValidation,
    updateReturnStatusValidation,
    updateOrderDeliveryValidation,
    bulkUpdateOrderStatusValidation,
    updatePaymentStatusValidation
} = require("../validators/orderValidator");

const {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    bulkUpdateOrderStatus,
    updateReturnStatus,
    deleteOrder,
    updateOrderDelivery,
    getOrderInvoice,
    updatePaymentStatus
} = require("../controllers/orderController");

router.post("/", authMiddleware, ...createOrderValidation, createOrder);
router.post(
    "/bulk-status",
    authMiddleware,
    ...bulkUpdateOrderStatusValidation,
    bulkUpdateOrderStatus
);
router.get("/", authMiddleware, getMyOrders);
router.get("/:id/invoice", authMiddleware, validateObjectId("id"), getOrderInvoice);
router.get("/:id", authMiddleware, validateObjectId("id"), getOrderById);
router.put(
    "/:id",
    authMiddleware,
    validateObjectId("id"),
    ...updateOrderStatusValidation,
    updateOrderStatus
);
router.put(
    "/:id/return",
    authMiddleware,
    validateObjectId("id"),
    ...updateReturnStatusValidation,
    updateReturnStatus
);
router.put(
    "/:id/delivery",
    authMiddleware,
    validateObjectId("id"),
    ...updateOrderDeliveryValidation,
    updateOrderDelivery
);
router.put(
    "/:id/payment",
    authMiddleware,
    validateObjectId("id"),
    ...updatePaymentStatusValidation,
    updatePaymentStatus
);
router.delete("/:id", authMiddleware, validateObjectId("id"), deleteOrder);

module.exports = router;
