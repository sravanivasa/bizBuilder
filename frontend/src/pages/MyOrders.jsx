import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { trackPublicOrder, trackPublicOrderByToken } from "../api/public";
import LanguageSwitcher from "../components/LanguageSwitcher";
import {
    getCustomerOrders,
    getStorePath,
    getTrackPath,
    updateCustomerOrderStatus
} from "../utils/customerOrdersStorage";

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

const statusBadgeClass = (status) => {
    switch (status) {
        case "Pending":
            return "bg-amber-500/20 text-amber-100 border-amber-400/30";
        case "Confirmed":
            return "bg-blue-500/20 text-blue-100 border-blue-400/30";
        case "Preparing":
            return "bg-violet-500/20 text-violet-100 border-violet-400/30";
        case "Completed":
            return "bg-emerald-500/20 text-emerald-100 border-emerald-400/30";
        case "Cancelled":
            return "bg-red-500/20 text-red-100 border-red-400/30";
        case "Delivered":
            return "bg-teal-500/20 text-teal-100 border-teal-400/30";
        default:
            return "bg-white/10 text-emerald-50 border-white/20";
    }
};

const MyOrders = () => {
    const { storeSlug } = useParams();
    const { t } = useTranslation();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

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
                    const status = data.order?.orderStatus;
                    if (status) {
                        updateCustomerOrderStatus(item.orderId, status);
                    }
                    return {
                        ...item,
                        orderStatus: status || item.orderStatus,
                        businessName:
                            data.order?.business?.businessName || item.businessName,
                        businessSlug:
                            data.order?.business?.slug || item.businessSlug
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

    const trackPath = (item) => getTrackPath(item);

    const shopPath = storeSlug ? `/store/${storeSlug}` : null;

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
                            {orders.map((item) => (
                                <li key={item.orderId}>
                                    <Link
                                        to={trackPath(item)}
                                        className="block rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-emerald-400/30 hover:bg-white/10"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="font-semibold text-white">
                                                #{item.shortOrderId}
                                            </span>
                                            <span
                                                className={`rounded-full border px-3 py-1 text-xs font-medium ${statusBadgeClass(
                                                    item.orderStatus
                                                )}`}
                                            >
                                                {getStatusLabel(item.orderStatus)}
                                            </span>
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
                                        <p className="mt-2 text-xs font-medium text-emerald-300">
                                            {t("myOrdersViewStatus")} →
                                        </p>
                                    </Link>
                                </li>
                            ))}
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
        </div>
    );
};

export default MyOrders;
