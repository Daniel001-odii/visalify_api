import User from "../models/user.js";
// const MSEdgeTTS = require('msedge-tts');
import { MsEdgeTTS } from "msedge-tts";
import Interview from "../models/interview.js";
import message from "../models/message.js";

import paystack from "../utils/paystack.js";
// Initialize the TTS service
const tts = new MsEdgeTTS();

// Fetch the list of voices and return them with parsed voice name
async function listVoices() {
  const voices = await tts.getVoices();
  return voices.map((voice, index) => {
    // Extract the usable voice name (e.g., "ar-DZ-IsmaelNeural")
    const match = voice.Name.match(/\(([^,]+), ([^\)]+)Neural\)/);
    const voiceName = match ? `${match[1]}-${match[2]}Neural` : voice.Name; // Fallback to original if no match
    return {
      id: index + 1,
      name: voiceName, // e.g., "ar-DZ-IsmaelNeural"
      gender: voice.Gender,
      language: voice.Locale,
    };
  });
}

export const getAllVoices = async (req, res) => {
  try {
    const { gender } = req.query;
    let voices = await listVoices();

    if (gender) {
      const normalizedGender = gender.toLowerCase();
      if (normalizedGender !== 'male' && normalizedGender !== 'female') {
        return res.status(400).json({ 
          message: "Invalid gender parameter. Allowed values: 'male' or 'female'" 
        });
      }
      
      voices = voices.filter(voice => 
        voice.gender.toLowerCase() === normalizedGender
      );
    }

    res.status(200).json({ voices });
  } catch (err) {
    res.status(500).json({ 
      message: "Internal server error", 
      error: err.message 
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user.userId, req.body, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


export const getUserInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ user: req.user_info._id }).sort({ createdAt: 1 });
    res.status(200).json({ interviews });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


export const getDashboardData = async (req, res) => {
  try {
    const user_id = req.user_info._id;

    const interviews = await Interview.find({ user: user_id });

    const practice_time = interviews.reduce((acc, cur) => acc + cur.duration, 0);
    const completed_interviews = interviews.length;

    const confidence_score = completed_interviews > 0
      ? Math.round(
        interviews.reduce((acc, cur) => {
            const score = Math.min(1, 90 / (cur.duration || 1)); // prevent division by 0
            return acc + score;
          }, 0) / completed_interviews * 100
        )
      : 0;

    res.status(200).json({
      status: 'success',
      practice_time,
      confidence_score, // Percentage
      completed_interviews
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


import { ofetch } from "ofetch";

export const generateVisaTips = async (req, res) => {
  const geminiApiKey = process.env.GOOGLE_API_KEY;

  if (!geminiApiKey) {
    return res.status(500).json({ message: "Google API Key is missing" });
  }

  const userData = req.user_info;

  if (!userData || Object.keys(userData).length === 0) {
    return res.status(400).json({ message: "Visa interview data is required." });
  }

  try {
    const user = await User.findById(userData._id);
    const lastTipDate = user.visa_tip?.date;
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

    // If tips were already generated today, return the saved tips
    if (lastTipDate && new Date(lastTipDate).toISOString().slice(0, 10) === today) {
      return res.status(200).json({
        success: true,
        tips: user.visa_tip.tips,
        message: "Today's tips already generated.",
      });
    }

    // Generate new tips
    const prompt = `
You are an expert visa interview coach.

Using the following data about a visa applicant, provide exactly 2 specific, personalized, and encouraging tips that will help them perform well in their interview, also make reference to the user's interview date sometimes.

Here is the user's information:
${JSON.stringify(userData, null, 2)}

Make the tips short, direct, and confidence-boosting.

Return only the tips in this format:

1. [Tip one]
2. [Tip two]
`;

    const geminiResponse = await ofetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 150,
            temperature: 0.7,
            topP: 0.9,
          },
        }),
      }
    );

    const responseText =
      geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    console.log("Raw Gemini Visa Tips Response:", responseText);

    // Extract tips from formatted string
    const tipsMatch = responseText.match(/1\.\s*(.+)\s*2\.\s*(.+)/s);

    const tips = tipsMatch
      ? [
          tipsMatch[1].trim(),
          tipsMatch[2].trim(),
        ]
      : [
          "Be calm and confident during your interview.",
          "Clearly explain the purpose of your visit with supporting documents.",
        ];

    // Save the new tips and today's date
    user.visa_tip = {
      tips,
      date: new Date(),
    };
    await user.save();

    res.status(200).json({
      success: true,
      tips,
    });
  } catch (error) {
    console.error("Error generating visa tips:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate visa interview tips.",
      error: error.message,
    });
  }
};



export const subscribePremium = async (req, res) => {
  try {
    const user = req.user_info;

    // Step 1: Create Paystack customer
    const customerRes = await paystack.post("/customer", {
      email: user.email,
      first_name: user.name.split(" ")[0],
    });

    console.log("customer from paystack: ", customerRes);

    const customerCode = customerRes.data.data.customer_code;

    // Step 2: Initialize subscription (use your own Paystack plan code)
    const planCode = process.env.PAYSTACK_PLAN_CODE; // From Paystack dashboard

    const subRes = await paystack.post("/transaction/initialize", {
      email: user.email,
      amount: 10000 * 100, // ₦5000 in kobo
      plan: planCode,
      metadata: {
        userId: user._id.toString(),
      },
    });

    return res.json({ url: subRes.data.data.authorization_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Subscription failed" });
  }
}


// to be used by remote CRON ...
export const startSubscriptionChecker = async () => {

    console.log("🔍 Checking for expired subscriptions...");

    const now = new Date();

    const expiredUsers = await User.find({
      subscription: "premium",
      subscription_end_date: { $lt: now }
    });

    for (const user of expiredUsers) {
      user.subscription = "free";
      user.subscription_end_date = null;
      user.subscription_start_date = null;
      await user.save();

      console.log(`👤 Downgraded: ${user.email}`);
    }

    console.log("✅ Subscription check complete.");

};