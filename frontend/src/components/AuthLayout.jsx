import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

const AuthLayout = () => {
    const { t } = useTranslation();

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-emerald-500/30 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-teal-400/20 blur-3xl" />
                <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_45%)]" />
            </div>

            <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
                <aside className="hidden flex-1 flex-col justify-between p-10 lg:flex xl:p-14">
                    <div>
                        <Link to="/" className="inline-flex items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-lg font-bold text-white shadow-lg shadow-emerald-500/30">
                                B
                            </span>
                            <span className="text-2xl font-bold text-white">{t("appName")}</span>
                        </Link>

                        <div className="mt-16 max-w-md">
                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
                                {t("authTagline")}
                            </p>
                            <h1 className="mt-4 text-4xl font-bold leading-tight text-white xl:text-5xl">
                                {t("authHeadline")}
                            </h1>
                            <p className="mt-5 text-lg leading-relaxed text-emerald-50/80">
                                {t("authDescription")}
                            </p>
                        </div>
                    </div>

                    <div className="grid max-w-md gap-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                            <p className="text-sm font-medium text-emerald-200">{t("authFeature1Title")}</p>
                            <p className="mt-1 text-sm text-emerald-50/70">{t("authFeature1Text")}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                            <p className="text-sm font-medium text-emerald-200">{t("authFeature2Title")}</p>
                            <p className="mt-1 text-sm text-emerald-50/70">{t("authFeature2Text")}</p>
                        </div>
                    </div>
                </aside>

                <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
                    <div className="w-full max-w-md">
                        <div className="mb-6 flex items-center justify-between lg:hidden">
                            <Link to="/" className="inline-flex items-center gap-2">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 font-bold text-white">
                                    B
                                </span>
                                <span className="text-xl font-bold text-white">{t("appName")}</span>
                            </Link>
                            <LanguageSwitcher variant="auth" />
                        </div>

                        <div className="rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-10">
                            <div className="mb-6 hidden justify-end lg:flex">
                                <LanguageSwitcher variant="auth" />
                            </div>
                            <Outlet />
                        </div>

                        <p className="mt-6 text-center text-xs text-emerald-100/50">
                            <Link to="/privacy" className="hover:text-emerald-200">
                                {t("privacyPolicy")}
                            </Link>
                            {" · "}
                            <Link to="/terms" className="hover:text-emerald-200">
                                {t("termsOfService")}
                            </Link>
                        </p>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AuthLayout;
