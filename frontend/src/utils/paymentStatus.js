export const getPaymentStatusLabelKey = (status) => {
    switch (status) {
        case "Paid":
            return "paymentStatusPaid";
        case "PaymentSubmitted":
            return "paymentStatusSubmitted";
        case "AwaitingPayment":
            return "paymentStatusAwaiting";
        case "Failed":
            return "paymentStatusFailed";
        case "COD":
            return "paymentStatusCOD";
        case "Pending":
        default:
            return "paymentStatusPending";
    }
};

export const paymentStatusBadgeClass = (status) => {
    switch (status) {
        case "Paid":
            return "border-emerald-400/30 bg-emerald-500/20 text-emerald-100";
        case "PaymentSubmitted":
            return "border-blue-400/30 bg-blue-500/20 text-blue-100";
        case "AwaitingPayment":
            return "border-amber-400/30 bg-amber-500/20 text-amber-100";
        case "Failed":
            return "border-red-400/30 bg-red-500/20 text-red-100";
        case "COD":
            return "border-purple-400/30 bg-purple-500/20 text-purple-100";
        case "Pending":
        default:
            return "border-white/20 bg-white/10 text-emerald-50/80";
    }
};

export const isPaymentComplete = (status) => status === "Paid" || status === "COD";

export const canViewInvoice = (status) => status === "Paid" || status === "COD";
