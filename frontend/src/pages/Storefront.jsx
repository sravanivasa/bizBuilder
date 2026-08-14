import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createPublicOrder, getPublicBusiness, getPublicProducts } from "../api/public";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { getCategoryLabelKey } from "../constants/businessCategories";
import {
    canEnableCheckoutSubmit,
    formatIndianPhone,
    validateCheckoutForm
} from "../utils/checkoutValidation";
import { calculateGstBreakdown, formatPrice } from "../utils/gstDisplay";
import { CHECKOUT_PAYMENT_METHODS, getPaymentLabelKey, isOnlinePaymentMethod } from "../constants/paymentMethods";
import { canViewInvoice } from "../utils/paymentStatus";
import {
    getLastCheckoutDetails,
    getStorePath,
    saveCustomerOrder
} from "../utils/customerOrdersStorage";

const inputClassName =
    "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-emerald-100/60 outline-none transition focus:border-emerald-300 focus:bg-white/15 focus:ring-2 focus:ring-emerald-400/30";

const inputErrorClassName =
    "border-red-400/50 focus:border-red-400 focus:ring-red-400/30";

const labelClassName = "mb-2 block text-sm font-medium text-emerald-50";

const fieldErrorClassName = "mt-1.5 text-sm text-red-300";

const getCheckoutInputClassName = (hasError) =>
    `${inputClassName}${hasError ? ` ${inputErrorClassName}` : ""}`;

const TotalsBreakdown = ({ amounts, t, compact = false }) => (
    <div className={`space-y-1 ${compact ? "text-sm" : ""}`}>
        <div className="flex justify-between text-emerald-50/80">
            <span>{t("subtotal")}</span>
            <span>{formatPrice(amounts.subtotal)}</span>
        </div>
        {amounts.gstAmount > 0 && (
            <div className="flex justify-between text-emerald-50/80">
                <span>{t("gstAmount", { rate: amounts.gstRate })}</span>
                <span>{formatPrice(amounts.gstAmount)}</span>
            </div>
        )}
        <div className={`flex justify-between text-white ${compact ? "" : "text-base"}`}>
            <span className={compact ? "font-medium" : ""}>{t("totalAmount")}</span>
            <span className={`font-bold text-emerald-300 ${compact ? "text-lg" : "text-lg"}`}>
                {formatPrice(amounts.totalAmount)}
            </span>
        </div>
    </div>
);

const CHECKOUT_FIELDS = [
    "customerName",
    "customerPhone",
    "customerAddress",
    "paymentMethod"
];

const EMPTY_CHECKOUT = {
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    paymentMethod: "COD"
};

const getStockBadge = (stock, t) => {
    if (stock <= 0) {
        return { label: t("storefrontOutOfStock"), className: "bg-red-500/20 text-red-100 border-red-400/30" };
    }
    if (stock <= 5) {
        return {
            label: t("storefrontLowStock", { count: stock }),
            className: "bg-amber-500/20 text-amber-100 border-amber-400/30"
        };
    }
    return {
        label: t("stockLabel", { count: stock }),
        className: "bg-emerald-500/20 text-emerald-100 border-emerald-400/30"
    };
};

const LoadingSkeleton = () => (
    <div className="space-y-6">
        <div className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-8">
            <div className="h-4 w-24 rounded bg-white/10" />
            <div className="mt-4 h-8 w-2/3 rounded bg-white/10" />
            <div className="mt-3 h-4 w-1/3 rounded bg-white/10" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
                <div
                    key={index}
                    className="animate-pulse overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                >
                    <div className="aspect-[4/3] bg-white/10" />
                    <div className="space-y-3 p-4">
                        <div className="h-5 w-3/4 rounded bg-white/10" />
                        <div className="h-4 w-full rounded bg-white/10" />
                        <div className="h-8 w-1/2 rounded bg-white/10" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const Storefront = () => {
    const { storeSlug } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [business, setBusiness] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [cart, setCart] = useState({});
    const [cartOpen, setCartOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [checkout, setCheckout] = useState(EMPTY_CHECKOUT);
    const [checkoutError, setCheckoutError] = useState("");
    const [touched, setTouched] = useState({});
    const [validationAttempted, setValidationAttempted] = useState(false);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(null);
    const [linkCopied, setLinkCopied] = useState(false);

    const loadStore = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [businessRes, productsRes] = await Promise.all([
                getPublicBusiness(storeSlug),
                getPublicProducts(storeSlug)
            ]);

            setBusiness(businessRes.data.business);
            setProducts(productsRes.data.products || []);
        } catch (err) {
            setError(err.response?.data?.message || t("storefrontLoadFailed"));
        } finally {
            setLoading(false);
        }
    }, [storeSlug, t]);

    useEffect(() => {
        loadStore();
    }, [loadStore]);

    const cartItems = useMemo(() => {
        return Object.entries(cart)
            .map(([productId, quantity]) => {
                const product = products.find((item) => item._id === productId);
                if (!product) {
                    return null;
                }

                return { product, quantity };
            })
            .filter(Boolean);
    }, [cart, products]);

    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cartItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
    );

    const orderAmounts = useMemo(
        () => calculateGstBreakdown(cartTotal, business),
        [cartTotal, business]
    );

    const checkoutValidationErrors = useMemo(
        () => validateCheckoutForm(checkout, cartItems, t),
        [checkout, cartItems, t]
    );

    const canPlaceOrder = canEnableCheckoutSubmit(checkout, cartItems);

    const shouldShowFieldError = (field) =>
        (touched[field] || validationAttempted) && checkoutValidationErrors[field];

    const addToCart = (product) => {
        const current = cart[product._id] || 0;
        const next = Math.min(current + 1, product.stock);

        if (next === current) {
            return;
        }

        setCart((prev) => ({ ...prev, [product._id]: next }));
    };

    const removeFromCart = (productId) => {
        setCart((prev) => {
            const next = { ...prev };
            delete next[productId];
            return next;
        });
    };

    const updateCartQuantity = (productId, quantity) => {
        const product = products.find((item) => item._id === productId);
        if (!product) {
            return;
        }

        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCart((prev) => ({
            ...prev,
            [productId]: Math.min(quantity, product.stock)
        }));
    };

    const openCheckout = () => {
        if (!cartItems.length) {
            return;
        }

        const savedDetails = getLastCheckoutDetails(storeSlug, business?._id);
        const paymentMethod = CHECKOUT_PAYMENT_METHODS.includes(checkout.paymentMethod)
            ? checkout.paymentMethod
            : EMPTY_CHECKOUT.paymentMethod;

        setCheckout({
            customerName: savedDetails?.customerName || "",
            customerPhone: savedDetails?.customerPhone || "",
            customerAddress: savedDetails?.customerAddress || "",
            paymentMethod
        });
        setCheckoutError("");
        setTouched({});
        setValidationAttempted(false);
        setCheckoutOpen(true);
        setCartOpen(false);
    };

    const handleCheckoutChange = (field, value) => {
        setCheckout((prev) => ({ ...prev, [field]: value }));
    };

    const handleCheckoutBlur = (field) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    };

    const handlePlaceOrder = async (event) => {
        event.preventDefault();
        setCheckoutError("");

        if (!canPlaceOrder) {
            setValidationAttempted(true);
            setTouched(
                CHECKOUT_FIELDS.reduce((acc, field) => {
                    acc[field] = true;
                    return acc;
                }, {})
            );
            return;
        }

        setPlacingOrder(true);

        try {
            const payload = {
                customerName: checkout.customerName.trim(),
                customerPhone: formatIndianPhone(checkout.customerPhone),
                customerAddress: checkout.customerAddress.trim(),
                paymentMethod: checkout.paymentMethod,
                products: cartItems.map((item) => ({
                    product: item.product._id,
                    quantity: item.quantity
                }))
            };

            const { data } = await createPublicOrder(storeSlug, payload);

            saveCustomerOrder({
                businessId: business?._id,
                businessSlug: business?.slug,
                orderId: data.order._id,
                shortOrderId: data.order._id?.slice(-6).toUpperCase(),
                trackingToken: data.order.trackingToken,
                phone: data.order.customerPhone,
                customerName: data.order.customerName,
                customerAddress: data.order.customerAddress,
                businessName: business?.businessName,
                totalAmount: data.order.totalAmount,
                createdAt: data.order.createdAt,
                orderStatus: data.order.orderStatus,
                paymentStatus: data.order.paymentStatus,
                paymentMethod: data.order.paymentMethod
            });

            if (
                isOnlinePaymentMethod(data.order.paymentMethod) &&
                data.order.trackingToken
            ) {
                const storePath =
                    getStorePath(business?._id, business?.slug || storeSlug) ||
                    `/store/${storeSlug}`;
                setCart({});
                setCheckout(EMPTY_CHECKOUT);
                setTouched({});
                setValidationAttempted(false);
                setCheckoutOpen(false);
                navigate(`${storePath}/pay/${data.order.trackingToken}`);
                loadStore();
                return;
            }

            setCart({});
            setCheckout(EMPTY_CHECKOUT);
            setTouched({});
            setValidationAttempted(false);
            setCheckoutOpen(false);
            await loadStore();

            setOrderSuccess({
                order: data.order,
                trackingUrl: data.trackingUrl,
                whatsappEnabled: data.whatsappEnabled
            });
        } catch (err) {
            setCheckoutError(err.response?.data?.message || t("storefrontOrderFailed"));
        } finally {
            setPlacingOrder(false);
        }
    };

    const categoryLabel = business?.category
        ? t(getCategoryLabelKey(business.category) || "categoryOther")
        : "";

    if (loading) {
        return (
            <StoreShell>
                <LoadingSkeleton />
            </StoreShell>
        );
    }

    if (error) {
        return (
            <StoreShell>
                <div className="mx-auto max-w-lg rounded-3xl border border-red-400/30 bg-red-500/10 p-8 text-center backdrop-blur-xl">
                    <span className="text-4xl">⚠️</span>
                    <p className="mt-4 text-red-100">{error}</p>
                </div>
            </StoreShell>
        );
    }

    if (orderSuccess) {
        const { order, trackingUrl, whatsappEnabled } = orderSuccess;
        const storePath = getStorePath(business?._id, business?.slug) || `/store/${storeSlug}`;
        const trackPath = order.trackingToken
            ? `${storePath}/track/${order.trackingToken}`
            : `${storePath}/track?orderId=${order._id?.slice(-6).toUpperCase()}&phone=${encodeURIComponent(order.customerPhone || "")}`;
        const fullTrackLink = trackingUrl || `${window.location.origin}${trackPath}`;

        const handleCopyTrackLink = async () => {
            try {
                await navigator.clipboard.writeText(fullTrackLink);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
            } catch {
                // ignore clipboard errors
            }
        };

        return (
            <StoreShell businessName={business?.businessName}>
                <div className="relative mx-auto max-w-lg overflow-hidden rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 via-white/5 to-teal-500/10 p-8 text-center shadow-2xl shadow-emerald-500/10 backdrop-blur-xl sm:p-10">
                    <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-teal-400/20 blur-2xl" />
                    <div className="relative">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-4xl text-white shadow-lg shadow-emerald-500/40">
                            ✓
                        </div>
                        <h2 className="mt-6 text-2xl font-bold text-white sm:text-3xl">
                            {t("storefrontOrderSuccessTitle")}
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-emerald-50/80">
                            {t("storefrontOrderSuccessMessage", {
                                id: order._id?.slice(-6).toUpperCase()
                            })}
                        </p>
                        <p className="mt-4 text-lg font-semibold text-white">
                            {t("totalAmount")}: {formatPrice(order.totalAmount)}
                        </p>
                        {order.trackingToken && canViewInvoice(order.paymentStatus) && (
                            <Link
                                to={`/invoice/${order.trackingToken}`}
                                className="mt-3 inline-flex text-sm font-medium text-emerald-300 transition hover:text-emerald-200"
                            >
                                {t("viewInvoice")} →
                            </Link>
                        )}
                        {whatsappEnabled ? (
                            <p className="mt-3 text-sm text-emerald-100/80">
                                {t("storefrontOrderSuccessWhatsApp")}
                            </p>
                        ) : (
                            <p className="mt-2 text-sm text-emerald-100/70">
                                {t("storefrontOrderSuccessCopyLink")}
                            </p>
                        )}
                        <div className="mt-4 flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={handleCopyTrackLink}
                                className="inline-flex justify-center rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-6 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
                            >
                                {linkCopied ? t("storefrontTrackLinkCopied") : t("storefrontCopyTrackLink")}
                            </button>
                        </div>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <Link
                                to={`${storePath}/my-orders`}
                                className="inline-flex justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400"
                            >
                                {t("storefrontViewMyOrders")}
                            </Link>
                            <Link
                                to={trackPath}
                                className="inline-flex justify-center rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-6 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
                            >
                                {t("storefrontTrackOrder")}
                            </Link>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setOrderSuccess(null);
                                setLinkCopied(false);
                            }}
                            className="mt-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400"
                        >
                            {t("storefrontOrderAgain")}
                        </button>
                    </div>
                </div>
            </StoreShell>
        );
    }

    return (
        <StoreShell businessName={business?.businessName}>
            <header className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-emerald-500/20 via-white/5 to-teal-500/10 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-400/15 blur-3xl" />
                <div className="relative flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                            {t("storefrontBadge")}
                        </p>
                        <h1 className="mt-2 text-2xl font-bold text-white sm:text-4xl">
                            {business?.businessName}
                        </h1>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            {categoryLabel && (
                                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100">
                                    {categoryLabel}
                                </span>
                            )}
                            {products.length > 0 && (
                                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-emerald-50/80">
                                    {t("storefrontProductCount", { count: products.length })}
                                </span>
                            )}
                        </div>
                        {(business?.address || business?.phoneNumber) && (
                            <div className="mt-4 space-y-1.5 text-sm text-emerald-50/70">
                                {business?.address && (
                                    <p className="flex items-start gap-2">
                                        <span className="mt-0.5 shrink-0">📍</span>
                                        <span>{business.address}</span>
                                    </p>
                                )}
                                {business?.phoneNumber && (
                                    <p className="flex items-center gap-2">
                                        <span className="shrink-0">📞</span>
                                        <span>{business.phoneNumber}</span>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => setCartOpen(true)}
                        className="relative shrink-0 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:border-emerald-400/30 hover:bg-white/20"
                    >
                        <span className="flex items-center gap-2">
                            <span>🛒</span>
                            {t("storefrontCart")}
                        </span>
                        {cartCount > 0 && (
                            <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-xs font-bold text-white shadow-lg">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            <section className="mt-6 rounded-3xl border border-white/15 bg-white/10 p-5 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-6">
                <h2 className="mb-5 text-lg font-semibold text-white">{t("storefrontProductsTitle")}</h2>

                {products.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-14 text-center">
                        <span className="text-4xl">📦</span>
                        <p className="mt-4 text-sm text-emerald-50/80">{t("storefrontNoProducts")}</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {products.map((product) => {
                            const inCart = cart[product._id] || 0;
                            const stockBadge = getStockBadge(product.stock, t);
                            const outOfStock = product.stock <= 0;

                            return (
                                <article
                                    key={product._id}
                                    className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-white/10 hover:shadow-xl hover:shadow-emerald-500/5"
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
                                        {product.image ? (
                                            <img
                                                src={product.image}
                                                alt={product.productName}
                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-4xl text-emerald-50/30">
                                                📷
                                            </div>
                                        )}
                                        <span
                                            className={`absolute right-3 top-3 rounded-full border px-2.5 py-1 text-xs font-semibold backdrop-blur-sm ${stockBadge.className}`}
                                        >
                                            {stockBadge.label}
                                        </span>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-lg font-bold text-white">
                                            {product.productName}
                                        </h3>
                                        {product.description && (
                                            <p className="mt-1 line-clamp-2 text-sm text-emerald-50/60">
                                                {product.description}
                                            </p>
                                        )}
                                        <div className="mt-4 flex items-center justify-between gap-3">
                                            <p className="text-xl font-bold text-emerald-300">
                                                {formatPrice(product.price)}
                                            </p>
                                            {inCart > 0 ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateCartQuantity(product._id, inCart - 1)
                                                        }
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="min-w-[2ch] text-center font-semibold text-white">
                                                        {inCart}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => addToCart(product)}
                                                        disabled={inCart >= product.stock}
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-40"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => addToCart(product)}
                                                    disabled={outOfStock}
                                                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {outOfStock
                                                        ? t("storefrontOutOfStock")
                                                        : t("storefrontAddToCart")}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {cartCount > 0 && (
                <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden">
                    <button
                        type="button"
                        onClick={() => setCartOpen(true)}
                        className="flex w-full items-center justify-between rounded-2xl border border-emerald-400/30 bg-slate-900/95 px-5 py-4 text-white shadow-2xl shadow-black/40 backdrop-blur-xl"
                    >
                        <span className="font-semibold">
                            {t("storefrontCart")} ({cartCount})
                        </span>
                        <span className="font-bold text-emerald-300">
                            {formatPrice(orderAmounts.totalAmount)}
                        </span>
                    </button>
                </div>
            )}

            {cartOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <button
                        type="button"
                        aria-label={t("close")}
                        onClick={() => setCartOpen(false)}
                        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                    />
                    <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-white/15 bg-slate-900/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white">{t("storefrontCart")}</h2>
                            <button
                                type="button"
                                onClick={() => setCartOpen(false)}
                                className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-emerald-100 transition hover:bg-white/20"
                            >
                                {t("close")}
                            </button>
                        </div>

                        <div className="mt-6 flex-1 space-y-3 overflow-y-auto">
                            {cartItems.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-12 text-center">
                                    <span className="text-3xl">🛒</span>
                                    <p className="mt-3 text-sm text-emerald-50/80">
                                        {t("storefrontCartEmpty")}
                                    </p>
                                    <p className="mt-1 text-xs text-emerald-100/60">
                                        {t("storefrontCartEmptyHint")}
                                    </p>
                                </div>
                            ) : (
                                cartItems.map(({ product, quantity }) => (
                                    <div
                                        key={product._id}
                                        className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
                                    >
                                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white/5">
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.productName}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-lg text-emerald-50/30">
                                                    📷
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-white">
                                                {product.productName}
                                            </p>
                                            <p className="text-sm text-emerald-300">
                                                {formatPrice(product.price)}
                                            </p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateCartQuantity(product._id, quantity - 1)
                                                    }
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                                                >
                                                    −
                                                </button>
                                                <span className="min-w-[2ch] text-center text-white">
                                                    {quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateCartQuantity(product._id, quantity + 1)
                                                    }
                                                    disabled={quantity >= product.stock}
                                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-40"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(product._id)}
                                                    className="ml-auto text-xs font-semibold text-red-300 transition hover:text-red-200"
                                                >
                                                    {t("delete")}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cartItems.length > 0 && (
                            <div className="mt-6 border-t border-white/10 pt-4">
                                <TotalsBreakdown amounts={orderAmounts} t={t} compact />
                                <button
                                    type="button"
                                    onClick={openCheckout}
                                    className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400"
                                >
                                    {t("storefrontCheckout")}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {checkoutOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
                    <button
                        type="button"
                        aria-label={t("close")}
                        onClick={() => setCheckoutOpen(false)}
                        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
                    />
                    <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {t("storefrontCheckoutTitle")}
                                </h2>
                                <p className="mt-1 text-sm text-emerald-50/70">
                                    {t("storefrontCheckoutSubtitle")}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCheckoutOpen(false)}
                                className="shrink-0 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-emerald-100 transition hover:bg-white/20"
                            >
                                {t("close")}
                            </button>
                        </div>

                        <form onSubmit={handlePlaceOrder} className="mt-6 space-y-4">
                            {validationAttempted && !canPlaceOrder && (
                                <p
                                    role="alert"
                                    className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
                                >
                                    {t("checkoutFillRequiredFields")}
                                </p>
                            )}

                            <div>
                                <label className={labelClassName} htmlFor="customerName">
                                    {t("customerName")}
                                </label>
                                <input
                                    id="customerName"
                                    type="text"
                                    value={checkout.customerName}
                                    onChange={(e) =>
                                        handleCheckoutChange("customerName", e.target.value)
                                    }
                                    onBlur={() => handleCheckoutBlur("customerName")}
                                    aria-invalid={Boolean(shouldShowFieldError("customerName"))}
                                    className={getCheckoutInputClassName(
                                        shouldShowFieldError("customerName")
                                    )}
                                />
                                {shouldShowFieldError("customerName") && (
                                    <p className={fieldErrorClassName}>
                                        {checkoutValidationErrors.customerName}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className={labelClassName} htmlFor="customerPhone">
                                    {t("customerPhone")}
                                </label>
                                <input
                                    id="customerPhone"
                                    type="tel"
                                    value={checkout.customerPhone}
                                    onChange={(e) =>
                                        handleCheckoutChange("customerPhone", e.target.value)
                                    }
                                    onBlur={() => handleCheckoutBlur("customerPhone")}
                                    aria-invalid={Boolean(shouldShowFieldError("customerPhone"))}
                                    className={getCheckoutInputClassName(
                                        shouldShowFieldError("customerPhone")
                                    )}
                                />
                                {shouldShowFieldError("customerPhone") && (
                                    <p className={fieldErrorClassName}>
                                        {checkoutValidationErrors.customerPhone}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className={labelClassName} htmlFor="customerAddress">
                                    {t("customerAddress")}
                                </label>
                                <textarea
                                    id="customerAddress"
                                    rows={3}
                                    value={checkout.customerAddress}
                                    onChange={(e) =>
                                        handleCheckoutChange("customerAddress", e.target.value)
                                    }
                                    onBlur={() => handleCheckoutBlur("customerAddress")}
                                    aria-invalid={Boolean(shouldShowFieldError("customerAddress"))}
                                    className={getCheckoutInputClassName(
                                        shouldShowFieldError("customerAddress")
                                    )}
                                />
                                {shouldShowFieldError("customerAddress") && (
                                    <p className={fieldErrorClassName}>
                                        {checkoutValidationErrors.customerAddress}
                                    </p>
                                )}
                            </div>

                            <div>
                                <p className={labelClassName}>{t("paymentMethod")}</p>
                                <div
                                    className={`grid gap-2 sm:grid-cols-2 ${
                                        shouldShowFieldError("paymentMethod")
                                            ? "rounded-xl border border-red-400/50 p-2"
                                            : ""
                                    }`}
                                >
                                    {CHECKOUT_PAYMENT_METHODS.map((method) => (
                                        <label
                                            key={method}
                                            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                                                checkout.paymentMethod === method
                                                    ? "border-emerald-400/50 bg-emerald-500/15"
                                                    : "border-white/20 bg-white/5 hover:bg-white/10"
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value={method}
                                                checked={checkout.paymentMethod === method}
                                                onChange={(e) =>
                                                    handleCheckoutChange("paymentMethod", e.target.value)
                                                }
                                                onBlur={() => handleCheckoutBlur("paymentMethod")}
                                                className="h-4 w-4 accent-emerald-400"
                                            />
                                            <span className="text-sm font-medium text-white">
                                                {t(getPaymentLabelKey(method))}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {shouldShowFieldError("paymentMethod") && (
                                    <p className={fieldErrorClassName}>
                                        {checkoutValidationErrors.paymentMethod}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                                <TotalsBreakdown amounts={orderAmounts} t={t} />
                            </div>

                            {validationAttempted && checkoutValidationErrors.cart && (
                                <p className={fieldErrorClassName}>
                                    {checkoutValidationErrors.cart}
                                </p>
                            )}

                            {checkoutError && (
                                <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                                    {checkoutError}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={placingOrder}
                                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {placingOrder ? t("loading") : t("storefrontPlaceOrder")}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </StoreShell>
    );
};

const StoreShell = ({ businessName, children }) => {
    const { storeSlug } = useParams();
    const { t } = useTranslation();
    const storePath = storeSlug ? `/store/${storeSlug}` : "/";

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-20 top-0 h-96 w-96 rounded-full bg-emerald-500/30 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-teal-400/20 blur-3xl" />
                <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_45%)]" />
            </div>

            <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 pb-24 sm:px-6 sm:pb-8 lg:px-8">
                <div className="mb-8 flex items-center justify-between gap-4">
                    <Link to={storePath} className="inline-flex items-center gap-2 transition hover:opacity-80">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-500/30">
                            B
                        </span>
                        <span className="text-xl font-bold text-white">
                            {businessName || t("appName")}
                        </span>
                    </Link>
                    <div className="flex items-center gap-2 sm:gap-3">
                        {storeSlug && (
                            <>
                                <Link
                                    to={`${storePath}/my-orders`}
                                    className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-white/20 sm:text-sm"
                                >
                                    {t("storefrontMyOrdersLink")}
                                </Link>
                                <Link
                                    to={`${storePath}/track`}
                                    className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20 sm:text-sm"
                                >
                                    {t("storefrontTrackOrderLink")}
                                </Link>
                            </>
                        )}
                        <LanguageSwitcher variant="auth" />
                    </div>
                </div>

                {children}
            </div>
        </div>
    );
};

export default Storefront;
