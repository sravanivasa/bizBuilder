const mongoose = require("mongoose");

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const businessSettingsSchema = new mongoose.Schema(
    {
        business: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Business",
            required: true,
            unique: true
        },
        gst: {
            enabled: {
                type: Boolean,
                default: false
            },
            rate: {
                type: Number,
                default: 18,
                min: 0,
                max: 100
            }
        },
        delivery: {
            preparationMinutes: {
                type: Number,
                default: 30,
                min: 0,
                max: 1440
            },
            deliveryMinutes: {
                type: Number,
                default: 60,
                min: 0,
                max: 10080
            }
        },
        schedule: {
            timezone: {
                type: String,
                default: "Asia/Kolkata",
                trim: true
            },
            workingDays: {
                type: [Number],
                default: [1, 2, 3, 4, 5, 6],
                validate: {
                    validator(days) {
                        if (!Array.isArray(days) || days.length === 0) {
                            return false;
                        }

                        const unique = new Set(days);

                        return unique.size === days.length && days.every((day) => day >= 0 && day <= 6);
                    },
                    message: "workingDays must be unique integers from 0 (Sunday) to 6 (Saturday)"
                }
            },
            openTime: {
                type: String,
                default: "09:00",
                validate: {
                    validator: (value) => TIME_PATTERN.test(value),
                    message: "openTime must be HH:mm"
                }
            },
            closeTime: {
                type: String,
                default: "21:00",
                validate: {
                    validator: (value) => TIME_PATTERN.test(value),
                    message: "closeTime must be HH:mm"
                }
            },
            holidays: {
                type: [String],
                default: [],
                validate: {
                    validator(dates) {
                        return dates.every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date));
                    },
                    message: "holidays must be YYYY-MM-DD strings"
                }
            }
        },
        returns: {
            enabled: {
                type: Boolean,
                default: true
            },
            windowDays: {
                type: Number,
                default: 30,
                min: 0,
                max: 365
            }
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("BusinessSettings", businessSettingsSchema);
