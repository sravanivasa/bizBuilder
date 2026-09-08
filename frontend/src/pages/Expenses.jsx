import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getMyBusinesses } from "../api/business";
import {
    createExpense,
    deleteExpense,
    getExpenseSummary,
    listExpenses,
    updateExpense
} from "../api/expenses";
import {
    EXPENSE_CATEGORIES,
    getTodayInBusinessTimezone
} from "../constants/expenseCategories";
import PageShell from "../components/PageShell";

const EXPENSES_PER_PAGE = 12;

const EMPTY_FORM = {
    amount: "",
    category: "Misc",
    expenseDate: getTodayInBusinessTimezone(),
    description: ""
};

const inputClassName =
    "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-emerald-100/60 outline-none transition focus:border-emerald-300 focus:bg-white/15 focus:ring-2 focus:ring-emerald-400/30";

const labelClassName = "mb-2 block text-sm font-medium text-emerald-50";

const formatPrice = (value) => `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getPageNumbers = (currentPage, totalPages) => {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    return [...pages]
        .filter((page) => page >= 1 && page <= totalPages)
        .sort((left, right) => left - right);
};

const categoryLabelKey = (category) => `expenseCategory${category}`;

const Expenses = () => {
    const { t } = useTranslation();

    const [businessId, setBusinessId] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: EXPENSES_PER_PAGE, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [summary, setSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summaryError, setSummaryError] = useState("");

    const [categoryFilter, setCategoryFilter] = useState("");
    const [fromFilter, setFromFilter] = useState("");
    const [toFilter, setToFilter] = useState("");
    const [appliedCategory, setAppliedCategory] = useState("");
    const [appliedFrom, setAppliedFrom] = useState("");
    const [appliedTo, setAppliedTo] = useState("");
    const [activeFilter, setActiveFilter] = useState("true");
    const [currentPage, setCurrentPage] = useState(1);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const [deactivateTarget, setDeactivateTarget] = useState(null);
    const [deactivating, setDeactivating] = useState(false);

    const loadExpenses = useCallback(
        async (id, { page = 1, category = "", from = "", to = "", active = "true" } = {}) => {
            const { data } = await listExpenses(id, {
                page,
                limit: EXPENSES_PER_PAGE,
                category: category || undefined,
                from: from || undefined,
                to: to || undefined,
                active
            });

            setExpenses(data.expenses || []);
            setPagination(data.pagination || { page, limit: EXPENSES_PER_PAGE, total: 0 });
        },
        []
    );

    const loadSummary = useCallback(async (id) => {
        setSummaryLoading(true);
        setSummaryError("");

        try {
            const { data } = await getExpenseSummary(id);
            setSummary(data.summary || null);
        } catch (err) {
            setSummary(null);
            setSummaryError(err.response?.data?.message || t("expensesSummaryFailed"));
        } finally {
            setSummaryLoading(false);
        }
    }, [t]);

    const totalPages = Math.max(1, Math.ceil(pagination.total / EXPENSES_PER_PAGE));
    const pageNumbers = useMemo(
        () => getPageNumbers(currentPage, totalPages),
        [currentPage, totalPages]
    );

    const pageStart = pagination.total === 0 ? 0 : (currentPage - 1) * EXPENSES_PER_PAGE + 1;
    const pageEnd = Math.min(currentPage * EXPENSES_PER_PAGE, pagination.total);

    useEffect(() => {
        const loadPage = async () => {
            setLoading(true);
            setError("");

            try {
                const { data } = await getMyBusinesses();
                const business = data.businesses?.[0];

                if (!business?._id) {
                    setBusinessId(null);
                    setExpenses([]);
                    setSummary(null);
                    return;
                }

                setBusinessId(business._id);
                await Promise.all([
                    loadExpenses(business._id, {
                        page: currentPage,
                        category: appliedCategory,
                        from: appliedFrom,
                        to: appliedTo,
                        active: activeFilter
                    }),
                    loadSummary(business._id)
                ]);
            } catch (err) {
                setError(err.response?.data?.message || t("expensesLoadFailed"));
            } finally {
                setLoading(false);
            }
        };

        loadPage();
    }, [
        loadExpenses,
        loadSummary,
        currentPage,
        appliedCategory,
        appliedFrom,
        appliedTo,
        activeFilter,
        t
    ]);

    useEffect(() => {
        setCurrentPage(1);
    }, [appliedCategory, appliedFrom, appliedTo, activeFilter]);

    const openCreateModal = () => {
        setEditingExpense(null);
        setForm({ ...EMPTY_FORM, expenseDate: getTodayInBusinessTimezone() });
        setFormError("");
        setModalOpen(true);
    };

    const openEditModal = (expense) => {
        setEditingExpense(expense);
        setForm({
            amount: String(expense.amount),
            category: expense.category || "Misc",
            expenseDate: expense.expenseDate || getTodayInBusinessTimezone(),
            description: expense.description || ""
        });
        setFormError("");
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingExpense(null);
        setForm(EMPTY_FORM);
        setFormError("");
    };

    const handleSave = async (event) => {
        event.preventDefault();

        if (!businessId) {
            return;
        }

        const amount = Number(form.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            setFormError(t("expenseAmountInvalid"));
            return;
        }

        setSaving(true);
        setFormError("");
        setSuccess("");

        const payload = {
            amount,
            category: form.category,
            expenseDate: form.expenseDate,
            description: form.description
        };

        try {
            if (editingExpense) {
                await updateExpense(editingExpense._id, payload);
                setSuccess(t("expenseUpdatedSuccess"));
            } else {
                await createExpense({ businessId, ...payload });
                setSuccess(t("expenseCreatedSuccess"));
            }

            closeModal();
            await loadExpenses(businessId, {
                page: currentPage,
                category: appliedCategory,
                from: appliedFrom,
                to: appliedTo,
                active: activeFilter
            });
            await loadSummary(businessId);
        } catch (err) {
            setFormError(err.response?.data?.message || t("expenseSaveFailed"));
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivate = async () => {
        if (!deactivateTarget || !businessId) {
            return;
        }

        setDeactivating(true);
        setError("");
        setSuccess("");

        try {
            await deleteExpense(deactivateTarget._id);
            setSuccess(t("expenseDeactivatedSuccess"));
            setDeactivateTarget(null);
            await loadExpenses(businessId, {
                page: currentPage,
                category: appliedCategory,
                from: appliedFrom,
                to: appliedTo,
                active: activeFilter
            });
            await loadSummary(businessId);
        } catch (err) {
            setError(err.response?.data?.message || t("expenseDeactivateFailed"));
        } finally {
            setDeactivating(false);
        }
    };

    const handleFilterSubmit = (event) => {
        event.preventDefault();
        setAppliedCategory(categoryFilter);
        setAppliedFrom(fromFilter);
        setAppliedTo(toFilter);
    };

    const clearFilters = () => {
        setCategoryFilter("");
        setFromFilter("");
        setToFilter("");
        setAppliedCategory("");
        setAppliedFrom("");
        setAppliedTo("");
    };

    return (
        <PageShell
            badge={t("expenses")}
            title={t("expensesTitle")}
            subtitle={t("expensesSubtitle")}
        >
            {!businessId && !loading ? (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-6 py-8 text-center">
                    <p className="text-sm text-amber-50">{t("noBusinessForExpenses")}</p>
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

                    <div className="mb-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
                            <p className="text-sm text-emerald-100/70">{t("expensesTodayTotal")}</p>
                            {summaryLoading ? (
                                <div className="mt-3 h-9 w-24 animate-pulse rounded-lg bg-white/10" />
                            ) : summaryError ? (
                                <p className="mt-3 text-sm text-red-200">{summaryError}</p>
                            ) : (
                                <p className="mt-3 text-3xl font-bold text-white">
                                    {formatPrice(summary?.todayTotal || 0)}
                                </p>
                            )}
                        </div>
                        <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
                            <p className="text-sm text-emerald-100/70">{t("expensesMonthTotal")}</p>
                            {summaryLoading ? (
                                <div className="mt-3 h-9 w-24 animate-pulse rounded-lg bg-white/10" />
                            ) : summaryError ? (
                                <p className="mt-3 text-sm text-red-200">{summaryError}</p>
                            ) : (
                                <p className="mt-3 text-3xl font-bold text-white">
                                    {formatPrice(summary?.monthTotal || 0)}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <form onSubmit={handleFilterSubmit} className="grid flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white"
                            >
                                <option value="">{t("expensesAllCategories")}</option>
                                {EXPENSE_CATEGORIES.map((category) => (
                                    <option key={category} value={category}>
                                        {t(categoryLabelKey(category))}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="date"
                                value={fromFilter}
                                onChange={(e) => setFromFilter(e.target.value)}
                                className={inputClassName}
                                aria-label={t("expensesFromDate")}
                            />
                            <input
                                type="date"
                                value={toFilter}
                                onChange={(e) => setToFilter(e.target.value)}
                                className={inputClassName}
                                aria-label={t("expensesToDate")}
                            />
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                                >
                                    {t("applyFilters")}
                                </button>
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white"
                                >
                                    {t("clear")}
                                </button>
                            </div>
                        </form>

                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={activeFilter}
                                onChange={(e) => setActiveFilter(e.target.value)}
                                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white"
                            >
                                <option value="true">{t("expensesActiveOnly")}</option>
                                <option value="false">{t("expensesInactiveOnly")}</option>
                                <option value="all">{t("expensesAll")}</option>
                            </select>
                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white"
                            >
                                {t("addExpense")}
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-center text-sm text-emerald-50/70">{t("loading")}</p>
                    ) : expenses.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center">
                            <p className="text-sm text-emerald-50/70">
                                {appliedCategory || appliedFrom || appliedTo
                                    ? t("expensesFilterEmpty")
                                    : t("expensesEmpty")}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
                                <table className="min-w-full text-left text-sm">
                                    <thead className="border-b border-white/10 text-emerald-100/70">
                                        <tr>
                                            <th className="px-4 py-3">{t("expenseDate")}</th>
                                            <th className="px-4 py-3">{t("expenseCategory")}</th>
                                            <th className="px-4 py-3">{t("expenseAmount")}</th>
                                            <th className="px-4 py-3">{t("expenseDescription")}</th>
                                            <th className="px-4 py-3">{t("status")}</th>
                                            <th className="px-4 py-3">{t("actions")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expenses.map((expense) => (
                                            <tr
                                                key={expense._id}
                                                className="border-b border-white/5 text-emerald-50/90"
                                            >
                                                <td className="px-4 py-3">{expense.expenseDate}</td>
                                                <td className="px-4 py-3">
                                                    {t(categoryLabelKey(expense.category))}
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-white">
                                                    {formatPrice(expense.amount)}
                                                </td>
                                                <td className="px-4 py-3 max-w-xs truncate">
                                                    {expense.description || "—"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                                                            expense.isActive
                                                                ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
                                                                : "border-amber-400/30 bg-amber-500/20 text-amber-100"
                                                        }`}
                                                    >
                                                        {expense.isActive
                                                            ? t("expenseActive")
                                                            : t("expenseDeactivated")}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(expense)}
                                                            className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
                                                        >
                                                            {t("edit")}
                                                        </button>
                                                        {expense.isActive && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeactivateTarget(expense)}
                                                                className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-100"
                                                            >
                                                                {t("deactivate")}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {pagination.total > EXPENSES_PER_PAGE && (
                                <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                                    <p className="text-sm text-emerald-100/60">
                                        {t("expensesPagination", {
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
                                                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                                                    page === currentPage
                                                        ? "bg-emerald-500 text-white"
                                                        : "border border-white/20 text-white"
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
                            {editingExpense ? t("editExpense") : t("addExpense")}
                        </h2>
                        {editingExpense && (
                            <p className="mt-2 text-xs text-emerald-100/60">
                                {t("expenseDateChangeNote")}
                            </p>
                        )}
                        {formError && (
                            <p className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                                {formError}
                            </p>
                        )}
                        <form onSubmit={handleSave} className="mt-5 space-y-4">
                            <div>
                                <label className={labelClassName} htmlFor="expenseAmount">
                                    {t("expenseAmount")}
                                </label>
                                <input
                                    id="expenseAmount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    required
                                    value={form.amount}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            amount: e.target.value
                                        }))
                                    }
                                    className={inputClassName}
                                />
                            </div>
                            <div>
                                <label className={labelClassName} htmlFor="expenseCategory">
                                    {t("expenseCategory")}
                                </label>
                                <select
                                    id="expenseCategory"
                                    value={form.category}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            category: e.target.value
                                        }))
                                    }
                                    className={inputClassName}
                                >
                                    {EXPENSE_CATEGORIES.map((category) => (
                                        <option key={category} value={category}>
                                            {t(categoryLabelKey(category))}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClassName} htmlFor="expenseDateInput">
                                    {t("expenseDate")}
                                </label>
                                <input
                                    id="expenseDateInput"
                                    type="date"
                                    required
                                    value={form.expenseDate}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            expenseDate: e.target.value
                                        }))
                                    }
                                    className={inputClassName}
                                />
                            </div>
                            <div>
                                <label className={labelClassName} htmlFor="expenseDescription">
                                    {t("expenseDescription")}
                                </label>
                                <textarea
                                    id="expenseDescription"
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm((current) => ({
                                            ...current,
                                            description: e.target.value
                                        }))
                                    }
                                    className={inputClassName}
                                    rows={3}
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
                            {t("deactivateExpenseTitle")}
                        </h2>
                        <p className="mt-3 text-sm text-emerald-50/80">
                            {t("deactivateExpenseMessage", {
                                amount: formatPrice(deactivateTarget.amount),
                                date: deactivateTarget.expenseDate
                            })}
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
                                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            >
                                {deactivating ? t("loading") : t("deactivate")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </PageShell>
    );
};

export default Expenses;
