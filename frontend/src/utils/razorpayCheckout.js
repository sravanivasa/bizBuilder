const UPI_METHODS = ["GPay", "PhonePe", "UPI"];

export const isMobileDevice = () =>
    typeof navigator !== "undefined" &&
    (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.userAgent.includes("Mac") && "ontouchend" in document));

export const isRazorpayTestKey = (keyId) =>
    typeof keyId === "string" && keyId.startsWith("rzp_test_");

export const isUpiCheckoutMethod = (paymentMethod) => UPI_METHODS.includes(paymentMethod);

/**
 * Standard Razorpay checkout — no custom display blocks so UPI shows when
 * enabled on the merchant's Razorpay account (Dashboard → Payment Methods → UPI).
 */
export const buildRazorpayCheckoutOptions = ({ orderData, payment, t, handlers = {} }) => {
    const prefill = {
        name: payment.customerName,
        contact: payment.customerPhone
    };

    return {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: orderData.businessName,
        description: t("orderIdLabel", { id: payment.shortOrderId }),
        order_id: orderData.razorpayOrderId,
        prefill,
        theme: { color: "#10b981" },
        method: {
            upi: true,
            card: true,
            netbanking: true,
            wallet: true,
            paylater: false,
            emi: false
        },
        ...handlers
    };
};
