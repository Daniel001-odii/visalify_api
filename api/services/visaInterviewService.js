import { ofetch } from "ofetch";
import config from "../config/config.js";

export const generateVisaInterviewQuestion = async ({ candidateData, currentAnswer, questionCount, previousQuestions, previousAnswers }) => {
  let prompt = `You are a visa officer conducting an interview...`;

  const geminiResponse = await ofetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": config.geminiApiKey },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 100, temperature: 0.5, topP: 0.9 } }),
  });

  const responseText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Please provide your full name.";
  
  return { question: responseText };
};
