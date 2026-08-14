import publicApi from "./publicAxios";

export const getPublicBusiness = (businessId) => publicApi.get(`/public/businesses/${businessId}`);

export const getPublicProducts = (businessId) =>
    publicApi.get(`/public/businesses/${businessId}/products`);

export const createPublicOrder = (businessId, payload) =>
    publicApi.post(`/public/businesses/${businessId}/orders`, payload);

export const trackPublicOrder = (businessId, { orderId, phone }) =>
    publicApi.get(`/public/businesses/${businessId}/orders/track`, {
        params: { orderId, phone }
    });

export const trackPublicOrderGlobal = ({ orderId, phone }) =>
    publicApi.get("/public/orders/track", {
        params: { orderId, phone }
    });

export const trackPublicOrderByToken = (token) =>
    publicApi.get(`/public/orders/track/${token}`);

export const getPublicInvoiceByToken = (token) =>
    publicApi.get(`/public/orders/invoice/${token}`);

export const getPaymentPage = (token) => publicApi.get(`/public/orders/pay/${token}`);

export const confirmPayment = (token) =>
    publicApi.post(`/public/orders/pay/${token}/confirm`);

export const createRazorpayOrder = (token) =>
    publicApi.post(`/public/orders/pay/${token}/razorpay-order`);

export const verifyRazorpayPayment = (token, payload) =>
    publicApi.post(`/public/orders/pay/${token}/verify`, payload);

export const requestPublicReturn = (businessId, orderId, payload) => {
    const isFormData = payload instanceof FormData;

    return publicApi.post(
        `/public/businesses/${businessId}/orders/${orderId}/return-request`,
        payload,
        isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined
    );
};

export const getDeliveryOrder = (deliveryToken) =>
    publicApi.get(`/public/deliver/${deliveryToken}`);

export const uploadDeliveryPhoto = (deliveryToken, file) => {
    const formData = new FormData();
    formData.append("photo", file);

    return publicApi.post(`/public/deliver/${deliveryToken}/photo`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
};

export const verifyDeliveryOtp = (deliveryToken, otp) =>
    publicApi.post(`/public/deliver/${deliveryToken}/verify-otp`, { otp });
