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
        }
    },
    {
        timestamps: true
    }
);

businessSchema.index({ owner: 1 });

businessSchema.pre("save", async function ensureSlug(next) {
    if (!this.slug && this.businessName) {
        const baseSlug = generateSlug(this.businessName);
        this.slug = await ensureUniqueSlug(this.constructor, baseSlug, this._id);
    }
    next();
});

module.exports = mongoose.model("Business", businessSchema);
