/* const express = require('express');
const { 
    conductVisaInterview, 
    conductVisaInterviewForAuthUsers, 
    createNewInterview,
    getInterviewById,
    getAllMessagesInInterview,
    deleteInterviewById, 
} = require('../controllers/visaController');

const { authenticate } = require("../middlewares/authMiddleware.js");
 */
import express from "express"
import { conductVisaInterview,
    conductVisaInterviewForAuthUsers, 
    createNewInterview,
    getInterviewById,
    getAllMessagesInInterview,
    deleteInterviewById, 
 } from "../controllers/visaController.js";
 import { authenticate } from "../middlewares/authMiddleware.js";
const router = express.Router();
// Visa interview route
router.post('/question', conductVisaInterview);
router.post('/:interview_id/user_question', authenticate, conductVisaInterviewForAuthUsers);

router.post('/new_interview', authenticate, createNewInterview);

router.get('/:interview_id/interview', authenticate, getInterviewById); // Assuming you have a function to get interview by ID')

router.get('/:interview_id/interview_messages', authenticate, getAllMessagesInInterview);

router.delete('/:interview_id/delete', authenticate, deleteInterviewById)

export default router;
