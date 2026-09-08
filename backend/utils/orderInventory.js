const Product = require("../models/Product");
const Order = require("../models/Orders");

const decrementStock = async (items) => {
    const decremented = [];

    for (const item of items) {
        const updatedProduct = await Product.findOneAndUpdate(
            { _id: item.product, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { new: true }
        );

        if (!updatedProduct) {
            const product = await Product.findById(item.product).select("productName");
            const error = new Error(
                product ? `${product.productName} is out of stock` : "Product is out of stock"
            );
            error.statusCode = 400;
            throw error;
        }

        decremented.push({ product: item.product, quantity: item.quantity });
    }

    return decremented;
};

const restoreStock = async (items) => {
    for (const item of items) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity }
        });
    }
};

/** Atomically claim stock restoration once per order (cancel, delete, return receive). */
const restoreStockOnce = async (order) => {
    const claimed = await Order.findOneAndUpdate(
        { _id: order._id, stockRestoredAt: null },
        { $set: { stockRestoredAt: new Date() } }
    );

    if (!claimed) {
        return false;
    }

    try {
        await restoreStock(order.products);
        order.stockRestoredAt = claimed.stockRestoredAt;
        return true;
    } catch (error) {
        await Order.findByIdAndUpdate(order._id, { $unset: { stockRestoredAt: "" } });
        throw error;
    }
};

module.exports = {
    decrementStock,
    restoreStock,
    restoreStockOnce
};
