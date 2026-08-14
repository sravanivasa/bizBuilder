import api from "./axios";

export const getMyOrders = () => api.get("/orders");

export const getOrderById = (orderId) => api.get(`/orders/${orderId}`);

export const updateOrderStatus = (orderId, orderStatus) =>
    api.put(`/orders/${orderId}`, { orderStatus });

export const bulkUpdateOrderStatus = (orderIds, orderStatus) =>
    api.post("/orders/bulk-status", { orderIds, orderStatus });

export const updateReturnStatus = (orderId, payload) =>
    api.put(`/orders/${orderId}/return`, payload);

export const deleteOrder = (orderId) => api.delete(`/orders/${orderId}`);

export const updateOrderDelivery = (orderId, payload) =>
    api.put(`/orders/${orderId}/delivery`, payload);

export const updatePaymentStatus = (orderId, paymentStatus) =>
    api.put(`/orders/${orderId}/payment`, { paymentStatus });

export const getOrderInvoice = (orderId) => api.get(`/orders/${orderId}/invoice`);
