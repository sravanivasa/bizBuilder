const getUpiQuery = (appPayLink, upiLink) => {
    const link = appPayLink || upiLink || "";
    const match = link.match(/[?&]pa=/);
    if (!match) {
        return "";
    }
    const queryStart = link.indexOf("?");
    return queryStart >= 0 ? link.slice(queryStart + 1) : "";
};

const isIos = () =>
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

const isAndroid = () =>
    typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

/**
 * Open GPay / PhonePe / generic UPI app from mobile browser.
 * Tries app-specific scheme first, then generic upi:// fallback.
 */
export const openUpiPaymentApp = ({ paymentMethod, appPayLink, upiLink }) => {
    const query = getUpiQuery(appPayLink, upiLink);
    if (!query) {
        return false;
    }

    const urls = [];

    if (paymentMethod === "GPay") {
        if (isIos()) {
            urls.push(`gpay://upi/pay?${query}`);
        }
        urls.push(`tez://upi/pay?${query}`);
        if (isAndroid()) {
            urls.push(
                `intent://pay?${query}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`
            );
        }
    } else if (paymentMethod === "PhonePe") {
        urls.push(`phonepe://pay?${query}`);
        if (isAndroid()) {
            urls.push(
                `intent://pay?${query}#Intent;scheme=upi;package=com.phonepe.app;end`
            );
        }
    }

    urls.push(`upi://pay?${query}`);

    const target = urls[0];
    window.location.href = target;

    return true;
};
