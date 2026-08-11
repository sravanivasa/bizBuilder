const mongoose = require("mongoose");
const Business = require("../models/Business");
const { generateSlug, ensureUniqueSlug } = require("./generateSlug");

const isObjectId = (value) =>
    mongoose.Types.ObjectId.isValid(value) && String(value).length === 24;

const ensureBusinessSlug = async (business) => {
    if (!business || business.slug) {
        return business;
    }

    const baseSlug = generateSlug(business.businessName);
    business.slug = await ensureUniqueSlug(Business, baseSlug, business._id);
    await business.save();
    return business;
};

const resolveBusiness = async (idOrSlug) => {
    if (!idOrSlug) {
        return null;
    }

    let business;
    if (isObjectId(idOrSlug)) {
        business = await Business.findById(idOrSlug);
    } else {
        business = await Business.findOne({ slug: String(idOrSlug).toLowerCase() });
    }

    if (!business) {
        return null;
    }

    return ensureBusinessSlug(business);
};

module.exports = { resolveBusiness, ensureBusinessSlug, isObjectId };
