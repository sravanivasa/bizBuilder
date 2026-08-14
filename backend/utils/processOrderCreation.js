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
    notifyCustomerOrderConfirmed,
    notifyCustomerPaymentPending
} = require("../services/whatsappService");
const {
    getInitialPaymentStatus,
    isOnlinePaymentMethod,
    isCodPaymentMethod
} = require("./paymentMethods");

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
            price: product.price
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
    const { aggregatedProducts, orderProducts, subtotal } = await buildOrderFromProducts(
        businessId,
        products
    );

    const business = await Business.findById(businessId).select(
        "businessName slug gstEnabled gstRate"
    );
    const { gstAmount, gstRate, totalAmount } = calculateOrderAmounts(subtotal, business);

    const resolvedWhatsApp = isWhatsAppSameAsPhone ? customerPhone : customerWhatsApp;

    let decrementedItems = [];

    try {
        decrementedItems = await decrementStock(aggregatedProducts);

        const order = await Order.create({
            business: businessId,
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
            trackingToken: generateTrackingToken()
        });

        notifyOwnerNewOrder(order, businessId);

        if (isCodPaymentMethod(paymentMethod)) {
            notifyCustomerOrderPlaced(order, business);
            notifyCustomerOrderConfirmed(order, business);
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
