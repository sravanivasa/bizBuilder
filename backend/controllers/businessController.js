const Business = require("../models/Business");
const { validationResult } = require("express-validator");
const asyncHandler = require("../middleware/asyncHandler");

// Create Business
const createBusiness = asyncHandler(async (req, res) => {
   
    const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const {
            businessName,
            category,
            phoneNumber,
            description,
            address,
            email,
            website,
            logo
        } = req.body;

        const business = await Business.create({
            businessName,
            category,
            phoneNumber,
            description,
            address,
            email,
            website,
            logo,
            owner: req.user._id
        });

        return res.status(201).json({
            success: true,
            message: "Business created successfully",
            business
        });
});

// Get Logged-in User Businesses
const getMyBusinesses = asyncHandler(async (req, res) => {

        const businesses = await Business.find({
            owner: req.user._id
        });

        return res.status(200).json({
            success: true,
            message: "Businesses fetched successfully",
            businesses
        });
});

// Get Business By ID
const getBusinessById = asyncHandler(async (req, res) => {
    
    const business = await Business.findById(req.params.id);

        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Business fetched successfully",
            business
        });
});

// Update Business
const updateBusiness = asyncHandler(async (req, res) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const business = await Business.findById(req.params.id);

        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business not found"
            });
        }

        if (business.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const updatedBusiness = await Business.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        return res.status(200).json({
            success: true,
            message: "Business updated successfully",
            business: updatedBusiness
        });
});

// Delete Business
const deleteBusiness = asyncHandler(async (req, res) => {

        const business = await Business.findById(req.params.id);

        if (!business) {
            return res.status(404).json({
                success: false,
                message: "Business not found"
            });
        }

        if (business.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }

        await Business.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Business deleted successfully"
        });

    });

module.exports = {
    createBusiness,
    getMyBusinesses,
    getBusinessById,
    updateBusiness,
    deleteBusiness
};