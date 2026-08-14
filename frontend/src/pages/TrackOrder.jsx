import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { requestPublicReturn, trackPublicOrder, trackPublicOrderByToken, trackPublicOrderGlobal } from "../api/public";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { formatIndianPhone, isValidIndianPhone } from "../utils/checkoutValidation";
import {
    getCustomerOrders,
    getLastPhoneForStore,
    getStorePath
} from "../utils/customerOrdersStorage";
import {
    canRequestReturn,
    normalizeReturnStatus,
    returnBadgeClass,
    RETURN_PROGRESS_STAGES,
    statusBadgeClass
} from "../utils/orderStatus";
import { getOrderAmounts, formatPrice } from "../utils/gstDisplay";
import { getPaymentLabelKey } from "../constants/paymentMethods";
import { getPaymentStatusLabelKey, paymentStatusBadgeClass, canViewInvoice } from "../utils/paymentStatus";
import { buildPhoneLink, buildWhatsAppLink } from "../utils/contactShop";
import { formatDateTime } from "../utils/timeAgo";

const inputClassName =
    "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-emerald-100/60 outline-none transition focus:border-emerald-300 focus:bg-white/15 focus:ring-2 focus:ring-emerald-400/30";

const labelClassName = "mb-2 block text-sm font-medium text-emerald-50";

const formatDate = (value) => {
    if (!value) {
        return "";
    }

    return new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

const TrackOrder = () => {
    const { t } = useTranslation();
    const { storeSlug: routeStoreSlug, token: routeToken } = useParams();
    const [searchParams] = useSearchParams();

    const isTokenMode = Boolean(routeToken);

    const queryBusinessId = searchParams.get("businessId") || "";
    const resolvedStoreKey = routeStoreSlug || queryBusinessId;
    const hideBusinessIdField = Boolean(routeStoreSlug || queryBusinessId);

    const [businessId, setBusinessId] = useState(resolvedStoreKey);
    const [orderId, setOrderId] = useState(searchParams.get("orderId") || "");
    const [phone, setPhone] = useState(searchParams.get("phone") || "");
    const [loading, setLoading] = useState(false);
    const [tokenLoading, setTokenLoading] = useState(isTokenMode);
    const [error, setError] = useState("");
    const [order, setOrder] = useState(null);

    const [returnReason, setReturnReason] = useState("");
    const [returnPhotoFiles, setReturnPhotoFiles] = useState([]);
    const [returnVideoFile, setReturnVideoFile] = useState(null);
    const [photoPreviewUrls, setPhotoPreviewUrls] = useState([]);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
    const [returnOpen, setReturnOpen] = useState(false);
    const [returnLoading, setReturnLoading] = useState(false);
    const [returnSuccess, setReturnSuccess] = useState("");
    const autoSubmitted = useRef(false);

    const getStatusLabel = (status) => t(`orderStatus${status}`);
    const getReturnStatusLabel = (status) =>
        t(`returnStatus${normalizeReturnStatus(status)}`);

    const effectiveBusinessId = resolvedStoreKey || businessId.trim();

    const effectivePhone = phone.trim() || order?.customerPhone || "";

    const normalizedReturnStatus = order ? normalizeReturnStatus(order.returnStatus) : "None";

    const showReturnProgress =
        order &&
        normalizedReturnStatus !== "None" &&
        normalizedReturnStatus !== "Rejected";

    const handleTrack = async (event) => {
        event.preventDefault();
        setError("");
        setReturnSuccess("");
        setOrder(null);

        if (!orderId.trim() || !phone.trim()) {
            setError(t("trackOrderFieldsRequiredSimple"));
            return;
        }

        if (!hideBusinessIdField && !businessId.trim()) {
            setError(t("trackOrderFieldsRequired"));
            return;
        }

        if (!isValidIndianPhone(phone)) {
            setError(t("validationPhoneInvalid"));
            return;
        }

        setLoading(true);

        try {
            const formattedPhone = formatIndianPhone(phone);
            const trimmedOrderId = orderId.trim();

            let data;
            if (effectiveBusinessId) {
                ({ data } = await trackPublicOrder(effectiveBusinessId, {
                    orderId: trimmedOrderId,
                    phone: formattedPhone
                }));
            } else {
                ({ data } = await trackPublicOrderGlobal({
                    orderId: trimmedOrderId,
                    phone: formattedPhone
                }));
            }

            setOrder(data.order);

            if (!effectiveBusinessId && data.order?.businessId) {
                setBusinessId(data.order.businessId);
            }
        } catch (err) {
            setError(err.response?.data?.message || t("trackOrderFailed"));
        } finally {
            setLoading(false);
        }
    };

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

    const closeReturnModal = () => {
        setReturnOpen(false);
        resetReturnEvidence();
    };

    const handleReturnRequest = async (event) => {
        event.preventDefault();
        setReturnSuccess("");
        setError("");

        const returnBusinessId =
            effectiveBusinessId ||
            order?.businessId ||
            order?.business?._id ||
            businessId.trim();

        if (!returnBusinessId) {
            setError(t("trackOrderFailed"));
            return;
        }

        setReturnLoading(true);

        try {
            const formData = new FormData();
            formData.append("phone", formatIndianPhone(effectivePhone));
            formData.append("reason", returnReason.trim());
            returnPhotoFiles.forEach((file) => formData.append("photos", file));
            if (returnVideoFile) {
                formData.append("video", returnVideoFile);
            }

            const { data } = await requestPublicReturn(returnBusinessId, orderId.trim(), formData);
            setOrder(data.order);
            setReturnSuccess(t("returnRequestSuccess"));
            setReturnOpen(false);
            setReturnReason("");
            resetReturnEvidence();
        } catch (err) {
            setError(err.response?.data?.message || t("returnRequestFailed"));
        } finally {
            setReturnLoading(false);
        }
    };

    useEffect(() => {
        if (!routeToken) {
            return;
        }

        let cancelled = false;

        const loadByToken = async () => {
            setTokenLoading(true);
            setError("");
            setOrder(null);

            try {
                const { data } = await trackPublicOrderByToken(routeToken);
                if (cancelled) {
                    return;
                }

                setOrder(data.order);
                setOrderId(data.order?.shortOrderId || "");
                if (data.order?.customerPhone) {
                    setPhone(data.order.customerPhone);
                }
                if (data.order?.businessId) {
                    setBusinessId(data.order.businessId);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.response?.data?.message || t("trackOrderFailed"));
                }
            } finally {
                if (!cancelled) {
                    setTokenLoading(false);
                }
            }
        };

        loadByToken();

        return () => {
            cancelled = true;
        };
    }, [routeToken, t]);

    useEffect(() => {
        if (isTokenMode || !resolvedStoreKey) {
            return;
        }

        const storedOrders = getCustomerOrders(resolvedStoreKey);
        const storedPhone = getLastPhoneForStore(resolvedStoreKey);

        if (!searchParams.get("phone") && storedPhone) {
            setPhone(storedPhone);
        }

        if (!searchParams.get("orderId") && storedOrders.length === 1) {
            setOrderId(storedOrders[0].shortOrderId);
            if (!searchParams.get("phone")) {
                setPhone(storedOrders[0].phone || storedPhone);
            }
        }
    }, [resolvedStoreKey, searchParams, isTokenMode]);

    useEffect(() => {
        if (isTokenMode || autoSubmitted.current) {
            return;
        }

        const oid = searchParams.get("orderId") || orderId;
        const ph = searchParams.get("phone") || phone;

        if (!oid || !ph) {
            return;
        }

        if (hideBusinessIdField || queryBusinessId) {
            autoSubmitted.current = true;
            const form = document.getElementById("track-order-form");
            form?.requestSubmit();
        }
    }, [searchParams, hideBusinessIdField, queryBusinessId, orderId, phone, isTokenMode]);

    const phoneTrackPath = routeStoreSlug
        ? `${getStorePath(routeStoreSlug)}/track`
        : effectiveBusinessId
          ? `${getStorePath(effectiveBusinessId)}/track`
          : "/track-order";

    const myOrdersPath = routeStoreSlug
        ? `${getStorePath(routeStoreSlug)}/my-orders`
        : "/my-orders";

    const shopPath = routeStoreSlug ? getStorePath(routeStoreSlug) : "/";

    const payPath = routeToken
        ? routeStoreSlug
            ? `${getStorePath(routeStoreSlug)}/pay/${routeToken}`
            : `/pay/${routeToken}`
        : null;

    const shopPhone = order?.business?.phoneNumber;
    const phoneLink = buildPhoneLink(shopPhone);
    const whatsAppLink = buildWhatsAppLink(
        shopPhone,
        order
            ? t("contactShopWhatsAppMessage", {
                  id: order.shortOrderId,
                  amount: formatPrice(getOrderAmounts(order).totalAmount)
              })
            : ""
    );

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-emerald-500/30 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-teal-400/20 blur-3xl" />
            </div>

            <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:px-6">
                <div className="mb-8 flex items-center justify-between gap-4">
                    <Link to={shopPath} className="inline-flex items-center gap-2 transition hover:opacity-80">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-500/30">
                            B
                        </span>
                        <span className="text-xl font-bold text-white">{t("appName")}</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link
                            to={myOrdersPath}
                            className="hidden rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-white/20 sm:inline-flex"
                        >
                            {t("storefrontMyOrdersLink")}
                        </Link>
                        <LanguageSwitcher variant="auth" />
                    </div>
                </div>

                <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                        {t("trackOrderBadge")}
                    </p>
                    <h1 className="mt-3 text-2xl font-bold text-white sm:text-3xl">{t("trackOrderTitle")}</h1>
                    <p className="mt-2 text-sm leading-6 text-emerald-50/80">
                        {isTokenMode
                            ? t("trackOrderSubtitleToken")
                            : hideBusinessIdField
                              ? t("trackOrderSubtitleSimple")
                              : t("trackOrderSubtitle")}
                    </p>

                    {tokenLoading ? (
                        <p className="mt-6 text-sm text-emerald-50/80">{t("loading")}</p>
                    ) : !isTokenMode ? (
                    <form id="track-order-form" onSubmit={handleTrack} className="mt-6 space-y-4">
                        {!hideBusinessIdField && (
                            <div>
                                <label className={labelClassName} htmlFor="businessId">
                                    {t("trackOrderBusinessId")}
                                </label>
                                <input
                                    id="businessId"
                                    type="text"
                                    value={businessId}
                                    onChange={(event) => setBusinessId(event.target.value)}
                                    placeholder={t("trackOrderBusinessIdPlaceholder")}
                                    className={inputClassName}
                                />
                            </div>
                        )}

                        <div>
                            <label className={labelClassName} htmlFor="orderId">
                                {t("trackOrderOrderId")}
                            </label>
                            <input
                                id="orderId"
                                type="text"
                                value={orderId}
                                onChange={(event) => setOrderId(event.target.value)}
                                placeholder={t("trackOrderOrderIdPlaceholder")}
                                className={inputClassName}
                            />
                        </div>

                        <div>
                            <label className={labelClassName} htmlFor="phone">
                                {t("customerPhone")}
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={(event) => setPhone(event.target.value)}
                                placeholder={t("trackOrderPhonePlaceholder")}
                                className={inputClassName}
                            />
                            <p className="mt-1.5 text-xs text-emerald-100/60">{t("trackOrderPhoneHint")}</p>
                        </div>

                        {error && (
                            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? t("loading") : t("trackOrderSubmit")}
                        </button>
                    </form>
                    ) : (
                        <div className="mt-6 space-y-4">
                            {error && (
                                <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                                    {error}
                                </p>
                            )}
                            <Link
                                to={phoneTrackPath}
                                className="inline-flex text-sm font-medium text-emerald-300 transition hover:text-emerald-200"
                            >
                                {t("trackOrderPhoneFallback")} →
                            </Link>
                        </div>
                    )}

                    {!isTokenMode && (
                    <Link
                        to={myOrdersPath}
                        className="mt-4 inline-flex text-sm font-medium text-emerald-300 transition hover:text-emerald-200"
                    >
                        {t("storefrontMyOrdersLink")} →
                    </Link>
                    )}
                </div>

                {returnSuccess && (
                    <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                        {returnSuccess}
                    </p>
                )}

                {order && (
                    <div className="mt-6 space-y-4 rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl sm:p-8">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-bold text-white">
                                {t("orderIdLabel", { id: order.shortOrderId })}
                            </h2>
                            <span
                                className={`rounded-full border px-3 py-1 text-xs font-medium ${statusBadgeClass(
                                    order.orderStatus
                                )}`}
                            >
                                {getStatusLabel(order.orderStatus)}
                            </span>
                            {order.returnStatus && order.returnStatus !== "None" && (
                                <span
                                    className={`rounded-full border px-3 py-1 text-xs font-medium ${returnBadgeClass(
                                        order.returnStatus
                                    )}`}
                                >
                                    {getReturnStatusLabel(order.returnStatus)}
                                </span>
                            )}
                        </div>

                        <p className="text-sm text-emerald-50/80">
                            {t("trackOrderShopLabel")}:{" "}
                            <span className="font-medium text-white">
                                {order.business?.businessName || t("appName")}
                            </span>
                        </p>

                        {order.paymentStatus === "AwaitingPayment" && payPath && (
                            <div className="rounded-xl border border-amber-400/30 bg-amber-500/15 px-4 py-3 text-sm text-amber-100">
                                <p>{t("trackPaymentAwaitingMessage")}</p>
                                <Link
                                    to={payPath}
                                    className="mt-2 inline-flex font-medium text-amber-50 underline"
                                >
                                    {t("trackPaymentCompleteLink")} →
                                </Link>
                            </div>
                        )}

                        {order.paymentStatus === "PaymentSubmitted" && (
                            <div className="rounded-xl border border-blue-400/30 bg-blue-500/15 px-4 py-3 text-sm text-blue-100">
                                <p>{t("trackPaymentSubmittedMessage")}</p>
                                {order.paymentSubmittedAt && (
                                    <p className="mt-1 text-xs text-blue-100/80">
                                        {t("paymentSubmittedAt")}: {formatDateTime(order.paymentSubmittedAt)}
                                    </p>
                                )}
                                {(phoneLink || whatsAppLink) && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {phoneLink && (
                                            <a
                                                href={phoneLink}
                                                className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                                            >
                                                {t("contactShopPhone")}
                                            </a>
                                        )}
                                        {whatsAppLink && (
                                            <a
                                                href={whatsAppLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="rounded-lg border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
                                            >
                                                {t("contactShopWhatsApp")}
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {order.paymentStatus === "Paid" && (
                            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100">
                                <p>{t("trackPaymentConfirmedMessage")}</p>
                            </div>
                        )}

                        <div className="grid gap-2 text-sm sm:grid-cols-2">
                            {(() => {
                                const amounts = getOrderAmounts(order);
                                return (
                                    <>
                                        <p className="text-emerald-50/80 sm:col-span-2">
                                            <span className="text-emerald-100/60">{t("subtotal")}: </span>
                                            {formatPrice(amounts.subtotal)}
                                        </p>
                                        {amounts.gstAmount > 0 && (
                                            <p className="text-emerald-50/80 sm:col-span-2">
                                                <span className="text-emerald-100/60">
                                                    {t("gstAmount", { rate: amounts.gstRate })}:{" "}
                                                </span>
                                                {formatPrice(amounts.gstAmount)}
                                            </p>
                                        )}
                                        <p className="text-emerald-50/80">
                                            <span className="text-emerald-100/60">{t("totalAmount")}: </span>
                                            <span className="font-semibold text-emerald-200">
                                                {formatPrice(amounts.totalAmount)}
                                            </span>
                                        </p>
                                    </>
                                );
                            })()}
                            <p className="text-emerald-50/80">
                                <span className="text-emerald-100/60">{t("paymentMethod")}: </span>
                                {(() => {
                                    const key = getPaymentLabelKey(order.paymentMethod);
                                    return key ? t(key) : order.paymentMethod;
                                })()}
                            </p>
                            {order.paymentStatus && (
                                <p className="text-emerald-50/80">
                                    <span className="text-emerald-100/60">{t("paymentStatus")}: </span>
                                    <span
                                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${paymentStatusBadgeClass(
                                            order.paymentStatus
                                        )}`}
                                    >
                                        {t(getPaymentStatusLabelKey(order.paymentStatus))}
                                    </span>
                                </p>
                            )}
                            <p className="text-emerald-50/80">
                                <span className="text-emerald-100/60">{t("orderDate")}: </span>
                                {formatDate(order.createdAt)}
                            </p>
                        </div>

                        {routeToken && canViewInvoice(order.paymentStatus) && (
                            <Link
                                to={`/invoice/${routeToken}`}
                                className="inline-flex text-sm font-medium text-emerald-300 transition hover:text-emerald-200"
                            >
                                {t("viewInvoice")} →
                            </Link>
                        )}

                        {order.items?.length > 0 && (
                            <div>
                                <p className="mb-3 text-sm font-medium text-emerald-50">{t("orderLineItems")}</p>
                                <ul className="space-y-2">
                                    {order.items.map((item, index) => (
                                        <li
                                            key={`${item.productName}-${index}`}
                                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                        >
                                            <span className="text-emerald-50/80">{item.productName}</span>
                                            <span className="text-emerald-50/70">
                                                {t("orderLineItemDetail", {
                                                    quantity: item.quantity,
                                                    price: formatPrice(item.price),
                                                    total: formatPrice(item.lineTotal)
                                                })}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {order.returnReason && (
                            <p className="text-sm text-emerald-50/80">
                                <span className="text-emerald-100/60">{t("returnReason")}: </span>
                                {order.returnReason}
                            </p>
                        )}

                        {(order.returnPhotos?.length > 0 || order.returnVideo) && (
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                <p className="text-sm font-medium text-emerald-50">{t("returnEvidenceTitle")}</p>
                                {order.returnPhotos?.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {order.returnPhotos.map((url, index) => (
                                            <a
                                                key={url}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <img
                                                    src={url}
                                                    alt={t("returnEvidencePhotoAlt", { index: index + 1 })}
                                                    className="h-20 w-20 rounded-lg object-cover transition hover:opacity-80"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                )}
                                {order.returnVideo && (
                                    <video
                                        src={order.returnVideo}
                                        controls
                                        className="mt-3 max-h-48 w-full rounded-lg"
                                    />
                                )}
                            </div>
                        )}

                        {(order.trackingId || order.trackingUrl) && (
                            <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-3 text-sm">
                                <p className="font-medium text-indigo-100">{t("trackCourierTitle")}</p>
                                {order.courierName && (
                                    <p className="mt-1 text-indigo-50/80">
                                        {t("courierName")}: {order.courierName}
                                    </p>
                                )}
                                {order.trackingId && (
                                    <p className="mt-1 text-indigo-50/80">
                                        {t("trackingId")}: {order.trackingId}
                                    </p>
                                )}
                                {order.trackingUrl && (
                                    <a
                                        href={order.trackingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 inline-flex text-sm font-medium text-indigo-200 underline"
                                    >
                                        {t("trackingOpenLink")} →
                                    </a>
                                )}
                            </div>
                        )}

                        {order.deliveryPhoto && (
                            <div>
                                <p className="mb-2 text-sm font-medium text-emerald-50">
                                    {t("trackDeliveryPhoto")}
                                </p>
                                <img
                                    src={order.deliveryPhoto}
                                    alt={t("deliverPhotoAlt")}
                                    className="max-h-48 w-full rounded-xl object-cover"
                                />
                            </div>
                        )}

                        {showReturnProgress && (
                            <div>
                                <p className="mb-3 text-sm font-medium text-emerald-50">
                                    {t("returnProgressTitle")}
                                </p>
                                <ol className="flex flex-wrap gap-2">
                                    {RETURN_PROGRESS_STAGES.map((stage) => {
                                        const currentIndex = RETURN_PROGRESS_STAGES.indexOf(
                                            normalizedReturnStatus
                                        );
                                        const stageIndex = RETURN_PROGRESS_STAGES.indexOf(stage);
                                        const isComplete = stageIndex <= currentIndex;
                                        const isCurrent = stage === normalizedReturnStatus;

                                        return (
                                            <li
                                                key={stage}
                                                className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                                                    isComplete
                                                        ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
                                                        : "border-white/10 bg-white/5 text-emerald-50/50"
                                                } ${isCurrent ? "ring-1 ring-emerald-400/40" : ""}`}
                                            >
                                                {getReturnStatusLabel(stage)}
                                            </li>
                                        );
                                    })}
                                </ol>
                            </div>
                        )}

                        {(order.returnTrackingId || order.returnCourier) && (
                            <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-3 text-sm">
                                <p className="font-medium text-indigo-100">{t("returnTrackingTitle")}</p>
                                {order.returnCourier && (
                                    <p className="mt-1 text-indigo-50/80">
                                        {t("returnCourier")}: {order.returnCourier}
                                    </p>
                                )}
                                {order.returnTrackingId && (
                                    <p className="mt-1 text-indigo-50/80">
                                        {t("returnTrackingId")}: {order.returnTrackingId}
                                    </p>
                                )}
                            </div>
                        )}

                        {order.deliveryTimeline?.length > 0 && (
                            <div>
                                <p className="mb-3 text-sm font-medium text-emerald-50">
                                    {t("deliveryTimeline")}
                                </p>
                                <ul className="space-y-2">
                                    {order.deliveryTimeline.map((entry, index) => (
                                        <li
                                            key={`${entry.status}-${index}`}
                                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <span className="font-medium text-emerald-100">
                                                    {getStatusLabel(entry.status)}
                                                </span>
                                                <span className="text-xs text-emerald-50/60">
                                                    {formatDate(entry.at)}
                                                </span>
                                            </div>
                                            {entry.note && (
                                                <p className="mt-1 text-emerald-50/70">{entry.note}</p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {canRequestReturn(order) && (
                            <button
                                type="button"
                                onClick={() => {
                                    resetReturnEvidence();
                                    setReturnReason("");
                                    setReturnOpen(true);
                                }}
                                className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-5 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20"
                            >
                                {t("requestReturn")}
                            </button>
                        )}
                    </div>
                )}

                {returnOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
                        <button
                            type="button"
                            aria-label={t("close")}
                            onClick={closeReturnModal}
                            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                        />
                        <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
                            <h2 className="text-lg font-bold text-white">{t("requestReturnTitle")}</h2>
                            <p className="mt-2 text-sm text-emerald-50/70">{t("requestReturnSubtitle")}</p>
                            <form onSubmit={handleReturnRequest} className="mt-4 space-y-4">
                                <div>
                                    <label className={labelClassName} htmlFor="returnReason">
                                        {t("returnReason")}
                                    </label>
                                    <textarea
                                        id="returnReason"
                                        rows={3}
                                        value={returnReason}
                                        onChange={(event) => setReturnReason(event.target.value)}
                                        placeholder={t("returnReasonPlaceholder")}
                                        className={inputClassName}
                                    />
                                </div>
                                <div>
                                    <label className={labelClassName} htmlFor="returnPhotos">
                                        {t("returnEvidencePhotos")}
                                    </label>
                                    <p className="mb-2 text-xs text-emerald-50/60">{t("returnEvidenceOptional")}</p>
                                    <input
                                        id="returnPhotos"
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
                                    <label className={labelClassName} htmlFor="returnVideo">
                                        {t("returnEvidenceVideo")}
                                    </label>
                                    <p className="mb-2 text-xs text-emerald-50/60">{t("returnEvidenceVideoHint")}</p>
                                    <input
                                        id="returnVideo"
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
                                        onClick={closeReturnModal}
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
        </div>
    );
};

export default TrackOrder;
