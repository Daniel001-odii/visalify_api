const express = require('express');
const { conductVisaInterview, conductVisaInterviewForAuthUsers } = require('../controllers/visaController');
const router = express.Router();

// Visa interview route
router.post('/question', conductVisaInterview);
router.post('/auth/question', conductVisaInterviewForAuthUsers);

module.exports = router; // ✅ Ensure this exports the router correctly
