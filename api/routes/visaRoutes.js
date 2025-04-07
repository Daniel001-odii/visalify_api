const express = require('express');
const { 
    conductVisaInterview, 
    conductVisaInterviewForAuthUsers, 
    createNewInterview,
    getInterviewById,
    getAllMessagesInInterview,
    deleteInterviewById, 
} = require('../controllers/visaController');
const router = express.Router();
const { authenticate } = require("../middlewares/authMiddleware.js");

// Visa interview route
router.post('/question', conductVisaInterview);
router.post('/:interview_id/user_question', authenticate, conductVisaInterviewForAuthUsers);

router.post('/new_interview', authenticate, createNewInterview);

router.get('/:interview_id/interview', authenticate, getInterviewById); // Assuming you have a function to get interview by ID')

router.get('/:interview_id/interview_messages', authenticate, getAllMessagesInInterview);

router.delete('/:interview_id/delete', authenticate, deleteInterviewById)

module.exports = router; // ✅ Ensure this exports the router correctly
