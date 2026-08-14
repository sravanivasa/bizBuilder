export const PAYMENT_METHODS = ["Cash", "COD", "GPay", "PhonePe", "NetBanking", "UPI", "Card"];

export const CHECKOUT_PAYMENT_METHODS = ["COD", "Cash", "GPay", "PhonePe", "NetBanking", "UPI"];

export const ONLINE_PAYMENT_METHODS = ["GPay", "PhonePe", "NetBanking", "UPI"];

export const isOnlinePaymentMethod = (method) => ONLINE_PAYMENT_METHODS.includes(method);

export const PAYMENT_STATUSES = [
    "Pending",
    "AwaitingPayment",
    "PaymentSubmitted",
    "Paid",
    "Failed",
    "COD"
];

export const getPaymentLabelKey = (method) => {
    switch (method) {
        case "Cash":
            return "paymentCash";
        case "COD":
            return "paymentCOD";
        case "GPay":
            return "paymentGPay";
        case "PhonePe":
            return "paymentPhonePe";
        case "NetBanking":
            return "paymentNetBanking";
        case "UPI":
            return "paymentUPI";
        case "Card":
            return "paymentCard";
        default:
            return null;
    }
};
