import express from "express"
import UserModel from "../Model/UserModel.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const router=express.Router();
const key="BLMS"

router.post("/register",async(req,res)=>{
    try{
        const {name,email,password}=req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Missing required fields" });
          }

      
          const existingUser = await UserModel.findOne({ email });
          if (existingUser) {
            return res.status(400).json({ message: "Account already exists. Please log in." });
          }
      
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);

          const newUser = new UserModel({ name, email, password: hashedPassword });
          const savedUser = await newUser.save();

          const token = jwt.sign(
            { id: savedUser._id, email: savedUser.email},
            key,
            { expiresIn: "3h" }
          );
      
          res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "Strict",
            maxAge: 3 * 60 * 60 * 1000,
          });
      
          res.status(200).json({
            message: "Signup Successful",
            status: true,
            user: {
              id: savedUser._id,
              name: savedUser.name,
              email: savedUser.email,
            },
          });
      
    }catch(err){
        res.status(500).json({success:false,message:"Failed to Register"})
    }
})

router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(401).json({ message: "Email and password are required" });
      }
  
      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "Account not found. Please sign up to continue." });
      }
  
      const isPasswordCorrect = await bcrypt.compare(password, user.password);
  
      if (!isPasswordCorrect) {
        return res.status(401).json({ message: "The password you entered is incorrect. Please try again." });
      }
  
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.KEY,
        { expiresIn: "3h" }
      );
  
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        maxAge: 3 * 60 * 60 * 1000,
      });
  
      res.status(200).json({
        message: "Login Successful",
        status: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
  
    } catch (err) {
      console.error("Login Error:", err);
      res.status(500).json({ message: "Failed Login", error: err.message });
    }
  });
  

export default router