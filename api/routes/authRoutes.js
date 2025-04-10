/* const express = require("express");
const { signup, login, verifyGoogleCode } = require("../controllers/authController.js");
 */
import express from "express";
import { signup, login, verifyGoogleCode, requestPasswordReset, resetPassword,
    validateResetToken
 } from "../controllers/authController.js"

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.post("/google_verify/code", verifyGoogleCode);

router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password/:token", resetPassword);
router.get("/validate-reset-token/:token", validateResetToken);;

export default router;
