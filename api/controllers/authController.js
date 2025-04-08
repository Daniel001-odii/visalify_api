import dotenv from 'dotenv';
dotenv.config();
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import config from '../config/config.js';
import { OAuth2Client } from "google-auth-library";
// const { OAuth2Client } = require('google-auth-library')

function getOauth2Client() {
  const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
  );

  return oAuth2Client;
}

function formatDateHumanReadable(isoDateString) {
  const date = new Date(isoDateString);
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZone: 'UTC',
    timeZoneName: 'short'
  };
  return date.toLocaleString('en-US', options);
}

export const verifyGoogleCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Authorization code is required" });

    console.log("Received Google authorization code:", code);

    // Initialize OAuth2 client and exchange the code for tokens
    const client = getOauth2Client();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Fetch user info from Google
    const { data: userinfo } = await client.request({
      url: "https://www.googleapis.com/oauth2/v3/userinfo",
    });

    console.log("Google User Data:", userinfo);

    // Check if user with the email already exists
    let user = await User.findOne({ email: userinfo.email });

    if (!user) {
      // If user does not exist, create a new account
      user = await User.create({
        name: userinfo.name,
        email: userinfo.email,
        googleId: userinfo.sub, // Google user ID
        avatar: userinfo.picture, // Profile picture
        provider: "google",
      });
    }

    user.profile_img = userinfo.picture;
    await user.save()

    user.last_login_string =formatDateHumanReadable(Date.now());
    user.save()

    // Generate JWT token for the user
    const token = jwt.sign({ userId: user._id }, config.jwtSecret, { expiresIn: "7d" });

    return res.status(200).json({
      message: "Google sign-in success",
      token,
      user,
    });
  } catch (error) {
    console.error("Error in verifyGoogleCode:", error);
    return res.status(500).json({ message: "Google authentication failed", error: error.message });
  }
};


export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });


    const newUser = await User.create({ name, email, password });

    const token = jwt.sign({ userId: newUser._id }, config.jwtSecret, { expiresIn: "7d" });

    // send welcome email here....
    // const result = await sendEmail({ to, subject, text, html });
    newUser.last_login_string =formatDateHumanReadable(Date.now());
    newUser.save()

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
    // if(user && user.provider != 'google'){
      if (!user || !(await user.matchPassword(password)) || user.provider != 'google') {
        return res.status(401).json({ message: "Invalid credentials provided" });
      }
    // }

    user.last_login_string =formatDateHumanReadable(Date.now());
    user.save()

    const token = jwt.sign({ user }, config.jwtSecret, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.log("err in login: ", error)
    res.status(500).json({ message: "Server error", error });
  }
};
