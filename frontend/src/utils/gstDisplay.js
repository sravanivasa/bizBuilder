const roundMoney = (value) => Math.round(Number(value) * 100) / 100;

export const calculateGstBreakdown = (subtotal, business) => {
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

export const getOrderAmounts = (order) => {
    const subtotal = order?.subtotal != null ? order.subtotal : order?.totalAmount || 0;
    const gstAmount = order?.gstAmount || 0;
    const gstRate = order?.gstRate || 0;
    const totalAmount = order?.totalAmount || subtotal;

    return { subtotal, gstAmount, gstRate, totalAmount };
};

export const formatPrice = (value) => `₹${Number(value).toLocaleString("en-IN")}`;
