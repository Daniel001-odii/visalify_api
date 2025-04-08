/* const express = require("express");

const paystack  = require("../utils/paystack.js");
const User = require("../models/user.js"); */
import express from "express"
import paystack from "../utils/paystack.js";
import User from "../models/user.js";

import {
    getProfile, 
    updateProfile,
    getAllVoices,
    getUserInterviews,
    getDashboardData,
    generateVisaTips,
    subscribePremium
} from "../controllers/profileController.js"
import { authenticate } from "../middlewares/authMiddleware.js";

/* const { 
    getProfile, 
    updateProfile,
    getAllVoices,
    getUserInterviews,
    getDashboardData,
    generateVisaTips
} = require("../controllers/profileController.js");
const { authenticate } = require("../middlewares/authMiddleware.js"); */
const router = express.Router();

router.get("/", authenticate, getProfile);
router.patch("/", authenticate, updateProfile);

router.get("/ai/voices", authenticate, getAllVoices);

router.get("/interviews", authenticate, getUserInterviews);

router.get("/dashboard_data", authenticate, getDashboardData);

router.get("/visa_tips", authenticate, generateVisaTips);

router.post("/subscribe_premium", authenticate, subscribePremium);

export default router;
