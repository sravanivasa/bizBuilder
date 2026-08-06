import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { getMyBusinesses } from "../api/business";

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

const stats = [
    { labelKey: "statTodayOrders", value: "0", icon: "📋" },
    { labelKey: "statProducts", value: "0", icon: "📦" },
    { labelKey: "statPending", value: "0", icon: "⏳" }
];

const Dashboard = () => {
    const { t } = useTranslation();
    const user = useSelector((state) => state.auth.user);
    const [businessName, setBusinessName] = useState("");

    useEffect(() => {
        const loadBusiness = async () => {
            try {
                const { data } = await getMyBusinesses();
                const business = data.businesses?.[0];
                if (business?.businessName) {
                    setBusinessName(business.businessName);
                }
            } catch {
                // Dashboard still works without business data.
            }
        };

        loadBusiness();
    }, []);

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
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                    <div
                        key={stat.labelKey}
                        className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-emerald-100/70">{t(stat.labelKey)}</p>
                            <span className="text-xl">{stat.icon}</span>
                        </div>
                        <p className="mt-3 text-3xl font-bold text-white">{stat.value}</p>
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
