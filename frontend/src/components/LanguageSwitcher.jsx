import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
    const { i18n, t } = useTranslation();

    const changeLanguage = (event) => {
        const language = event.target.value;
        i18n.changeLanguage(language);
        localStorage.setItem("language", language);
    };

    return (
        <label className="flex items-center gap-2 text-sm text-slate-600">
            <span>{t("language")}</span>
            <select
                value={i18n.language}
                onChange={changeLanguage}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
            >
                <option value="en">English</option>
                <option value="te">తెలుగు</option>
                <option value="hi">हिन्दी</option>
            </select>
        </label>
    );
};

export default LanguageSwitcher;
