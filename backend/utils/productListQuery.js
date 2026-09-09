const { escapeRegex } = require("./phoneValidation");

const MAX_SEARCH_LENGTH = 100;

const PRODUCT_LIST_SORT_FIELDS = {
    createdAt: "createdAt",
    productName: "productName",
    price: "price",
    stock: "stock"
};

const buildProductListFilter = (businessId, search) => {
    const filter = { business: businessId };
    const trimmed = search?.trim().slice(0, MAX_SEARCH_LENGTH);

    if (!trimmed) {
        return filter;
    }

    const escaped = escapeRegex(trimmed);

    return {
        business: businessId,
        $or: [
            { productName: { $regex: escaped, $options: "i" } },
            { description: { $regex: escaped, $options: "i" } }
        ]
    };
};

const buildProductListSort = (sortField, sortDirection) => {
    const field = PRODUCT_LIST_SORT_FIELDS[sortField] || "createdAt";
    const direction = sortDirection === "asc" ? 1 : -1;
    const sort = { [field]: direction };

    if (field !== "createdAt") {
        sort.createdAt = -1;
    }

    sort._id = direction;

    return sort;
};

module.exports = {
    MAX_SEARCH_LENGTH,
    PRODUCT_LIST_SORT_FIELDS,
    buildProductListFilter,
    buildProductListSort
};
