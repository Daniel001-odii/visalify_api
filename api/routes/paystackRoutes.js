import express from 'express';
import { handlePaystackWebhook, verifyInitialPayment } from '../controllers/paystackController.js';

const router = express.Router();

router.post('/webhook', handlePaystackWebhook); // For Paystack events
router.get('/verify-payment', verifyInitialPayment); // For first-time verification

export default router;
