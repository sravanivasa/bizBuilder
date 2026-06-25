const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");

router.post("/register", async (req, res) => {
    console.log(req.body);
  try {
    const hashedPassword = await bcrypt.hash(
      req.body.password,
      10
    );
    
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    });
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
router.get("/",async(req,res)=>{
    const users = await User.find();
    res.json(users);
});

module.exports = router;