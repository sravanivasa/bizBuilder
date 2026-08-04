const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { registerValidation, loginValidation } = require("../validators/userValidator");

const {
    registerUser,
    loginUser,
    getProfile,
    getAllUsers
} = require("../controllers/userController");

// Register
router.post("/register", ...registerValidation, registerUser);

// Login
router.post("/login", ...loginValidation, loginUser);

// Profile
router.get("/profile", authMiddleware, getProfile);

// Get All Users
router.get("/", getAllUsers);

module.exports = router;