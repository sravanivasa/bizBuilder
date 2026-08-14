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

        subtotal: {
            type: Number
        },

        gstAmount: {
            type: Number,
            default: 0
        },

        gstRate: {
            type: Number,
            default: 0
        },

        totalAmount: {
            type: Number,
            required: true
        },

        paymentMethod: {
            type: String,
            enum: ["Cash", "COD", "GPay", "PhonePe", "NetBanking", "UPI", "Card"],
            default: "Cash"
        },

        paymentStatus: {
            type: String,
            enum: ["Pending", "AwaitingPayment", "PaymentSubmitted", "Paid", "Failed", "COD"],
            default: "Pending"
        },

        paymentSubmittedAt: {
            type: Date
        },

        orderStatus: {
            type: String,
            enum: [
                "New",
                "Processing",
                "Shipped",
                "OutForDelivery",
                "Delivered",
                "Cancelled",
                "Pending",
                "Confirmed",
                "Preparing",
                "Completed"
            ],
            default: "Pending"
        },

        deliveryType: {
            type: String,
            enum: ["local", "courier", "pickup"],
            default: null
        },

        courierName: {
            type: String,
            trim: true
        },

        trackingId: {
            type: String,
            trim: true
        },

        trackingUrl: {
            type: String,
            trim: true
        },

        deliveryPersonName: {
            type: String,
            trim: true
        },

        deliveryPersonPhone: {
            type: String,
            trim: true
        },

        deliveryToken: {
            type: String,
            unique: true,
            sparse: true,
            index: true
        },

        deliveryPhoto: {
            type: String,
            trim: true
        },

        deliveryOtp: {
            type: String,
            trim: true
        },

        deliveryOtpExpiresAt: {
            type: Date
        },

        deliveryTimeline: [
            {
                status: { type: String, trim: true },
                note: { type: String, trim: true, default: "" },
                photo: { type: String, trim: true, default: null },
                at: { type: Date, default: Date.now }
            }
        ],

        returnStatus: {
            type: String,
            enum: [
                "None",
                "Requested",
                "Accepted",
                "Shipped",
                "Delivered",
                "Rejected",
                "Approved",
                "Completed"
            ],
            default: "None"
        },

        returnReason: {
            type: String,
            trim: true
        },

        returnPhotos: [
            {
                type: String,
                trim: true
            }
        ],

        returnVideo: {
            type: String,
            trim: true
        },

        returnRequestedAt: {
            type: Date
        },

        returnResolvedAt: {
            type: Date
        },

        returnTrackingId: {
            type: String,
            trim: true
        },

        returnCourier: {
            type: String,
            trim: true
        },

        returnShippedAt: {
            type: Date
        },

        returnDeliveredAt: {
            type: Date
        },

        trackingToken: {
            type: String,
            unique: true,
            index: true,
            required: true
        },

        razorpayOrderId: {
            type: String,
            trim: true,
            index: true,
            sparse: true
        },

        razorpayPaymentId: {
            type: String,
            trim: true
        },

        paidAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

orderSchema.index({ business: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);