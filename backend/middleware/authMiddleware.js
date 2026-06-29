const jwt = require("jsonwebtoken");
const User  = require("../models/User");
const authMiddleware = async(req, res, next) => {
    try{
        const authHeader  =  req.headers.authorization;
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({
                success: false,
                message: "Not authorized, no token"
            });
        }
        const token = authHeader.split(" ")[1];

        console.log("Authorization Header:", authHeader);
        console.log("Extracted Token:", token);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if(!user){
            return res.status(401).json({
                success: false,
                message: "Not authorized, user not found"
            });
        }
        req.user = user;
        next();


    }catch(error){
        console.log(error);
        res.status(401).json({
            success: false,
            message: "Not authorized, token failed"
        });
    }



};
module.exports = authMiddleware;
