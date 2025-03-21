const express = require("express");
const { 
    getProfile, 
    updateProfile,
    getAllVoices 
} = require("../controllers/profileController.js");
const { authenticate } = require("../middlewares/authMiddleware.js");
const router = express.Router();

router.get("/", authenticate, getProfile);
router.patch("/", authenticate, updateProfile);

router.get("/ai/voices", getAllVoices);
module.exports = router;
