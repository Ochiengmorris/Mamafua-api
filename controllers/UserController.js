const mongoose = require("mongoose");
const UserModel = require("../models/UserModel");
const ObjectId = mongoose.Types.ObjectId;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const jwtSecret = process.env.JWT_SECRET;

const salt = bcrypt.genSaltSync(12);

const RegisterUser = async (req, res) => {
  const { username, email, phone, password } = req.body;

  try {
    try {
      const userDoc = await UserModel.create({
        username,
        email,
        phone,
        password: bcrypt.hashSync(password, salt),
      });

      if (userDoc) {
        jwt.sign(
          {
            email: userDoc.email,
            id: userDoc._id,
            username: userDoc.username,
          },
          jwtSecret,
          { expiresIn: "24h" },
          async (err, token) => {
            if (err) {
              throw err;
            }
            const userWithoutPassword = await UserModel.findById(
              userDoc._id
            ).select("-password");
            const isProduction = process.env.NODE_ENV === "production";
            res
              .cookie("token", token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: "none",
                maxAge: 24 * 60 * 60 * 1000,
              })
              .status(201)
              .json({
                user: userWithoutPassword,
                status: "SUCCESS",
                message: "Registration succesfull",
              });
          }
        );
      }
    } catch (e) {
      if (e.code === 11000) {
        // Duplicate key error
        const field = Object.keys(e.keyPattern)[0];
        const message = `The ${field} is already in use.`;
        res.status(422).json({ message: message });
      } else {
        res.status(422).json({ message: e.message });
      }
    }
  } catch (error) {
    console.error("Error during Registration:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const LoginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const userDoc = await UserModel.findOne({ email: email });
    if (userDoc) {
      const passGood = await bcrypt.compare(password, userDoc.password);
      if (passGood) {
        jwt.sign(
          { email: userDoc.email, id: userDoc._id, username: userDoc.username },
          jwtSecret,
          { expiresIn: "24h" },
          async (err, token) => {
            if (err) {
              throw err;
            }
            const userWithoutPassword = await UserModel.findById(
              userDoc._id
            ).select("-password");
            const isProduction = process.env.NODE_ENV === "production";
            res
              .cookie("token", token, {
                httpOnly: true,
                secure: isProduction,
                sameSite: "none",
                maxAge: 24 * 60 * 60 * 1000,
              })
              .json({
                user: userWithoutPassword,
                status: "SUCCESS",
                message: "Login successful",
              });
          }
        );
      } else {
        res.status(422).json({ message: "Invalid credentials" });
      }
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const LogOutUser = (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res
    .cookie("token", "", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "none",
      maxAge: 0,
    })
    .json({ message: "Logged out" });
};

const getUsers = async (req, res) => {
  try {
    const users = await UserModel.find({}).select("-password");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  RegisterUser,
  LoginUser,
  LogOutUser,
  getUsers,
};
