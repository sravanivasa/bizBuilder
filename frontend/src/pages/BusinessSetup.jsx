import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createBusiness, getMyBusinesses, updateBusiness } from "../api/business";
import { BUSINESS_CATEGORIES } from "../constants/businessCategories";
import PageShell from "../components/PageShell";

const EMPTY_FORM = {
    businessName: "",
    category: "",
    phoneNumber: "",
    address: "",
    description: "",
    email: "",
    website: "",
    logo: "",
    gstin: "",
    gstEnabled: false,
    gstRate: "18",
    upiId: "",
    bankAccountName: "",
    bankName: "",
    bankAccountNumber: "",
    bankIfsc: "",
    autoConfirmOnlinePayments: false,
    razorpayEnabled: false,
    razorpayKeyId: "",
    razorpayKeySecret: ""
};

const inputClassName =
    "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-emerald-100/60 outline-none transition focus:border-emerald-300 focus:bg-white/15 focus:ring-2 focus:ring-emerald-400/30";

const labelClassName = "mb-2 block text-sm font-medium text-emerald-50";

const BusinessSetup = () => {
    const { t } = useTranslation();

    const [form, setForm] = useState(EMPTY_FORM);
    const [businessId, setBusinessId] = useState(null);
    const [isEditing, setIsEditing] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const loadBusiness = async () => {
            setLoading(true);
            setError("");

            try {
                const { data } = await getMyBusinesses();
                const business = data.businesses?.[0];

                if (business) {
                    setBusinessId(business._id);
                    setForm({
                        businessName: business.businessName || "",
                        category: business.category || "",
                        phoneNumber: business.phoneNumber || "",
                        address: business.address || "",
                        description: business.description || "",
                        email: business.email || "",
                        website: business.website || "",
                        logo: business.logo || "",
                        gstin: business.gstin || "",
                        gstEnabled: Boolean(business.gstEnabled),
                        gstRate: String(business.gstRate ?? 18),
                        upiId: business.upiId || "",
                        bankAccountName: business.bankAccountName || "",
                        bankName: business.bankName || "",
                        bankAccountNumber: business.bankAccountNumber || "",
                        bankIfsc: business.bankIfsc || "",
                        autoConfirmOnlinePayments: Boolean(business.autoConfirmOnlinePayments),
                        razorpayEnabled: Boolean(business.razorpayEnabled),
                        razorpayKeyId: business.razorpayKeyId || "",
                        razorpayKeySecret: business.hasRazorpaySecret
                            ? business.razorpayKeySecret || "••••••••"
                            : ""
                    });
                    setIsEditing(false);
                } else {
                    setIsEditing(true);
                }
            } catch (err) {
                setError(err.response?.data?.message || t("businessLoadFailed"));
            } finally {
                setLoading(false);
            }
        };

        loadBusiness();
    }, [t]);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setForm({
            ...form,
            [name]: type === "checkbox" ? checked : value
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        setSaving(true);

        const payload = {
            businessName: form.businessName.trim(),
            category: form.category,
            phoneNumber: form.phoneNumber.trim(),
            address: form.address.trim(),
            description: form.description.trim() || undefined,
            email: form.email.trim() || undefined,
            website: form.website.trim() || undefined,
            logo: form.logo.trim() || undefined,
            gstin: form.gstin.trim() || undefined,
            gstEnabled: form.gstEnabled,
            gstRate: Number(form.gstRate) || 18,
            upiId: form.upiId.trim() || undefined,
            bankAccountName: form.bankAccountName.trim() || undefined,
            bankName: form.bankName.trim() || undefined,
            bankAccountNumber: form.bankAccountNumber.trim() || undefined,
            bankIfsc: form.bankIfsc.trim() || undefined,
            autoConfirmOnlinePayments: form.autoConfirmOnlinePayments,
            razorpayEnabled: form.razorpayEnabled,
            razorpayKeyId: form.razorpayKeyId.trim() || undefined
        };

        if (form.razorpayKeySecret.trim() && form.razorpayKeySecret !== "••••••••") {
            payload.razorpayKeySecret = form.razorpayKeySecret.trim();
        }

        try {
            if (businessId) {
                const { data } = await updateBusiness(businessId, payload);
                setForm({
                    businessName: data.business.businessName || "",
                    category: data.business.category || "",
                    phoneNumber: data.business.phoneNumber || "",
                    address: data.business.address || "",
                    description: data.business.description || "",
                    email: data.business.email || "",
                    website: data.business.website || "",
                    logo: data.business.logo || "",
                    gstin: data.business.gstin || "",
                    gstEnabled: Boolean(data.business.gstEnabled),
                    gstRate: String(data.business.gstRate ?? 18),
                    upiId: data.business.upiId || "",
                    bankAccountName: data.business.bankAccountName || "",
                    bankName: data.business.bankName || "",
                    bankAccountNumber: data.business.bankAccountNumber || "",
                    bankIfsc: data.business.bankIfsc || "",
                    autoConfirmOnlinePayments: Boolean(data.business.autoConfirmOnlinePayments),
                    razorpayEnabled: Boolean(data.business.razorpayEnabled),
                    razorpayKeyId: data.business.razorpayKeyId || "",
                    razorpayKeySecret: data.business.hasRazorpaySecret
                        ? data.business.razorpayKeySecret || "••••••••"
                        : ""
                });
                setSuccess(t("businessUpdateSuccess"));
            } else {
                const { data } = await createBusiness(payload);
                setBusinessId(data.business._id);
                setSuccess(t("businessCreateSuccess"));
            }

            setIsEditing(false);
        } catch (err) {
            const validationErrors = err.response?.data?.errors;
            if (validationErrors?.length) {
                setError(validationErrors.map((item) => item.msg).join(". "));
            } else {
                setError(err.response?.data?.message || t("businessSaveFailed"));
            }
        } finally {
            setSaving(false);
        }
    };

    const getCategoryLabel = (value) => {
        const labelKey = BUSINESS_CATEGORIES.find((category) => category.value === value)?.labelKey;
        return labelKey ? t(labelKey) : value;
    };

    const renderField = (name, label, value, options = {}) => {
        const { type = "text", required = false, hint, fullWidth = false } = options;

        return (
            <div className={fullWidth ? "sm:col-span-2" : ""}>
                <label htmlFor={name} className={labelClassName}>
                    {label}
                    {required && <span className="text-red-300"> *</span>}
                </label>
                {isEditing ? (
                    type === "textarea" ? (
                        <textarea
                            id={name}
                            name={name}
                            value={value}
                            onChange={handleChange}
                            required={required}
                            rows={3}
                            className={inputClassName}
                        />
                    ) : (
                        <input
                            id={name}
                            type={type}
                            name={name}
                            value={value}
                            onChange={handleChange}
                            required={required}
                            className={inputClassName}
                        />
                    )
                ) : (
                    <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                        {value || "—"}
                    </p>
                )}
                {hint && isEditing && (
                    <p className="mt-1.5 text-xs text-emerald-100/60">{hint}</p>
                )}
            </div>
        );
    };

    return (
        <PageShell
            badge={t("business")}
            title={t("businessSetupTitle")}
            subtitle={t("businessSetupSubtitle")}
        >
            {loading ? (
                <p className="text-center text-sm text-emerald-50/70">{t("loading")}</p>
            ) : (
                <div className="space-y-6">
                    {error && (
                        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                            {error}
                        </p>
                    )}

                    {success && (
                        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                            {success}
                        </p>
                    )}

                    {!isEditing && businessId && (
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
                            <p className="text-sm text-emerald-50">{t("businessProfileSaved")}</p>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(true);
                                    setSuccess("");
                                    setError("");
                                }}
                                className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                            >
                                {t("editBusiness")}
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-5 sm:grid-cols-2">
                            {renderField("businessName", t("businessName"), form.businessName, {
                                required: true
                            })}

                            <div>
                                <label htmlFor="category" className={labelClassName}>
                                    {t("category")}
                                    <span className="text-red-300"> *</span>
                                </label>
                                {isEditing ? (
                                    <select
                                        id="category"
                                        name="category"
                                        value={form.category}
                                        onChange={handleChange}
                                        required
                                        className={`${inputClassName} appearance-none`}
                                    >
                                        <option value="" disabled className="bg-slate-900 text-white">
                                            {t("selectCategory")}
                                        </option>
                                        {BUSINESS_CATEGORIES.map((category) => (
                                            <option
                                                key={category.value}
                                                value={category.value}
                                                className="bg-slate-900 text-white"
                                            >
                                                {t(category.labelKey)}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                                        {getCategoryLabel(form.category)}
                                    </p>
                                )}
                            </div>

                            {renderField("phoneNumber", t("phoneNumber"), form.phoneNumber, {
                                type: "tel",
                                required: true,
                                hint: t("phoneNumberHint")
                            })}

                            {renderField("address", t("address"), form.address, {
                                required: true
                            })}

                            {renderField("email", t("email"), form.email, {
                                type: "email"
                            })}

                            {renderField("website", t("website"), form.website, {
                                type: "url"
                            })}

                            {renderField("logo", t("logo"), form.logo, {
                                hint: t("logoHint")
                            })}

                            {renderField("description", t("description"), form.description, {
                                type: "textarea",
                                fullWidth: true
                            })}

                            <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5">
                                <h3 className="text-sm font-semibold text-emerald-50">{t("gstSettingsTitle")}</h3>
                                <p className="mt-1 text-xs text-emerald-100/60">{t("gstSettingsHint")}</p>

                                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        {isEditing ? (
                                            <label className="flex items-center gap-3 text-sm text-emerald-50">
                                                <input
                                                    type="checkbox"
                                                    name="gstEnabled"
                                                    checked={form.gstEnabled}
                                                    onChange={handleChange}
                                                    className="h-4 w-4 rounded border-white/30 bg-white/10 text-emerald-500"
                                                />
                                                {t("gstEnabled")}
                                            </label>
                                        ) : (
                                            <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                                                {form.gstEnabled ? t("gstEnabled") : "—"}
                                            </p>
                                        )}
                                    </div>

                                    {renderField("gstin", t("gstin"), form.gstin, {
                                        hint: t("gstinHint")
                                    })}

                                    <div>
                                        <label htmlFor="gstRate" className={labelClassName}>
                                            {t("gstRate")}
                                        </label>
                                        {isEditing ? (
                                            <select
                                                id="gstRate"
                                                name="gstRate"
                                                value={form.gstRate}
                                                onChange={handleChange}
                                                disabled={!form.gstEnabled}
                                                className={`${inputClassName} appearance-none disabled:opacity-50`}
                                            >
                                                <option value="5" className="bg-slate-900 text-white">
                                                    5%
                                                </option>
                                                <option value="12" className="bg-slate-900 text-white">
                                                    12%
                                                </option>
                                                <option value="18" className="bg-slate-900 text-white">
                                                    18%
                                                </option>
                                            </select>
                                        ) : (
                                            <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                                                {form.gstEnabled ? `${form.gstRate}%` : "—"}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5">
                                <h3 className="text-sm font-semibold text-emerald-50">{t("paymentSettingsTitle")}</h3>
                                <p className="mt-1 text-xs text-emerald-100/60">{t("paymentSettingsHint")}</p>

                                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                                    {renderField("upiId", t("upiId"), form.upiId, {
                                        hint: t("upiIdHint")
                                    })}

                                    {renderField("bankAccountName", t("bankAccountName"), form.bankAccountName)}

                                    {renderField("bankName", t("bankName"), form.bankName)}

                                    {renderField("bankAccountNumber", t("bankAccountNumber"), form.bankAccountNumber)}

                                    {renderField("bankIfsc", t("bankIfsc"), form.bankIfsc, {
                                        hint: t("bankIfscHint")
                                    })}
                                </div>

                                <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-500/10 p-4">
                                    <label className="flex cursor-pointer items-start gap-3">
                                        <input
                                            type="checkbox"
                                            name="autoConfirmOnlinePayments"
                                            checked={form.autoConfirmOnlinePayments}
                                            onChange={handleChange}
                                            disabled={!isEditing}
                                            className="mt-1 h-4 w-4 rounded border-white/30 bg-white/10 text-emerald-500 focus:ring-emerald-400/40 disabled:opacity-50"
                                        />
                                        <span>
                                            <span className="block text-sm font-medium text-emerald-50">
                                                {t("autoConfirmOnlinePayments")}
                                            </span>
                                            <span className="mt-1 block text-xs text-amber-100/80">
                                                {t("autoConfirmOnlinePaymentsHint")}
                                            </span>
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-5">
                                <h3 className="text-sm font-semibold text-emerald-50">{t("razorpaySettings")}</h3>
                                <p className="mt-1 text-xs text-emerald-100/60">{t("razorpaySettingsHint")}</p>

                                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        {isEditing ? (
                                            <label className="flex items-center gap-3 text-sm text-emerald-50">
                                                <input
                                                    type="checkbox"
                                                    name="razorpayEnabled"
                                                    checked={form.razorpayEnabled}
                                                    onChange={handleChange}
                                                    className="h-4 w-4 rounded border-white/30 bg-white/10 text-emerald-500"
                                                />
                                                {t("razorpayEnabled")}
                                            </label>
                                        ) : (
                                            <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white">
                                                {form.razorpayEnabled ? t("razorpayEnabled") : "—"}
                                            </p>
                                        )}
                                    </div>

                                    {renderField("razorpayKeyId", t("razorpayKeyId"), form.razorpayKeyId, {
                                        hint: t("razorpayKeyIdHint")
                                    })}

                                    {renderField(
                                        "razorpayKeySecret",
                                        t("razorpayKeySecret"),
                                        form.razorpayKeySecret,
                                        {
                                            type: "password",
                                            hint: t("razorpayKeySecretHint")
                                        }
                                    )}
                                </div>
                            </div>
                        </div>

                        {isEditing && (
                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving
                                        ? t("loading")
                                        : businessId
                                          ? t("saveBusiness")
                                          : t("createBusiness")}
                                </button>

                                {businessId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setError("");
                                            setSuccess("");
                                        }}
                                        className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                                    >
                                        {t("cancelEdit")}
                                    </button>
                                )}
                            </div>
                        )}
                    </form>
                </div>
            )}
        </PageShell>
    );
};

export default BusinessSetup;
