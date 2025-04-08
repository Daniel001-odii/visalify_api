export const requirePremium = async (req, res, next) => {
    const user = req.user_info; // Attach user from auth middleware/session
  
    if (user.subscription !== "premium") {
      return res.status(403).json({ error: "Premium subscription required." });
    }
  
    if (new Date() > new Date(user.subscription_end_date)) {
      user.subscription = "free";
      await user.save();
      return res.status(403).json({ error: "Subscription expired." });
    }
  
    next();
  };
  