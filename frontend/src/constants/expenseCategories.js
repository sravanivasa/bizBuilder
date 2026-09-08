export const EXPENSE_CATEGORIES = [
    "Rent",
    "Utilities",
    "Inventory",
    "Transport",
    "Marketing",
    "Salaries",
    "Misc"
];

export const EXPENSE_TIMEZONE = "Asia/Kolkata";

export const getTodayInBusinessTimezone = () =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone: EXPENSE_TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
