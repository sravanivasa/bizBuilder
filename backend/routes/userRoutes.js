const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const { registerValidation, loginValidation } = require("../validators/userValidator");
const { registerUser, loginUser, getProfile } = require("../controllers/userController");

router.post("/register", registerValidation, registerUser);
router.get("/",async(req,res)=>{
    const users = await User.find();
    res.json(users);
});
router.get("/profile", authMiddleware, getProfile);
router.post("/login", loginValidation, loginUser);

module.exports = router;
