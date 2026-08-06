import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ForgotPassword = () => {
    const { t } = useTranslation();

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">{t("forgotPassword")}</h1>
                <p className="mt-2 text-sm text-emerald-50/70">{t("forgotPasswordSubtitle")}</p>
            </div>

            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5">
                <p className="text-sm leading-6 text-amber-50">{t("forgotPasswordComingSoon")}</p>
                <p className="mt-3 text-sm leading-6 text-amber-100/70">{t("forgotPasswordNote")}</p>
            </div>

            <Link
                to="/login"
                className="mt-8 inline-flex items-center text-sm font-semibold text-emerald-300 transition hover:text-white"
            >
                ← {t("backToLogin")}
            </Link>
        </div>
    );
};

export default ForgotPassword;
