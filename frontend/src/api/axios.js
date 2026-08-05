import axios from "axios";

// Single axios instance for the whole app.
// VITE_ prefix is required so Vite exposes the variable to the browser.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

// Attach JWT to every request after login.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;
