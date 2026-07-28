const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {validationResult} = require("express-validator");
const asyncHandler = require("../middleware/asyncHandler");

// Register User
const registerUser = asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array()
            });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const user = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user
        });   
});

// Login User
const loginUser = asyncHandler(async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {

            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array()
            });

        }
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {

            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
            });

        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {

            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
            });

        }

        const token = jwt.sign(
            {
                id: user._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
});

// Get Profile
const getProfile = asyncHandler(async (req, res) => {

    res.status(200).json({
        success: true,
        user: req.user
    });

});

// Get All Users
const getAllUsers = asyncHandler(async (req, res) => {

    const users = await User.find();
            res.status(200).json({
            success: true,
            users
        });
    });

module.exports = {
    registerUser,
    loginUser,
    getProfile,
    getAllUsers
};