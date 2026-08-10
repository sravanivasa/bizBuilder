const generateSlug = (businessName) => {
    if (!businessName || typeof businessName !== "string") {
        return "business";
    }

    const slug = businessName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .replace(/-+/g, "-");

    return slug || "business";
};

const ensureUniqueSlug = async (Business, baseSlug, excludeId = null) => {
    let slug = baseSlug;
    let suffix = 2;

    while (true) {
        const query = { slug };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }

        const existing = await Business.findOne(query).select("_id");
        if (!existing) {
            return slug;
        }

        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
    }
};

module.exports = { generateSlug, ensureUniqueSlug };
