import publicApi from "./publicAxios";

export const getPublicBusiness = (businessId) => publicApi.get(`/public/businesses/${businessId}`);

export const getPublicProducts = (businessId) =>
    publicApi.get(`/public/businesses/${businessId}/products`);

export const createPublicOrder = (businessId, payload) =>
    publicApi.post(`/public/businesses/${businessId}/orders`, payload);
