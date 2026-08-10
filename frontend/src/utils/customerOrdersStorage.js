const STORAGE_KEY = "bizbuilder_my_orders";
const LAST_PHONE_KEY = "bizbuilder_last_phone";

const isObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));

const readOrders = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const writeOrders = (orders) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
};

const readLastPhones = () => {
    try {
        const raw = localStorage.getItem(LAST_PHONE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

const writeLastPhones = (map) => {
    localStorage.setItem(LAST_PHONE_KEY, JSON.stringify(map));
};

export const getStorePath = (businessId, businessSlug) =>
    `/store/${businessSlug || businessId}`;

export const getTrackPath = (item) => {
    if (item.trackingToken) {
        const storePath = item.businessId
            ? getStorePath(item.businessId, item.businessSlug)
            : "";
        return storePath
            ? `${storePath}/track/${item.trackingToken}`
            : `/track/${item.trackingToken}`;
    }

    const base = item.businessId
        ? `${getStorePath(item.businessId, item.businessSlug)}/track`
        : "/track-order";
    const params = new URLSearchParams({
        orderId: item.shortOrderId,
        phone: item.phone || ""
    });
    return `${base}?${params.toString()}`;
};

export const matchesStoreKey = (item, storeKey) => {
    if (!storeKey) {
        return true;
    }

    return (
        item.businessId === storeKey ||
        item.businessSlug === storeKey ||
        (isObjectId(storeKey) && item.businessId === storeKey)
    );
};

export const saveLastPhone = (businessId, phone) => {
    if (!businessId || !phone) {
        return;
    }

    const map = readLastPhones();
    map[businessId] = phone;
    writeLastPhones(map);
};

export const getLastPhone = (businessId) => {
    if (!businessId) {
        return "";
    }

    return readLastPhones()[businessId] || "";
};

export const saveCustomerOrder = (order) => {
    const orderId = order.orderId || order._id;
    if (!orderId) {
        return;
    }

    const entry = {
        businessId: order.businessId,
        businessSlug: order.businessSlug || "",
        orderId: String(orderId),
        shortOrderId:
            order.shortOrderId || String(orderId).slice(-6).toUpperCase(),
        trackingToken: order.trackingToken || "",
        phone: order.phone || order.customerPhone,
        businessName: order.businessName || "",
        totalAmount: order.totalAmount,
        createdAt: order.createdAt || new Date().toISOString(),
        orderStatus: order.orderStatus || "Pending"
    };

    if (entry.businessId && entry.phone) {
        saveLastPhone(entry.businessId, entry.phone);
    }

    const orders = readOrders().filter((item) => item.orderId !== entry.orderId);
    writeOrders([entry, ...orders]);
};

export const getCustomerOrders = (storeKey) => {
    const orders = readOrders();
    if (!storeKey) {
        return orders;
    }
    return orders.filter((item) => matchesStoreKey(item, storeKey));
};

export const getLastPhoneForStore = (storeKey) => {
    const orders = getCustomerOrders(storeKey);
    const businessIds = [...new Set(orders.map((item) => item.businessId).filter(Boolean))];

    for (const businessId of businessIds) {
        const phone = getLastPhone(businessId);
        if (phone) {
            return phone;
        }
    }

    return orders[0]?.phone || "";
};

export const removeCustomerOrder = (orderId) => {
    const orders = readOrders().filter((item) => item.orderId !== String(orderId));
    writeOrders(orders);
};

export const updateCustomerOrderStatus = (orderId, orderStatus) => {
    const orders = readOrders().map((item) =>
        item.orderId === String(orderId) ? { ...item, orderStatus } : item
    );
    writeOrders(orders);
};
