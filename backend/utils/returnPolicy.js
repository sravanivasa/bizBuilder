/** Legacy compatibility for orders created before Stage 2 return-policy snapshots. */
const LEGACY_RETURN_WINDOW_DAYS = 30;

const RETURN_ELIGIBLE_STATUSES = ["Delivered", "Completed"];

const getReturnPolicyForOrder = (order) => {
    if (order?.returnPolicySnapshot?.enabled != null) {
        return {
            enabled: Boolean(order.returnPolicySnapshot.enabled),
            windowDays: Number(order.returnPolicySnapshot.windowDays)
        };
    }

    return {
        enabled: true,
        windowDays: LEGACY_RETURN_WINDOW_DAYS,
        legacy: true
    };
};

const isReturnWindowOpen = (order, policy = null) => {
    const resolved = policy || getReturnPolicyForOrder(order);

    if (!resolved.enabled) {
        return false;
    }

    const referenceDate = order?.updatedAt || order?.createdAt;

    if (!referenceDate) {
        return false;
    }

    const windowEnd = new Date(referenceDate);
    windowEnd.setDate(windowEnd.getDate() + resolved.windowDays);

    return new Date() <= windowEnd;
};

const canRequestReturn = (order) => {
    if (!order) {
        return false;
    }

    if (!RETURN_ELIGIBLE_STATUSES.includes(order.orderStatus)) {
        return false;
    }

    if (order.returnStatus && order.returnStatus !== "None") {
        return false;
    }

    const policy = getReturnPolicyForOrder(order);

    if (!policy.enabled) {
        return false;
    }

    return isReturnWindowOpen(order, policy);
};

module.exports = {
    LEGACY_RETURN_WINDOW_DAYS,
    RETURN_ELIGIBLE_STATUSES,
    getReturnPolicyForOrder,
    isReturnWindowOpen,
    canRequestReturn
};
