const EXPECTED_COLUMNS = ["productName", "description", "price", "stock", "imageUrl"];

const parseCsvLine = (line) => {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index++) {
        const char = line[index];

        if (char === '"') {
            if (inQuotes && line[index + 1] === '"') {
                current += '"';
                index++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
};

const normalizeHeader = (header) => header.trim().toLowerCase();

export const parseProductCsv = (text) => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length < 2) {
        return { error: "noRows", rows: [] };
    }

    const header = parseCsvLine(lines[0]).map(normalizeHeader);
    const missingColumns = EXPECTED_COLUMNS.filter(
        (column) => !header.includes(column.toLowerCase())
    );

    if (missingColumns.length > 0) {
        return { error: "invalidHeader", rows: [], missingColumns };
    }

    const rows = [];

    for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
        const values = parseCsvLine(lines[lineIndex]);

        if (values.every((value) => !value.trim())) {
            continue;
        }

        const row = {};
        header.forEach((column, columnIndex) => {
            row[column] = values[columnIndex] ?? "";
        });

        rows.push({
            productName: row.productname ?? "",
            description: row.description ?? "",
            price: row.price ?? "",
            stock: row.stock ?? "",
            imageUrl: row.imageurl ?? ""
        });
    }

    if (rows.length === 0) {
        return { error: "noRows", rows: [] };
    }

    return { rows };
};

export const PRODUCT_CSV_TEMPLATE = EXPECTED_COLUMNS.join(",");
