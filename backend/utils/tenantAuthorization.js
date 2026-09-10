const Business = require("../models/Business");
const Order = require("../models/Orders");

/**
 * Atomic owner check: business exists and belongs to user.
 * Returns the Business document or null (not found / not owned).
 */
const ensureBusinessOwner = async (businessId, userId) => {
    if (!businessId || !userId) {
        return null;
    }

    return Business.findOne({ _id: businessId, owner: userId });
};

/**
 * Load business by ID and verify ownership (Pattern B).
 * Preserves 404 for missing business, 403 for wrong owner.
 */
const findBusinessForOwner = async (businessId, userId) => {
    const business = await Business.findById(businessId);

    if (!business) {
        return { error: { status: 404, message: "Business not found" } };
    }

    if (business.owner.toString() !== userId.toString()) {
        return { error: { status: 403, message: "Forbidden" } };
    }

    return { business };
};

/**
 * Resolve the business context for list/dashboard endpoints.
 * When businessId is omitted, returns the owner's first business (createdAt asc).
 */
const resolveOwnerBusiness = async (userId, businessId) => {
    if (businessId) {
        const business = await ensureBusinessOwner(businessId, userId);

        if (!business) {
            return { error: { status: 403, message: "Forbidden" } };
        }

        return { business };
    }

    const business = await Business.findOne({ owner: userId }).sort({ createdAt: 1 });

    if (!business) {
        return { error: { status: 404, message: "No business found" } };
    }

    return { business };
};

/**
 * Load an order and verify the authenticated user owns its business.
 */
const ensureOwnerOrder = async (orderId, userId) => {
    const order = await Order.findById(orderId);

    if (!order) {
        return { error: { status: 404, message: "Order not found" } };
    }

    const business = await Business.findById(order.business);

    if (!business) {
        return { error: { status: 404, message: "Business not found" } };
    }

    if (business.owner.toString() !== userId.toString()) {
        return { error: { status: 403, message: "Forbidden" } };
    }

    return { order, business };
};

/**
 * Load any business-scoped resource and verify ownership via resource.business.
 */
const findResourceForOwner = async (Model, resourceId, userId, notFoundMessage) => {
    const resource = await Model.findById(resourceId);

    if (!resource) {
        return {
            error: {
                status: 404,
                message: notFoundMessage || `${Model.modelName} not found`
            }
        };
    }

    const business = await ensureBusinessOwner(resource.business, userId);

    if (!business) {
        return { error: { status: 403, message: "Forbidden" } };
    }

    return { resource, business };
};

/**
 * Verify ownership for a product document already loaded.
 */
const assertProductOwner = async (product, userId) => {
    if (!product) {
        return { error: { status: 404, message: "Product not found" } };
    }

    const business = await Business.findById(product.business);

    if (!business) {
        return { error: { status: 404, message: "Business not found" } };
    }

    if (business.owner.toString() !== userId.toString()) {
        return { error: { status: 403, message: "Forbidden" } };
    }

    return { product, business };
};

module.exports = {
    ensureBusinessOwner,
    findBusinessForOwner,
    resolveOwnerBusiness,
    ensureOwnerOrder,
    findResourceForOwner,
    assertProductOwner
};
