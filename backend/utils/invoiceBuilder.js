const Product = require("../models/Product");
const Business = require("../models/Business");
const pickFields = require("./pickFields");
const { roundMoney } = require("./gstCalculation");

const INVOICE_BUSINESS_FIELDS = [
    "businessName",
    "address",
    "phoneNumber",
    "email",
    "gstin",
    "gstEnabled",
    "gstRate"
];

const shortOrderId = (orderId) => String(orderId).slice(-6).toUpperCase();

const buildInvoiceResponse = async (order) => {
    const business = await Business.findById(order.business).select(
        INVOICE_BUSINESS_FIELDS.join(" ")
    );

    const productIds = order.products.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } }).select("productName");
    const productMap = new Map(products.map((product) => [String(product._id), product.productName]));

    const items = order.products.map((item) => ({
        productName: productMap.get(String(item.product)) || "Product",
        quantity: item.quantity,
        price: item.price,
        lineTotal: roundMoney(item.price * item.quantity)
    }));

    const subtotal =
        order.subtotal != null ? order.subtotal : roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));
    const gstAmount = order.gstAmount != null ? order.gstAmount : 0;
    const gstRate = order.gstRate != null ? order.gstRate : 0;
    const totalAmount = order.totalAmount;

    return {
        orderId: order._id,
        shortOrderId: shortOrderId(order._id),
        createdAt: order.createdAt,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        items,
        subtotal,
        gstAmount,
        gstRate,
        totalAmount,
        business: business
            ? pickFields(business.toObject(), INVOICE_BUSINESS_FIELDS)
            : { businessName: "Shop" }
    };
};

module.exports = {
    buildInvoiceResponse,
    shortOrderId
};
