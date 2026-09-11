import api from "./axios";

export const getSettings = (businessId) => api.get(`/businesses/${businessId}/settings`);

export const updateSettings = (businessId, data) => api.put(`/businesses/${businessId}/settings`, data);
