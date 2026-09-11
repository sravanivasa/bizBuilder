const { validationResult } = require("express-validator");
const asyncHandler = require("../middleware/asyncHandler");
const BusinessSettings = require("../models/BusinessSettings");
const { findBusinessForOwner } = require("../utils/tenantAuthorization");
const {
    ensureBusinessSettings,
    formatSettingsResponse,
    syncBusinessGstFields
} = require("../utils/businessSettings");

const mergeSettingsUpdate = (existing, body) => {
    const update = {};

    if (body.gst) {
        update.gst = {
            enabled: body.gst.enabled != null ? Boolean(body.gst.enabled) : existing.gst.enabled,
            rate: body.gst.rate != null ? Number(body.gst.rate) : existing.gst.rate
        };
    }

    if (body.delivery) {
        update.delivery = {
            preparationMinutes:
                body.delivery.preparationMinutes != null
                    ? Number(body.delivery.preparationMinutes)
                    : existing.delivery.preparationMinutes,
            deliveryMinutes:
                body.delivery.deliveryMinutes != null
                    ? Number(body.delivery.deliveryMinutes)
                    : existing.delivery.deliveryMinutes
        };
    }

    if (body.schedule) {
        const nextSchedule = { ...existing.schedule };

        if (body.schedule.workingDays) {
            nextSchedule.workingDays = [...body.schedule.workingDays];
        }

        if (body.schedule.openTime) {
            nextSchedule.openTime = body.schedule.openTime;
        }

        if (body.schedule.closeTime) {
            nextSchedule.closeTime = body.schedule.closeTime;
        }

        if (body.schedule.holidays) {
            nextSchedule.holidays = [...body.schedule.holidays];
        }

        update.schedule = nextSchedule;
    }

    if (body.returns) {
        update.returns = {
            enabled:
                body.returns.enabled != null ? Boolean(body.returns.enabled) : existing.returns.enabled,
            windowDays:
                body.returns.windowDays != null
                    ? Number(body.returns.windowDays)
                    : existing.returns.windowDays
        };
    }

    return update;
};

const getBusinessSettings = asyncHandler(async (req, res) => {
    const { business, error } = await findBusinessForOwner(req.params.businessId, req.user._id);

    if (error) {
        return res.status(error.status).json({
            success: false,
            message: error.message
        });
    }

    const settings = await ensureBusinessSettings(business._id);

    if (!settings) {
        return res.status(404).json({
            success: false,
            message: "Business not found"
        });
    }

    res.status(200).json({
        success: true,
        settings: formatSettingsResponse(settings)
    });
});

const updateBusinessSettings = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const { business, error } = await findBusinessForOwner(req.params.businessId, req.user._id);

    if (error) {
        return res.status(error.status).json({
            success: false,
            message: error.message
        });
    }

    const existing = await ensureBusinessSettings(business._id);

    if (!existing) {
        return res.status(404).json({
            success: false,
            message: "Business not found"
        });
    }

    const current = formatSettingsResponse(existing);
    const update = mergeSettingsUpdate(current, req.body);

    if (update.schedule?.openTime && update.schedule?.closeTime) {
        if (update.schedule.openTime >= update.schedule.closeTime) {
            return res.status(400).json({
                success: false,
                message: "openTime must be earlier than closeTime"
            });
        }
    } else if (update.schedule?.openTime && !update.schedule.closeTime) {
        if (update.schedule.openTime >= current.schedule.closeTime) {
            return res.status(400).json({
                success: false,
                message: "openTime must be earlier than closeTime"
            });
        }
    } else if (update.schedule?.closeTime && !update.schedule.openTime) {
        if (current.schedule.openTime >= update.schedule.closeTime) {
            return res.status(400).json({
                success: false,
                message: "openTime must be earlier than closeTime"
            });
        }
    }

    const updated = await BusinessSettings.findOneAndUpdate(
        { business: business._id },
        { $set: update },
        { new: true, runValidators: true }
    );

    if (update.gst) {
        await syncBusinessGstFields(business._id, {
            enabled: updated.gst.enabled,
            rate: updated.gst.rate
        });
    }

    res.status(200).json({
        success: true,
        message: "Business settings updated successfully",
        settings: formatSettingsResponse(updated)
    });
});

module.exports = {
    getBusinessSettings,
    updateBusinessSettings
};
