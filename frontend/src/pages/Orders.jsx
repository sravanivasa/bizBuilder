import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getMyBusinesses } from "../api/business";
import {
    deleteOrder,
    getMyOrders,
    updateOrderStatus,
    updateReturnStatus,
    updateOrderDelivery,
    bulkUpdateOrderStatus
} from "../api/orders";
import PageShell from "../components/PageShell";
import {
    ORDER_STATUSES,
    TERMINAL_STATUSES,
    DELETABLE_STATUSES,
    COURIER_OPTIONS,
    DELIVERY_TYPES,
    statusBadgeClass
} from "../utils/orderStatus";

const ORDERS_PER_PAGE = 12;

const inputClassName =
    "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-emerald-100/60 outline-none transition focus:border-emerald-300 focus:bg-white/15 focus:ring-2 focus:ring-emerald-400/30";

const selectClassName =
    "rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/30";

const formatPrice = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

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

const shortId = (id) => (id ? String(id).slice(-6).toUpperCase() : "");

const hasCourierTracking = (order) =>
    order.deliveryType === "courier" &&
    Boolean(order.trackingId?.trim() || order.courierName?.trim());

const getPageNumbers = (currentPage, totalPages) => {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    return [...pages]
        .filter((page) => page >= 1 && page <= totalPages)
        .sort((left, right) => left - right);
};

const returnBadgeClass = (status) => {
    switch (status) {
        case "Requested":
            return "bg-amber-500/20 text-amber-100 border-amber-400/30";
        case "Approved":
        case "Completed":
            return "bg-emerald-500/20 text-emerald-100 border-emerald-400/30";
        case "Rejected":
            return "bg-red-500/20 text-red-100 border-red-400/30";
        default:
            return "bg-white/10 text-emerald-50 border-white/20";
    }
};

const Orders = () => {
    const { t } = useTranslation();

    const [hasBusiness, setHasBusiness] = useState(false);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [statusDrafts, setStatusDrafts] = useState({});
    const [savingId, setSavingId] = useState(null);
    const [returnSavingId, setReturnSavingId] = useState(null);

    const [expandedId, setExpandedId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deliverySavingId, setDeliverySavingId] = useState(null);
    const [deliveryDrafts, setDeliveryDrafts] = useState({});

    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkCancelConfirm, setBulkCancelConfirm] = useState(false);

    const getStatusLabel = (status) => t(`orderStatus${status}`);
    const getReturnStatusLabel = (status) => t(`returnStatus${status}`);

    const getPaymentLabel = (method) => {
        switch (method) {
            case "Cash":
                return t("paymentCash");
            case "Card":
                return t("paymentCard");
            case "UPI":
                return t("paymentUPI");
            default:
                return method;
        }
    };

    const loadOrders = useCallback(async () => {
        const { data } = await getMyOrders();
        const nextOrders = data.orders || [];
        setOrders(nextOrders);

        const drafts = {};
        nextOrders.forEach((order) => {
            drafts[order._id] = order.orderStatus;
        });
        setStatusDrafts(drafts);

        const delivery = {};
        nextOrders.forEach((order) => {
            delivery[order._id] = {
                deliveryType: order.deliveryType || "",
                courierName: order.courierName || "",
                trackingId: order.trackingId || "",
                deliveryPersonName: order.deliveryPersonName || "",
                deliveryPersonPhone: order.deliveryPersonPhone || ""
            };
        });
        setDeliveryDrafts(delivery);
    }, []);

    const filteredOrders = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) {
            return orders;
        }

        return orders.filter((order) => {
            const name = order.customerName?.toLowerCase() ?? "";
            const phone = order.customerPhone?.toLowerCase() ?? "";
            const status = order.orderStatus?.toLowerCase() ?? "";
            const statusLabel = getStatusLabel(order.orderStatus).toLowerCase();

            return (
                name.includes(query) ||
                phone.includes(query) ||
                status.includes(query) ||
                statusLabel.includes(query)
            );
        });
    }, [orders, searchQuery, t]);

    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const pageStart =
        filteredOrders.length === 0 ? 0 : (safePage - 1) * ORDERS_PER_PAGE + 1;
    const pageEnd = Math.min(safePage * ORDERS_PER_PAGE, filteredOrders.length);

    const paginatedOrders = useMemo(() => {
        const start = (safePage - 1) * ORDERS_PER_PAGE;
        return filteredOrders.slice(start, start + ORDERS_PER_PAGE);
    }, [filteredOrders, safePage]);

    const pageNumbers = useMemo(
        () => getPageNumbers(safePage, totalPages),
        [safePage, totalPages]
    );

    useEffect(() => {
        const loadPage = async () => {
            setLoading(true);
            setError("");

            try {
                const { data } = await getMyBusinesses();
                const business = data.businesses?.[0];

                if (!business) {
                    setHasBusiness(false);
                    setOrders([]);
                    return;
                }

                setHasBusiness(true);
                await loadOrders();
            } catch (err) {
                setError(err.response?.data?.message || t("ordersLoadFailed"));
            } finally {
                setLoading(false);
            }
        };

        loadPage();
    }, [loadOrders, t]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const pageOrderIds = useMemo(
        () => paginatedOrders.map((order) => order._id),
        [paginatedOrders]
    );

    const allPageSelected =
        pageOrderIds.length > 0 && pageOrderIds.every((id) => selectedIds.has(id));

    const somePageSelected =
        pageOrderIds.some((id) => selectedIds.has(id)) && !allPageSelected;

    const selectedCount = selectedIds.size;

    const toggleOrderSelection = (orderId) => {
        setSelectedIds((current) => {
            const next = new Set(current);

            if (next.has(orderId)) {
                next.delete(orderId);
            } else {
                next.add(orderId);
            }

            return next;
        });
    };

    const toggleSelectAllOnPage = () => {
        setSelectedIds((current) => {
            const next = new Set(current);

            if (allPageSelected) {
                pageOrderIds.forEach((id) => next.delete(id));
            } else {
                pageOrderIds.forEach((id) => next.add(id));
            }

            return next;
        });
    };

    const clearSelection = () => setSelectedIds(new Set());

    const applyBulkUpdates = (updatedOrders) => {
        const updatedMap = new Map(updatedOrders.map((order) => [order._id, order]));

        setOrders((current) =>
            current.map((item) => updatedMap.get(item._id) || item)
        );

        setStatusDrafts((current) => {
            const next = { ...current };
            updatedOrders.forEach((order) => {
                next[order._id] = order.orderStatus;
            });
            return next;
        });
    };

    const handleBulkStatus = async (orderStatus, orderIds = [...selectedIds]) => {
        if (!orderIds.length) {
            return;
        }

        setBulkLoading(true);
        setError("");
        setSuccess("");

        try {
            const { data } = await bulkUpdateOrderStatus(orderIds, orderStatus);
            applyBulkUpdates(data.orders || []);

            const updatedCount = data.updatedCount ?? data.orders?.length ?? 0;
            const skippedCount = data.skippedCount ?? data.skipped?.length ?? 0;

            if (updatedCount > 0) {
                setSuccess(
                    t("bulkActionSuccess", {
                        updated: updatedCount,
                        skipped: skippedCount
                    })
                );
            } else if (skippedCount > 0) {
                setError(
                    orderStatus === "Shipped"
                        ? t("bulkShippedNoneEligible")
                        : t("bulkActionNoneUpdated")
                );
            }

            if (orderStatus === "Cancelled") {
                setBulkCancelConfirm(false);
            }

            clearSelection();
        } catch (err) {
            setError(err.response?.data?.message || t("bulkActionFailed"));
        } finally {
            setBulkLoading(false);
        }
    };

    const handleBulkMarkProcessing = () => handleBulkStatus("Processing");

    const handleBulkMarkShipped = () => {
        const eligibleIds = [...selectedIds].filter((id) => {
            const order = orders.find((item) => item._id === id);
            return order && hasCourierTracking(order) && !TERMINAL_STATUSES.includes(order.orderStatus);
        });

        const skippedCount = selectedIds.size - eligibleIds.length;

        if (!eligibleIds.length) {
            setError(t("bulkShippedNoneEligible"));
            return;
        }

        if (skippedCount > 0) {
            setSuccess(t("bulkShippedSkipped", { count: skippedCount }));
        }

        handleBulkStatus("Shipped", eligibleIds);
    };

    const handleBulkCancel = () => handleBulkStatus("Cancelled");

    const handleStatusDraftChange = (orderId, value) => {
        setStatusDrafts((current) => ({ ...current, [orderId]: value }));
    };

    const handleSaveStatus = async (order) => {
        const draft = statusDrafts[order._id];

        if (!draft || draft === order.orderStatus) {
            return;
        }

        setSavingId(order._id);
        setError("");
        setSuccess("");

        try {
            const { data } = await updateOrderStatus(order._id, draft);
            setOrders((current) =>
                current.map((item) => (item._id === order._id ? data.order : item))
            );
            setSuccess(t("orderStatusUpdateSuccess"));
        } catch (err) {
            setError(err.response?.data?.message || t("orderStatusUpdateFailed"));
            setStatusDrafts((current) => ({
                ...current,
                [order._id]: order.orderStatus
            }));
        } finally {
            setSavingId(null);
        }
    };

    const handleReturnAction = async (order, returnStatus) => {
        setReturnSavingId(order._id);
        setError("");
        setSuccess("");

        try {
            const { data } = await updateReturnStatus(order._id, returnStatus);
            setOrders((current) =>
                current.map((item) => (item._id === order._id ? data.order : item))
            );
            setSuccess(
                returnStatus === "Approved"
                    ? t("returnApproveSuccess")
                    : t("returnRejectSuccess")
            );
        } catch (err) {
            setError(err.response?.data?.message || t("returnUpdateFailed"));
        } finally {
            setReturnSavingId(null);
        }
    };

    const handleDeliveryDraftChange = (orderId, field, value) => {
        setDeliveryDrafts((current) => ({
            ...current,
            [orderId]: {
                ...current[orderId],
                [field]: value
            }
        }));
    };

    const handleSaveDelivery = async (order, options = {}) => {
        const draft = deliveryDrafts[order._id];

        if (!draft?.deliveryType) {
            setError(t("deliveryTypeRequired"));
            return;
        }

        setDeliverySavingId(order._id);
        setError("");
        setSuccess("");

        try {
            const payload = {
                deliveryType: draft.deliveryType,
                courierName: draft.courierName,
                trackingId: draft.trackingId,
                deliveryPersonName: draft.deliveryPersonName,
                deliveryPersonPhone: draft.deliveryPersonPhone,
                ...options
            };

            const { data } = await updateOrderDelivery(order._id, payload);
            setOrders((current) =>
                current.map((item) => (item._id === order._id ? data.order : item))
            );
            setStatusDrafts((current) => ({
                ...current,
                [order._id]: data.order.orderStatus
            }));
            setSuccess(t("deliveryUpdateSuccess"));
        } catch (err) {
            setError(err.response?.data?.message || t("deliveryUpdateFailed"));
        } finally {
            setDeliverySavingId(null);
        }
    };

    const handleCopyDeliveryLink = async (order) => {
        const url = order.deliveryPersonUrl;

        if (!url) {
            setError(t("deliveryLinkMissing"));
            return;
        }

        try {
            await navigator.clipboard.writeText(url);
            setSuccess(t("deliveryLinkCopied"));
        } catch {
            setError(t("deliveryLinkCopyFailed"));
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) {
            return;
        }

        setDeleting(true);
        setError("");
        setSuccess("");

        try {
            await deleteOrder(deleteTarget._id);
            setOrders((current) => current.filter((item) => item._id !== deleteTarget._id));
            setSuccess(t("orderDeleteSuccess"));
            setDeleteTarget(null);

            if (expandedId === deleteTarget._id) {
                setExpandedId(null);
            }
        } catch (err) {
            setError(err.response?.data?.message || t("orderDeleteFailed"));
        } finally {
            setDeleting(false);
        }
    };

    const renderBulkCancelDialog = () => {
        if (!bulkCancelConfirm) {
            return null;
        }

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <button
                    type="button"
                    aria-label={t("cancel")}
                    onClick={() => setBulkCancelConfirm(false)}
                    className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                />
                <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
                    <h2 className="text-lg font-bold text-white">{t("bulkConfirmCancel")}</h2>
                    <p className="mt-2 text-sm text-emerald-50/70">
                        {t("bulkConfirmCancelMessage", { count: selectedCount })}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={handleBulkCancel}
                            disabled={bulkLoading}
                            className="rounded-xl bg-red-500/90 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {bulkLoading ? t("loading") : t("bulkCancelConfirm")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setBulkCancelConfirm(false)}
                            className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                        >
                            {t("cancel")}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderBulkActionBar = () => {
        if (selectedCount === 0) {
            return null;
        }

        return (
            <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 backdrop-blur-xl">
                <p className="text-sm font-medium text-emerald-100">
                    {t("bulkSelectedCount", { count: selectedCount })}
                </p>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={handleBulkMarkProcessing}
                        disabled={bulkLoading}
                        className="rounded-lg bg-blue-500/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                    >
                        {bulkLoading ? t("loading") : t("bulkMarkProcessing")}
                    </button>
                    <button
                        type="button"
                        onClick={handleBulkMarkShipped}
                        disabled={bulkLoading}
                        className="rounded-lg bg-indigo-500/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                    >
                        {bulkLoading ? t("loading") : t("bulkMarkShipped")}
                    </button>
                    <button
                        type="button"
                        onClick={() => setBulkCancelConfirm(true)}
                        disabled={bulkLoading}
                        className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-500/20 disabled:opacity-60"
                    >
                        {t("bulkCancel")}
                    </button>
                    <button
                        type="button"
                        onClick={clearSelection}
                        disabled={bulkLoading}
                        className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
                    >
                        {t("bulkClearSelection")}
                    </button>
                </div>
            </div>
        );
    };

    const renderDeleteDialog = () => {
        if (!deleteTarget) {
            return null;
        }

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <button
                    type="button"
                    aria-label={t("cancel")}
                    onClick={() => setDeleteTarget(null)}
                    className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                />
                <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
                    <h2 className="text-lg font-bold text-white">{t("confirmDeleteOrder")}</h2>
                    <p className="mt-2 text-sm text-emerald-50/70">
                        {t("confirmDeleteOrderMessage", {
                            id: shortId(deleteTarget._id),
                            name: deleteTarget.customerName
                        })}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="rounded-xl bg-red-500/90 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {deleting ? t("loading") : t("delete")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setDeleteTarget(null)}
                            className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                        >
                            {t("cancel")}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderPagination = () => {
        if (filteredOrders.length <= ORDERS_PER_PAGE) {
            return null;
        }

        return (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={safePage <= 1}
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {t("pagePrev")}
                </button>
                {pageNumbers.map((page, index) => {
                    const previousPage = pageNumbers[index - 1];
                    const showEllipsis = previousPage && page - previousPage > 1;

                    return (
                        <span key={page} className="flex items-center gap-2">
                            {showEllipsis && (
                                <span className="px-1 text-sm text-emerald-50/50">…</span>
                            )}
                            <button
                                type="button"
                                onClick={() => setCurrentPage(page)}
                                className={`min-w-9 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                                    page === safePage
                                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                                        : "border border-white/20 bg-white/10 text-white hover:bg-white/20"
                                }`}
                            >
                                {page}
                            </button>
                        </span>
                    );
                })}
                <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={safePage >= totalPages}
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {t("pageNext")}
                </button>
            </div>
        );
    };

    const renderLineItems = (order) => {
        if (!order.products?.length) {
            return (
                <p className="text-sm text-emerald-50/60">{t("orderLineItemsEmpty")}</p>
            );
        }

        return (
            <ul className="space-y-2">
                {order.products.map((item, index) => {
                    const productId =
                        item.product?._id || item.product?.toString?.() || item.product;
                    const lineTotal = Number(item.price) * Number(item.quantity);

                    return (
                        <li
                            key={`${productId}-${index}`}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                        >
                            <div className="text-emerald-50/80">
                                {item.product?.productName
                                    ? item.product.productName
                                    : t("orderProductRef", { id: shortId(productId) })}
                            </div>
                            <div className="text-emerald-50/70">
                                {t("orderLineItemDetail", {
                                    quantity: item.quantity,
                                    price: formatPrice(item.price),
                                    total: formatPrice(lineTotal)
                                })}
                            </div>
                        </li>
                    );
                })}
            </ul>
        );
    };

    const renderDeliveryTimeline = (order) => {
        if (!order.deliveryTimeline?.length) {
            return null;
        }

        return (
            <div className="mt-4">
                <p className="mb-2 text-sm font-medium text-emerald-50">{t("deliveryTimeline")}</p>
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
                            {entry.photo && (
                                <img
                                    src={entry.photo}
                                    alt={t("deliverPhotoAlt")}
                                    className="mt-2 max-h-24 rounded-lg object-cover"
                                />
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    const renderDeliverySection = (order) => {
        const isTerminal = TERMINAL_STATUSES.includes(order.orderStatus);
        const draft = deliveryDrafts[order._id] || {
            deliveryType: order.deliveryType || "",
            courierName: order.courierName || "",
            trackingId: order.trackingId || "",
            deliveryPersonName: order.deliveryPersonName || "",
            deliveryPersonPhone: order.deliveryPersonPhone || ""
        };
        const saving = deliverySavingId === order._id;

        return (
            <div className="mt-4 border-t border-white/10 pt-4">
                <p className="mb-3 text-sm font-medium text-emerald-50">{t("deliverySection")}</p>

                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-emerald-100/70">
                            {t("deliveryType")}
                        </label>
                        <select
                            value={draft.deliveryType}
                            onChange={(event) =>
                                handleDeliveryDraftChange(order._id, "deliveryType", event.target.value)
                            }
                            disabled={isTerminal}
                            className={selectClassName}
                        >
                            <option value="" className="bg-slate-900 text-white">
                                {t("deliveryTypeSelect")}
                            </option>
                            {DELIVERY_TYPES.map((type) => (
                                <option key={type} value={type} className="bg-slate-900 text-white">
                                    {t(`deliveryType${type.charAt(0).toUpperCase() + type.slice(1)}`)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {draft.deliveryType === "courier" && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-emerald-100/70">
                                    {t("courierName")}
                                </label>
                                <select
                                    value={draft.courierName}
                                    onChange={(event) =>
                                        handleDeliveryDraftChange(
                                            order._id,
                                            "courierName",
                                            event.target.value
                                        )
                                    }
                                    disabled={isTerminal}
                                    className={`${selectClassName} w-full`}
                                >
                                    <option value="" className="bg-slate-900 text-white">
                                        {t("courierSelect")}
                                    </option>
                                    {COURIER_OPTIONS.map((carrier) => (
                                        <option
                                            key={carrier}
                                            value={carrier}
                                            className="bg-slate-900 text-white"
                                        >
                                            {carrier}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-emerald-100/70">
                                    {t("trackingId")}
                                </label>
                                <input
                                    type="text"
                                    value={draft.trackingId}
                                    onChange={(event) =>
                                        handleDeliveryDraftChange(
                                            order._id,
                                            "trackingId",
                                            event.target.value
                                        )
                                    }
                                    disabled={isTerminal}
                                    className={inputClassName}
                                    placeholder={t("trackingIdPlaceholder")}
                                />
                            </div>
                        </div>
                    )}

                    {draft.deliveryType === "local" && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-emerald-100/70">
                                    {t("deliveryPersonName")}
                                </label>
                                <input
                                    type="text"
                                    value={draft.deliveryPersonName}
                                    onChange={(event) =>
                                        handleDeliveryDraftChange(
                                            order._id,
                                            "deliveryPersonName",
                                            event.target.value
                                        )
                                    }
                                    disabled={isTerminal}
                                    className={inputClassName}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-emerald-100/70">
                                    {t("deliveryPersonPhone")}
                                </label>
                                <input
                                    type="tel"
                                    value={draft.deliveryPersonPhone}
                                    onChange={(event) =>
                                        handleDeliveryDraftChange(
                                            order._id,
                                            "deliveryPersonPhone",
                                            event.target.value
                                        )
                                    }
                                    disabled={isTerminal}
                                    className={inputClassName}
                                />
                            </div>
                        </div>
                    )}

                    {!isTerminal && draft.deliveryType && (
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => handleSaveDelivery(order)}
                                disabled={saving}
                                className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
                            >
                                {saving ? t("loading") : t("deliverySave")}
                            </button>

                            {draft.deliveryType === "courier" && (
                                <button
                                    type="button"
                                    onClick={() => handleSaveDelivery(order, { markShipped: true })}
                                    disabled={saving}
                                    className="rounded-lg bg-indigo-500/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                                >
                                    {saving ? t("loading") : t("deliveryMarkShipped")}
                                </button>
                            )}

                            {draft.deliveryType === "local" && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleSaveDelivery(order, { markOutForDelivery: true })
                                    }
                                    disabled={saving}
                                    className="rounded-lg bg-violet-500/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60"
                                >
                                    {saving ? t("loading") : t("deliveryAssignAndSend")}
                                </button>
                            )}

                            {draft.deliveryType === "pickup" && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleSaveDelivery(order, { markReadyForPickup: true })
                                    }
                                    disabled={saving}
                                    className="rounded-lg bg-violet-500/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60"
                                >
                                    {saving ? t("loading") : t("deliveryMarkReadyPickup")}
                                </button>
                            )}
                        </div>
                    )}

                    {order.deliveryPersonUrl && (
                        <button
                            type="button"
                            onClick={() => handleCopyDeliveryLink(order)}
                            className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20"
                        >
                            {t("deliveryCopyLink")}
                        </button>
                    )}

                    {order.trackingId && (
                        <p className="text-xs text-emerald-50/70">
                            {t("trackingId")}: {order.trackingId}
                            {order.trackingUrl && (
                                <>
                                    {" — "}
                                    <a
                                        href={order.trackingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-300 underline"
                                    >
                                        {t("trackingOpenLink")}
                                    </a>
                                </>
                            )}
                        </p>
                    )}

                    {order.deliveryPhoto && (
                        <img
                            src={order.deliveryPhoto}
                            alt={t("deliverPhotoAlt")}
                            className="max-h-32 rounded-xl object-cover"
                        />
                    )}
                </div>

                {renderDeliveryTimeline(order)}
            </div>
        );
    };

    const renderOrderCard = (order) => {
        const isTerminal = TERMINAL_STATUSES.includes(order.orderStatus);
        const canDelete = DELETABLE_STATUSES.includes(order.orderStatus);
        const draft = statusDrafts[order._id] ?? order.orderStatus;
        const hasDraftChange = draft !== order.orderStatus;
        const isExpanded = expandedId === order._id;

        return (
            <article
                key={order._id}
                className={`rounded-2xl border p-4 sm:p-5 transition ${
                    selectedIds.has(order._id)
                        ? "border-emerald-400/40 bg-emerald-500/10"
                        : "border-white/10 bg-white/5"
                }`}
            >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 flex-1 gap-3">
                        <label className="mt-1 flex shrink-0 items-start">
                            <input
                                type="checkbox"
                                checked={selectedIds.has(order._id)}
                                onChange={() => toggleOrderSelection(order._id)}
                                className="mt-0.5 h-4 w-4 rounded border-white/30 bg-white/10 text-emerald-500 focus:ring-emerald-400/40"
                                aria-label={t("bulkSelectOrder", { id: shortId(order._id) })}
                            />
                        </label>
                        <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-white">
                                {t("orderIdLabel", { id: shortId(order._id) })}
                            </h3>
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

                        <div className="grid gap-2 text-sm sm:grid-cols-2">
                            <p className="text-emerald-50/80">
                                <span className="text-emerald-100/60">{t("customerName")}: </span>
                                {order.customerName}
                            </p>
                            <p className="text-emerald-50/80">
                                <span className="text-emerald-100/60">{t("customerPhone")}: </span>
                                {order.customerPhone}
                            </p>
                            <p className="text-emerald-50/80 sm:col-span-2">
                                <span className="text-emerald-100/60">{t("customerAddress")}: </span>
                                {order.customerAddress}
                            </p>
                            <p className="text-emerald-50/80">
                                <span className="text-emerald-100/60">{t("totalAmount")}: </span>
                                <span className="font-semibold text-emerald-200">
                                    {formatPrice(order.totalAmount)}
                                </span>
                            </p>
                            <p className="text-emerald-50/80">
                                <span className="text-emerald-100/60">{t("paymentMethod")}: </span>
                                {getPaymentLabel(order.paymentMethod)}
                            </p>
                            <p className="text-emerald-50/80 sm:col-span-2">
                                <span className="text-emerald-100/60">{t("orderDate")}: </span>
                                {formatDate(order.createdAt)}
                            </p>
                            {order.returnReason && (
                                <p className="text-emerald-50/80 sm:col-span-2">
                                    <span className="text-emerald-100/60">{t("returnReason")}: </span>
                                    {order.returnReason}
                                </p>
                            )}
                        </div>
                    </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:w-56">
                        {!isTerminal && (
                            <div className="space-y-2">
                                <label
                                    htmlFor={`status-${order._id}`}
                                    className="block text-xs font-medium text-emerald-100/70"
                                >
                                    {t("orderStatus")}
                                </label>
                                <select
                                    id={`status-${order._id}`}
                                    value={draft}
                                    onChange={(event) =>
                                        handleStatusDraftChange(order._id, event.target.value)
                                    }
                                    className={selectClassName}
                                >
                                    {ORDER_STATUSES.map((status) => (
                                        <option
                                            key={status}
                                            value={status}
                                            className="bg-slate-900 text-white"
                                        >
                                            {getStatusLabel(status)}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => handleSaveStatus(order)}
                                    disabled={!hasDraftChange || savingId === order._id}
                                    className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {savingId === order._id ? t("loading") : t("saveStatus")}
                                </button>
                            </div>
                        )}

                        {order.returnStatus === "Requested" && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-amber-100/80">
                                    {t("returnRequestPending")}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleReturnAction(order, "Approved")}
                                        disabled={returnSavingId === order._id}
                                        className="rounded-lg bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                                    >
                                        {returnSavingId === order._id ? t("loading") : t("approveReturn")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleReturnAction(order, "Rejected")}
                                        disabled={returnSavingId === order._id}
                                        className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-500/20 disabled:opacity-60"
                                    >
                                        {t("rejectReturn")}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setExpandedId(isExpanded ? null : order._id)
                                }
                                className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                            >
                                {isExpanded ? t("collapseOrder") : t("expandOrder")}
                            </button>
                            {canDelete && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSuccess("");
                                        setDeleteTarget(order);
                                    }}
                                    className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-500/20"
                                >
                                    {t("delete")}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {isExpanded && (
                    <div className="mt-4 border-t border-white/10 pt-4">
                        <p className="mb-3 text-sm font-medium text-emerald-50">
                            {t("orderLineItems")}
                        </p>
                        {renderLineItems(order)}
                        {renderDeliverySection(order)}
                    </div>
                )}
            </article>
        );
    };

    return (
        <PageShell
            badge={t("orders")}
            title={t("ordersTitle")}
            subtitle={t("ordersSubtitle")}
        >
            {loading ? (
                <p className="text-center text-sm text-emerald-50/70">{t("loading")}</p>
            ) : !hasBusiness ? (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-6 py-8 text-center">
                    <p className="text-sm text-amber-50">{t("noBusinessForOrders")}</p>
                    <Link
                        to="/business"
                        className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400"
                    >
                        {t("setupBusiness")}
                    </Link>
                </div>
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

                    <div>
                        <label htmlFor="orderSearch" className="sr-only">
                            {t("orderSearchPlaceholder")}
                        </label>
                        <input
                            id="orderSearch"
                            type="search"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder={t("orderSearchPlaceholder")}
                            className={inputClassName}
                        />
                        <p className="mt-2 text-xs text-emerald-50/60">{t("ordersWhatsAppNote")}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-emerald-50/70">
                        <p>
                            {filteredOrders.length > 0
                                ? t("showingOrdersRange", {
                                      start: pageStart,
                                      end: pageEnd,
                                      total: filteredOrders.length
                                  })
                                : t("ordersCount", { count: orders.length })}
                        </p>
                        {searchQuery.trim() &&
                            filteredOrders.length === 0 &&
                            orders.length > 0 && (
                                <p className="text-amber-100/80">{t("ordersNoSearchResults")}</p>
                            )}
                    </div>

                    {orders.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-12 text-center">
                            <p className="text-sm text-emerald-50/80">{t("ordersEmpty")}</p>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-12 text-center">
                            <p className="text-sm text-emerald-50/80">{t("ordersNoSearchResults")}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {renderBulkActionBar()}
                            <label className="flex items-center gap-2 text-sm text-emerald-50/80">
                                <input
                                    type="checkbox"
                                    checked={allPageSelected}
                                    ref={(element) => {
                                        if (element) {
                                            element.indeterminate = somePageSelected;
                                        }
                                    }}
                                    onChange={toggleSelectAllOnPage}
                                    className="h-4 w-4 rounded border-white/30 bg-white/10 text-emerald-500 focus:ring-emerald-400/40"
                                />
                                {t("bulkSelectAllPage")}
                            </label>
                            <div
                                className="max-h-[calc(100vh-18rem)] overflow-y-auto rounded-2xl border border-white/10 p-4 sm:p-5"
                            >
                                <div className="space-y-4">
                                    {paginatedOrders.map((order) => renderOrderCard(order))}
                                </div>
                            </div>
                            {renderPagination()}
                        </div>
                    )}
                </div>
            )}

            {renderDeleteDialog()}
            {renderBulkCancelDialog()}
        </PageShell>
    );
};

export default Orders;
