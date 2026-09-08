const Customer = require("../models/Customer");
const { normalizePhoneForMatch, formatPhoneForStorage } = require("./phoneValidation");

const findOrCreateCustomerForOrder = async ({
    businessId,
    customerName,
    customerPhone,
    customerAddress
}) => {
    const phoneNormalized = normalizePhoneForMatch(customerPhone);

    if (!phoneNormalized) {
        const error = new Error("Enter a valid 10-digit Indian mobile number");
        error.statusCode = 400;
        throw error;
    }

    const phone = formatPhoneForStorage(customerPhone);
    const address = customerAddress?.trim() || "";

    const existing = await Customer.findOne({
        business: businessId,
        phoneNormalized
    });

    if (existing) {
        if (!existing.isActive) {
            existing.isActive = true;
            existing.name = customerName.trim();
            if (address) {
                existing.defaultAddress = address;
            }
            await existing.save();
        }

        return existing;
    }

    try {
        return await Customer.create({
            business: businessId,
            name: customerName.trim(),
            phone,
            phoneNormalized,
            defaultAddress: address,
            isActive: true
        });
    } catch (error) {
        if (error.code === 11000) {
            const raced = await Customer.findOne({
                business: businessId,
                phoneNormalized
            });

            if (raced) {
                if (!raced.isActive) {
                    raced.isActive = true;
                    raced.name = customerName.trim();
                    if (address) {
                        raced.defaultAddress = address;
                    }
                    await raced.save();
                }

                return raced;
            }
        }

        throw error;
    }
};

module.exports = {
    findOrCreateCustomerForOrder
};
