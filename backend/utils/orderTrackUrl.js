const getFrontendBaseUrl = () =>
    (process.env.FRONTEND_URL || process.env.STOREFRONT_URL || "http://localhost:5173").replace(
        /\/$/,
        ""
    );

const buildOrderTrackUrl = (order, business) => {
    const base = getFrontendBaseUrl();
    const token = order.trackingToken;

    if (!token) {
        return null;
    }

    const slug = business?.slug;
    if (slug) {
        return `${base}/store/${slug}/track/${token}`;
    }

    return `${base}/track/${token}`;
};

module.exports = {
    getFrontendBaseUrl,
    buildOrderTrackUrl
};
