const parsePagination = (query, defaultLimit = 12) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || defaultLimit));

    return {
        page,
        limit,
        skip: (page - 1) * limit
    };
};

const buildPaginationMeta = (page, limit, total) => {
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
    };
};

module.exports = {
    parsePagination,
    buildPaginationMeta
};
