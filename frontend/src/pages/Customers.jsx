import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getMyBusinesses } from "../api/business";
import {
    createCustomer,
    deleteCustomer,
    getCustomer,
    getCustomerOrders,
    listCustomers,
    updateCustomer
} from "../api/customers";
import PageShell from "../components/PageShell";

const CUSTOMERS_PER_PAGE = 12;

const EMPTY_FORM = {
    name: "",
    phone: "",
    email: "",
    defaultAddress: "",
    notes: ""
};

const inputClassName =
    "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-emerald-100/60 outline-none transition focus:border-emerald-300 focus:bg-white/15 focus:ring-2 focus:ring-emerald-400/30";

const labelClassName = "mb-2 block text-sm font-medium text-emerald-50";

const formatPrice = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

const getPageNumbers = (currentPage, totalPages) => {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    return [...pages]
        .filter((page) => page >= 1 && page <= totalPages)
        .sort((left, right) => left - right);
};

const Customers = () => {
    const { t } = useTranslation();

    const [businessId, setBusinessId] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: CUSTOMERS_PER_PAGE, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [searchInput, setSearchInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("true");
    const [currentPage, setCurrentPage] = useState(1);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const [deactivateTarget, setDeactivateTarget] = useState(null);
    const [deactivating, setDeactivating] = useState(false);

    const [detailCustomer, setDetailCustomer] = useState(null);
    const [detailStats, setDetailStats] = useState(null);
    const [historyOrders, setHistoryOrders] = useState([]);
    const [historyPagination, setHistoryPagination] = useState({
        page: 1,
        limit: 10,
        total: 0
    });
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState("");
    const [historyPage, setHistoryPage] = useState(1);

    const loadCustomers = useCallback(
        async (id, { page = 1, search = "", active = "true" } = {}) => {
            const { data } = await listCustomers(id, {
                page,
                limit: CUSTOMERS_PER_PAGE,
                search: search || undefined,
                active
            });

            setCustomers(data.customers || []);
            setPagination(data.pagination || { page, limit: CUSTOMERS_PER_PAGE, total: 0 });
        },
        []
    );

    const totalPages = Math.max(1, Math.ceil(pagination.total / CUSTOMERS_PER_PAGE));
    const pageNumbers = useMemo(
        () => getPageNumbers(currentPage, totalPages),
        [currentPage, totalPages]
    );

    const pageStart = pagination.total === 0 ? 0 : (currentPage - 1) * CUSTOMERS_PER_PAGE + 1;
    const pageEnd = Math.min(currentPage * CUSTOMERS_PER_PAGE, pagination.total);

    useEffect(() => {
        const loadPage = async () => {
            setLoading(true);
            setError("");

            try {
                const { data } = await getMyBusinesses();
                const business = data.businesses?.[0];

                if (!business?._id) {
                    setBusinessId(null);
                    setCustomers([]);
                    return;
                }

                setBusinessId(business._id);
                await loadCustomers(business._id, {
                    page: currentPage,
                    search: searchQuery,
                    active: activeFilter
                });
            } catch (err) {
                setError(err.response?.data?.message || t("customersLoadFailed"));
            } finally {
                setLoading(false);
            }
        };

        loadPage();
    }, [loadCustomers, currentPage, searchQuery, activeFilter, t]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeFilter]);

    const openCreateModal = () => {
        setEditingCustomer(null);
        setForm(EMPTY_FORM);
        setFormError("");
        setModalOpen(true);
    };

    const openEditModal = (customer) => {
        setEditingCustomer(customer);
        setForm({
            name: customer.name || "",
            phone: customer.phone || "",
            email: customer.email || "",
            defaultAddress: customer.defaultAddress || "",
            notes: customer.notes || ""
        });
        setFormError("");
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingCustomer(null);
        setForm(EMPTY_FORM);
        setFormError("");
    };

    const handleSave = async (event) => {
        event.preventDefault();

        if (!businessId) {
            return;
        }

        setSaving(true);
        setFormError("");
        setSuccess("");

        try {
            if (editingCustomer) {
                const { data } = await updateCustomer(editingCustomer._id, form);
                setSuccess(t("customerUpdatedSuccess"));
                if (detailCustomer?._id === editingCustomer._id) {
                    setDetailCustomer(data.customer);
                }
            } else {
                const { data } = await createCustomer({ businessId, ...form });
                setSuccess(
                    data.reactivated
                        ? t("customerReactivatedSuccess")
                        : t("customerCreatedSuccess")
                );
            }

            closeModal();
            await loadCustomers(businessId, {
                page: currentPage,
                search: searchQuery,
                active: activeFilter
            });
        } catch (err) {
            setFormError(err.response?.data?.message || t("customerSaveFailed"));
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async () => {
        if (!deactivateTarget) {
            return;
        }

        setDeactivating(true);
        setError("");
        setSuccess("");

        try {
            await deleteCustomer(deactivateTarget._id);
            setSuccess(t("customerDeactivatedSuccess"));
            setDeactivateTarget(null);

            if (detailCustomer?._id === deactivateTarget._id) {
                setDetailCustomer((current) =>
                    current ? { ...current, isActive: false } : current
                );
            }

            if (businessId) {
                await loadCustomers(businessId, {
                    page: currentPage,
                    search: searchQuery,
                    active: activeFilter
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || t("customerDeactivateFailed"));
        } finally {
            setDeactivating(false);
        }
    };

    const loadCustomerHistory = useCallback(async (customerId, page = 1) => {
        setHistoryLoading(true);
        setHistoryError("");

        try {
            const [customerRes, ordersRes] = await Promise.all([
                getCustomer(customerId),
                getCustomerOrders(customerId, { page, limit: 10 })
            ]);

            setDetailCustomer(customerRes.data.customer);
            setDetailStats(customerRes.data.stats || null);
            setHistoryOrders(ordersRes.data.orders || []);
            setHistoryPagination(
                ordersRes.data.pagination || { page, limit: 10, total: 0 }
            );
            setHistoryPage(page);
        } catch (err) {
            setHistoryError(err.response?.data?.message || t("customerHistoryLoadFailed"));
            setHistoryOrders([]);
            setHistoryPagination({ page: 1, limit: 10, total: 0 });
        } finally {
            setHistoryLoading(false);
        }
    }, [t]);

    const closeDetail = () => {
        setDetailCustomer(null);
        setDetailStats(null);
        setHistoryOrders([]);
        setHistoryError("");
        setHistoryPage(1);
    };

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        setSearchQuery(searchInput.trim());
    };

    return (
        <PageShell
            badge={t("customers")}
            title={t("customersTitle")}
            subtitle={t("customersSubtitle")}
        >
            {!businessId && !loading ? (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-6 py-8 text-center">
                    <p className="text-sm text-amber-50">{t("noBusinessForCustomers")}</p>
                    <Link
                        to="/business"
                        className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white"
                    >
                        {t("setupBusiness")}
                    </Link>
                </div>
            ) : (
                <>
                    {error && (
                        <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                            {success}
                        </div>
                    )}

                    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
                            <input
                                type="search"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder={t("customersSearchPlaceholder")}
                                className={inputClassName}
                            />
                            <button
                                type="submit"
                                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                            >
                                {t("search")}
                            </button>
                        </form>

                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={activeFilter}
                                onChange={(e) => setActiveFilter(e.target.value)}
                                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white"
                            >
                                <option value="true">{t("customersActiveOnly")}</option>
                                <option value="false">{t("customersInactiveOnly")}</option>
                                <option value="all">{t("customersAll")}</option>
                            </select>
                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white"
                            >
                                {t("addCustomer")}
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-center text-sm text-emerald-50/70">{t("loading")}</p>
                    ) : customers.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center">
                            <p className="text-sm text-emerald-50/70">
                                {searchQuery
                                    ? t("customersSearchEmpty")
                                    : t("customersEmpty")}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {customers.map((customer) => (
                                    <article
                                        key={customer._id}
                                        className="rounded-2xl border border-white/10 bg-white/5 p-5"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">
                                                    {customer.name}
                                                </h3>
                                                <p className="mt-1 text-sm text-emerald-50/80">
                                                    {customer.phone}
                                                </p>
                                            </div>
                                            <span
                                                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                                                    customer.isActive
                                                        ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
                                                        : "border-amber-400/30 bg-amber-500/20 text-amber-100"
                                                }`}
                                            >
                                                {customer.isActive
                                                    ? t("customerActive")
                                                    : t("customerDeactivated")}
                                            </span>
                                        </div>

                                        {customer.defaultAddress && (
                                            <p className="mt-3 text-sm text-emerald-50/70">
                                                {customer.defaultAddress}
                                            </p>
                                        )}

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => loadCustomerHistory(customer._id)}
                                                className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
                                            >
                                                {t("viewOrderHistory")}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(customer)}
                                                className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100"
                                            >
                                                {t("edit")}
                                            </button>
                                            {customer.isActive && (
                                                <button
                                                    type="button"
                                                    onClick={() => setDeactivateTarget(customer)}
                                                    className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-100"
                                                >
                                                    {t("deactivate")}
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {pagination.total > CUSTOMERS_PER_PAGE && (
                                <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                                    <p className="text-sm text-emerald-50/70">
                                        {t("customersPagination", {
                                            start: pageStart,
                                            end: pageEnd,
                                            total: pagination.total
                                        })}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {pageNumbers.map((page) => (
                                            <button
                                                key={page}
                                                type="button"
                                                onClick={() => setCurrentPage(page)}
                                                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                                                    page === currentPage
                                                        ? "bg-emerald-500 text-white"
                                                        : "border border-white/20 bg-white/10 text-white"
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
                    <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6">
                        <h2 className="text-xl font-bold text-white">
                            {editingCustomer ? t("editCustomer") : t("addCustomer")}
                        </h2>

                        {formError && (
                            <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                                {formError}
                            </p>
                        )}

                        <form onSubmit={handleSave} className="mt-5 space-y-4">
                            <div>
                                <label className={labelClassName} htmlFor="customerName">
                                    {t("customerName")}
                                </label>
                                <input
                                    id="customerName"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            name: e.target.value
                                        }))
                                    }
                                    className={inputClassName}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClassName} htmlFor="customerPhone">
                                    {t("customerPhone")}
                                </label>
                                <input
                                    id="customerPhone"
                                    value={form.phone}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            phone: e.target.value
                                        }))
                                    }
                                    className={inputClassName}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClassName} htmlFor="customerEmail">
                                    {t("email")}
                                </label>
                                <input
                                    id="customerEmail"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            email: e.target.value
                                        }))
                                    }
                                    className={inputClassName}
                                />
                            </div>
                            <div>
                                <label className={labelClassName} htmlFor="customerAddress">
                                    {t("customerDefaultAddress")}
                                </label>
                                <textarea
                                    id="customerAddress"
                                    value={form.defaultAddress}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            defaultAddress: e.target.value
                                        }))
                                    }
                                    className={inputClassName}
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className={labelClassName} htmlFor="customerNotes">
                                    {t("customerNotes")}
                                </label>
                                <textarea
                                    id="customerNotes"
                                    value={form.notes}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            notes: e.target.value
                                        }))
                                    }
                                    className={inputClassName}
                                    rows={2}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white"
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                >
                                    {saving ? t("loading") : t("save")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deactivateTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
                    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-6">
                        <h2 className="text-xl font-bold text-white">
                            {t("deactivateCustomerTitle")}
                        </h2>
                        <p className="mt-3 text-sm text-emerald-50/80">
                            {t("deactivateCustomerMessage", { name: deactivateTarget.name })}
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeactivateTarget(null)}
                                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white"
                            >
                                {t("cancel")}
                            </button>
                            <button
                                type="button"
                                onClick={handleDeactivate}
                                disabled={deactivating}
                                className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                                {deactivating ? t("loading") : t("deactivate")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {detailCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
                    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {detailCustomer.name}
                                </h2>
                                <p className="mt-1 text-sm text-emerald-50/80">
                                    {detailCustomer.phone}
                                </p>
                                <span
                                    className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                                        detailCustomer.isActive
                                            ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
                                            : "border-amber-400/30 bg-amber-500/20 text-amber-100"
                                    }`}
                                >
                                    {detailCustomer.isActive
                                        ? t("customerActive")
                                        : t("customerDeactivated")}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={closeDetail}
                                className="rounded-xl border border-white/20 px-3 py-1.5 text-sm text-white"
                            >
                                {t("close")}
                            </button>
                        </div>

                        {detailStats && (
                            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                    <p className="text-xs text-emerald-100/60">
                                        {t("customerOrderCount")}
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-white">
                                        {detailStats.orderCount}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                    <p className="text-xs text-emerald-100/60">
                                        {t("customerTotalSpend")}
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-white">
                                        {formatPrice(detailStats.totalSpend)}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                    <p className="text-xs text-emerald-100/60">
                                        {t("customerLastOrder")}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-white">
                                        {detailStats.lastOrderAt
                                            ? new Date(detailStats.lastOrderAt).toLocaleString()
                                            : t("customerNoOrdersYet")}
                                    </p>
                                </div>
                            </div>
                        )}

                        <h3 className="mt-6 text-lg font-semibold text-white">
                            {t("customerOrderHistory")}
                        </h3>

                        {historyLoading ? (
                            <p className="mt-4 text-sm text-emerald-50/70">{t("loading")}</p>
                        ) : historyError ? (
                            <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                                {historyError}
                            </p>
                        ) : historyOrders.length === 0 ? (
                            <p className="mt-4 text-sm text-emerald-50/70">
                                {t("customerNoOrdersYet")}
                            </p>
                        ) : (
                            <div className="mt-4 space-y-3">
                                {historyOrders.map((order) => (
                                    <div
                                        key={order._id}
                                        className="rounded-xl border border-white/10 bg-white/5 p-4"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="font-semibold text-white">
                                                #{String(order._id).slice(-6).toUpperCase()}
                                            </p>
                                            <p className="text-sm text-emerald-300">
                                                {formatPrice(order.totalAmount)}
                                            </p>
                                        </div>
                                        <p className="mt-1 text-sm text-emerald-50/80">
                                            {t(`orderStatus${order.orderStatus}`)} ·{" "}
                                            {order.paymentStatus}
                                        </p>
                                        <p className="mt-1 text-xs text-emerald-100/60">
                                            {t("orderSnapshotLabel")}: {order.customerName} ·{" "}
                                            {order.customerPhone}
                                        </p>
                                        <p className="mt-1 text-xs text-emerald-100/50">
                                            {new Date(order.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {historyPagination.total > historyPagination.limit && !historyError && (
                            <div className="mt-4 flex gap-2">
                                <button
                                    type="button"
                                    disabled={historyPage <= 1 || historyLoading}
                                    onClick={() =>
                                        loadCustomerHistory(detailCustomer._id, historyPage - 1)
                                    }
                                    className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                                >
                                    {t("previous")}
                                </button>
                                <button
                                    type="button"
                                    disabled={
                                        historyPage * historyPagination.limit >=
                                            historyPagination.total || historyLoading
                                    }
                                    onClick={() =>
                                        loadCustomerHistory(detailCustomer._id, historyPage + 1)
                                    }
                                    className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                                >
                                    {t("next")}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </PageShell>
    );
};

export default Customers;
