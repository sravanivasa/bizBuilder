const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
    {
        business: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Business",
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100
        },
        phone: {
            type: String,
            required: true,
            trim: true
        },
        phoneNormalized: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: ""
        },
        defaultAddress: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ""
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: ""
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

customerSchema.index({ business: 1, phoneNormalized: 1 }, { unique: true });
customerSchema.index({ business: 1, createdAt: -1 });

module.exports = mongoose.model("Customer", customerSchema);
