import api from "./axios";

export const createBusiness = (data) => api.post("/businesses", data);
export const getMyBusinesses = () => api.get("/businesses/my-businesses");
export const updateBusiness = (id, data) => api.put(`/businesses/${id}`, data);
