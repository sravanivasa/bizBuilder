const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        productName: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0.01
        },
        image: {
            type: String,
            trim: true,
            required: true
        },
        stock: {
            type: Number,
            required: true,
            min: 0
        },
        business: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Business",
            required: true
        }
    },
    {
        timestamps: true
    }
);

productSchema.index({ business: 1 });

module.exports = mongoose.model("Product", productSchema);
