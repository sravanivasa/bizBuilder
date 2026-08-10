const { getFrontendBaseUrl } = require("./orderTrackUrl");

const buildDeliveryPersonUrl = (order) => {
    const token = order.deliveryToken;

    if (!token) {
        return null;
    }

    return `${getFrontendBaseUrl()}/deliver/${token}`;
};

module.exports = {
    buildDeliveryPersonUrl
};
