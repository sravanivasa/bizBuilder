import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { logout } from "../store/authSlice";
import LanguageSwitcher from "./LanguageSwitcher";

const Navbar = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    return (
        <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                <Link to="/" className="text-xl font-bold text-emerald-700">
                    {t("appName")}
                </Link>

                <div className="flex items-center gap-4">
                    <LanguageSwitcher />

                    {isAuthenticated ? (
                        <>
                            <Link to="/" className="text-sm font-medium text-slate-700 hover:text-emerald-700">
                                {t("dashboard")}
                            </Link>
                            <Link to="/products" className="text-sm font-medium text-slate-700 hover:text-emerald-700">
                                {t("products")}
                            </Link>
                            <Link to="/orders" className="text-sm font-medium text-slate-700 hover:text-emerald-700">
                                {t("orders")}
                            </Link>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
                            >
                                {t("logout")}
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-sm font-medium text-slate-700 hover:text-emerald-700">
                                {t("login")}
                            </Link>
                            <Link
                                to="/register"
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                            >
                                {t("register")}
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
