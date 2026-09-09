import api from "./axios";

export const getDashboardSummary = (businessId) =>
    api.get("/dashboard/summary", {
        params: businessId ? { businessId } : undefined
    });
