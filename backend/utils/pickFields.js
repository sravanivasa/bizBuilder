const pickFields = (source, allowedFields) => {
    return allowedFields.reduce((result, field) => {
        if (source[field] !== undefined) {
            result[field] = source[field];
        }
        return result;
    }, {});
};

module.exports = pickFields;
