export const ORDER_STATUSES = [
    "New",
    "Processing",
    "Shipped",
    "OutForDelivery",
    "Delivered",
    "Cancelled",
    "Pending",
    "Confirmed",
    "Preparing",
    "Completed"
];

export const TERMINAL_STATUSES = ["Delivered", "Cancelled", "Completed"];

export const DELETABLE_STATUSES = ["Pending", "New", "Cancelled"];

export const DELIVERY_TYPES = ["local", "courier", "pickup"];

export const COURIER_OPTIONS = [
    "Delhivery",
    "India Post",
    "BlueDart",
    "DTDC",
    "Ekart",
    "Shadowfax",
    "XpressBees",
    "Other"
];

export const statusBadgeClass = (status) => {
    switch (status) {
        case "Pending":
        case "New":
            return "bg-amber-500/20 text-amber-100 border-amber-400/30";
        case "Confirmed":
        case "Processing":
        case "Preparing":
            return "bg-blue-500/20 text-blue-100 border-blue-400/30";
        case "Shipped":
            return "bg-indigo-500/20 text-indigo-100 border-indigo-400/30";
        case "OutForDelivery":
            return "bg-violet-500/20 text-violet-100 border-violet-400/30";
        case "Completed":
            return "bg-emerald-500/20 text-emerald-100 border-emerald-400/30";
        case "Cancelled":
            return "bg-red-500/20 text-red-100 border-red-400/30";
        case "Delivered":
            return "bg-teal-500/20 text-teal-100 border-teal-400/30";
        default:
            return "bg-white/10 text-emerald-50 border-white/20";
    }
};
