const buildIndiaPostUrl = (id) =>
    `https://www.indiapost.gov.in/_layouts/15/DOP.Portal.Tracking/TrackConsignment.aspx?consignmentnumber=${encodeURIComponent(id)}`;

const KNOWN_CARRIERS = {
    delhivery: (id) => `https://www.delhivery.com/track/package/${encodeURIComponent(id)}`,
    "india post": buildIndiaPostUrl,
    indiapost: buildIndiaPostUrl,
    bluedart: (id) => `https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo=${encodeURIComponent(id)}`,
    dtdc: (id) => `https://www.dtdc.in/tracking/tracking_results.asp?Ttype=awb_no&strCnno=${encodeURIComponent(id)}`,
    ekart: (id) => `https://ekartlogistics.com/shipmenttrack/${encodeURIComponent(id)}`,
    shadowfax: (id) => `https://tracker.shadowfax.in/#/tracking/${encodeURIComponent(id)}`,
    xpressbees: (id) => `https://www.xpressbees.com/track?isawb=Yes&trackid=${encodeURIComponent(id)}`
};

const buildCourierTrackingUrl = (courierName, trackingId) => {
    if (!courierName || !trackingId) {
        return null;
    }

    const key = courierName.trim().toLowerCase();
    const builder = KNOWN_CARRIERS[key];

    if (builder) {
        return builder(trackingId.trim());
    }

    return null;
};

const COURIER_OPTIONS = [
    "Delhivery",
    "India Post",
    "BlueDart",
    "DTDC",
    "Ekart",
    "Shadowfax",
    "XpressBees",
    "Other"
];

module.exports = {
    KNOWN_CARRIERS,
    COURIER_OPTIONS,
    buildCourierTrackingUrl
};
