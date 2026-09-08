const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");
const {
    createCustomerValidation,
    updateCustomerValidation,
    listCustomersValidation,
    listCustomerOrdersValidation
} = require("../validators/customerValidator");
const {
    createCustomer,
    listCustomers,
    getCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerOrders
} = require("../controllers/customerController");

router.post("/", authMiddleware, ...createCustomerValidation, createCustomer);
router.get("/", authMiddleware, ...listCustomersValidation, listCustomers);
router.get(
    "/:id/orders",
    authMiddleware,
    validateObjectId("id"),
    ...listCustomerOrdersValidation,
    getCustomerOrders
);
router.get("/:id", authMiddleware, validateObjectId("id"), getCustomer);
router.put(
    "/:id",
    authMiddleware,
    validateObjectId("id"),
    ...updateCustomerValidation,
    updateCustomer
);
router.delete("/:id", authMiddleware, validateObjectId("id"), deleteCustomer);

module.exports = router;
