import User from "../models/user.js";
// const MSEdgeTTS = require('msedge-tts');
import { MsEdgeTTS } from "msedge-tts";
import Interview from "../models/interview.js";
import message from "../models/message.js";

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
    const voices = await listVoices();
    res.status(200).json({ voices });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err.message });
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

  const prompt = `
You are an expert visa interview coach.

Using the following data about a visa applicant, provide exactly 2 specific, personalized, and encouraging tips that will help them perform well in their interview.

Here is the user's information:
${JSON.stringify(userData, null, 2)}

Make the tips short, direct, and confidence-boosting.

Return only the tips in this format:

1. [Tip one]
2. [Tip two]
`;

  try {
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

