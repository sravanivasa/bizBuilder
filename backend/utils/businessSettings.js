const Business = require("../models/Business");
const BusinessSettings = require("../models/BusinessSettings");

const DEFAULT_SETTINGS = {
    gst: {
        enabled: false,
        rate: 18
    },
    delivery: {
        preparationMinutes: 30,
        deliveryMinutes: 60
    },
    schedule: {
        timezone: "Asia/Kolkata",
        workingDays: [1, 2, 3, 4, 5, 6],
        openTime: "09:00",
        closeTime: "21:00",
        holidays: []
    },
    returns: {
        enabled: true,
        windowDays: 30
    }
};

const buildDefaultsFromBusiness = (business) => ({
    gst: {
        enabled: Boolean(business?.gstEnabled),
        rate: business?.gstRate != null ? Number(business.gstRate) : DEFAULT_SETTINGS.gst.rate
    },
    delivery: { ...DEFAULT_SETTINGS.delivery },
    schedule: {
        ...DEFAULT_SETTINGS.schedule,
        workingDays: [...DEFAULT_SETTINGS.schedule.workingDays],
        holidays: []
    },
    returns: { ...DEFAULT_SETTINGS.returns }
});

const formatSettingsResponse = (settings) => {
    const plain = settings.toObject ? settings.toObject() : { ...settings };

    return {
        _id: plain._id,
        business: plain.business,
        gst: {
            enabled: Boolean(plain.gst?.enabled),
            rate: plain.gst?.rate != null ? Number(plain.gst.rate) : DEFAULT_SETTINGS.gst.rate
        },
        delivery: {
            preparationMinutes: Number(plain.delivery?.preparationMinutes ?? DEFAULT_SETTINGS.delivery.preparationMinutes),
            deliveryMinutes: Number(plain.delivery?.deliveryMinutes ?? DEFAULT_SETTINGS.delivery.deliveryMinutes)
        },
        schedule: {
            timezone: plain.schedule?.timezone || DEFAULT_SETTINGS.schedule.timezone,
            workingDays: [...(plain.schedule?.workingDays || DEFAULT_SETTINGS.schedule.workingDays)],
            openTime: plain.schedule?.openTime || DEFAULT_SETTINGS.schedule.openTime,
            closeTime: plain.schedule?.closeTime || DEFAULT_SETTINGS.schedule.closeTime,
            holidays: [...(plain.schedule?.holidays || [])]
        },
        returns: {
            enabled: Boolean(plain.returns?.enabled ?? DEFAULT_SETTINGS.returns.enabled),
            windowDays: Number(plain.returns?.windowDays ?? DEFAULT_SETTINGS.returns.windowDays)
        },
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt
    };
};

const resolveBusinessGstConfig = async (businessId) => {
    const settings = await resolveBusinessSettings(businessId);

    return {
        gstEnabled: Boolean(settings.gst.enabled),
        gstRate: settings.gst.enabled ? Number(settings.gst.rate) : 0
    };
};

const syncBusinessGstFields = async (businessId, { enabled, rate }) => {
    await Business.findByIdAndUpdate(
        businessId,
        {
            $set: {
                gstEnabled: Boolean(enabled),
                gstRate: enabled ? Number(rate) : 0
            }
        },
        { timestamps: false }
    );
};

const syncSettingsGstFromBusiness = async (businessId, business) => {
    const gst = {
        enabled: Boolean(business?.gstEnabled),
        rate: business?.gstRate != null ? Number(business.gstRate) : DEFAULT_SETTINGS.gst.rate
    };

    await BusinessSettings.findOneAndUpdate(
        { business: businessId },
        {
            $set: { gst },
            $setOnInsert: {
                business: businessId,
                delivery: DEFAULT_SETTINGS.delivery,
                schedule: {
                    ...DEFAULT_SETTINGS.schedule,
                    workingDays: [...DEFAULT_SETTINGS.schedule.workingDays],
                    holidays: []
                },
                returns: DEFAULT_SETTINGS.returns
            }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return gst;
};

const ensureBusinessSettings = async (businessId) => {
    const existing = await BusinessSettings.findOne({ business: businessId });

    if (existing) {
        return existing;
    }

    const business = await Business.findById(businessId).select("gstEnabled gstRate");

    if (!business) {
        return null;
    }

    const defaults = buildDefaultsFromBusiness(business);

    try {
        return await BusinessSettings.create({
            business: businessId,
            ...defaults
        });
    } catch (error) {
        if (error.code === 11000) {
            return BusinessSettings.findOne({ business: businessId });
        }

        throw error;
    }
};

const resolveBusinessSettings = async (businessId) => {
    let settings = await BusinessSettings.findOne({ business: businessId });

    if (settings) {
        return formatSettingsResponse(settings);
    }

    const business = await Business.findById(businessId).select("gstEnabled gstRate");

    if (!business) {
        return null;
    }

    const defaults = buildDefaultsFromBusiness(business);

    try {
        settings = await BusinessSettings.create({
            business: businessId,
            ...defaults
        });
    } catch (error) {
        if (error.code === 11000) {
            settings = await BusinessSettings.findOne({ business: businessId });
        } else {
            throw error;
        }
    }

    return formatSettingsResponse(settings);
};

const getReturnPolicySnapshot = async (businessId) => {
    const settings = await resolveBusinessSettings(businessId);

    if (!settings) {
        return {
            enabled: DEFAULT_SETTINGS.returns.enabled,
            windowDays: DEFAULT_SETTINGS.returns.windowDays
        };
    }

    return {
        enabled: Boolean(settings.returns.enabled),
        windowDays: Number(settings.returns.windowDays)
    };
};

const getPublicReturnsSummary = async (businessId) => {
    const settings = await resolveBusinessSettings(businessId);

    if (!settings) {
        return {
            enabled: DEFAULT_SETTINGS.returns.enabled,
            windowDays: DEFAULT_SETTINGS.returns.windowDays
        };
    }

    return {
        enabled: Boolean(settings.returns.enabled),
        windowDays: Number(settings.returns.windowDays)
    };
};

module.exports = {
    DEFAULT_SETTINGS,
    buildDefaultsFromBusiness,
    formatSettingsResponse,
    ensureBusinessSettings,
    resolveBusinessSettings,
    resolveBusinessGstConfig,
    syncBusinessGstFields,
    syncSettingsGstFromBusiness,
    getReturnPolicySnapshot,
    getPublicReturnsSummary
};
