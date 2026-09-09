import { createSlice } from "@reduxjs/toolkit";

const tokenFromStorage = localStorage.getItem("token");

const initialState = {
    token: tokenFromStorage,
    user: null,
    isAuthenticated: Boolean(tokenFromStorage),
    authReady: !tokenFromStorage
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            state.token = action.payload.token;
            state.user = action.payload.user;
            state.isAuthenticated = true;
            state.authReady = true;
            localStorage.setItem("token", action.payload.token);
        },
        logout: (state) => {
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
            state.authReady = true;
            localStorage.removeItem("token");
        },
        setUser: (state, action) => {
            state.user = action.payload;
        },
        setAuthReady: (state) => {
            state.authReady = true;
        }
    }
});

export const { setCredentials, logout, setUser, setAuthReady } = authSlice.actions;
export default authSlice.reducer;
