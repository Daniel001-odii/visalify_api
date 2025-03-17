import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import config from "../config/config.js";

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });


    const newUser = await User.create({ name, email, password });

    const token = jwt.sign({ userId: newUser._id }, config.jwtSecret, { expiresIn: "7d" });

    res.status(201).json({ token, message: "User registered successfully", userId: newUser._id });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
    console.log("err in signup: ", error)
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    // Check if user exists and password is correct
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials provided" });
    }

    const token = jwt.sign({ userId: user._id }, config.jwtSecret, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.log("err in login: ", error)
    res.status(500).json({ message: "Server error", error });
  }
};
