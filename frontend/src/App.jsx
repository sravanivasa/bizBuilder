import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import AuthLayout from "./components/AuthLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import BusinessSetup from "./pages/BusinessSetup";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Storefront from "./pages/Storefront";
import TrackOrder from "./pages/TrackOrder";
import DeliverOrder from "./pages/DeliverOrder";
import MyOrders from "./pages/MyOrders";
import Invoice from "./pages/Invoice";
import Payment from "./pages/Payment";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/store/:storeSlug" element={<Storefront />} />
                <Route path="/store/:storeSlug/pay/:token" element={<Payment />} />
                <Route path="/store/:storeSlug/track/:token" element={<TrackOrder />} />
                <Route path="/store/:storeSlug/track" element={<TrackOrder />} />
                <Route path="/store/:storeSlug/my-orders" element={<MyOrders />} />
                <Route path="/track/:token" element={<TrackOrder />} />
                <Route path="/pay/:token" element={<Payment />} />
                <Route path="/invoice/:token" element={<Invoice />} />
                <Route path="/deliver/:deliveryToken" element={<DeliverOrder />} />
                <Route path="/my-orders" element={<MyOrders />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />

                <Route element={<AuthLayout />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                </Route>

                <Route element={<ProtectedRoute />}>
                    <Route element={<Layout />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/business" element={<BusinessSetup />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/orders/:orderId/invoice" element={<Invoice ownerMode />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
