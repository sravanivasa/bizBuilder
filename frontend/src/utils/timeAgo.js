export const formatTimeAgo = (value, t) => {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();

    if (diffMs < 0) {
        return t("timeAgoJustNow");
    }

    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) {
        return t("timeAgoJustNow");
    }

    if (minutes < 60) {
        return t("timeAgoMinutes", { count: minutes });
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return t("timeAgoHours", { count: hours });
    }

    const days = Math.floor(hours / 24);
    return t("timeAgoDays", { count: days });
};

export const formatDateTime = (value) => {
    if (!value) {
        return "";
    }

    return new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};
