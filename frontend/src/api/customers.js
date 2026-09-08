import api from "./axios";

export const listCustomers = (businessId, params = {}) =>
    api.get("/customers", {
        params: {
            businessId,
            ...params
        }
    });

export const getCustomer = (customerId) => api.get(`/customers/${customerId}`);

export const createCustomer = (data) => api.post("/customers", data);

export const updateCustomer = (customerId, data) => api.put(`/customers/${customerId}`, data);

export const deleteCustomer = (customerId) => api.delete(`/customers/${customerId}`);

export const getCustomerOrders = (customerId, params = {}) =>
    api.get(`/customers/${customerId}/orders`, { params });
