import axios from "axios";
import store from "../store";
import { logout } from "../store/authSlice";

// Single axios instance for the whole app.
// VITE_ prefix is required so Vite exposes the variable to the browser.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

const AUTH_ENDPOINT_PATTERN = /\/users\/(login|register)$/;

// Attach JWT to every request after login.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || "";

        if (status === 401 && localStorage.getItem("token") && !AUTH_ENDPOINT_PATTERN.test(requestUrl)) {
            store.dispatch(logout());

            if (!window.location.pathname.startsWith("/login")) {
                window.location.replace("/login");
            }
        }

        return Promise.reject(error);
    }
);

export default api;
