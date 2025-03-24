const { ofetch } = require("ofetch");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
const fs = require("fs");
const path = require("path");

const User = require("../models/user");

// Build interview prompt with improved conversational tone
let prompt = `You are a visa officer conducting an interview. Your tone is formal, polite, and professional, mimicking a real human officer. Use natural phrasing like "Can you tell me...", "I’d like to know...", or "Please explain..." to sound conversational. 
    Based on the candidate's data and previous answers below, ask a single, concise question from common visa interview topics 
    (e.g., purpose of travel, funding, ties to home country, past travel history) to assess their eligibility. 
    Do not repeat questions already asked. You must ask exactly 5 questions before making a decision. 
    After the 5th question, evaluate all data and answers, then provide a final response in this exact format: 
    "[APPROVED or DENIED]: [Full sentence reason in a polite, human-like tone, e.g., 'Congratulations, your visa has been approved as you’ve demonstrated strong ties to your home country.' or 'I’m sorry, but your visa has been denied due to insufficient funding for this trip.']". 
    Here is the candidate’s data:\n\n`;


exports.conductVisaInterview = async (req, res) => {
  try {
    const {
      candidateData,
      currentAnswer,
      questionCount = 0,
      previousQuestions = [],
      previousAnswers = [],
    } = req.body;
    console.log("from client ", req.body);

    const geminiApiKey = process.env.GOOGLE_API_KEY;
    if (!geminiApiKey) {
      return res.status(500).json({ message: "Google API Key is missing" });
    }

    prompt += JSON.stringify(candidateData, null, 2) + "\n\n";

    if (previousQuestions.length > 0) {
      prompt += `Previous questions and answers:\n`;
      previousQuestions.forEach((q, i) => {
        prompt += `- Question ${i + 1}: "${q}"\n  Answer: "${
          previousAnswers[i]
        }"\n`;
      });
    }

    if (currentAnswer) {
      prompt += `The candidate just answered: "${currentAnswer}" to the last question.\n`;
    }

    const maxQuestions = 5;
    if (questionCount < maxQuestions) {
      prompt += `Ask question ${
        questionCount + 1
      } of 5 in a polite, conversational tone. Provide a recommended reply that would be a correct and appropriate answer to that question. Return the question and the recommended reply separated by ' || '. For example: 'Can you tell me the purpose of your trip? || I’m traveling to attend a family wedding.'`;
    } else {
      prompt += `You have asked 5 questions. Now evaluate all data and answers, and return only the final decision in this format: "[APPROVED or DENIED]: [Full sentence reason in a polite, human-like tone]"`;
    }

    console.log("Prompt:", prompt);

    // Fetch response from Gemini API
    const geminiResponse = await ofetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 150, // Increased slightly to accommodate full sentences
            temperature: 0.7, // Slightly higher for more natural variation
            topP: 0.9,
          },
        }),
      }
    );

    const responseText =
      geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Please provide your full name.";
    console.log("Gemini Response:", responseText);

    // Parse response
    let question = "";
    let decision = null;
    let recommendedReply = "";
    const isFinal = questionCount >= maxQuestions;

    if (isFinal) {
      const match = responseText.match(
        /^(?:\[)?(APPROVED|DENIED)(?:\])?: (.+)$/i
      );
      if (match) {
        decision = { status: match[1], reason: match[2] };
      } else {
        decision = {
          status: "DENIED",
          reason:
            "I’m sorry, but your visa has been denied due to an unexpected processing error.",
        };
      }
    } else {
      const parts = responseText.split(" || ");
      if (parts.length === 2) {
        question = parts[0].trim();
        recommendedReply = parts[1].trim();
      } else {
        question = responseText;
        recommendedReply = "Please provide a clear and detailed response.";
      }
    }

    // Update state
    const updatedQuestionCount = questionCount + 1;
    const updatedPreviousQuestions = isFinal
      ? previousQuestions
      : [...previousQuestions, question];
    const updatedPreviousAnswers = currentAnswer
      ? [...previousAnswers, currentAnswer]
      : previousAnswers;

    // Generate Audio
    const createAudio = async (text) => {
      try {
        const tts = new MsEdgeTTS();
        await tts.setMetadata(
          "en-US-AriaNeural",
          OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS
        );

        const { audioStream } = await tts.toStream(text);
        const chunks = [];
        for await (const chunk of audioStream) {
          chunks.push(chunk);
        }
        const audioBuffer = Buffer.concat(chunks);

        const audioBase64 = `data:audio/webm;base64,${audioBuffer.toString(
          "base64"
        )}`;
        return audioBase64;
      } catch (error) {
        console.error("Error generating audio:", error);
        return null;
      }
    };

    // Generate audio for question or decision
    const audioText = isFinal ? decision.reason : question;
    const audioPath = await createAudio(audioText);

    res.json({
      question: isFinal ? "" : question,
      decision: isFinal ? decision : null,
      recommendedReply: isFinal ? "" : recommendedReply,
      audioPath,
      questionCount: updatedQuestionCount,
      previousQuestions: updatedPreviousQuestions,
      previousAnswers: updatedPreviousAnswers,
      isFinal,
    });
  } catch (error) {
    console.error("Visa Interview Error:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

exports.conductVisaInterviewForAuthUsers = async (req, res) => {
  try {
    const {
      currentAnswer,
      questionCount = 0,
      previousQuestions = [],
      previousAnswers = [],
    } = req.body;
    console.log("from client ", req.body);

    const {
      name,
      nationality,
      travelled_before,
      visa_refused_before,
      target_country,
      visa_type,
      interview_date,
      settings,
    } = req.user_info;
    const candidateData = {
      name,
      nationality,
      travelled_before,
      visa_refused_before,
      target_country,
      visa_type,
      interview_date,
    };

    const geminiApiKey = process.env.GOOGLE_API_KEY;
    if (!geminiApiKey) {
      return res.status(500).json({ message: "Google API Key is missing" });
    }

    prompt += JSON.stringify(candidateData, null, 2) + "\n\n";

    if (previousQuestions.length > 0) {
      prompt += `Previous questions and answers:\n`;
      previousQuestions.forEach((q, i) => {
        prompt += `- Question ${i + 1}: "${q}"\n  Answer: "${
          previousAnswers[i]
        }"\n`;
      });
    }

    if (currentAnswer) {
      prompt += `The candidate just answered: "${currentAnswer}" to the last question.\n`;
    }

    const maxQuestions = 5;
    if (questionCount < maxQuestions) {
      prompt += `Ask question ${
        questionCount + 1
      } of 5 in a polite, conversational tone. Provide a recommended reply that would be a correct and appropriate answer to that question. Return the question and the recommended reply separated by ' || '. For example: 'Can you tell me the purpose of your trip? || I’m traveling to attend a family wedding.'`;
    } else {
      prompt += `You have asked 5 questions. Now evaluate all data and answers, and return only the final decision in this format: "[APPROVED or DENIED]: [Full sentence reason in a polite, human-like tone]"`;
    }

    console.log("Prompt:", prompt);

    // Fetch response from Gemini API
    const geminiResponse = await ofetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 150, // Increased slightly to accommodate full sentences
            temperature: 0.7, // Slightly higher for more natural variation
            topP: 0.9,
          },
        }),
      }
    );

    const responseText =
      geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Please provide your full name.";
    console.log("Gemini Response:", responseText);

    // Parse response
    let question = "";
    let decision = null;
    let recommendedReply = "";
    const isFinal = questionCount >= maxQuestions;

    if (isFinal) {
      const match = responseText.match(
        /^(?:\[)?(APPROVED|DENIED)(?:\])?: (.+)$/i
      );
      if (match) {
        decision = { status: match[1], reason: match[2] };
      } else {
        decision = {
          status: "DENIED",
          reason:
            "I’m sorry, but your visa has been denied due to an unexpected processing error.",
        };
      }
    } else {
      const parts = responseText.split(" || ");
      if (parts.length === 2) {
        question = parts[0].trim();
        recommendedReply = parts[1].trim();
      } else {
        question = responseText;
        recommendedReply = "Please provide a clear and detailed response.";
      }
    }

    // Update state
    const updatedQuestionCount = questionCount + 1;
    const updatedPreviousQuestions = isFinal
      ? previousQuestions
      : [...previousQuestions, question];
    const updatedPreviousAnswers = currentAnswer
      ? [...previousAnswers, currentAnswer]
      : previousAnswers;

    // Generate Audio
    const createAudio = async (text) => {
      try {
        const tts = new MsEdgeTTS();
        await tts.setMetadata(
          settings.vo_voice,
          OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS
        );

        const { audioStream } = await tts.toStream(text);
        const chunks = [];
        for await (const chunk of audioStream) {
          chunks.push(chunk);
        }
        const audioBuffer = Buffer.concat(chunks);

        const audioBase64 = `data:audio/webm;base64,${audioBuffer.toString(
          "base64"
        )}`;
        return audioBase64;
      } catch (error) {
        console.error("Error generating audio:", error);
        return null;
      }
    };

    // Generate audio for question or decision
    const audioText = isFinal ? decision.reason : question;
    const audioPath = await createAudio(audioText);

    res.json({
      question: isFinal ? "" : question,
      decision: isFinal ? decision : null,
      recommendedReply: isFinal ? "" : recommendedReply,
      audioPath,
      questionCount: updatedQuestionCount,
      previousQuestions: updatedPreviousQuestions,
      previousAnswers: updatedPreviousAnswers,
      isFinal,
    });
  } catch (error) {
    console.error("Visa Interview Error:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
