import { useTranslation } from "react-i18next";

const LanguageSwitcher = ({ variant = "default" }) => {
    const { i18n, t } = useTranslation();

    const changeLanguage = (event) => {
        const language = event.target.value;
        i18n.changeLanguage(language);
        localStorage.setItem("language", language);
    };

    const isDark = variant === "auth" || variant === "app";

    return (
        <label className={`flex items-center gap-2 text-sm ${isDark ? "text-emerald-100/80" : "text-slate-600"}`}>
            <span className="sr-only">{t("language")}</span>
            <select
                value={i18n.language}
                onChange={changeLanguage}
                className={`rounded-lg border px-2 py-1.5 text-sm outline-none transition ${
                    isDark
                        ? "border-white/20 bg-white/10 text-white focus:border-emerald-300"
                        : "border-slate-300 bg-white text-slate-700"
                }`}
            >
                <option value="en">English</option>
                <option value="te">తెలుగు</option>
                <option value="hi">हिन्दी</option>
            </select>
        </label>
    );
};

export default LanguageSwitcher;
