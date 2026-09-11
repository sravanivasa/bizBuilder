import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getMyBusinesses } from "../api/business";
import { getSettings, updateSettings } from "../api/businessSettings";
import PageShell from "../components/PageShell";

const DAY_OPTIONS = [
    { value: 0, labelKey: "daySunday" },
    { value: 1, labelKey: "dayMonday" },
    { value: 2, labelKey: "dayTuesday" },
    { value: 3, labelKey: "dayWednesday" },
    { value: 4, labelKey: "dayThursday" },
    { value: 5, labelKey: "dayFriday" },
    { value: 6, labelKey: "daySaturday" }
];

const inputClassName =
    "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-emerald-100/60 outline-none transition focus:border-emerald-300 focus:bg-white/15 focus:ring-2 focus:ring-emerald-400/30";

const labelClassName = "mb-2 block text-sm font-medium text-emerald-50";

const BusinessSettingsPage = () => {
    const { t } = useTranslation();
    const [businessId, setBusinessId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [form, setForm] = useState(null);
    const [holidayInput, setHolidayInput] = useState("");

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError("");

            try {
                const { data: businessData } = await getMyBusinesses();
                const business = businessData.businesses?.[0];

                if (!business) {
                    setError(t("businessSettingsNoBusiness"));
                    setLoading(false);
                    return;
                }

                setBusinessId(business._id);
                const { data } = await getSettings(business._id);
                setForm({
                    gst: {
                        enabled: Boolean(data.settings.gst.enabled),
                        rate: String(data.settings.gst.rate ?? 18)
                    },
                    delivery: {
                        preparationMinutes: String(data.settings.delivery.preparationMinutes ?? 30),
                        deliveryMinutes: String(data.settings.delivery.deliveryMinutes ?? 60)
                    },
                    schedule: {
                        workingDays: [...(data.settings.schedule.workingDays || [])],
                        openTime: data.settings.schedule.openTime || "09:00",
                        closeTime: data.settings.schedule.closeTime || "21:00",
                        holidays: [...(data.settings.schedule.holidays || [])],
                        timezone: data.settings.schedule.timezone || "Asia/Kolkata"
                    },
                    returns: {
                        enabled: Boolean(data.settings.returns.enabled),
                        windowDays: String(data.settings.returns.windowDays ?? 30)
                    }
                });
            } catch (err) {
                setError(err.response?.data?.message || t("businessSettingsLoadFailed"));
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [t]);

    const toggleWorkingDay = (day) => {
        setForm((current) => {
            const workingDays = current.schedule.workingDays.includes(day)
                ? current.schedule.workingDays.filter((value) => value !== day)
                : [...current.schedule.workingDays, day].sort((a, b) => a - b);

            return {
                ...current,
                schedule: {
                    ...current.schedule,
                    workingDays
                }
            };
        });
    };

    const addHoliday = () => {
        const value = holidayInput.trim();

        if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            setError(t("businessSettingsInvalidHoliday"));
            return;
        }

        setForm((current) => ({
            ...current,
            schedule: {
                ...current.schedule,
                holidays: current.schedule.holidays.includes(value)
                    ? current.schedule.holidays
                    : [...current.schedule.holidays, value].sort()
            }
        }));
        setHolidayInput("");
        setError("");
    };

    const removeHoliday = (value) => {
        setForm((current) => ({
            ...current,
            schedule: {
                ...current.schedule,
                holidays: current.schedule.holidays.filter((holiday) => holiday !== value)
            }
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const payload = {
                gst: {
                    enabled: form.gst.enabled,
                    rate: form.gst.enabled ? Number(form.gst.rate) : 0
                },
                delivery: {
                    preparationMinutes: Number(form.delivery.preparationMinutes),
                    deliveryMinutes: Number(form.delivery.deliveryMinutes)
                },
                schedule: {
                    workingDays: form.schedule.workingDays,
                    openTime: form.schedule.openTime,
                    closeTime: form.schedule.closeTime,
                    holidays: form.schedule.holidays
                },
                returns: {
                    enabled: form.returns.enabled,
                    windowDays: Number(form.returns.windowDays)
                }
            };

            const { data } = await updateSettings(businessId, payload);
            setForm({
                gst: {
                    enabled: Boolean(data.settings.gst.enabled),
                    rate: String(data.settings.gst.rate ?? 18)
                },
                delivery: {
                    preparationMinutes: String(data.settings.delivery.preparationMinutes ?? 30),
                    deliveryMinutes: String(data.settings.delivery.deliveryMinutes ?? 60)
                },
                schedule: {
                    workingDays: [...(data.settings.schedule.workingDays || [])],
                    openTime: data.settings.schedule.openTime || "09:00",
                    closeTime: data.settings.schedule.closeTime || "21:00",
                    holidays: [...(data.settings.schedule.holidays || [])],
                    timezone: data.settings.schedule.timezone || "Asia/Kolkata"
                },
                returns: {
                    enabled: Boolean(data.settings.returns.enabled),
                    windowDays: String(data.settings.returns.windowDays ?? 30)
                }
            });
            setSuccess(t("businessSettingsSaveSuccess"));
        } catch (err) {
            setError(err.response?.data?.message || t("businessSettingsSaveFailed"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <PageShell title={t("businessSettingsTitle")} subtitle={t("businessSettingsSubtitle")}>
            <div className="mb-6">
                <Link to="/business" className="text-sm text-emerald-200 hover:text-white">
                    {t("businessSettingsBackToProfile")}
                </Link>
            </div>

            {loading && <p className="text-emerald-50/80">{t("loading")}</p>}
            {error && <p className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-100">{error}</p>}
            {success && (
                <p className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-emerald-100">
                    {success}
                </p>
            )}

            {form && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <h2 className="text-lg font-semibold text-white">{t("gstSettingsTitle")}</h2>
                        <p className="mt-1 text-sm text-emerald-50/70">{t("businessSettingsGstHint")}</p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <label className="flex items-center gap-3 text-sm text-emerald-50 sm:col-span-2">
                                <input
                                    type="checkbox"
                                    checked={form.gst.enabled}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            gst: { ...current.gst, enabled: event.target.checked }
                                        }))
                                    }
                                    className="h-4 w-4 rounded border-white/30 bg-white/10 text-emerald-500"
                                />
                                {t("gstEnabled")}
                            </label>
                            <div>
                                <label className={labelClassName}>{t("gstRate")}</label>
                                <select
                                    value={form.gst.rate}
                                    disabled={!form.gst.enabled}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            gst: { ...current.gst, rate: event.target.value }
                                        }))
                                    }
                                    className={`${inputClassName} appearance-none disabled:opacity-50`}
                                >
                                    <option value="5" className="bg-slate-900 text-white">5%</option>
                                    <option value="12" className="bg-slate-900 text-white">12%</option>
                                    <option value="18" className="bg-slate-900 text-white">18%</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <h2 className="text-lg font-semibold text-white">{t("businessSettingsDeliveryTitle")}</h2>
                        <p className="mt-1 text-sm text-emerald-50/70">{t("businessSettingsDeliveryHint")}</p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelClassName}>{t("businessSettingsPreparationMinutes")}</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="1440"
                                    value={form.delivery.preparationMinutes}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            delivery: { ...current.delivery, preparationMinutes: event.target.value }
                                        }))
                                    }
                                    className={inputClassName}
                                />
                            </div>
                            <div>
                                <label className={labelClassName}>{t("businessSettingsDeliveryMinutes")}</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="10080"
                                    value={form.delivery.deliveryMinutes}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            delivery: { ...current.delivery, deliveryMinutes: event.target.value }
                                        }))
                                    }
                                    className={inputClassName}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <h2 className="text-lg font-semibold text-white">{t("businessSettingsScheduleTitle")}</h2>
                        <p className="mt-1 text-sm text-emerald-50/70">
                            {t("businessSettingsScheduleHint", { timezone: form.schedule.timezone })}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {DAY_OPTIONS.map((day) => (
                                <button
                                    key={day.value}
                                    type="button"
                                    onClick={() => toggleWorkingDay(day.value)}
                                    className={`rounded-full px-3 py-1 text-sm ${
                                        form.schedule.workingDays.includes(day.value)
                                            ? "bg-emerald-500/30 text-emerald-50"
                                            : "bg-white/10 text-emerald-100/70"
                                    }`}
                                >
                                    {t(day.labelKey)}
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelClassName}>{t("businessSettingsOpenTime")}</label>
                                <input
                                    type="time"
                                    value={form.schedule.openTime}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            schedule: { ...current.schedule, openTime: event.target.value }
                                        }))
                                    }
                                    className={inputClassName}
                                />
                            </div>
                            <div>
                                <label className={labelClassName}>{t("businessSettingsCloseTime")}</label>
                                <input
                                    type="time"
                                    value={form.schedule.closeTime}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            schedule: { ...current.schedule, closeTime: event.target.value }
                                        }))
                                    }
                                    className={inputClassName}
                                />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className={labelClassName}>{t("businessSettingsHolidays")}</label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={holidayInput}
                                    onChange={(event) => setHolidayInput(event.target.value)}
                                    className={inputClassName}
                                />
                                <button
                                    type="button"
                                    onClick={addHoliday}
                                    className="rounded-xl bg-emerald-500/20 px-4 py-2 text-sm text-emerald-50"
                                >
                                    {t("add")}
                                </button>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {form.schedule.holidays.map((holiday) => (
                                    <button
                                        key={holiday}
                                        type="button"
                                        onClick={() => removeHoliday(holiday)}
                                        className="rounded-full bg-white/10 px-3 py-1 text-sm text-emerald-50"
                                    >
                                        {holiday} ×
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                        <h2 className="text-lg font-semibold text-white">{t("businessSettingsReturnsTitle")}</h2>
                        <p className="mt-1 text-sm text-emerald-50/70">{t("businessSettingsReturnsHint")}</p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <label className="flex items-center gap-3 text-sm text-emerald-50 sm:col-span-2">
                                <input
                                    type="checkbox"
                                    checked={form.returns.enabled}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            returns: { ...current.returns, enabled: event.target.checked }
                                        }))
                                    }
                                    className="h-4 w-4 rounded border-white/30 bg-white/10 text-emerald-500"
                                />
                                {t("businessSettingsReturnsEnabled")}
                            </label>
                            <div>
                                <label className={labelClassName}>{t("businessSettingsReturnWindowDays")}</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="365"
                                    value={form.returns.windowDays}
                                    onChange={(event) =>
                                        setForm((current) => ({
                                            ...current,
                                            returns: { ...current.returns, windowDays: event.target.value }
                                        }))
                                    }
                                    className={inputClassName}
                                />
                            </div>
                        </div>
                    </section>

                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-xl bg-emerald-500 px-5 py-3 font-medium text-white transition hover:bg-emerald-400 disabled:opacity-60"
                    >
                        {saving ? t("saving") : t("saveChanges")}
                    </button>
                </form>
            )}
        </PageShell>
    );
};

export default BusinessSettingsPage;
