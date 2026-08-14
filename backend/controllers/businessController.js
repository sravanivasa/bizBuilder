const Business = require("../models/Business");
const Product = require("../models/Product");
const Order = require("../models/Orders");
const { validationResult } = require("express-validator");
const asyncHandler = require("../middleware/asyncHandler");
const pickFields = require("../utils/pickFields");
const { generateSlug, ensureUniqueSlug } = require("../utils/generateSlug");
const { ensureBusinessSlug } = require("../utils/resolveBusiness");

const RAZORPAY_SECRET_MASK = "••••••••";

const BUSINESS_FIELDS = [
    "businessName",
    "category",
    "phoneNumber",
    "description",
    "address",
    "email",
    "website",
    "logo",
    "gstin",
    "gstEnabled",
    "gstRate",
    "upiId",
    "bankAccountName",
    "bankName",
    "bankAccountNumber",
    "bankIfsc",
    "autoConfirmOnlinePayments",
    "razorpayEnabled",
    "razorpayKeyId"
];

const formatBusinessForOwner = (business) => {
    const plain = business.toObject ? business.toObject() : { ...business };
    plain.hasRazorpaySecret = Boolean(plain.razorpayKeySecret);
    delete plain.razorpayKeySecret;

    if (plain.hasRazorpaySecret) {
        plain.razorpayKeySecret = RAZORPAY_SECRET_MASK;
    }

    return plain;
};

const createBusiness = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const businessFields = pickFields(req.body, BUSINESS_FIELDS);
    const baseSlug = generateSlug(businessFields.businessName);
    const slug = await ensureUniqueSlug(Business, baseSlug);

    if (req.body.razorpayKeySecret?.trim()) {
        businessFields.razorpayKeySecret = req.body.razorpayKeySecret.trim();
    }

    const business = await Business.create({
        ...businessFields,
        slug,
        owner: req.user._id
    });

    res.status(201).json({
        success: true,
        message: "Business created successfully",
        business: formatBusinessForOwner(business)
    });
});

const getMyBusinesses = asyncHandler(async (req, res) => {
    const businesses = await Business.find({ owner: req.user._id }).select("+razorpayKeySecret");
    const businessesWithSlugs = await Promise.all(
        businesses.map(async (business) => {
            const withSlug = await ensureBusinessSlug(business);
            return formatBusinessForOwner(withSlug);
        })
    );

    res.status(200).json({
        success: true,
        message: "Businesses fetched successfully",
        businesses: businessesWithSlugs
    });
});

const getBusinessById = asyncHandler(async (req, res) => {
    const business = await Business.findById(req.params.id).select("+razorpayKeySecret");

    if (!business) {
        return res.status(404).json({
            success: false,
            message: "Business not found"
        });
    }

    res.status(200).json({
        success: true,
        message: "Business fetched successfully",
        business: formatBusinessForOwner(business)
    });
});

const updateBusiness = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const business = await Business.findById(req.params.id);

    if (!business) {
        return res.status(404).json({
            success: false,
            message: "Business not found"
        });
    }

    if (business.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Forbidden"
        });
    }

    const updates = pickFields(req.body, BUSINESS_FIELDS);

    const incomingSecret = req.body.razorpayKeySecret;

    if (
        incomingSecret &&
        incomingSecret.trim() &&
        incomingSecret !== RAZORPAY_SECRET_MASK
    ) {
        updates.razorpayKeySecret = incomingSecret.trim();
    }

    if (!business.slug) {
        const nameForSlug = updates.businessName || business.businessName;
        const baseSlug = generateSlug(nameForSlug);
        updates.slug = await ensureUniqueSlug(Business, baseSlug, business._id);
    }

    const updatedBusiness = await Business.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true
    }).select("+razorpayKeySecret");

    res.status(200).json({
        success: true,
        message: "Business updated successfully",
        business: formatBusinessForOwner(updatedBusiness)
    });
});

const deleteBusiness = asyncHandler(async (req, res) => {
    const business = await Business.findById(req.params.id);

    if (!business) {
        return res.status(404).json({
            success: false,
            message: "Business not found"
        });
    }

    if (business.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Forbidden"
        });
    }

    await Promise.all([
        Product.deleteMany({ business: business._id }),
        Order.deleteMany({ business: business._id }),
        Business.findByIdAndDelete(business._id)
    ]);

    res.status(200).json({
        success: true,
        message: "Business deleted successfully"
    });
});

module.exports = {
    createBusiness,
    getMyBusinesses,
    getBusinessById,
    updateBusiness,
    deleteBusiness
};
