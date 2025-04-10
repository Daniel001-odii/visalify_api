import jwt from "jsonwebtoken";
import config from "../config/config.js";
import User from '../models/user.js';

export const authenticate = async (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user_data = await User.findById(decoded.userId);

    req.user = decoded;
    req.user_info = user_data;
    console.log("user data from middleware: ", user_data)
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};
