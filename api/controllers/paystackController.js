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
