const mongoose = require("mongoose");
const { ALL_ORDER_STATUSES } = require("./orderStatus");
const { PAYMENT_STATUSES, PAYMENT_METHODS } = require("./paymentMethods");
const { escapeRegex, normalizePhoneForMatch, isPhoneSearchInput } = require("./phoneValidation");
const {
    getIstDayCreatedAtRange,
    shiftExpenseDate,
    isValidExpenseDateString
} = require("./expenseDate");
const { buildDeliveryPersonUrl } = require("./deliveryUrl");

const MAX_SEARCH_LENGTH = 100;

const ORDER_LIST_SORT_FIELDS = {
    createdAt: "createdAt",
    totalAmount: "totalAmount",
    orderStatus: "orderStatus",
    paymentStatus: "paymentStatus"
};

const shortOrderId = (orderId) => String(orderId).slice(-6).toUpperCase();

const getIstCreatedAtRange = (dateFrom, dateTo) => {
    const start = new Date(`${dateFrom}T00:00:00+05:30`);
    const nextDay = shiftExpenseDate(dateTo, 1);
    const endExclusive = new Date(`${nextDay}T00:00:00+05:30`);

    return { $gte: start, $lt: endExclusive };
};

const buildOrderSearchConditions = (search) => {
    const trimmed = search.trim().slice(0, MAX_SEARCH_LENGTH);

    if (!trimmed) {
        return null;
    }

    const conditions = [];

    if (mongoose.Types.ObjectId.isValid(trimmed)) {
        const objectId = new mongoose.Types.ObjectId(trimmed);

        if (String(objectId) === trimmed) {
            conditions.push({ _id: objectId });
        }
    }

    const normalizedShortId = trimmed.replace(/[^a-fA-F0-9]/gi, "").slice(-6).toUpperCase();

    if (normalizedShortId.length === 6) {
        conditions.push({
            $expr: {
                $eq: [
                    {
                        $toUpper: {
                            $substr: [
                                { $toString: "$_id" },
                                { $subtract: [{ $strLenCP: { $toString: "$_id" } }, 6] },
                                6
                            ]
                        }
                    },
                    normalizedShortId
                ]
            }
        });
    }

    if (isPhoneSearchInput(trimmed)) {
        const normalizedPhone = normalizePhoneForMatch(trimmed);

        if (normalizedPhone) {
            conditions.push({
                customerPhone: { $regex: escapeRegex(normalizedPhone), $options: "i" }
            });
        }
    }

    const escaped = escapeRegex(trimmed);
    conditions.push({ customerName: { $regex: escaped, $options: "i" } });

    if (ALL_ORDER_STATUSES.includes(trimmed)) {
        conditions.push({ orderStatus: trimmed });
    }

    if (PAYMENT_STATUSES.includes(trimmed)) {
        conditions.push({ paymentStatus: trimmed });
    }

    if (PAYMENT_METHODS.includes(trimmed)) {
        conditions.push({ paymentMethod: trimmed });
    }

    return conditions;
};

const buildOrderListFilter = ({
    businessId,
    search,
    orderStatus,
    paymentStatus,
    paymentMethod,
    dateFrom,
    dateTo
}) => {
    const filter = { business: businessId };

    if (orderStatus) {
        filter.orderStatus = orderStatus;
    }

    if (paymentStatus) {
        filter.paymentStatus = paymentStatus;
    }

    if (paymentMethod) {
        filter.paymentMethod = paymentMethod;
    }

    if (dateFrom && dateTo) {
        filter.createdAt = getIstCreatedAtRange(dateFrom, dateTo);
    } else if (dateFrom) {
        filter.createdAt = getIstDayCreatedAtRange(dateFrom);
    } else if (dateTo) {
        filter.createdAt = getIstDayCreatedAtRange(dateTo);
    }

    const searchConditions = search ? buildOrderSearchConditions(search) : null;

    if (searchConditions?.length) {
        return { $and: [filter, { $or: searchConditions }] };
    }

    return filter;
};

const buildOrderListSort = (sortField, sortDirection) => {
    const field = ORDER_LIST_SORT_FIELDS[sortField] || "createdAt";
    const direction = sortDirection === "asc" ? 1 : -1;
    const sort = { [field]: direction };

    if (field !== "createdAt") {
        sort.createdAt = -1;
    }

    sort._id = direction;

    return sort;
};

const formatOrderForOwnerList = (order) => {
    const plain = order.toObject ? order.toObject() : { ...order };

    delete plain.trackingToken;
    delete plain.deliveryToken;
    delete plain.deliveryOtp;
    delete plain.razorpayOrderId;
    delete plain.razorpayPaymentId;

    plain.shortOrderId = shortOrderId(plain._id);
    plain.deliveryPersonUrl = buildDeliveryPersonUrl(order);

    return plain;
};

module.exports = {
    MAX_SEARCH_LENGTH,
    ORDER_LIST_SORT_FIELDS,
    ALL_ORDER_STATUSES,
    PAYMENT_STATUSES,
    PAYMENT_METHODS,
    isValidExpenseDateString,
    buildOrderListFilter,
    buildOrderListSort,
    formatOrderForOwnerList,
    shortOrderId
};
