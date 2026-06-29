const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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
router.post("/login",async(req,res)=>{
  try{
    const {email,password} = req.body;
    const user = await User.findOne({email});
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password"
      });
    }
    const isMatch = await bcrypt.compare(password,user.password);
    console.log(isMatch);
    if(!isMatch){
      return res.status(400).json({
        success: false,
        message: "Invalid email or password"
      });
    }
  const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

    
  }catch(error){
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;