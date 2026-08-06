import api from "./axios";

export const BULK_IMPORT_BATCH_SIZE = 25;

const appendProductFields = (formData, data) => {
    formData.append("productName", data.productName);
    if (data.description) {
        formData.append("description", data.description);
    }
    formData.append("price", String(data.price));
    formData.append("stock", String(data.stock));
};

const buildProductFormData = (data, { includeImage = true } = {}) => {
    const formData = new FormData();
    appendProductFields(formData, data);

    if (includeImage && data.image) {
        formData.append("image", data.image);
    }

    return formData;
};

export const createProduct = (businessId, data) =>
    api.post(`/products/${businessId}`, buildProductFormData(data));

export const getProductsByBusiness = (businessId) => api.get(`/products/business/${businessId}`);

export const getProductById = (productId) => api.get(`/products/${productId}`);

export const updateProduct = (productId, data) =>
    api.put(
        `/products/${productId}`,
        buildProductFormData(data, { includeImage: Boolean(data.image) })
    );

export const deleteProduct = (productId) => api.delete(`/products/${productId}`);

export const bulkCreateProducts = (businessId, products) =>
    api.post(`/products/${businessId}/bulk`, { products });

export const bulkCreateProductsInBatches = async (
    businessId,
    products,
    { batchSize = BULK_IMPORT_BATCH_SIZE, onProgress } = {}
) => {
    const aggregated = { created: 0, failed: 0, errors: [] };

    for (let offset = 0; offset < products.length; offset += batchSize) {
        const batch = products.slice(offset, offset + batchSize);

        try {
            const { data } = await bulkCreateProducts(businessId, batch);
            aggregated.created += data.created ?? 0;
            aggregated.failed += data.failed ?? 0;

            if (data.errors?.length) {
                aggregated.errors.push(
                    ...data.errors.map((item) => ({
                        row: offset + item.row,
                        message: item.message
                    }))
                );
            }
        } catch (err) {
            const message =
                err.response?.status === 413
                    ? "Request body is too large"
                    : err.response?.data?.message || err.message || "Import failed";

            const batchError = new Error(message);
            batchError.response = err.response;
            batchError.processed = offset;
            batchError.total = products.length;
            throw batchError;
        }

        onProgress?.(Math.min(offset + batch.length, products.length), products.length);
    }

    return aggregated;
};
