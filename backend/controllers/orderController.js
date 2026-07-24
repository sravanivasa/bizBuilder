const Order = require("../models/Order");
const Business = require("../models/Business");
const Product = require("../models/Product");

const asyncHandler = require("../middleware/asyncHandler");

const createOrder = asyncHandler(async (req, res) => {

     const {
        businessId,
        customerName,
        customerPhone,
        customerAddress,
        products,
        paymentMethod
    } = req.body;
    //check business
    const business = await Business.findById(businessId);

           if (!business) {
                return res.status(404).json({
                 success: false,
                 message: "Business not found"
            });
            }
     //check owner       
    if (business.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
            success: false,
             message: "Unauthorized"
            });
    }

    let totalAmount = 0;
    const orderProducts = [];
    
    //check every product and calculate total amount
    for (const item of products) {
        const product = await Product.findById(item.product);     
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }
        if (item.quantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: `${product.productName} is out of stock`
            });
        }
        totalAmount += product.price * item.quantity;
        orderProducts.push({ 
             product: product._id,
            quantity: item.quantity,
            price: product.price
         });
    }
    //create order
    const order = await Order.create({
        business: businessId,
        customerName,
        customerPhone,
        customerAddress,
        products: orderProducts,
        totalAmount,
        paymentMethod
    });
      // Reduce Stock
    for (const item of products) {

        const product = await Product.findById(item.product);

        product.stock -= item.quantity;

        await product.save();

    }

    res.status(201).json({
        success: true,
          message: "Order placed successfully",order
    }); 
});

const getMyOrders = asyncHandler(async (req, res) => {

});

const getOrderById = asyncHandler(async (req, res) => {

});

const updateOrderStatus = asyncHandler(async (req, res) => {

});

const deleteOrder = asyncHandler(async (req, res) => {

});

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder
};