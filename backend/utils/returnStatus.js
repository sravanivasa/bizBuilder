const LEGACY_RETURN_STATUS_MAP = {
    Approved: "Accepted",
    Completed: "Delivered"
};

const normalizeReturnStatus = (status) => {
    if (!status || status === "None") {
        return "None";
    }
    return LEGACY_RETURN_STATUS_MAP[status] || status;
};

module.exports = {
    normalizeReturnStatus,
    LEGACY_RETURN_STATUS_MAP
};
