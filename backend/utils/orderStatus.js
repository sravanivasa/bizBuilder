const LEGACY_ORDER_STATUSES = [
    "Pending",
    "Confirmed",
    "Preparing",
    "Completed",
    "Cancelled",
    "Delivered"
];

const SIMPLIFIED_ORDER_STATUSES = [
    "New",
    "Processing",
    "Shipped",
    "OutForDelivery",
    "Delivered",
    "Cancelled"
];

const ALL_ORDER_STATUSES = [...new Set([...SIMPLIFIED_ORDER_STATUSES, ...LEGACY_ORDER_STATUSES])];

const TERMINAL_ORDER_STATUSES = ["Delivered", "Cancelled", "Completed"];

const LEGACY_TO_SIMPLIFIED = {
    Pending: "New",
    Confirmed: "Processing",
    Preparing: "Processing",
    Completed: "Delivered",
    Delivered: "Delivered",
    Cancelled: "Cancelled",
    New: "New",
    Processing: "Processing",
    Shipped: "Shipped",
    OutForDelivery: "OutForDelivery"
};

const normalizeOrderStatus = (status) => LEGACY_TO_SIMPLIFIED[status] || status;

const isTerminalOrderStatus = (status) => TERMINAL_ORDER_STATUSES.includes(status);

const isActiveOrderStatus = (status) => !isTerminalOrderStatus(status);

module.exports = {
    LEGACY_ORDER_STATUSES,
    SIMPLIFIED_ORDER_STATUSES,
    ALL_ORDER_STATUSES,
    TERMINAL_ORDER_STATUSES,
    normalizeOrderStatus,
    isTerminalOrderStatus,
    isActiveOrderStatus
};
