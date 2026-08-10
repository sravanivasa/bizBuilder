const Product = require("../models/Product");
const Order = require("../models/Orders");
const aggregateOrderProducts = require("./aggregateOrderProducts");
const { decrementStock, restoreStock } = require("./orderInventory");
const { notifyOwnerNewOrder } = require("../services/whatsappService");

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

    return { aggregatedProducts, orderProducts, totalAmount };
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
    const { aggregatedProducts, orderProducts, totalAmount } = await buildOrderFromProducts(
        businessId,
        products
    );

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
            totalAmount,
            paymentMethod
        });

        notifyOwnerNewOrder(order, businessId);

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
