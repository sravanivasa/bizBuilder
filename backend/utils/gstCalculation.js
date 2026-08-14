const roundMoney = (value) => Math.round(Number(value) * 100) / 100;

const calculateOrderAmounts = (subtotal, business) => {
    const normalizedSubtotal = roundMoney(subtotal);

    if (!business?.gstEnabled) {
        return {
            subtotal: normalizedSubtotal,
            gstAmount: 0,
            gstRate: 0,
            totalAmount: normalizedSubtotal
        };
    }

    const gstRate = Number(business.gstRate) || 18;
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
