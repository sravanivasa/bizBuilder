const mongoose = require("mongoose");
const { generateSlug, ensureUniqueSlug } = require("../utils/generateSlug");

const businessSchema = new mongoose.Schema(
    {
        businessName: {
            type: String,
            required: true,
            trim: true
        },
        slug: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true,
            sparse: true
        },
        category: {
            type: String,
            required: true,
            trim: true
        },
        phoneNumber: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        address: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        website: {
            type: String,
            trim: true
        },
        logo: {
            type: String,
            trim: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        gstin: {
            type: String,
            trim: true,
            default: ""
        },
        gstEnabled: {
            type: Boolean,
            default: false
        },
        gstRate: {
            type: Number,
            default: 18,
            min: 0,
            max: 100
        },
        upiId: {
            type: String,
            trim: true,
            default: ""
        },
        bankAccountName: {
            type: String,
            trim: true,
            default: ""
        },
        bankName: {
            type: String,
            trim: true,
            default: ""
        },
        bankAccountNumber: {
            type: String,
            trim: true,
            default: ""
        },
        bankIfsc: {
            type: String,
            trim: true,
            default: ""
        },
        autoConfirmOnlinePayments: {
            type: Boolean,
            default: false
        },
        razorpayEnabled: {
            type: Boolean,
            default: false
        },
        razorpayKeyId: {
            type: String,
            trim: true,
            default: ""
        },
        razorpayKeySecret: {
            type: String,
            trim: true,
            default: "",
            select: false
        }
    },
    {
        timestamps: true
    }
);

businessSchema.index({ owner: 1 });

businessSchema.pre("save", async function ensureSlug() {
    if (!this.slug && this.businessName) {
        const baseSlug = generateSlug(this.businessName);
        this.slug = await ensureUniqueSlug(this.constructor, baseSlug, this._id);
    }
});

module.exports = mongoose.model("Business", businessSchema);
