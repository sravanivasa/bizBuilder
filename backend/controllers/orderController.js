const Order = require("../models/Orders");
const Business = require("../models/Business");
const Product = require("../models/Product");
const { validationResult } = require("express-validator");
const asyncHandler = require("../middleware/asyncHandler");

const createOrder = asyncHandler(async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }   
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
// to get all orders
const getMyOrders = asyncHandler(async (req, res) => {
    const business = await Business.findOne({
    owner: req.user._id
});

if (!business) {
    return res.status(404).json({
        success: false,
        message: "Business not found"
    });
}
 const orders = await Order.find({
        business: business._id
    });

    res.status(200).json({
        success: true,
        message: "Orders fetched successfully",
        orders
    });

});
// to get order by id
const getOrderById = asyncHandler(async (req, res) => {
const order = await Order.findById(req.params.id);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    const business = await Business.findById(order.business);
    if (!business) {
        return res.status(404).json({
            success: false,
            message: "Business not found"
        });
    }   
    if (business.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Unauthorized"
        });
    }

    res.status(200).json({
        success: true,
        message: "Order fetched successfully",
        order
    });

});

// to update order status
const updateOrderStatus = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }


    const order = await Order.findById(req.params.id);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    const business = await Business.findById(order.business);
    if (!business) {        
    return res.status(404).json({
        success: false,
        message: "Business not found"
    });
    }

    if (business.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Unauthorized"
        });
    }
    if(order.status === "Delivered" || order.status === "Cancelled") {
        return res.status(400).json({
            success: false,
            message: "Cannot update status of Completed or Cancelled orders"
        });
    }
    order.status = req.body.status;

    await order.save();

    res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        order
    });

});
// to delete order
const deleteOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    const business = await Business.findById(order.business);
    if (!business) {
    return res.status(404).json({
        success: false,
        message: "Business not found"
        });
    }

    if (business.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: "Unauthorized"
        });
    }
    if (order.status !== "Pending" && order.status !== "Cancelled") {
    return res.status(400).json({
        success: false,
        message: "Only Pending or Cancelled orders can be deleted"
    });
}
    //Restore Stock
    for (const item of order.products) {
        const product = await Product.findById(item.product);
        if (product) {
            product.stock += item.quantity;
            await product.save();
        }
    }
    
    await order.deleteOne();       
    res.status(200).json({
        success: true,
        message: "Order deleted successfully"
    }); 


});

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    deleteOrder
};
