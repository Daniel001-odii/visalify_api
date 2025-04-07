const express = require("express");
const { 
    getProfile, 
    updateProfile,
    getAllVoices,
    getUserInterviews
} = require("../controllers/profileController.js");
const { authenticate } = require("../middlewares/authMiddleware.js");
const router = express.Router();

router.get("/", authenticate, getProfile);
router.patch("/", authenticate, updateProfile);

router.get("/ai/voices", getAllVoices);

router.get("/interviews", authenticate, getUserInterviews);
// router.get("/interviews/:interview_id", authenticate, getUserInterviews);
// router.get("/interviews/:interview_id/messages", authenticate, getUserInterviews);

module.exports = router;
