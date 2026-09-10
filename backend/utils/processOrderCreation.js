const crypto = require("crypto");
const Product = require("../models/Product");
const Order = require("../models/Orders");
const Business = require("../models/Business");
const aggregateOrderProducts = require("./aggregateOrderProducts");
const { calculateOrderAmounts } = require("./gstCalculation");
const { decrementStock, restoreStock } = require("./orderInventory");
const {
    notifyOwnerNewOrder,
    notifyCustomerOrderPlaced,
    notifyCustomerPaymentPending
} = require("../services/whatsappService");
const {
    getInitialPaymentStatus,
    isOnlinePaymentMethod,
    isCodPaymentMethod
} = require("./paymentMethods");
const { findOrCreateCustomerForOrder } = require("./customerAssociation");

const generateTrackingToken = () => crypto.randomBytes(32).toString("hex");

const buildOrderFromProducts = async (businessId, products) => {
    const aggregatedProducts = aggregateOrderProducts(products);
    const orderProducts = [];
    let totalAmount = 0;

    for (const item of aggregatedProducts) {
        const product = await Product.findById(item.product);

        if (!product) {
            const error = new Error("Product not found");
            error.statusCode = 404;
            throw error;
        }

        if (product.business.toString() !== businessId) {
            const error = new Error(`${product.productName} does not belong to this business`);
            error.statusCode = 400;
            throw error;
        }

        if (item.quantity > product.stock) {
            const error = new Error(`${product.productName} is out of stock`);
            error.statusCode = 400;
            throw error;
        }

        totalAmount += product.price * item.quantity;
        orderProducts.push({
            product: product._id,
            quantity: item.quantity,
            price: product.price,
            productName: product.productName
        });
    }

    return { aggregatedProducts, orderProducts, subtotal: totalAmount };
};

const createOrderForBusiness = async ({
    businessId,
    customerName,
    customerPhone,
    customerAddress,
    products,
    paymentMethod = "Cash",
    isWhatsAppSameAsPhone = true,
    customerWhatsApp
}) => {
    const normalizedBusinessId = String(businessId);
    const { aggregatedProducts, orderProducts, subtotal } = await buildOrderFromProducts(
        normalizedBusinessId,
        products
    );

    const business = await Business.findById(normalizedBusinessId).select(
        "businessName slug gstEnabled gstRate"
    );
    const { gstAmount, gstRate, totalAmount } = calculateOrderAmounts(subtotal, business);

    const resolvedWhatsApp = isWhatsAppSameAsPhone ? customerPhone : customerWhatsApp;

    let decrementedItems = [];

    try {
        decrementedItems = await decrementStock(aggregatedProducts);

        const customer = await findOrCreateCustomerForOrder({
            businessId: normalizedBusinessId,
            customerName,
            customerPhone,
            customerAddress
        });

        const order = await Order.create({
            business: normalizedBusinessId,
            customer: customer._id,
            customerName,
            customerPhone,
            customerAddress,
            isWhatsAppSameAsPhone,
            customerWhatsApp: resolvedWhatsApp,
            products: orderProducts,
            subtotal,
            gstAmount,
            gstRate,
            totalAmount,
            paymentMethod,
            paymentStatus: getInitialPaymentStatus(paymentMethod),
            orderStatus: "New",
            trackingToken: generateTrackingToken()
        });

        notifyOwnerNewOrder(order, normalizedBusinessId);

        if (isCodPaymentMethod(paymentMethod)) {
            notifyCustomerOrderPlaced(order, business);
        } else if (isOnlinePaymentMethod(paymentMethod)) {
            notifyCustomerPaymentPending(order, business);
        } else {
            notifyCustomerOrderPlaced(order, business);
        }

        return order;
    } catch (error) {
        if (decrementedItems.length) {
            await restoreStock(decrementedItems);
        }

        throw error;
    }
};

module.exports = {
    buildOrderFromProducts,
    createOrderForBusiness
};
