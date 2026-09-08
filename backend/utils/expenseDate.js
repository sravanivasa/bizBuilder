/**
 * Expense reporting uses Asia/Kolkata business-calendar dates (YYYY-MM-DD).
 * expenseDate is stored and compared as a date-only string — never shifted via UTC ISO conversion.
 */
const BUSINESS_TIMEZONE = "Asia/Kolkata";
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const formatDateInTimezone = (date, timeZone = BUSINESS_TIMEZONE) =>
    new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(date);

const getTodayInBusinessTimezone = () => formatDateInTimezone(new Date());

const getMonthRangeInBusinessTimezone = () => {
    const today = getTodayInBusinessTimezone();
    const [year, month] = today.split("-");
    const yearNumber = Number(year);
    const monthNumber = Number(month);
    const lastDay = new Date(Date.UTC(yearNumber, monthNumber, 0)).getUTCDate();
    const monthPadded = String(monthNumber).padStart(2, "0");

    return {
        start: `${year}-${monthPadded}-01`,
        end: `${year}-${monthPadded}-${String(lastDay).padStart(2, "0")}`
    };
};

const isValidExpenseDateString = (value) => {
    if (!DATE_ONLY_PATTERN.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));

    return (
        parsed.getUTCFullYear() === year &&
        parsed.getUTCMonth() === month - 1 &&
        parsed.getUTCDate() === day
    );
};

const shiftExpenseDate = (dateString, dayOffset) => {
    const [year, month, day] = dateString.split("-").map(Number);
    const shifted = new Date(Date.UTC(year, month - 1, day + dayOffset));
    const y = shifted.getUTCFullYear();
    const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
    const d = String(shifted.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

module.exports = {
    BUSINESS_TIMEZONE,
    DATE_ONLY_PATTERN,
    formatDateInTimezone,
    getTodayInBusinessTimezone,
    getMonthRangeInBusinessTimezone,
    isValidExpenseDateString,
    shiftExpenseDate
};
