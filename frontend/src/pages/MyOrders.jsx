import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { requestPublicReturn, trackPublicOrder, trackPublicOrderByToken } from "../api/public";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { formatIndianPhone } from "../utils/checkoutValidation";
import {
    getCustomerOrders,
    getStorePath,
    getTrackPath,
    updateCustomerOrderStatus
} from "../utils/customerOrdersStorage";
import { canRequestReturn, normalizeReturnStatus, returnBadgeClass, statusBadgeClass } from "../utils/orderStatus";
import { canViewInvoice } from "../utils/paymentStatus";

const inputClassName =
    "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-emerald-100/60 outline-none transition focus:border-emerald-300 focus:bg-white/15 focus:ring-2 focus:ring-emerald-400/30";

const labelClassName = "mb-2 block text-sm font-medium text-emerald-50";

const formatPrice = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

const formatDate = (value) => {
    if (!value) {
        return "";
    }

    return new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
};

const MyOrders = () => {
    const { storeSlug } = useParams();
    const { t } = useTranslation();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [returnTarget, setReturnTarget] = useState(null);
    const [returnReason, setReturnReason] = useState("");
    const [returnPhotoFiles, setReturnPhotoFiles] = useState([]);
    const [returnVideoFile, setReturnVideoFile] = useState(null);
    const [photoPreviewUrls, setPhotoPreviewUrls] = useState([]);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
    const [returnLoading, setReturnLoading] = useState(false);
    const [returnError, setReturnError] = useState("");

    const loadOrders = useCallback(async () => {
        const stored = getCustomerOrders(storeSlug);
        setOrders(stored);

        if (!stored.length) {
            setLoading(false);
            return;
        }

        const refreshed = await Promise.all(
            stored.map(async (item) => {
                try {
                    let data;
                    if (item.trackingToken) {
                        ({ data } = await trackPublicOrderByToken(item.trackingToken));
                    } else {
                        const storeKey = item.businessSlug || item.businessId;
                        ({ data } = await trackPublicOrder(storeKey, {
                            orderId: item.shortOrderId,
                            phone: item.phone
                        }));
                    }
                    const order = data.order;
                    const status = order?.orderStatus;
                    if (status) {
                        updateCustomerOrderStatus(item.orderId, status);
                    }
                    return {
                        ...item,
                        orderStatus: status || item.orderStatus,
                        paymentStatus: order?.paymentStatus || item.paymentStatus,
                        paymentMethod: order?.paymentMethod || item.paymentMethod,
                        returnStatus: order?.returnStatus || item.returnStatus || "None",
                        returnReason: order?.returnReason || item.returnReason,
                        returnPhotos: order?.returnPhotos || item.returnPhotos || [],
                        returnVideo: order?.returnVideo || item.returnVideo || null,
                        businessName:
                            order?.business?.businessName || item.businessName,
                        businessSlug:
                            order?.business?.slug || item.businessSlug,
                        businessId: order?.businessId || item.businessId
                    };
                } catch {
                    return item;
                }
            })
        );

        setOrders(refreshed);
        setLoading(false);
    }, [storeSlug]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const getStatusLabel = (status) => t(`orderStatus${status}`);
    const getReturnStatusLabel = (status) =>
        t(`returnStatus${normalizeReturnStatus(status)}`);

    const trackPath = (item) => getTrackPath(item);

    const shopPath = storeSlug ? `/store/${storeSlug}` : null;

    const resetReturnEvidence = () => {
        photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
        if (videoPreviewUrl) {
            URL.revokeObjectURL(videoPreviewUrl);
        }
        setReturnPhotoFiles([]);
        setReturnVideoFile(null);
        setPhotoPreviewUrls([]);
        setVideoPreviewUrl("");
    };

    const handleReturnPhotoSelect = (event) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) {
            return;
        }

        photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
        const combined = [...returnPhotoFiles, ...files].slice(0, 5);
        setReturnPhotoFiles(combined);
        setPhotoPreviewUrls(combined.map((file) => URL.createObjectURL(file)));
        event.target.value = "";
    };

    const handleReturnVideoSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        if (videoPreviewUrl) {
            URL.revokeObjectURL(videoPreviewUrl);
        }
        setReturnVideoFile(file);
        setVideoPreviewUrl(URL.createObjectURL(file));
        event.target.value = "";
    };

    const handleReturnRequest = async (event) => {
        event.preventDefault();
        if (!returnTarget) {
            return;
        }

        setReturnError("");
        setReturnLoading(true);

        const businessId =
            returnTarget.businessSlug || returnTarget.businessId || storeSlug;

        try {
            const formData = new FormData();
            formData.append("phone", formatIndianPhone(returnTarget.phone));
            formData.append("reason", returnReason.trim());
            returnPhotoFiles.forEach((file) => formData.append("photos", file));
            if (returnVideoFile) {
                formData.append("video", returnVideoFile);
            }

            const { data } = await requestPublicReturn(
                businessId,
                returnTarget.shortOrderId,
                formData
            );
            setOrders((current) =>
                current.map((item) =>
                    item.orderId === returnTarget.orderId
                        ? {
                              ...item,
                              returnStatus: "Requested",
                              returnReason: returnReason.trim(),
                              returnPhotos: data.order?.returnPhotos || [],
                              returnVideo: data.order?.returnVideo || null
                          }
                        : item
                )
            );
            setReturnTarget(null);
            setReturnReason("");
            resetReturnEvidence();
        } catch (err) {
            setReturnError(err.response?.data?.message || t("returnRequestFailed"));
        } finally {
            setReturnLoading(false);
        }
    };

    const openReturnModal = (item) => {
        setReturnTarget(item);
        setReturnReason("");
        setReturnError("");
        resetReturnEvidence();
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-emerald-500/30 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-teal-400/20 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6">
                <div className="mb-8 flex items-center justify-between gap-4">
                    <Link
                        to={shopPath || "/"}
                        className="inline-flex items-center gap-2 transition hover:opacity-80"
                    >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-500/30">
                            B
                        </span>
                        <span className="text-xl font-bold text-white">{t("appName")}</span>
                    </Link>
                    <LanguageSwitcher variant="auth" />
                </div>

                <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                        {t("myOrdersBadge")}
                    </p>
                    <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                        {storeSlug ? t("myOrdersShopTitle") : t("myOrdersTitle")}
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-emerald-50/80">
                        {t("myOrdersSubtitle")}
                    </p>

                    {loading ? (
                        <div className="mt-8 space-y-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-4"
                                >
                                    <div className="h-4 w-24 rounded bg-white/10" />
                                    <div className="mt-3 h-5 w-2/3 rounded bg-white/10" />
                                    <div className="mt-2 h-4 w-1/3 rounded bg-white/10" />
                                </div>
                            ))}
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="mt-8 rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-12 text-center">
                            <span className="text-4xl">📦</span>
                            <p className="mt-4 text-sm text-emerald-50/80">{t("myOrdersEmpty")}</p>
                            {shopPath && (
                                <Link
                                    to={shopPath}
                                    className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400"
                                >
                                    {t("myOrdersBrowseShop")}
                                </Link>
                            )}
                        </div>
                    ) : (
                        <ul className="mt-6 space-y-3">
                            {orders.map((item) => {
                                const normalizedReturn = normalizeReturnStatus(item.returnStatus);
                                const showReturnBadge =
                                    normalizedReturn && normalizedReturn !== "None";

                                return (
                                    <li
                                        key={item.orderId}
                                        className="rounded-2xl border border-white/10 bg-white/5 p-4"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-semibold text-white">
                                                #{item.shortOrderId}
                                            </span>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span
                                                    className={`rounded-full border px-3 py-1 text-xs font-medium ${statusBadgeClass(
                                                        item.orderStatus
                                                    )}`}
                                                >
                                                    {getStatusLabel(item.orderStatus)}
                                                </span>
                                                {showReturnBadge && (
                                                    <span
                                                        className={`rounded-full border px-3 py-1 text-xs font-medium ${returnBadgeClass(
                                                            item.returnStatus
                                                        )}`}
                                                    >
                                                        {getReturnStatusLabel(item.returnStatus)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {item.businessName && (
                                            <p className="mt-2 text-sm text-emerald-50/70">
                                                {item.businessName}
                                            </p>
                                        )}
                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-emerald-50/80">
                                            <span>{formatDate(item.createdAt)}</span>
                                            <span className="font-semibold text-emerald-200">
                                                {formatPrice(item.totalAmount)}
                                            </span>
                                        </div>
                                        {item.returnReason && (
                                            <p className="mt-2 text-xs text-emerald-50/70">
                                                <span className="text-emerald-100/60">
                                                    {t("returnReason")}:{" "}
                                                </span>
                                                {item.returnReason}
                                            </p>
                                        )}
                                        <div className="mt-3 flex flex-wrap items-center gap-3">
                                            <Link
                                                to={trackPath(item)}
                                                className="text-xs font-medium text-emerald-300 transition hover:text-emerald-200"
                                            >
                                                {t("myOrdersViewStatus")} →
                                            </Link>
                                            {item.trackingToken && canViewInvoice(item.paymentStatus) && (
                                                <Link
                                                    to={`/invoice/${item.trackingToken}`}
                                                    className="text-xs font-medium text-emerald-300 transition hover:text-emerald-200"
                                                >
                                                    {t("viewInvoice")} →
                                                </Link>
                                            )}
                                            {canRequestReturn(item) && (
                                                <button
                                                    type="button"
                                                    onClick={() => openReturnModal(item)}
                                                    className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:bg-amber-500/20"
                                                >
                                                    {t("requestReturn")}
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">
                        {shopPath && (
                            <Link
                                to={shopPath}
                                className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                            >
                                {t("myOrdersBackToShop")}
                            </Link>
                        )}
                        {storeSlug ? (
                            <Link
                                to={`/store/${storeSlug}/track`}
                                className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
                            >
                                {t("storefrontTrackOrderLink")}
                            </Link>
                        ) : (
                            <Link
                                to="/track-order"
                                className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
                            >
                                {t("storefrontTrackOrderLink")}
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {returnTarget && (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
                    <button
                        type="button"
                        aria-label={t("close")}
                        onClick={() => {
                            setReturnTarget(null);
                            resetReturnEvidence();
                        }}
                        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                    />
                    <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
                        <h2 className="text-lg font-bold text-white">{t("requestReturnTitle")}</h2>
                        <p className="mt-2 text-sm text-emerald-50/70">{t("requestReturnSubtitle")}</p>
                        <form onSubmit={handleReturnRequest} className="mt-4 space-y-4">
                            {returnError && (
                                <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                                    {returnError}
                                </p>
                            )}
                            <div>
                                <label className={labelClassName} htmlFor="myOrdersReturnReason">
                                    {t("returnReason")}
                                </label>
                                <textarea
                                    id="myOrdersReturnReason"
                                    rows={3}
                                    value={returnReason}
                                    onChange={(event) => setReturnReason(event.target.value)}
                                    placeholder={t("returnReasonPlaceholder")}
                                    className={inputClassName}
                                />
                            </div>
                            <div>
                                <label className={labelClassName} htmlFor="myOrdersReturnPhotos">
                                    {t("returnEvidencePhotos")}
                                </label>
                                <p className="mb-2 text-xs text-emerald-50/60">{t("returnEvidenceOptional")}</p>
                                <input
                                    id="myOrdersReturnPhotos"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    multiple
                                    onChange={handleReturnPhotoSelect}
                                    className="block w-full text-sm text-emerald-50/80 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                                />
                                {photoPreviewUrls.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {photoPreviewUrls.map((url, index) => (
                                            <img
                                                key={url}
                                                src={url}
                                                alt={t("returnEvidencePhotoAlt", { index: index + 1 })}
                                                className="h-20 w-20 rounded-lg object-cover"
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className={labelClassName} htmlFor="myOrdersReturnVideo">
                                    {t("returnEvidenceVideo")}
                                </label>
                                <p className="mb-2 text-xs text-emerald-50/60">{t("returnEvidenceVideoHint")}</p>
                                <input
                                    id="myOrdersReturnVideo"
                                    type="file"
                                    accept="video/mp4,video/quicktime"
                                    onChange={handleReturnVideoSelect}
                                    className="block w-full text-sm text-emerald-50/80 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                                />
                                {videoPreviewUrl && (
                                    <video
                                        src={videoPreviewUrl}
                                        controls
                                        className="mt-3 max-h-40 w-full rounded-lg"
                                    />
                                )}
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    disabled={returnLoading}
                                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:from-emerald-400 hover:to-teal-400 disabled:opacity-60"
                                >
                                    {returnLoading ? t("loading") : t("submitReturnRequest")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setReturnTarget(null);
                                        resetReturnEvidence();
                                    }}
                                    className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                                >
                                    {t("cancel")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyOrders;
