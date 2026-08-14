import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    getPaymentPage,
    createRazorpayOrder,
    verifyRazorpayPayment
} from "../api/public";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { getPaymentLabelKey } from "../constants/paymentMethods";
import { getStorePath } from "../utils/customerOrdersStorage";
import { formatPrice } from "../utils/gstDisplay";
import { getPaymentStatusLabelKey, paymentStatusBadgeClass, canViewInvoice } from "../utils/paymentStatus";
import { buildRazorpayCheckoutOptions, isRazorpayTestKey } from "../utils/razorpayCheckout";
import { openUpiPaymentApp } from "../utils/openUpiApp";
import { isMobileDevice } from "../utils/razorpayCheckout";

const loadRazorpayScript = () =>
    new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

const Payment = () => {
    const { t } = useTranslation();
    const { storeSlug, token } = useParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [payment, setPayment] = useState(null);
    const [razorpayLoading, setRazorpayLoading] = useState(false);
    const [razorpayError, setRazorpayError] = useState("");
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const checkoutOpenedRef = useRef(false);

    const loadPayment = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const { data } = await getPaymentPage(token);
            setPayment(data.payment);
        } catch (err) {
            setError(err.response?.data?.message || t("paymentLoadFailed"));
        } finally {
            setLoading(false);
        }
    }, [token, t]);

    useEffect(() => {
        loadPayment();
    }, [loadPayment]);

    const isPaid = payment?.paymentStatus === "Paid";
    const isSubmitted = payment?.paymentStatus === "PaymentSubmitted";
    const useRazorpay = Boolean(payment?.razorpayConfigured);
    const showManualFallback = payment && !useRazorpay && !isPaid;

    const prepareRazorpayOrder = useCallback(async () => {
        if (!payment || isPaid || !useRazorpay) {
            return null;
        }

        setRazorpayLoading(true);
        setRazorpayError("");

        try {
            const { data } = await createRazorpayOrder(token);
            return data;
        } catch (err) {
            setRazorpayError(err.response?.data?.message || t("paymentFailed"));
            return null;
        } finally {
            setRazorpayLoading(false);
        }
    }, [payment, isPaid, useRazorpay, token, t]);

    const openRazorpayCheckout = async () => {
        if (checkoutOpen) {
            return;
        }

        setRazorpayError("");
        setCheckoutOpen(true);

        const orderData = await prepareRazorpayOrder();

        if (!orderData) {
            setCheckoutOpen(false);
            return;
        }

        const scriptLoaded = await loadRazorpayScript();

        if (!scriptLoaded) {
            setRazorpayError(t("paymentFailed"));
            setCheckoutOpen(false);
            return;
        }

        const options = buildRazorpayCheckoutOptions({
            orderData,
            payment,
            t,
            handlers: {
                handler: async (response) => {
                    try {
                        await verifyRazorpayPayment(token, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        const { data } = await getPaymentPage(token);
                        setPayment(data.payment);
                    } catch (err) {
                        setRazorpayError(err.response?.data?.message || t("paymentFailed"));
                    } finally {
                        setCheckoutOpen(false);
                        checkoutOpenedRef.current = false;
                    }
                },
                modal: {
                    ondismiss: () => {
                        setCheckoutOpen(false);
                        checkoutOpenedRef.current = false;
                        setRazorpayError(t("paymentDismissed"));
                    }
                }
            }
        });

        const razorpay = new window.Razorpay(options);
        razorpay.on("payment.failed", () => {
            setRazorpayError(t("paymentFailed"));
            setCheckoutOpen(false);
            checkoutOpenedRef.current = false;
        });

        checkoutOpenedRef.current = true;
        razorpay.open();
    };

    const openDirectUpiApp = () => {
        const opened = openUpiPaymentApp({
            paymentMethod: payment.paymentMethod,
            appPayLink: payment.appPayLink,
            upiLink: payment.upiLink
        });

        if (!opened) {
            setRazorpayError(t("paymentUpiOpenFailed"));
        }
    };

    const storePath = payment?.business
        ? getStorePath(payment.business._id, payment.business.slug || storeSlug)
        : storeSlug
          ? `/store/${storeSlug}`
          : "";
    const trackPath = storePath
        ? `${storePath}/track/${token}`
        : `/track/${token}`;

    const paymentMethodKey = payment ? getPaymentLabelKey(payment.paymentMethod) : null;
    const paymentMethodLabel = paymentMethodKey ? t(paymentMethodKey) : payment?.paymentMethod;
    const isUpiMethod = payment && ["GPay", "PhonePe", "UPI"].includes(payment.paymentMethod);
    const isNetBanking = payment?.paymentMethod === "NetBanking";
    const business = payment?.business;
    const hasUpiDetails = Boolean(business?.upiId);
    const hasBankDetails =
        Boolean(business?.bankAccountNumber) &&
        Boolean(business?.bankName) &&
        Boolean(business?.bankIfsc);

    const isMobile = isMobileDevice();
    const showPaymentInstructions = payment && !isPaid && !isSubmitted;
    const showDirectUpiPay =
        showPaymentInstructions &&
        isUpiMethod &&
        hasUpiDetails &&
        showManualFallback &&
        Boolean(payment.appPayLink);
    const showRazorpayCheckout =
        useRazorpay && showPaymentInstructions && !isPaid && !isSubmitted;
    const showUpiQrOnRazorpay =
        showRazorpayCheckout && hasUpiDetails && Boolean(payment.qrCodeUrl);
    const showInvoice = payment && canViewInvoice(payment.paymentStatus);
    const headerIcon = isPaid ? "✓" : isSubmitted ? "⏳" : "💳";
    const headerTitle = isPaid
        ? t("orderConfirmedTitle")
        : isSubmitted
          ? t("paymentSubmittedTitle")
          : t("completePaymentTitle");
    const headerMessage = isPaid
        ? t("paymentConfirmed", { id: payment?.shortOrderId })
        : isSubmitted
          ? t("paymentSubmittedMessage", { id: payment?.shortOrderId })
          : t("completePaymentMessage", { id: payment?.shortOrderId });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-lg px-4 py-8 sm:px-6">
                <div className="mb-6 flex items-center justify-between">
                    {storePath ? (
                        <Link
                            to={storePath}
                            className="text-sm font-medium text-emerald-300 transition hover:text-emerald-200"
                        >
                            ← {payment?.business?.businessName || t("storefrontBackToStore")}
                        </Link>
                    ) : (
                        <span />
                    )}
                    <LanguageSwitcher />
                </div>

                {loading ? (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
                        <p className="text-emerald-50/70">{t("loading")}</p>
                    </div>
                ) : error && !payment ? (
                    <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-8 text-center backdrop-blur-xl">
                        <span className="text-4xl">⚠️</span>
                        <p className="mt-4 text-red-100">{error}</p>
                    </div>
                ) : payment ? (
                    <div className="space-y-6">
                        <div className="relative overflow-hidden rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 via-white/5 to-teal-500/10 p-6 text-center shadow-2xl shadow-emerald-500/10 backdrop-blur-xl sm:p-8">
                            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-400/20 blur-2xl" />
                            <div className="relative">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-3xl text-white shadow-lg shadow-emerald-500/40">
                                    {headerIcon}
                                </div>
                                <h1 className="mt-5 text-2xl font-bold text-white">
                                    {headerTitle}
                                </h1>
                                <p className="mt-2 text-sm leading-6 text-emerald-50/80">
                                    {headerMessage}
                                </p>
                                {payment.paymentStatus && (
                                    <span
                                        className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${paymentStatusBadgeClass(
                                            payment.paymentStatus
                                        )}`}
                                    >
                                        {t(getPaymentStatusLabelKey(payment.paymentStatus))}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
                            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                                <div className="flex justify-between text-emerald-50/80">
                                    <span>{t("orderIdLabel", { id: payment.shortOrderId })}</span>
                                </div>
                                <div className="flex justify-between text-emerald-50/80">
                                    <span>{t("paymentMethod")}</span>
                                    <span>{paymentMethodLabel}</span>
                                </div>
                                {payment.gstAmount > 0 && (
                                    <>
                                        <div className="flex justify-between text-emerald-50/80">
                                            <span>{t("subtotal")}</span>
                                            <span>{formatPrice(payment.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-emerald-50/80">
                                            <span>{t("gstAmount", { rate: payment.gstRate })}</span>
                                            <span>{formatPrice(payment.gstAmount)}</span>
                                        </div>
                                    </>
                                )}
                                <div className="flex justify-between text-base font-semibold text-white">
                                    <span>{t("totalAmount")}</span>
                                    <span className="text-emerald-300">
                                        {formatPrice(payment.totalAmount)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {isPaid && (
                            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100">
                                {t("paymentVerifiedMessage")}
                            </div>
                        )}

                        {isSubmitted && !isPaid && (
                            <div className="rounded-2xl border border-blue-400/30 bg-blue-500/15 px-4 py-3 text-sm text-blue-100">
                                {t("paymentDoneMessage", { id: payment.shortOrderId })}
                            </div>
                        )}

                        {showRazorpayCheckout && (
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
                                <h2 className="text-base font-semibold text-white">
                                    {t("paymentSimpleTitle")}
                                </h2>
                                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-emerald-50/80">
                                    <li>{t("paymentStep1")}</li>
                                    <li>{t("paymentStep2")}</li>
                                    <li>{t("paymentStep3")}</li>
                                </ol>

                                {razorpayError && (
                                    <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                                        {razorpayError}
                                    </p>
                                )}

                                <button
                                    type="button"
                                    onClick={openRazorpayCheckout}
                                    disabled={razorpayLoading || checkoutOpen}
                                    className="mt-5 flex w-full justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {razorpayLoading || checkoutOpen
                                        ? t("loading")
                                        : t("payAmount", { amount: formatPrice(payment.totalAmount) })}
                                </button>

                                {showUpiQrOnRazorpay && (
                                    <div className="mt-6 border-t border-white/10 pt-6">
                                        <p className="text-sm font-medium text-emerald-50">
                                            {t("paymentQrDesktopTitle")}
                                        </p>
                                        <p className="mt-1 text-xs text-emerald-100/60">
                                            {t("paymentQrDesktopHint")}
                                        </p>
                                        <div className="mt-4 flex flex-col items-center gap-3">
                                            <img
                                                src={payment.qrCodeUrl}
                                                alt={t("paymentQrAlt")}
                                                className="h-44 w-44 rounded-2xl border border-white/10 bg-white p-2"
                                            />
                                            <p className="font-mono text-xs text-emerald-100">
                                                {business.upiId}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {isRazorpayTestKey(payment?.razorpayKeyId) && (
                                    <p className="mt-4 text-xs text-amber-100/80">
                                        {t("razorpayTestModeShort")}
                                    </p>
                                )}
                            </div>
                        )}

                        {showManualFallback && !isSubmitted && !showDirectUpiPay && (
                            <p className="text-center text-sm text-amber-100/90">
                                {t("razorpayNotConfigured")}
                            </p>
                        )}

                        {showDirectUpiPay && (
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
                                <h2 className="text-base font-semibold text-white">
                                    {t("manualPaymentTitle")}
                                </h2>
                                <p className="mt-1 text-sm text-emerald-50/70">
                                    {t("paymentInstructionsSubtitle", { method: paymentMethodLabel })}
                                </p>

                                {hasUpiDetails ? (
                                    <div className="mt-5 space-y-5">
                                        <div>
                                            <p className="text-sm font-medium text-emerald-50">
                                                {t("paymentUpiIdLabel")}
                                            </p>
                                            <p className="mt-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white">
                                                {business.upiId}
                                            </p>
                                        </div>

                                        {payment.qrCodeUrl && (
                                            <div className="flex flex-col items-center gap-3">
                                                <img
                                                    src={payment.qrCodeUrl}
                                                    alt={t("paymentQrAlt")}
                                                    className="h-48 w-48 rounded-2xl border border-white/10 bg-white p-2"
                                                />
                                                <p className="text-center text-xs text-emerald-100/60">
                                                    {t("paymentScanQr")}
                                                </p>
                                            </div>
                                        )}

                                        {payment.appPayLink && isMobile && (
                                            <button
                                                type="button"
                                                onClick={openDirectUpiApp}
                                                className="flex w-full justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400"
                                            >
                                                {t("paymentOpenApp", { method: paymentMethodLabel })}
                                            </button>
                                        )}
                                        {!isMobile && (
                                            <p className="text-center text-sm text-amber-100/90">
                                                {t("paymentUpiMobileOnly")}
                                            </p>
                                        )}
                                        <p className="text-center text-xs text-emerald-100/60">
                                            {t("manualUpiAfterPayHint")}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="mt-4 text-sm text-amber-100/90">
                                        {t("paymentUpiNotConfigured")}
                                    </p>
                                )}
                            </div>
                        )}

                        {showManualFallback && isNetBanking && (
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
                                <h2 className="text-base font-semibold text-white">
                                    {t("manualPaymentTitle")}
                                </h2>
                                <p className="mt-1 text-sm text-emerald-50/70">
                                    {t("paymentInstructionsSubtitle", { method: paymentMethodLabel })}
                                </p>

                                {hasBankDetails ? (
                                    <div className="mt-5 space-y-4 text-sm">
                                        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                                            {business.bankAccountName && (
                                                <p className="text-emerald-50/80">
                                                    <span className="text-emerald-100/60">
                                                        {t("paymentBankAccountName")}:{" "}
                                                    </span>
                                                    {business.bankAccountName}
                                                </p>
                                            )}
                                            <p className="text-emerald-50/80">
                                                <span className="text-emerald-100/60">
                                                    {t("paymentBankName")}:{" "}
                                                </span>
                                                {business.bankName}
                                            </p>
                                            <p className="font-mono text-emerald-50/80">
                                                <span className="font-sans text-emerald-100/60">
                                                    {t("paymentBankAccountNumber")}:{" "}
                                                </span>
                                                {business.bankAccountNumber}
                                            </p>
                                            <p className="font-mono text-emerald-50/80">
                                                <span className="font-sans text-emerald-100/60">
                                                    {t("paymentBankIfsc")}:{" "}
                                                </span>
                                                {business.bankIfsc}
                                            </p>
                                        </div>
                                        <p className="text-xs text-emerald-100/60">
                                            {t("paymentBankTransferHint")}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="mt-4 text-sm text-amber-100/90">
                                        {t("paymentBankNotConfigured")}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                            <Link
                                to={trackPath}
                                className="inline-flex justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-teal-400"
                            >
                                {t("storefrontTrackOrder")}
                            </Link>
                            {showInvoice && (
                                <Link
                                    to={`/invoice/${token}`}
                                    className="inline-flex justify-center rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-6 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
                                >
                                    {t("viewInvoice")}
                                </Link>
                            )}
                        </div>
                        {!showInvoice && payment && !isPaid && (
                            <p className="text-center text-xs text-emerald-100/60">
                                {t("invoiceAfterPayment")}
                            </p>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default Payment;
