const roundMoney = (value) => Math.round(Number(value) * 100) / 100;

const calculateOrderAmounts = (subtotal, gstConfig = {}) => {
    const normalizedSubtotal = roundMoney(subtotal);
    const gstEnabled = Boolean(gstConfig.gstEnabled);
    const configuredRate = gstConfig.gstRate != null ? Number(gstConfig.gstRate) : 18;

    if (!gstEnabled) {
        return {
            subtotal: normalizedSubtotal,
            gstAmount: 0,
            gstRate: 0,
            totalAmount: normalizedSubtotal
        };
    }

    const gstRate = configuredRate;
    const gstAmount = roundMoney((normalizedSubtotal * gstRate) / 100);
    const totalAmount = roundMoney(normalizedSubtotal + gstAmount);

    return {
        subtotal: normalizedSubtotal,
        gstAmount,
        gstRate,
        totalAmount
    };
};

module.exports = {
    calculateOrderAmounts,
    roundMoney
};
