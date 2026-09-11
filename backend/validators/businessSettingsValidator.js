const { body } = require("express-validator");

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isValidHoliday = (value) => {
    if (!DATE_PATTERN.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
};

const validateWorkingDays = (days) => {
    if (!Array.isArray(days) || days.length === 0) {
        throw new Error("workingDays must be a non-empty array");
    }

    const unique = new Set();

    for (const day of days) {
        const numeric = Number(day);

        if (!Number.isInteger(numeric) || numeric < 0 || numeric > 6) {
            throw new Error("workingDays must contain integers from 0 (Sunday) to 6 (Saturday)");
        }

        if (unique.has(numeric)) {
            throw new Error("workingDays must not contain duplicates");
        }

        unique.add(numeric);
    }

    return true;
};

const validateTimeOrder = (openTime, closeTime) => {
    if (!TIME_PATTERN.test(openTime) || !TIME_PATTERN.test(closeTime)) {
        throw new Error("openTime and closeTime must be HH:mm");
    }

    if (openTime >= closeTime) {
        throw new Error("openTime must be earlier than closeTime");
    }

    return true;
};

const updateBusinessSettingsValidation = [
    body("gst")
        .optional()
        .isObject()
        .withMessage("gst must be an object"),
    body("gst.enabled")
        .optional()
        .isBoolean()
        .withMessage("gst.enabled must be a boolean"),
    body("gst.rate")
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage("gst.rate must be between 0 and 100"),
    body("delivery")
        .optional()
        .isObject()
        .withMessage("delivery must be an object"),
    body("delivery.preparationMinutes")
        .optional()
        .isInt({ min: 0, max: 1440 })
        .withMessage("delivery.preparationMinutes must be between 0 and 1440"),
    body("delivery.deliveryMinutes")
        .optional()
        .isInt({ min: 0, max: 10080 })
        .withMessage("delivery.deliveryMinutes must be between 0 and 10080"),
    body("schedule")
        .optional()
        .isObject()
        .withMessage("schedule must be an object"),
    body("schedule.timezone")
        .optional()
        .custom(() => {
            throw new Error("schedule.timezone is server-controlled");
        }),
    body("schedule.workingDays")
        .optional()
        .custom(validateWorkingDays),
    body("schedule.openTime")
        .optional()
        .matches(TIME_PATTERN)
        .withMessage("schedule.openTime must be HH:mm"),
    body("schedule.closeTime")
        .optional()
        .matches(TIME_PATTERN)
        .withMessage("schedule.closeTime must be HH:mm"),
    body("schedule.holidays")
        .optional()
        .isArray()
        .withMessage("schedule.holidays must be an array"),
    body("schedule.holidays.*")
        .optional()
        .custom((value) => {
            if (!isValidHoliday(value)) {
                throw new Error("schedule.holidays must contain valid YYYY-MM-DD dates");
            }

            return true;
        }),
    body("returns")
        .optional()
        .isObject()
        .withMessage("returns must be an object"),
    body("returns.enabled")
        .optional()
        .isBoolean()
        .withMessage("returns.enabled must be a boolean"),
    body("returns.windowDays")
        .optional()
        .isInt({ min: 0, max: 365 })
        .withMessage("returns.windowDays must be between 0 and 365"),
    body("_id").optional().custom(() => {
        throw new Error("_id cannot be modified");
    }),
    body("business").optional().custom(() => {
        throw new Error("business cannot be modified");
    }),
    body("owner").optional().custom(() => {
        throw new Error("owner cannot be modified");
    }),
    body("createdAt").optional().custom(() => {
        throw new Error("createdAt cannot be modified");
    }),
    body("updatedAt").optional().custom(() => {
        throw new Error("updatedAt cannot be modified");
    }),
    body().custom((value) => {
        if (value.schedule?.openTime && value.schedule?.closeTime) {
            validateTimeOrder(value.schedule.openTime, value.schedule.closeTime);
        }

        return true;
    })
];

module.exports = {
    updateBusinessSettingsValidation,
    validateWorkingDays,
    validateTimeOrder,
    isValidHoliday
};
