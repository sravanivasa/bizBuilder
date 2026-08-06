import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getMyBusinesses } from "../api/business";
import {
    deleteOrder,
    getMyOrders,
    updateOrderStatus
} from "../api/orders";
import PageShell from "../components/PageShell";

const ORDERS_PER_PAGE = 12;

const ORDER_STATUSES = [
    "Pending",
    "Confirmed",
    "Preparing",
    "Completed",
    "Cancelled",
    "Delivered"
];

const DELETABLE_STATUSES = ["Pending", "Cancelled"];
const TERMINAL_STATUSES = ["Delivered", "Cancelled", "Completed"];

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

const getPageNumbers = (currentPage, totalPages) => {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    return [...pages]
        .filter((page) => page >= 1 && page <= totalPages)
        .sort((left, right) => left - right);
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

    const [expandedId, setExpandedId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const getStatusLabel = (status) => t(`orderStatus${status}`);

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

    const renderOrderCard = (order) => {
        const isTerminal = TERMINAL_STATUSES.includes(order.orderStatus);
        const canDelete = DELETABLE_STATUSES.includes(order.orderStatus);
        const draft = statusDrafts[order._id] ?? order.orderStatus;
        const hasDraftChange = draft !== order.orderStatus;
        const isExpanded = expandedId === order._id;

        return (
            <article
                key={order._id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"
            >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
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
        </PageShell>
    );
};

export default Orders;
