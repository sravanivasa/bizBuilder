import { useTranslation } from "react-i18next";

const PageShell = ({ title, subtitle, badge, children }) => {
    const { t } = useTranslation();

    return (
        <section className="space-y-6">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
                {badge && (
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                        {badge}
                    </p>
                )}
                <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{title}</h1>
                {subtitle && (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/70 sm:text-base">
                        {subtitle}
                    </p>
                )}
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-8">
                {children || (
                    <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center">
                        <p className="text-sm text-emerald-50/80">{t("comingSoon")}</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default PageShell;
