import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Dashboard = () => {
    const { t } = useTranslation();

    return (
        <section className="rounded-2xl bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-slate-900">{t("welcome")}</h1>
            <p className="mt-2 text-slate-600">{t("welcomeSubtitle")}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <Link to="/business" className="rounded-xl border border-slate-200 p-5 hover:border-emerald-500">
                    <h2 className="font-semibold text-slate-900">{t("business")}</h2>
                    <p className="mt-2 text-sm text-slate-500">Set up your business profile.</p>
                </Link>
                <Link to="/products" className="rounded-xl border border-slate-200 p-5 hover:border-emerald-500">
                    <h2 className="font-semibold text-slate-900">{t("products")}</h2>
                    <p className="mt-2 text-sm text-slate-500">Add and manage your products.</p>
                </Link>
                <Link to="/orders" className="rounded-xl border border-slate-200 p-5 hover:border-emerald-500">
                    <h2 className="font-semibold text-slate-900">{t("orders")}</h2>
                    <p className="mt-2 text-sm text-slate-500">Track and update customer orders.</p>
                </Link>
            </div>
        </section>
    );
};

export default Dashboard;
