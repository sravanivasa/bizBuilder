/**
 * Phase 5 lifecycle QA — run: node backend/scripts/phase5-qa.js
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

let passed = 0;
let failed = 0;

const pass = (name, detail = "") => {
    passed++;
    console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
};

const fail = (name, detail = "") => {
    failed++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
};

const { getOrderStatusTransitionError } = require("../utils/orderLifecycle");
const { isInvoiceAvailable } = require("../utils/paymentMethods");

const order = (overrides = {}) => ({
    orderStatus: "New",
    paymentMethod: "UPI",
    paymentStatus: "AwaitingPayment",
    ...overrides
});

// --- H1 Paid cancellation ---
(() => {
    const err = getOrderStatusTransitionError(
        order({ paymentStatus: "Paid", orderStatus: "Processing" }),
        "Cancelled"
    );
    if (err === "Paid orders cannot be cancelled. Use the refund process first.") {
        pass("H1 Paid → Cancelled blocked");
    } else {
        fail("H1 Paid → Cancelled blocked", err);
    }
})();

// --- PaymentSubmitted cancellation preserved ---
(() => {
    const err = getOrderStatusTransitionError(
        order({ paymentStatus: "PaymentSubmitted", orderStatus: "Processing" }),
        "Cancelled"
    );
    if (err === null) {
        pass("PaymentSubmitted → Cancelled allowed");
    } else {
        fail("PaymentSubmitted → Cancelled allowed", err);
    }
})();

// --- H2 online unpaid delivery ---
(() => {
    const awaiting = getOrderStatusTransitionError(
        order({ paymentStatus: "AwaitingPayment", orderStatus: "OutForDelivery" }),
        "Delivered"
    );
    const submitted = getOrderStatusTransitionError(
        order({ paymentStatus: "PaymentSubmitted", orderStatus: "OutForDelivery" }),
        "Delivered"
    );
    const directJump = getOrderStatusTransitionError(
        order({ paymentStatus: "AwaitingPayment", orderStatus: "New" }),
        "Delivered"
    );
    if (
        awaiting === "Online orders must be paid before they can be marked as delivered." &&
        submitted === "Online orders must be paid before they can be marked as delivered." &&
        directJump
    ) {
        pass("H2 online unpaid → Delivered blocked");
    } else {
        fail("H2 online unpaid → Delivered blocked", `${awaiting} | ${submitted} | ${directJump}`);
    }
})();

// --- Online unpaid → Shipped blocked ---
(() => {
    const err = getOrderStatusTransitionError(
        order({ paymentStatus: "AwaitingPayment", orderStatus: "Processing" }),
        "Shipped"
    );
    if (err === "Online orders must be paid before shipping or delivery.") {
        pass("H2 online unpaid → Shipped blocked");
    } else {
        fail("H2 online unpaid → Shipped blocked", err);
    }
})();

// --- Paid online fulfillment ---
(() => {
    const toShipped = getOrderStatusTransitionError(
        order({ paymentStatus: "Paid", orderStatus: "Processing" }),
        "Shipped"
    );
    const toDelivered = getOrderStatusTransitionError(
        order({ paymentStatus: "Paid", orderStatus: "OutForDelivery" }),
        "Delivered"
    );
    if (toShipped === null && toDelivered === null) {
        pass("D paid online fulfillment allowed");
    } else {
        fail("D paid online fulfillment allowed", `${toShipped} | ${toDelivered}`);
    }
})();

// --- COD fulfillment ---
(() => {
    const cod = {
        orderStatus: "Processing",
        paymentMethod: "COD",
        paymentStatus: "COD"
    };
    const toShipped = getOrderStatusTransitionError(cod, "Shipped");
    const toDelivered = getOrderStatusTransitionError(
        { ...cod, orderStatus: "OutForDelivery" },
        "Delivered"
    );
    if (toShipped === null && toDelivered === null) {
        pass("E COD fulfillment allowed");
    } else {
        fail("E COD fulfillment allowed", `${toShipped} | ${toDelivered}`);
    }
})();

// --- Cash fulfillment ---
(() => {
    const cash = {
        orderStatus: "Processing",
        paymentMethod: "Cash",
        paymentStatus: "Pending"
    };
    const err = getOrderStatusTransitionError(cash, "Shipped");
    if (err === null) {
        pass("E Cash fulfillment allowed");
    } else {
        fail("E Cash fulfillment allowed", err);
    }
})();

// --- Transition matrix: invalid jumps ---
(() => {
    const newToDelivered = getOrderStatusTransitionError(
        order({ orderStatus: "New", paymentMethod: "COD", paymentStatus: "COD" }),
        "Delivered"
    );
    const cancelledToProcessing = getOrderStatusTransitionError(
        order({ orderStatus: "Cancelled", paymentMethod: "COD", paymentStatus: "COD" }),
        "Processing"
    );
    const deliveredToShipped = getOrderStatusTransitionError(
        order({ orderStatus: "Delivered", paymentMethod: "COD", paymentStatus: "COD" }),
        "Shipped"
    );
    if (
        newToDelivered &&
        cancelledToProcessing &&
        deliveredToShipped
    ) {
        pass("Transition matrix invalid jumps blocked");
    } else {
        fail(
            "Transition matrix invalid jumps blocked",
            `${newToDelivered} | ${cancelledToProcessing} | ${deliveredToShipped}`
        );
    }
})();

// --- Lateral processing moves ---
(() => {
    const err = getOrderStatusTransitionError(
        order({ orderStatus: "Confirmed", paymentMethod: "COD", paymentStatus: "COD" }),
        "Preparing"
    );
    if (err === null) {
        pass("Lateral Confirmed → Preparing allowed");
    } else {
        fail("Lateral Confirmed → Preparing allowed", err);
    }
})();

// --- Invoice eligibility ---
(() => {
    const unpaid = isInvoiceAvailable(order({ paymentStatus: "AwaitingPayment" }));
    const paid = isInvoiceAvailable(order({ paymentStatus: "Paid" }));
    const cod = isInvoiceAvailable(order({ paymentStatus: "COD", paymentMethod: "COD" }));
    if (!unpaid && paid && cod) {
        pass("G invoice eligibility");
    } else {
        fail("G invoice eligibility", `${unpaid} ${paid} ${cod}`);
    }
})();

// --- New → Processing (bulk path) ---
(() => {
    const err = getOrderStatusTransitionError(
        order({ orderStatus: "New", paymentMethod: "COD", paymentStatus: "COD" }),
        "Processing"
    );
    if (err === null) {
        pass("F bulk Processing from New allowed");
    } else {
        fail("F bulk Processing from New allowed", err);
    }
})();

console.log(`\nPhase 5 QA: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
