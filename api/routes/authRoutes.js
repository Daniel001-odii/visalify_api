/* const express = require("express");
const { signup, login, verifyGoogleCode } = require("../controllers/authController.js");
 */
import express from "express";
import { signup, login, verifyGoogleCode } from "../controllers/authController.js"

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.post("/google_verify/code", verifyGoogleCode);

export default router;
