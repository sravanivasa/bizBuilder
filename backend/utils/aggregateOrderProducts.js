const aggregateOrderProducts = (products) => {
    const aggregated = new Map();

    for (const item of products) {
        const productId = item.product.toString();
        const quantity = Number(item.quantity);
        aggregated.set(productId, (aggregated.get(productId) || 0) + quantity);
    }

    return Array.from(aggregated, ([product, quantity]) => ({
        product,
        quantity
    }));
};

module.exports = aggregateOrderProducts;
