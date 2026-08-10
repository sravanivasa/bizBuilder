const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        business: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Business",
            required: true
        },

        customerName: {
            type: String,
            required: true,
            trim: true
        },

        customerPhone: {
            type: String,
            required: true,
            trim: true
        },

        isWhatsAppSameAsPhone: {
            type: Boolean,
            default: true
        },

        customerWhatsApp: {
            type: String,
            trim: true
        },

        customerAddress: {
            type: String,
            required: true,
            trim: true
        },

        products: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true
                },

                quantity: {
                    type: Number,
                    required: true,
                    min: 1
                },

                price: {
                    type: Number,
                    required: true
                }
            }
        ],

        totalAmount: {
            type: Number,
            required: true
        },

        paymentMethod: {
            type: String,
            enum: ["Cash", "Card", "UPI"],
            default: "Cash"
        },

        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid"],
            default: "Pending"
        },

        orderStatus: {
            type: String,
            enum: [
                "Pending",
                "Confirmed",
                "Preparing",
                "Completed",
                "Cancelled",
                "Delivered"
            ],
            default: "Pending"
        }
    },
    {
        timestamps: true
    }
);

orderSchema.index({ business: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);