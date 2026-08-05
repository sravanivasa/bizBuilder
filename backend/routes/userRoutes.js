const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { registerValidation, loginValidation } = require("../validators/userValidator");

const {
    registerUser,
    loginUser,
    getProfile,
    getAllUsers
} = require("../controllers/userController");

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

router.post("/register", authLimiter, ...registerValidation, registerUser);
router.post("/login", authLimiter, ...loginValidation, loginUser);
router.get("/profile", authMiddleware, getProfile);
router.get("/", authMiddleware, adminMiddleware, getAllUsers);

module.exports = router;
