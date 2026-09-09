import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { getDashboardSummary } from "../api/dashboard";

const cards = [
    {
        to: "/business",
        titleKey: "business",
        descKey: "businessCardDesc",
        icon: "🏪",
        gradient: "from-emerald-500 to-teal-500"
    },
    {
        to: "/products",
        titleKey: "products",
        descKey: "productsCardDesc",
        icon: "📦",
        gradient: "from-cyan-500 to-blue-500"
    },
    {
        to: "/orders",
        titleKey: "orders",
        descKey: "ordersCardDesc",
        icon: "🧾",
        gradient: "from-violet-500 to-purple-500"
    }
];

const statCards = [
    { key: "todayOrders", labelKey: "statTodayOrders", icon: "📋", isCurrency: false },
    { key: "todayRevenue", labelKey: "statTodayRevenue", icon: "💰", isCurrency: true },
    { key: "todayExpenses", labelKey: "statTodayExpenses", icon: "📤", isCurrency: true },
    { key: "todayProfit", labelKey: "statTodayProfit", icon: "✨", isCurrency: true },
    { key: "monthRevenue", labelKey: "statMonthRevenue", icon: "📈", isCurrency: true },
    { key: "monthExpenses", labelKey: "statMonthExpenses", icon: "🧾", isCurrency: true },
    { key: "monthProfit", labelKey: "statMonthProfit", icon: "💎", isCurrency: true },
    { key: "pendingOrders", labelKey: "statPending", icon: "⏳", isCurrency: false }
];

const formatCurrency = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

const Dashboard = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const user = useSelector((state) => state.auth.user);
    const [businessName, setBusinessName] = useState("");
    const [businessId, setBusinessId] = useState(null);
    const [businessSlug, setBusinessSlug] = useState(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [summary, setSummary] = useState(null);
    const [loadState, setLoadState] = useState("loading");
    const [errorMessage, setErrorMessage] = useState("");
    const [noBusiness, setNoBusiness] = useState(false);

    const loadDashboard = useCallback(async () => {
        setLoadState("loading");
        setErrorMessage("");
        setNoBusiness(false);

        try {
            const { data } = await getDashboardSummary();
            const nextSummary = data.summary;

            setSummary(nextSummary);
            setBusinessName(nextSummary.businessName || "");
            setBusinessId(nextSummary.businessId || null);
            setBusinessSlug(nextSummary.businessSlug || null);
            setLoadState("success");
        } catch (err) {
            const status = err.response?.status;
            const message = err.response?.data?.message;

            if (status === 404 && message === "No business found") {
                setSummary(null);
                setBusinessName("");
                setBusinessId(null);
                setBusinessSlug(null);
                setNoBusiness(true);
                setLoadState("empty");
                return;
            }

            setSummary(null);
            setErrorMessage(message || t("dashboardLoadFailed"));
            setLoadState("error");
        }
    }, [t]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard, location.pathname]);

    useEffect(() => {
        const handleFocus = () => {
            if (loadState !== "loading") {
                loadDashboard();
            }
        };

        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, [loadDashboard, loadState]);

    const copyTextToClipboard = async (text) => {
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch {
                // Fall back to execCommand below.
            }
        }

        try {
            const textarea = document.createElement("textarea");
            textarea.value = text;
            textarea.setAttribute("readonly", "");
            textarea.style.position = "fixed";
            textarea.style.left = "-9999px";
            document.body.appendChild(textarea);
            textarea.select();
            const copied = document.execCommand("copy");
            document.body.removeChild(textarea);
            return copied;
        } catch {
            return false;
        }
    };

    const handleCopyStoreLink = async () => {
        if (!businessId) {
            return;
        }

        const storeUrl = `${window.location.origin}/store/${businessSlug || businessId}`;
        const copied = await copyTextToClipboard(storeUrl);

        if (copied) {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2500);
        }
    };

    const renderStatValue = (stat) => {
        if (loadState === "loading") {
            return <div className="mt-3 h-9 w-16 animate-pulse rounded-lg bg-white/10" />;
        }

        if (loadState === "error" || !summary) {
            return <p className="mt-3 text-sm text-emerald-100/50">—</p>;
        }

        const value = summary[stat.key];

        return (
            <p className="mt-3 text-3xl font-bold text-white">
                {stat.isCurrency ? formatCurrency(value) : value}
            </p>
        );
    };

    return (
        <section className="space-y-6">
            <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-emerald-500/20 via-white/5 to-teal-500/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                    {t("dashboard")}
                </p>
                <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
                    {user?.name ? `${t("hello")}, ${user.name}` : t("welcome")}
                </h1>
                {businessName && (
                    <p className="mt-2 text-sm font-medium text-emerald-200">
                        {t("dashboardBusinessLabel")}: {businessName}
                    </p>
                )}
                {summary?.timezone && (
                    <p className="mt-1 text-xs text-emerald-100/60">
                        {t("dashboardTimezoneContext", {
                            timezone: summary.timezone,
                            today: summary.today
                        })}
                    </p>
                )}
                <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80 sm:text-base">
                    {t("welcomeSubtitle")}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                        to="/business"
                        className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400"
                    >
                        {businessName ? t("editBusiness") : t("setupBusiness")}
                    </Link>
                    <Link
                        to="/products"
                        className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                    >
                        {t("addProducts")}
                    </Link>
                    {businessId && (
                        <button
                            type="button"
                            onClick={handleCopyStoreLink}
                            className="rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-5 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
                        >
                            {copySuccess ? t("storeLinkCopied") : t("copyStoreLink")}
                        </button>
                    )}
                </div>
                {copySuccess && (
                    <p className="mt-3 text-sm text-emerald-300">{t("storeLinkCopied")}</p>
                )}
            </div>

            {loadState === "error" && (
                <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-5 backdrop-blur-xl">
                    <p className="text-sm text-red-100">{errorMessage || t("dashboardLoadFailed")}</p>
                    <button
                        type="button"
                        onClick={loadDashboard}
                        className="mt-3 rounded-xl border border-red-300/40 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/30"
                    >
                        {t("retry")}
                    </button>
                </div>
            )}

            {noBusiness && (
                <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5 backdrop-blur-xl">
                    <p className="text-sm text-amber-100">{t("dashboardNoBusiness")}</p>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <div
                        key={stat.key}
                        className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-emerald-100/70">{t(stat.labelKey)}</p>
                            <span className="text-xl">{stat.icon}</span>
                        </div>
                        {renderStatValue(stat)}
                    </div>
                ))}
            </div>

            <div>
                <h2 className="mb-4 text-lg font-semibold text-white">{t("quickActions")}</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    {cards.map((card) => (
                        <Link
                            key={card.to}
                            to={card.to}
                            className="group rounded-3xl border border-white/15 bg-white/10 p-6 shadow-xl shadow-black/10 backdrop-blur-xl transition hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-white/15"
                        >
                            <div
                                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.gradient} text-xl shadow-lg`}
                            >
                                {card.icon}
                            </div>
                            <h3 className="mt-5 text-xl font-bold text-white">{t(card.titleKey)}</h3>
                            <p className="mt-2 text-sm leading-6 text-emerald-50/70">{t(card.descKey)}</p>
                            <span className="mt-5 inline-flex text-sm font-semibold text-emerald-300 transition group-hover:text-emerald-200">
                                {t("openSection")} →
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Dashboard;
