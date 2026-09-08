import api from "./axios";

export const listExpenses = (businessId, params = {}) =>
    api.get("/expenses", {
        params: {
            businessId,
            ...params
        }
    });

export const getExpenseSummary = (businessId) =>
    api.get("/expenses/summary", {
        params: { businessId }
    });

export const getExpense = (expenseId) => api.get(`/expenses/${expenseId}`);

export const createExpense = (data) => api.post("/expenses", data);

export const updateExpense = (expenseId, data) => api.put(`/expenses/${expenseId}`, data);

export const deleteExpense = (expenseId) => api.delete(`/expenses/${expenseId}`);
