import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getDeliveryOrder, uploadDeliveryPhoto, verifyDeliveryOtp } from "../api/public";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { statusBadgeClass } from "../utils/orderStatus";

const inputClassName =
    "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-emerald-100/60 outline-none transition focus:border-emerald-300 focus:bg-white/15 focus:ring-2 focus:ring-emerald-400/30";

const labelClassName = "mb-2 block text-sm font-medium text-emerald-50";

const formatPrice = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

const DeliverOrder = () => {
    const { t } = useTranslation();
    const { deliveryToken } = useParams();

    const [loading, setLoading] = useState(true);
    const [order, setOrder] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [otp, setOtp] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [delivered, setDelivered] = useState(false);
    const fileInputRef = useRef(null);

    const getStatusLabel = (status) => t(`orderStatus${status}`);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError("");

            try {
                const { data } = await getDeliveryOrder(deliveryToken);
                if (!cancelled) {
                    setOrder(data.order);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.message || t("deliverLoadFailed"));
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        if (deliveryToken) {
            load();
        }

        return () => {
            cancelled = true;
        };
    }, [deliveryToken, t]);

    const handlePhotoChange = async (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setUploading(true);
        setError("");
        setSuccess("");

        try {
            const { data } = await uploadDeliveryPhoto(deliveryToken, file);
            setOrder((current) => ({ ...current, deliveryPhoto: data.deliveryPhoto }));
            setSuccess(t("deliverPhotoSuccess"));
        } catch (err) {
            setError(err.response?.data?.message || t("deliverPhotoFailed"));
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleVerifyOtp = async (event) => {
        event.preventDefault();

        if (!otp.trim()) {
            setError(t("deliverOtpRequired"));
            return;
        }

        setVerifying(true);
        setError("");
        setSuccess("");

        try {
            const { data } = await verifyDeliveryOtp(deliveryToken, otp.trim());
            setOrder(data.order);
            setDelivered(true);
            setSuccess(t("deliverSuccess"));
        } catch (err) {
            setError(err.response?.data?.message || t("deliverOtpFailed"));
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-emerald-500/30 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-teal-400/20 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto max-w-lg px-4 py-6 sm:px-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div className="inline-flex items-center gap-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-500/30">
                            B
                        </span>
                        <span className="text-lg font-bold text-white">{t("deliverPageTitle")}</span>
                    </div>
                    <LanguageSwitcher variant="auth" />
                </div>

                {loading ? (
                    <p className="text-sm text-emerald-50/80">{t("loading")}</p>
                ) : delivered ? (
                    <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-center">
                        <p className="text-2xl">✓</p>
                        <h1 className="mt-3 text-xl font-bold text-white">{t("deliverSuccessTitle")}</h1>
                        <p className="mt-2 text-sm text-emerald-50/80">{t("deliverSuccessMessage")}</p>
                    </div>
                ) : order ? (
                    <div className="space-y-4">
                        <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-lg font-bold text-white">
                                    {t("orderIdLabel", { id: order.shortOrderId })}
                                </h1>
                                <span
                                    className={`rounded-full border px-3 py-1 text-xs font-medium ${statusBadgeClass(
                                        order.orderStatus
                                    )}`}
                                >
                                    {getStatusLabel(order.orderStatus)}
                                </span>
                            </div>

                            <div className="mt-4 space-y-2 text-sm">
                                <p className="text-emerald-50/80">
                                    <span className="text-emerald-100/60">{t("customerName")}: </span>
                                    {order.customerName}
                                </p>
                                <p className="text-emerald-50/80">
                                    <span className="text-emerald-100/60">{t("customerPhone")}: </span>
                                    <a
                                        href={`tel:${order.customerPhone}`}
                                        className="font-medium text-emerald-200 underline"
                                    >
                                        {order.customerPhone}
                                    </a>
                                </p>
                                <p className="text-emerald-50/80">
                                    <span className="text-emerald-100/60">{t("customerAddress")}: </span>
                                    {order.customerAddress}
                                </p>
                                <p className="text-emerald-50/80">
                                    <span className="text-emerald-100/60">{t("totalAmount")}: </span>
                                    <span className="font-semibold text-emerald-200">
                                        {formatPrice(order.totalAmount)}
                                    </span>
                                </p>
                            </div>

                            {order.items?.length > 0 && (
                                <div className="mt-4">
                                    <p className="mb-2 text-sm font-medium text-emerald-50">{t("orderLineItems")}</p>
                                    <ul className="space-y-2">
                                        {order.items.map((item, index) => (
                                            <li
                                                key={`${item.productName}-${index}`}
                                                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-emerald-50/80"
                                            >
                                                {item.productName} × {item.quantity}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
                            <h2 className="text-sm font-semibold text-white">{t("deliverPhotoSection")}</h2>
                            <p className="mt-1 text-xs text-emerald-50/70">{t("deliverPhotoHint")}</p>

                            {order.deliveryPhoto && (
                                <img
                                    src={order.deliveryPhoto}
                                    alt={t("deliverPhotoAlt")}
                                    className="mt-3 max-h-48 w-full rounded-xl object-cover"
                                />
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handlePhotoChange}
                                className="mt-3 block w-full text-sm text-emerald-50/80 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                            />
                            {uploading && (
                                <p className="mt-2 text-xs text-emerald-50/70">{t("deliverPhotoUploading")}</p>
                            )}
                        </div>

                        {order.hasOtp && (
                            <form
                                onSubmit={handleVerifyOtp}
                                className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl"
                            >
                                <h2 className="text-sm font-semibold text-white">{t("deliverOtpSection")}</h2>
                                <p className="mt-1 text-xs text-emerald-50/70">{t("deliverOtpHint")}</p>

                                <label className={`${labelClassName} mt-4`} htmlFor="deliveryOtp">
                                    {t("deliverOtpLabel")}
                                </label>
                                <input
                                    id="deliveryOtp"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(event) => setOtp(event.target.value)}
                                    placeholder="1234"
                                    className={inputClassName}
                                />

                                <button
                                    type="submit"
                                    disabled={verifying}
                                    className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {verifying ? t("loading") : t("deliverMarkDelivered")}
                                </button>
                            </form>
                        )}
                    </div>
                ) : (
                    <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6">
                        <p className="text-sm text-red-100">{error || t("deliverLoadFailed")}</p>
                    </div>
                )}

                {error && !loading && order && !delivered && (
                    <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                        {error}
                    </p>
                )}

                {success && !delivered && (
                    <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                        {success}
                    </p>
                )}

                <p className="mt-6 text-center text-xs text-emerald-50/50">
                    <Link to="/" className="hover:text-emerald-200">
                        {t("appName")}
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default DeliverOrder;
