const { ofetch } = require("ofetch");
const { MsEdgeTTS, OUTPUT_FORMAT } = require("msedge-tts");
const User = require('../models/user');

const INTERVIEW_CONFIG = {
  MAX_QUESTIONS: 5,
  VOICE_SETTINGS: {
    question: { rate: "+5%", pitch: "+0Hz" },
    approved: { rate: "+10%", pitch: "+20Hz" },
    denied: { rate: "-10%", pitch: "-30Hz" }
  },
  ERROR_FALLBACKS: {
    question: "Could you clarify your previous answer?",
    recommendation: "I need to consult my documents for accurate details.",
    denialReason: "Insufficient evidence to approve application"
  }
};

async function createVocalResponse(text, responseType = 'question') {
  try {
    const tts = new MsEdgeTTS();
    // const voice = req?.user_info?.settings?.vo_voice || "en-US-AriaNeural";
    const voice = "en-US-AriaNeural";
    const { rate, pitch } = INTERVIEW_CONFIG.VOICE_SETTINGS[responseType] || {};
    
    await tts.setMetadata(
      voice,
      OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS,
      { rate, pitch }
    );

    const { audioStream } = await tts.toStream(text);
    const chunks = [];
    for await (const chunk of audioStream) chunks.push(chunk);
    return `data:audio/webm;base64,${Buffer.concat(chunks).toString("base64")}`;
  } catch (error) {
    console.error("Audio generation failed:", error);
    return null;
  }
}

function buildInterviewPrompt(phase, candidateData, history) {
  const basePrompt = `Role: Professional visa officer conducting technical interview
Candidate Data: ${JSON.stringify(candidateData)}
Conversation History:\n${history.join("\n")}`;

  return phase === 'question' 
    ? `${basePrompt}\nGenerate next question and ideal answer format: "QUESTION||RECOMMENDED_ANSWER"`
    : `${basePrompt}\nAfter ${INTERVIEW_CONFIG.MAX_QUESTIONS} questions, provide final decision using format: "[STATUS]: Official Statement||Detailed Reason"`;
}

exports.conductVisaInterviewForAuthUsers = async (req, res) => {
  try {
    const { currentAnswer, questionCount = 0, history = [] } = req.body;
    const user = req.user_info;
    
    // Initialize candidate data
    const candidateData = {
      name: user.name,
      nationality: user.nationality,
      travelHistory: user.travelled_before,
      visaDenials: user.visa_refused_before,
      targetCountry: user.target_country,
      visaType: user.visa_type
    };

    // Update conversation history
    const updatedHistory = currentAnswer 
      ? [...history, `Officer: ${history.slice(-1)[0]?.question}`, `Applicant: ${currentAnswer}`]
      : history;

    // Determine interview phase
    const isFinalPhase = questionCount >= INTERVIEW_CONFIG.MAX_QUESTIONS;
    const phase = isFinalPhase ? 'decision' : 'question';

    // Build phase-specific prompt
    const prompt = buildInterviewPrompt(phase, candidateData, updatedHistory);
    
    // Get AI response
    const geminiResponse = await ofetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GOOGLE_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 150,
            temperature: 0.65,
            topP: 0.9
          }
        })
      }
    );

    // Process AI response
    const responseText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    let result = {};

    if (phase === 'question') {
      const [question, recommendation] = responseText.split("||").map(s => s.trim());
      result = {
        question: question || INTERVIEW_CONFIG.ERROR_FALLBACKS.question,
        recommendation: recommendation || INTERVIEW_CONFIG.ERROR_FALLBACKS.recommendation,
        audio: await createVocalResponse(question || INTERVIEW_CONFIG.ERROR_FALLBACKS.question)
      };
    } else {
      const [decisionLine, reason] = responseText.split("||").map(s => s.trim());
      const statusMatch = decisionLine?.match(/\[(APPROVED|DENIED)\]:\s*(.+)/i) || [];
      
      result.decision = {
        status: statusMatch[1]?.toUpperCase() || 'DENIED',
        officialStatement: statusMatch[2] || INTERVIEW_CONFIG.ERROR_FALLBACKS.denialReason,
        detailedReason: reason || INTERVIEW_CONFIG.ERROR_FALLBACKS.denialReason
      };
      result.audio = await createVocalResponse(
        `${result.decision.officialStatement} ${result.decision.detailedReason}`,
        result.decision.status.toLowerCase()
      );
    }

    res.json({
      ...result,
      questionCount: isFinalPhase ? INTERVIEW_CONFIG.MAX_QUESTIONS : questionCount + 1,
      history: updatedHistory,
      isFinal: isFinalPhase
    });

  } catch (error) {
    console.error("Interview Error:", error);
    res.status(500).json({
      error: "interview_failure",
      recovery: "Continue with your last response",
      fallbackQuestion: INTERVIEW_CONFIG.ERROR_FALLBACKS.question,
      audio: await createVocalResponse(INTERVIEW_CONFIG.ERROR_FALLBACKS.question)
    });
  }
};