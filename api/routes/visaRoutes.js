const express = require('express');
const { conductVisaInterview, conductVisaInterviewForAuthUsers } = require('../controllers/visaController');
const router = express.Router();
const { authenticate } = require("../middlewares/authMiddleware.js");

// Visa interview route
router.post('/question', conductVisaInterview);
router.post('/user_question', authenticate, conductVisaInterviewForAuthUsers);

module.exports = router; // ✅ Ensure this exports the router correctly
