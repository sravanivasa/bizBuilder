const Customer = require("../models/Customer");
const Business = require("../models/Business");
const Order = require("../models/Orders");
const { validationResult } = require("express-validator");
const asyncHandler = require("../middleware/asyncHandler");
const pickFields = require("../utils/pickFields");
const {
    normalizePhoneForMatch,
    formatPhoneForStorage,
    escapeRegex
} = require("../utils/phoneValidation");

const CUSTOMER_RESPONSE_FIELDS = [
    "_id",
    "business",
    "name",
    "phone",
    "email",
    "defaultAddress",
    "notes",
    "isActive",
    "createdAt",
    "updatedAt"
];

const formatCustomer = (customer) =>
    pickFields(customer.toObject ? customer.toObject() : customer, CUSTOMER_RESPONSE_FIELDS);

const ensureBusinessOwner = async (businessId, userId) => {
    const business = await Business.findOne({ _id: businessId, owner: userId });

    if (!business) {
        return null;
    }

    return business;
};

const findCustomerForOwner = async (customerId, userId) => {
    const customer = await Customer.findById(customerId);

    if (!customer) {
        return { error: { status: 404, message: "Customer not found" } };
    }

    const business = await ensureBusinessOwner(customer.business, userId);

    if (!business) {
        return { error: { status: 403, message: "Forbidden" } };
    }

    return { customer, business };
};

const buildCustomerStats = async (businessId, customerId) => {
    const [stats] = await Order.aggregate([
        {
            $match: {
                business: businessId,
                customer: customerId
            }
        },
        {
            $group: {
                _id: null,
                orderCount: { $sum: 1 },
                totalSpend: {
                    $sum: {
                        $cond: [{ $ne: ["$orderStatus", "Cancelled"] }, "$totalAmount", 0]
                    }
                },
                lastOrderAt: { $max: "$createdAt" }
            }
        }
    ]);

    return {
        orderCount: stats?.orderCount || 0,
        totalSpend: stats?.totalSpend || 0,
        lastOrderAt: stats?.lastOrderAt || null
    };
};

const sanitizeCustomerOrder = (order) => {
    const plain = order.toObject ? order.toObject() : { ...order };
    delete plain.trackingToken;
    delete plain.deliveryToken;
    delete plain.deliveryOtp;
    delete plain.razorpayOrderId;
    delete plain.razorpayPaymentId;
    return plain;
};

const createCustomer = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const { businessId, name, phone, email, defaultAddress, notes } = req.body;
    const business = await ensureBusinessOwner(businessId, req.user._id);

    if (!business) {
        return res.status(403).json({
            success: false,
            message: "Forbidden"
        });
    }

    const phoneNormalized = normalizePhoneForMatch(phone);
    const storedPhone = formatPhoneForStorage(phone);
    const existing = await Customer.findOne({ business: businessId, phoneNormalized });

    if (existing?.isActive) {
        return res.status(409).json({
            success: false,
            message: "A customer with this phone number already exists for this business"
        });
    }

    if (existing && !existing.isActive) {
        existing.isActive = true;
        existing.name = name.trim();
        existing.phone = storedPhone;
        existing.email = email?.trim() || "";
        existing.defaultAddress = defaultAddress?.trim() || "";
        existing.notes = notes?.trim() || "";
        await existing.save();

        return res.status(200).json({
            success: true,
            message: "Customer reactivated successfully",
            reactivated: true,
            customer: formatCustomer(existing)
        });
    }

    try {
        const customer = await Customer.create({
            business: businessId,
            name: name.trim(),
            phone: storedPhone,
            phoneNormalized,
            email: email?.trim() || "",
            defaultAddress: defaultAddress?.trim() || "",
            notes: notes?.trim() || "",
            isActive: true
        });

        res.status(201).json({
            success: true,
            message: "Customer created successfully",
            customer: formatCustomer(customer)
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A customer with this phone number already exists for this business"
            });
        }

        throw error;
    }
});

const listCustomers = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const { businessId, search, active = "true" } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const business = await ensureBusinessOwner(businessId, req.user._id);

    if (!business) {
        return res.status(403).json({
            success: false,
            message: "Forbidden"
        });
    }

    const filter = { business: businessId };

    if (active === "true") {
        filter.isActive = true;
    } else if (active === "false") {
        filter.isActive = false;
    }

    const trimmedSearch = search?.trim();

    if (trimmedSearch) {
        const normalizedPhone = normalizePhoneForMatch(trimmedSearch);

        if (normalizedPhone && /^\d+$/.test(normalizedPhone)) {
            filter.phoneNormalized = normalizedPhone;
        } else {
            filter.name = { $regex: escapeRegex(trimmedSearch), $options: "i" };
        }
    }

    const total = await Customer.countDocuments(filter);
    const customers = await Customer.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    res.status(200).json({
        success: true,
        message: "Customers fetched successfully",
        customers: customers.map(formatCustomer),
        pagination: {
            page,
            limit,
            total
        }
    });
});

const getCustomer = asyncHandler(async (req, res) => {
    const lookup = await findCustomerForOwner(req.params.id, req.user._id);

    if (lookup.error) {
        return res.status(lookup.error.status).json({
            success: false,
            message: lookup.error.message
        });
    }

    const stats = await buildCustomerStats(lookup.customer.business, lookup.customer._id);

    res.status(200).json({
        success: true,
        message: "Customer fetched successfully",
        customer: formatCustomer(lookup.customer),
        stats
    });
});

const updateCustomer = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const lookup = await findCustomerForOwner(req.params.id, req.user._id);

    if (lookup.error) {
        return res.status(lookup.error.status).json({
            success: false,
            message: lookup.error.message
        });
    }

    const customer = lookup.customer;
    const { name, phone, email, defaultAddress, notes } = req.body;

    if (name !== undefined) {
        customer.name = name.trim();
    }

    if (phone !== undefined) {
        const phoneNormalized = normalizePhoneForMatch(phone);
        const duplicate = await Customer.findOne({
            business: customer.business,
            phoneNormalized,
            _id: { $ne: customer._id }
        });

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: "Another customer with this phone number already exists for this business"
            });
        }

        customer.phone = formatPhoneForStorage(phone);
        customer.phoneNormalized = phoneNormalized;
    }

    if (email !== undefined) {
        customer.email = email?.trim() || "";
    }

    if (defaultAddress !== undefined) {
        customer.defaultAddress = defaultAddress.trim();
    }

    if (notes !== undefined) {
        customer.notes = notes.trim();
    }

    try {
        await customer.save();
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Another customer with this phone number already exists for this business"
            });
        }

        throw error;
    }

    res.status(200).json({
        success: true,
        message: "Customer updated successfully",
        customer: formatCustomer(customer)
    });
});

const deleteCustomer = asyncHandler(async (req, res) => {
    const lookup = await findCustomerForOwner(req.params.id, req.user._id);

    if (lookup.error) {
        return res.status(lookup.error.status).json({
            success: false,
            message: lookup.error.message
        });
    }

    const customer = lookup.customer;

    if (!customer.isActive) {
        return res.status(200).json({
            success: true,
            message: "Customer is already deactivated",
            customer: formatCustomer(customer)
        });
    }

    customer.isActive = false;
    await customer.save();

    res.status(200).json({
        success: true,
        message: "Customer deactivated successfully",
        customer: formatCustomer(customer)
    });
});

const getCustomerOrders = asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const lookup = await findCustomerForOwner(req.params.id, req.user._id);

    if (lookup.error) {
        return res.status(lookup.error.status).json({
            success: false,
            message: lookup.error.message
        });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const filter = {
        business: lookup.customer.business,
        customer: lookup.customer._id
    };

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
        .select("-trackingToken -deliveryToken -deliveryOtp -razorpayOrderId -razorpayPaymentId")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    res.status(200).json({
        success: true,
        message: "Customer orders fetched successfully",
        orders: orders.map(sanitizeCustomerOrder),
        pagination: {
            page,
            limit,
            total
        }
    });
});

module.exports = {
    createCustomer,
    listCustomers,
    getCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerOrders
};
