const jwt = require("jsonwebtoken");
require("dotenv").config();
const secret = process.env.SECRET;

exports.requireLogin = (req,res,next) =>{
   try{
        const token = req.headers.Authorization;
        console.log(token);
        const decoded = jwt.verify(token,secret);
        if(decoded){
            req.user = decoded.data;
            next();
        }else{
            res.json({message:"Not Authorized"})
        }
   }catch(e){
        res.status(400).json({message:e.message});
   }
} 