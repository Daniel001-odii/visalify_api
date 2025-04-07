import User from "../models/user.js";
// const MSEdgeTTS = require('msedge-tts');
import { MsEdgeTTS } from "msedge-tts";
import Interview from "../models/interview.js";

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
    const interviews = await Interview.find({ user: req.user_info._id });
    res.status(200).json({ interviews });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};