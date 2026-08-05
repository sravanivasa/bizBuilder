const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const asyncHandler = require("../middleware/asyncHandler");
const formatUser = require("../utils/formatUser");

const createToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const registerUser = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errors.array()
        });
    }

    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
        return res.status(409).json({
            success: false,
            message: "Email already registered"
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
        token: createToken(user._id),
        user: formatUser(user)
    });
});

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
        return res.status(401).json({
            success: false,
            message: "Invalid email or password"
        });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password"
        });
    }

    res.status(200).json({
        success: true,
        message: "Login successful",
        token: createToken(user._id),
        user: formatUser(user)
    });
});

const getProfile = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        user: formatUser(req.user)
    });
});

const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select("-password");
    res.status(200).json({
        success: true,
        users: users.map(formatUser)
    });
});

module.exports = {
    registerUser,
    loginUser,
    getProfile,
    getAllUsers
};
