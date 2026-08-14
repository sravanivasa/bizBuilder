import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPublicInvoiceByToken } from "../api/public";
import { getOrderInvoice } from "../api/orders";
import { getPaymentLabelKey } from "../constants/paymentMethods";
import { formatPrice } from "../utils/gstDisplay";
import { getPaymentStatusLabelKey } from "../utils/paymentStatus";
import LanguageSwitcher from "../components/LanguageSwitcher";

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

const Invoice = ({ ownerMode = false }) => {
    const { token, orderId } = useParams();
    const { t } = useTranslation();

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadInvoice = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            if (ownerMode && orderId) {
                const { data } = await getOrderInvoice(orderId);
                setInvoice(data.invoice);
            } else if (token) {
                const { data } = await getPublicInvoiceByToken(token);
                setInvoice(data.invoice);
            } else {
                setError(t("invoiceNotFound"));
            }
        } catch (err) {
            const message = err.response?.data?.message;
            if (err.response?.status === 403) {
                setError(t("invoiceAfterPaymentBlocked"));
            } else {
                setError(message || t("invoiceLoadFailed"));
            }
        } finally {
            setLoading(false);
        }
    }, [ownerMode, orderId, token, t]);

    useEffect(() => {
        loadInvoice();
    }, [loadInvoice]);

    const getPaymentLabel = (method) => {
        const key = getPaymentLabelKey(method);
        return key ? t(key) : method;
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 print:bg-white">
            <div className="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:px-8 print:py-6">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <Link
                        to={ownerMode ? "/orders" : "/"}
                        className="text-sm font-medium text-emerald-700 hover:text-emerald-600"
                    >
                        ← {ownerMode ? t("orders") : t("appName")}
                    </Link>
                    <div className="flex items-center gap-3">
                        <LanguageSwitcher />
                        {invoice && (
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                            >
                                {t("invoicePrint")}
                            </button>
                        )}
                    </div>
                </div>

                {loading && (
                    <p className="text-center text-sm text-slate-600">{t("loading")}</p>
                )}

                {error && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                {invoice && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none sm:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                    {t("invoiceTitle")}
                                </p>
                                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                                    {invoice.business?.businessName || t("appName")}
                                </h1>
                                {invoice.business?.address && (
                                    <p className="mt-2 text-sm text-slate-600">{invoice.business.address}</p>
                                )}
                                {invoice.business?.phoneNumber && (
                                    <p className="text-sm text-slate-600">{invoice.business.phoneNumber}</p>
                                )}
                                {invoice.business?.email && (
                                    <p className="text-sm text-slate-600">{invoice.business.email}</p>
                                )}
                                {invoice.business?.gstin && (
                                    <p className="mt-2 text-sm font-medium text-slate-700">
                                        {t("gstin")}: {invoice.business.gstin}
                                    </p>
                                )}
                            </div>
                            <div className="text-right text-sm text-slate-600">
                                <p>
                                    <span className="font-medium text-slate-800">{t("invoiceNumber")}: </span>
                                    #{invoice.shortOrderId}
                                </p>
                                <p className="mt-1">
                                    <span className="font-medium text-slate-800">{t("invoiceDate")}: </span>
                                    {formatDate(invoice.createdAt)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 border-b border-slate-200 pb-6 sm:grid-cols-2">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    {t("invoiceBillTo")}
                                </p>
                                <p className="mt-2 font-medium text-slate-900">{invoice.customerName}</p>
                                <p className="text-sm text-slate-600">{invoice.customerPhone}</p>
                                <p className="mt-1 text-sm text-slate-600">{invoice.customerAddress}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    {t("invoicePaymentDetails")}
                                </p>
                                <p className="mt-2 text-sm text-slate-700">
                                    <span className="font-medium">{t("paymentMethod")}: </span>
                                    {getPaymentLabel(invoice.paymentMethod)}
                                </p>
                                <p className="text-sm text-slate-700">
                                    <span className="font-medium">{t("paymentStatus")}: </span>
                                    {t(getPaymentStatusLabelKey(invoice.paymentStatus))}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 overflow-x-auto">
                            <table className="w-full min-w-[480px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                                        <th className="py-3 pr-4">{t("invoiceItem")}</th>
                                        <th className="py-3 pr-4 text-right">{t("invoiceQty")}</th>
                                        <th className="py-3 pr-4 text-right">{t("price")}</th>
                                        <th className="py-3 text-right">{t("invoiceAmount")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items?.map((item, index) => (
                                        <tr key={`${item.productName}-${index}`} className="border-b border-slate-100">
                                            <td className="py-3 pr-4 text-slate-800">{item.productName}</td>
                                            <td className="py-3 pr-4 text-right text-slate-700">{item.quantity}</td>
                                            <td className="py-3 pr-4 text-right text-slate-700">
                                                {formatPrice(item.price)}
                                            </td>
                                            <td className="py-3 text-right font-medium text-slate-900">
                                                {formatPrice(item.lineTotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <div className="w-full max-w-xs space-y-2 text-sm">
                                <div className="flex justify-between text-slate-700">
                                    <span>{t("subtotal")}</span>
                                    <span>{formatPrice(invoice.subtotal)}</span>
                                </div>
                                {invoice.gstAmount > 0 && (
                                    <div className="flex justify-between text-slate-700">
                                        <span>{t("gstAmount", { rate: invoice.gstRate })}</span>
                                        <span>{formatPrice(invoice.gstAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
                                    <span>{t("totalAmount")}</span>
                                    <span>{formatPrice(invoice.totalAmount)}</span>
                                </div>
                            </div>
                        </div>

                        <p className="mt-8 text-center text-xs text-slate-500 print:mt-12">
                            {t("invoiceFooter")}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Invoice;
