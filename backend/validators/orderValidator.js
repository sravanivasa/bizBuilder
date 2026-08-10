const { body } = require("express-validator");
const { ALL_ORDER_STATUSES } = require("../utils/orderStatus");
const { COURIER_OPTIONS } = require("../utils/courierTracking");

const createOrderValidation = [
    body("businessId")
        .isMongoId()
        .withMessage("Invalid business ID"),

    body("customerName")
        .trim()
        .notEmpty()
        .withMessage("Customer name is required"),

    body("customerPhone")
        .trim()
        .notEmpty()
        .withMessage("Customer phone is required"),

    body("customerAddress")
        .trim()
        .notEmpty()
        .withMessage("Customer address is required"),

    body("products")
        .isArray({ min: 1 })
        .withMessage("At least one product is required"),

    body("products.*.product")
        .isMongoId()
        .withMessage("Each product ID must be valid"),

    body("products.*.quantity")
        .isInt({ min: 1 })
        .withMessage("Each product quantity must be at least 1"),

    body("paymentMethod")
        .optional()
        .isIn(["Cash", "Card", "UPI"])
        .withMessage("Invalid payment method")
];

const updateOrderStatusValidation = [
    body("orderStatus")
        .isIn(ALL_ORDER_STATUSES)
        .withMessage("Invalid order status")
];

const updateOrderDeliveryValidation = [
    body("deliveryType")
        .optional()
        .isIn(["local", "courier", "pickup"])
        .withMessage("Delivery type must be local, courier, or pickup"),

    body("courierName")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Courier name is too long"),

    body("trackingId")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Tracking ID is too long"),

    body("trackingUrl")
        .optional({ checkFalsy: true })
        .trim()
        .isURL()
        .withMessage("Tracking URL must be a valid URL"),

    body("deliveryPersonName")
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Delivery person name is too long"),

    body("deliveryPersonPhone")
        .optional()
        .trim()
        .isLength({ min: 10, max: 15 })
        .withMessage("Delivery person phone must be 10–15 characters"),

    body("markShipped")
        .optional()
        .isBoolean()
        .withMessage("markShipped must be a boolean"),

    body("markOutForDelivery")
        .optional()
        .isBoolean()
        .withMessage("markOutForDelivery must be a boolean"),

    body("markReadyForPickup")
        .optional()
        .isBoolean()
        .withMessage("markReadyForPickup must be a boolean")
];

const updateReturnStatusValidation = [
    body("returnStatus")
        .isIn(["Approved", "Rejected"])
        .withMessage("Return status must be Approved or Rejected")
];

const BULK_ORDER_STATUSES = ["Processing", "Shipped", "Cancelled"];

const bulkUpdateOrderStatusValidation = [
    body("orderIds")
        .isArray({ min: 1 })
        .withMessage("At least one order ID is required"),

    body("orderIds.*")
        .isMongoId()
        .withMessage("Each order ID must be valid"),

    body("orderStatus")
        .isIn(BULK_ORDER_STATUSES)
        .withMessage("Bulk status must be Processing, Shipped, or Cancelled")
];

module.exports = {
    createOrderValidation,
    updateOrderStatusValidation,
    updateReturnStatusValidation,
    updateOrderDeliveryValidation,
    bulkUpdateOrderStatusValidation,
    COURIER_OPTIONS
};
