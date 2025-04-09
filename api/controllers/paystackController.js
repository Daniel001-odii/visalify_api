import crypto from 'crypto';
import axios from 'axios';
import { updateSubscriptionStatus } from '../services/userServices.js';

export const handlePaystackWebhook = async (req, res) => {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.sendStatus(401); // Not from Paystack
  }

  const event = req.body.event;
  const data = req.body.data;
  const email = data?.customer?.email;

  console.log("data from paystack: ", req.body);

  switch (event) {
    case 'invoice.payment_success':
      await updateSubscriptionStatus(email, {
        status: 'active',
        nextPaymentDate: data.next_payment_date,
        subscriptionCode: data.subscription?.subscription_code,
      });
      break;

    case 'invoice.payment_failed':
      await updateSubscriptionStatus(email, { status: 'past_due' });
      break;

    case 'subscription.disable':
    case 'subscription.not_renew':
      await updateSubscriptionStatus(email, { status: 'cancelled' });
      break;
  }

  return res.sendStatus(200);
};

export const verifyInitialPayment = async (req, res) => {
  const reference = req.query.reference;

  try {
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
      }
    });

    const data = response.data.data;
    if (data.status === 'success') {
      const email = data.customer.email;
      await updateSubscriptionStatus(email, {
        status: 'active',
        subscriptionCode: data.subscription?.subscription_code,
        nextPaymentDate: data.next_payment_date
      });
      return res.status(200).json({ message: 'Payment verified and user updated' });
    }

    return res.status(400).json({ message: 'Payment not successful' });
  } catch (error) {
    return res.status(500).json({ error: 'Verification failed', details: error.message });
  }
};

export const generatePaystackPaymentLink = async (req, res) => {
    const user = req.user_info;
    // const userId = user._id
    console.log("plan code: ", process.env.PAYSTACK_PLAN_CODE)
  
    try {
      /* const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' }); */
  
      const payload = {
        email: user.email, // still required
        amount: "100000",
        plan: process.env.PAYSTACK_PLAN_CODE, // Your subscription plan code
        metadata: {
          userId: user._id.toString(),
          realEmail: user.email
        }
      };
  
      const response = await axios.post('https://api.paystack.co/transaction/initialize', payload, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });
  
      const paymentLink = response.data.data.authorization_url;
      res.status(200).json({ paymentLink });
  
    } catch (err) {
      console.error('Error creating payment link:', err.response?.data || err.message);
      res.status(500).json({ message: 'Could not create payment link' });
    }
  };