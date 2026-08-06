import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { logout } from "../store/authSlice";
import LanguageSwitcher from "./LanguageSwitcher";

const Navbar = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
    const user = useSelector((state) => state.auth.user);

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
        setMobileOpen(false);
    };

    const navItems = [
        { to: "/", label: t("dashboard") },
        { to: "/business", label: t("business") },
        { to: "/products", label: t("products") },
        { to: "/orders", label: t("orders") }
    ];

    const linkClass = (path) => {
        const active = location.pathname === path;
        return `rounded-xl px-3 py-2 text-sm font-medium transition ${
            active
                ? "bg-emerald-500/20 text-emerald-200"
                : "text-emerald-50/80 hover:bg-white/10 hover:text-white"
        }`;
    };

    return (
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
                <Link to="/" className="inline-flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/30">
                        B
                    </span>
                    <div className="min-w-0">
                        <p className="text-lg font-bold text-white">{t("appName")}</p>
                        {user?.name && (
                            <p className="truncate text-xs text-emerald-100/60">
                                {t("hello")}, {user.name}
                            </p>
                        )}
                    </div>
                </Link>

                {isAuthenticated ? (
                    <>
                        <nav className="hidden items-center gap-1 md:flex">
                            {navItems.map((item) => (
                                <Link key={item.to} to={item.to} className={linkClass(item.to)}>
                                    {item.label}
                                </Link>
                            ))}
                            <LanguageSwitcher variant="app" />
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="ml-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                            >
                                {t("logout")}
                            </button>
                        </nav>

                        <button
                            type="button"
                            onClick={() => setMobileOpen((open) => !open)}
                            className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 p-2 text-white md:hidden"
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </>
                ) : (
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher variant="app" />
                        <Link to="/login" className="rounded-xl px-3 py-2 text-sm font-medium text-emerald-50/80 hover:text-white">
                            {t("login")}
                        </Link>
                        <Link
                            to="/register"
                            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-emerald-500/20"
                        >
                            {t("register")}
                        </Link>
                    </div>
                )}
            </div>

            {isAuthenticated && mobileOpen && (
                <div className="border-t border-white/10 bg-slate-950/95 px-4 py-4 md:hidden">
                    <nav className="flex flex-col gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                onClick={() => setMobileOpen(false)}
                                className={linkClass(item.to)}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                        <LanguageSwitcher variant="app" />
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white"
                        >
                            {t("logout")}
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;
