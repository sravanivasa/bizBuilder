const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

// Register
const registerUser = async (req, res) => {
    try {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { name, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });

    }
};

// Login
const loginUser = async (req, res) => {

    try {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {

            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            });

        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {

            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
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

        return res.status(200).json({

            success: true,
            message: "Login successful",
            token

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,
            message: "Server error"

        });

    }

};

// Profile
const getProfile = async (req, res) => {

    try {

        return res.status(200).json({

            success: true,
            user: req.user

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,
            message: "Server error"

        });

    }

};

module.exports = {

    registerUser,
    loginUser,
    getProfile

};