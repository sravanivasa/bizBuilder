import api from "./axios";

export const getMyOrders = () => api.get("/orders");

export const getOrderById = (orderId) => api.get(`/orders/${orderId}`);

export const updateOrderStatus = (orderId, orderStatus) =>
    api.put(`/orders/${orderId}`, { orderStatus });

export const deleteOrder = (orderId) => api.delete(`/orders/${orderId}`);
