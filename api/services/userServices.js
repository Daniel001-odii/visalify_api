import User from '../models/user.js';

export const updateSubscriptionStatus = async (email, updates) => {
  try {
    await User.findOneAndUpdate({ email }, {
      $set: {
        subscriptionStatus: updates.status,
        subscriptionCode: updates.subscriptionCode,
        nextPaymentDate: updates.nextPaymentDate
      }
    }, { new: true });
  } catch (err) {
    console.error('Error updating user subscription:', err.message);
  }
};
