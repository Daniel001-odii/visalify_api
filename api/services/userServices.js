import User from '../models/user.js';

export const updateSubscriptionStatus = async (email, updates) => {
  try {
    // await User.findByIdAndUpdate({ user_id }, {
    await User.findOneAndUpdate({ email }, {
      $set: {
        subscription_status: updates.status,
        subscription: updates.subscription,
        customer_code: updates.customer_code,
        // subscriptionCode: updates.subscriptionCode
      }
    }, { new: true });
  } catch (err) {
    console.error('Error updating user subscription:', err.message);
  }
};
