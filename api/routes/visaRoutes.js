const express = require('express');
const { conductVisaInterview } = require('../controllers/visaController');
const router = express.Router();

// Visa interview route
router.post('/question', conductVisaInterview);

module.exports = router; // ✅ Ensure this exports the router correctly
