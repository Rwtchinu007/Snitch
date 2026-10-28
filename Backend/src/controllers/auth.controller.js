import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: config.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

async function sendTokenResponse(user, res, message, status = 200) {
  const token = jwt.sign(
    {
      id: user._id,
    },
    config.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  res.cookie("token", token, cookieOptions);

  res.status(status).json({
    message,
    success: true,
    user: {
      id: user._id,
      email: user.email,
      contact: user.contact,
      fullname: user.fullname,
      role: user.role,
    },
  });
}

export const register = async (req, res) => {
  const { email, contact, password, fullname,isSeller } = req.body;

  try {
    const existingUser = await userModel.findOne({
      $or: [{ email }, { contact }],
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email or contact already exists" });
    }

    const user = await userModel.create({ email, contact, password, fullname,role: isSeller ? "seller" : "buyer" });


    await sendTokenResponse(user, res, "User registered successfully", 201);

  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const login = async(req,res)=>{
  const {email,password} = req.body;

  const user = await userModel.findOne({email});

  if(!user){
    return res.status(400).json({message:"Invalid email or password"});
  }

  const isMatch = await user.comparePassword(password);

  if(!isMatch){
    return res.status(400).json({message:"Invalid email or password"});
  }

  await sendTokenResponse(user,res,"User logged in successfully");

}


export const googleCallback = async (req, res) => {
const {id,displayName,emails,photos} = req.user;
const email = emails[0].value;
const profilePic = photos[0].value;

let user = await userModel.findOne({ email });

if(!user){
  user = await userModel.create({
    email,
    googleId: id,
    fullname: displayName,
  })
}

const token = jwt.sign(
  {
    id: user._id,},config.JWT_SECRET,{
    expiresIn: "7d",
  },
);

res.cookie("token", token, cookieOptions);


const redirectPath = user.role === "seller" ? "/seller/dashboard" : "/";
res.redirect(`${config.CLIENT_URL}${redirectPath}`);
}

export const getMe = async (req,res)=>{
  const user = req.user;
  res.status(200).json({
    message:"User fetched successfully",
    success:true,
    user:{
      id: user._id,
      email: user.email,
      contact: user.contact,
      fullname: user.fullname,
      role: user.role,
    }
  })
}
export const logout = (req, res) => {
  const { maxAge, ...clearOptions } = cookieOptions;
  res.clearCookie("token", clearOptions);
  res.status(200).json({ message: "Logged out successfully", success: true });
}
