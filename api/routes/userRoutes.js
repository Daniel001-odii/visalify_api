const express = require("express");
const { getProfile, updateProfile } = require("../controllers/profileController.js");
const { authenticate } = require("../middlewares/authMiddleware.js");
const router = express.Router();

router.get("/", authenticate, getProfile);
router.put("/", authenticate, updateProfile);

module.exports = router;
