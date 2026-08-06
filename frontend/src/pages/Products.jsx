import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getMyBusinesses } from "../api/business";
import {
    BULK_IMPORT_BATCH_SIZE,
    bulkCreateProductsInBatches,
    createProduct,
    deleteProduct,
    getProductsByBusiness,
    updateProduct
} from "../api/products";
import PageShell from "../components/PageShell";
import { parseProductCsv, PRODUCT_CSV_TEMPLATE } from "../utils/csvParser";

const EMPTY_FORM = {
    productName: "",
    description: "",
    price: "",
    stock: ""
};

const PRODUCTS_PER_PAGE = 12;
const CSV_PREVIEW_ROWS = 5;

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

const Products = () => {
    const { t } = useTranslation();

    const [businessId, setBusinessId] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [csvModalOpen, setCsvModalOpen] = useState(false);
    const [csvRows, setCsvRows] = useState([]);
    const [csvParseError, setCsvParseError] = useState("");
    const [csvImporting, setCsvImporting] = useState(false);
    const [csvImportProgress, setCsvImportProgress] = useState({ current: 0, total: 0 });
    const [csvImportResult, setCsvImportResult] = useState(null);

    const loadProducts = useCallback(
        async (id) => {
            const { data } = await getProductsByBusiness(id);
            setProducts(data.products || []);
        },
        []
    );

    const filteredProducts = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) {
            return products;
        }

        return products.filter((product) => {
            const name = product.productName?.toLowerCase() ?? "";
            const description = product.description?.toLowerCase() ?? "";
            return name.includes(query) || description.includes(query);
        });
    }, [products, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const pageStart =
        filteredProducts.length === 0 ? 0 : (safePage - 1) * PRODUCTS_PER_PAGE + 1;
    const pageEnd = Math.min(safePage * PRODUCTS_PER_PAGE, filteredProducts.length);

    const paginatedProducts = useMemo(() => {
        const start = (safePage - 1) * PRODUCTS_PER_PAGE;
        return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
    }, [filteredProducts, safePage]);

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
                    setBusinessId(null);
                    setProducts([]);
                    return;
                }

                setBusinessId(business._id);
                await loadProducts(business._id);
            } catch (err) {
                setError(err.response?.data?.message || t("productsLoadFailed"));
            } finally {
                setLoading(false);
            }
        };

        loadPage();
    }, [loadProducts, t]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const resetImagePreview = () => {
        if (imagePreview.startsWith("blob:")) {
            URL.revokeObjectURL(imagePreview);
        }
        setImageFile(null);
        setImagePreview("");
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingProduct(null);
        setForm(EMPTY_FORM);
        resetImagePreview();
        setFormError("");
    };

    const closeCsvModal = () => {
        setCsvModalOpen(false);
        setCsvRows([]);
        setCsvParseError("");
        setCsvImportProgress({ current: 0, total: 0 });
        setCsvImportResult(null);
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setForm(EMPTY_FORM);
        resetImagePreview();
        setFormError("");
        setModalOpen(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setForm({
            productName: product.productName || "",
            description: product.description || "",
            price: String(product.price ?? ""),
            stock: String(product.stock ?? "")
        });
        resetImagePreview();
        setImagePreview(product.image || "");
        setFormError("");
        setModalOpen(true);
    };

    const handleChange = (event) => {
        setForm({ ...form, [event.target.name]: event.target.value });
    };

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (imagePreview.startsWith("blob:")) {
            URL.revokeObjectURL(imagePreview);
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleCsvFileChange = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) {
            return;
        }

        if (!file.name.toLowerCase().endsWith(".csv")) {
            setCsvParseError(t("csvInvalidFormat"));
            setCsvRows([]);
            setCsvImportResult(null);
            setCsvModalOpen(true);
            return;
        }

        const text = await file.text();
        const result = parseProductCsv(text);

        if (result.error === "invalidHeader") {
            setCsvParseError(t("csvInvalidHeader"));
            setCsvRows([]);
            setCsvImportResult(null);
            setCsvModalOpen(true);
            return;
        }

        if (result.error === "noRows") {
            setCsvParseError(t("csvNoRows"));
            setCsvRows([]);
            setCsvImportResult(null);
            setCsvModalOpen(true);
            return;
        }

        setCsvParseError("");
        setCsvRows(result.rows);
        setCsvImportResult(null);
        setCsvModalOpen(true);
    };

    const handleCsvImport = async () => {
        if (!csvRows.length || !businessId) {
            return;
        }

        setCsvImporting(true);
        setCsvParseError("");
        setCsvImportProgress({ current: 0, total: csvRows.length });

        try {
            const data = await bulkCreateProductsInBatches(businessId, csvRows, {
                onProgress: (current, total) => setCsvImportProgress({ current, total })
            });
            setCsvImportResult(data);
            await loadProducts(businessId);

            if (data.created > 0) {
                setSuccess(t("csvImportSummary", { created: data.created, failed: data.failed }));
            }
        } catch (err) {
            if (err.processed > 0) {
                setCsvParseError(
                    t("csvImportPartialFailed", {
                        processed: err.processed,
                        total: err.total ?? csvRows.length,
                        message: err.message
                    })
                );
            } else if (err.response?.status === 413) {
                setCsvParseError(t("csvImportTooLarge"));
            } else {
                setCsvParseError(err.response?.data?.message || err.message || t("csvImportFailed"));
            }
        } finally {
            setCsvImporting(false);
            setCsvImportProgress({ current: 0, total: 0 });
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError("");
        setSaving(true);

        const payload = {
            productName: form.productName.trim(),
            description: form.description.trim(),
            price: Number(form.price),
            stock: Number(form.stock),
            image: imageFile
        };

        if (!editingProduct && !imageFile) {
            setFormError(t("productImageRequired"));
            setSaving(false);
            return;
        }

        try {
            if (editingProduct) {
                const { data } = await updateProduct(editingProduct._id, payload);
                setProducts((current) =>
                    current.map((item) =>
                        item._id === editingProduct._id ? data.product : item
                    )
                );
                setSuccess(t("productUpdateSuccess"));
            } else {
                const { data } = await createProduct(businessId, payload);
                setProducts((current) => [data.product, ...current]);
                setSuccess(t("productCreateSuccess"));
            }

            closeModal();
        } catch (err) {
            const validationErrors = err.response?.data?.errors;
            if (validationErrors?.length) {
                setFormError(validationErrors.map((item) => item.msg).join(". "));
            } else {
                setFormError(err.response?.data?.message || t("productSaveFailed"));
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) {
            return;
        }

        setDeleting(true);
        setError("");

        try {
            await deleteProduct(deleteTarget._id);
            setProducts((current) => current.filter((item) => item._id !== deleteTarget._id));
            setSuccess(t("productDeleteSuccess"));
            setDeleteTarget(null);
        } catch (err) {
            setError(err.response?.data?.message || t("productDeleteFailed"));
        } finally {
            setDeleting(false);
        }
    };

    const renderModal = () => {
        if (!modalOpen) {
            return null;
        }

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <button
                    type="button"
                    aria-label={t("cancel")}
                    onClick={closeModal}
                    className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                />
                <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
                    <h2 className="text-xl font-bold text-white">
                        {editingProduct ? t("editProduct") : t("addProduct")}
                    </h2>
                    <p className="mt-1 text-sm text-emerald-50/70">
                        {editingProduct ? t("editProductSubtitle") : t("addProductSubtitle")}
                    </p>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                        {formError && (
                            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                                {formError}
                            </p>
                        )}

                        <div>
                            <label htmlFor="productName" className={labelClassName}>
                                {t("productName")}
                                <span className="text-red-300"> *</span>
                            </label>
                            <input
                                id="productName"
                                name="productName"
                                value={form.productName}
                                onChange={handleChange}
                                required
                                className={inputClassName}
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className={labelClassName}>
                                {t("description")}
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={3}
                                className={inputClassName}
                            />
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label htmlFor="price" className={labelClassName}>
                                    {t("price")}
                                    <span className="text-red-300"> *</span>
                                </label>
                                <input
                                    id="price"
                                    name="price"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={form.price}
                                    onChange={handleChange}
                                    required
                                    className={inputClassName}
                                />
                            </div>

                            <div>
                                <label htmlFor="stock" className={labelClassName}>
                                    {t("stock")}
                                    <span className="text-red-300"> *</span>
                                </label>
                                <input
                                    id="stock"
                                    name="stock"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={form.stock}
                                    onChange={handleChange}
                                    required
                                    className={inputClassName}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="image" className={labelClassName}>
                                {t("productImage")}
                                {!editingProduct && <span className="text-red-300"> *</span>}
                            </label>
                            <input
                                id="image"
                                name="image"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleImageChange}
                                className="block w-full text-sm text-emerald-50/80 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-500/20 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-100 hover:file:bg-emerald-500/30"
                            />
                            {editingProduct && (
                                <p className="mt-1.5 text-xs text-emerald-100/60">
                                    {t("productImageOptional")}
                                </p>
                            )}
                            {imagePreview && (
                                <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                    <img
                                        src={imagePreview}
                                        alt={t("imagePreview")}
                                        className="h-40 w-full object-cover"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving
                                    ? t("loading")
                                    : editingProduct
                                      ? t("saveProduct")
                                      : t("createProduct")}
                            </button>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                            >
                                {t("cancel")}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const renderCsvModal = () => {
        if (!csvModalOpen) {
            return null;
        }

        const previewRows = csvRows.slice(0, CSV_PREVIEW_ROWS);

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <button
                    type="button"
                    aria-label={t("cancel")}
                    onClick={closeCsvModal}
                    className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                />
                <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
                    <h2 className="text-xl font-bold text-white">{t("importCsvTitle")}</h2>
                    <p className="mt-1 text-sm text-emerald-50/70">{t("importCsvSubtitle")}</p>
                    {csvRows.length > BULK_IMPORT_BATCH_SIZE && !csvImportResult && (
                        <p className="mt-2 text-xs text-emerald-100/60">
                            {t("csvBatchHint", { size: BULK_IMPORT_BATCH_SIZE })}
                        </p>
                    )}

                    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100/70">
                            {t("csvFormatTitle")}
                        </p>
                        <p className="mt-2 font-mono text-xs text-emerald-50/80">{PRODUCT_CSV_TEMPLATE}</p>
                        <p className="mt-2 text-xs text-emerald-100/60">{t("csvFormatHint")}</p>
                    </div>

                    {csvImporting && csvImportProgress.total > 0 && (
                        <p className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                            {t("csvImportProgress", {
                                current: csvImportProgress.current,
                                total: csvImportProgress.total
                            })}
                        </p>
                    )}

                    {csvParseError && (
                        <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                            {csvParseError}
                        </p>
                    )}

                    {csvRows.length > 0 && !csvImportResult && (
                        <div className="mt-4">
                            <p className="text-sm font-medium text-emerald-50">
                                {t("csvPreviewTitle", { count: csvRows.length })}
                            </p>
                            <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
                                <table className="min-w-full text-left text-xs text-emerald-50/80">
                                    <thead className="bg-white/5 text-emerald-100/70">
                                        <tr>
                                            <th className="px-3 py-2">{t("productName")}</th>
                                            <th className="px-3 py-2">{t("description")}</th>
                                            <th className="px-3 py-2">{t("price")}</th>
                                            <th className="px-3 py-2">{t("stock")}</th>
                                            <th className="px-3 py-2">{t("csvImageUrl")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewRows.map((row, index) => (
                                            <tr key={index} className="border-t border-white/10">
                                                <td className="px-3 py-2">{row.productName}</td>
                                                <td className="px-3 py-2 max-w-[8rem] truncate">
                                                    {row.description}
                                                </td>
                                                <td className="px-3 py-2">{row.price}</td>
                                                <td className="px-3 py-2">{row.stock}</td>
                                                <td className="px-3 py-2 max-w-[8rem] truncate">
                                                    {row.imageUrl || t("csvImageOptional")}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {csvRows.length > CSV_PREVIEW_ROWS && (
                                <p className="mt-2 text-xs text-emerald-100/60">
                                    {t("csvPreviewMore", {
                                        count: csvRows.length - CSV_PREVIEW_ROWS
                                    })}
                                </p>
                            )}
                        </div>
                    )}

                    {csvImportResult && (
                        <div className="mt-4 space-y-3">
                            <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                                {t("csvImportSummary", {
                                    created: csvImportResult.created,
                                    failed: csvImportResult.failed
                                })}
                            </p>
                            {csvImportResult.errors?.length > 0 && (
                                <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3">
                                    <p className="text-sm font-medium text-amber-50">
                                        {t("importResults")}
                                    </p>
                                    <ul className="mt-2 space-y-1 text-xs text-amber-50/80">
                                        {csvImportResult.errors.map((item) => (
                                            <li key={`${item.row}-${item.message}`}>
                                                {t("csvRowError", {
                                                    row: item.row,
                                                    message: item.message
                                                })}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">
                        {csvRows.length > 0 && !csvImportResult && (
                            <button
                                type="button"
                                onClick={handleCsvImport}
                                disabled={csvImporting}
                                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {csvImporting
                                    ? csvImportProgress.total > 0
                                        ? t("csvImportProgress", {
                                              current: csvImportProgress.current,
                                              total: csvImportProgress.total
                                          })
                                        : t("csvImporting")
                                    : t("csvConfirmImport")}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={closeCsvModal}
                            className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                        >
                            {csvImportResult ? t("close") : t("cancel")}
                        </button>
                    </div>
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
                    <h2 className="text-lg font-bold text-white">{t("confirmDeleteProduct")}</h2>
                    <p className="mt-2 text-sm text-emerald-50/70">
                        {t("confirmDeleteProductMessage", { name: deleteTarget.productName })}
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
        if (filteredProducts.length <= PRODUCTS_PER_PAGE) {
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

    return (
        <PageShell
            badge={t("products")}
            title={t("productsTitle")}
            subtitle={t("productsSubtitle")}
        >
            {loading ? (
                <p className="text-center text-sm text-emerald-50/70">{t("loading")}</p>
            ) : !businessId ? (
                <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-6 py-8 text-center">
                    <p className="text-sm text-amber-50">{t("noBusinessForProducts")}</p>
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

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                            <label htmlFor="productSearch" className="sr-only">
                                {t("productSearchPlaceholder")}
                            </label>
                            <input
                                id="productSearch"
                                type="search"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder={t("productSearchPlaceholder")}
                                className={inputClassName}
                            />
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <label className="cursor-pointer rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">
                                {t("importCsv")}
                                <input
                                    type="file"
                                    accept=".csv,text/csv"
                                    onChange={handleCsvFileChange}
                                    className="hidden"
                                />
                            </label>
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400"
                            >
                                {t("addProduct")}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-emerald-50/70">
                        <p>
                            {filteredProducts.length > 0
                                ? t("showingProductsRange", {
                                      start: pageStart,
                                      end: pageEnd,
                                      total: filteredProducts.length
                                  })
                                : t("productsCount", { count: products.length })}
                        </p>
                        {searchQuery.trim() && filteredProducts.length === 0 && products.length > 0 && (
                            <p className="text-amber-100/80">{t("productsNoSearchResults")}</p>
                        )}
                    </div>

                    {products.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-12 text-center">
                            <p className="text-sm text-emerald-50/80">{t("productsEmpty")}</p>
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="mt-4 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                            >
                                {t("addFirstProduct")}
                            </button>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-12 text-center">
                            <p className="text-sm text-emerald-50/80">{t("productsNoSearchResults")}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div
                                className="max-h-[calc(100vh-18rem)] overflow-y-auto rounded-2xl border border-white/10 p-4 sm:p-5"
                            >
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {paginatedProducts.map((product) => (
                                        <article
                                            key={product._id}
                                            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                                        >
                                            <div className="aspect-[4/3] overflow-hidden bg-white/5">
                                                {product.image ? (
                                                    <img
                                                        src={product.image}
                                                        alt={product.productName}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-3xl text-emerald-50/40">
                                                        📷
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-semibold text-white">
                                                    {product.productName}
                                                </h3>
                                                {product.description && (
                                                    <p className="mt-1 line-clamp-2 text-sm text-emerald-50/60">
                                                        {product.description}
                                                    </p>
                                                )}
                                                <div className="mt-3 flex items-center justify-between gap-2">
                                                    <p className="text-lg font-bold text-emerald-200">
                                                        {formatPrice(product.price)}
                                                    </p>
                                                    <p className="text-sm text-emerald-50/70">
                                                        {t("stockLabel", { count: product.stock })}
                                                    </p>
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(product)}
                                                        className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                                                    >
                                                        {t("edit")}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSuccess("");
                                                            setDeleteTarget(product);
                                                        }}
                                                        className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-500/20"
                                                    >
                                                        {t("delete")}
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>
                            {renderPagination()}
                        </div>
                    )}
                </div>
            )}

            {renderModal()}
            {renderCsvModal()}
            {renderDeleteDialog()}
        </PageShell>
    );
};

export default Products;
