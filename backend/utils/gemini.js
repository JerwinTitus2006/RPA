const axios = require("axios");

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

function extractJsonFromText(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Gemini response text is empty.");
  }

  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const startIndex = cleaned.indexOf("{");
    const endIndex = cleaned.lastIndexOf("}");

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const jsonSlice = cleaned.slice(startIndex, endIndex + 1);
      return JSON.parse(jsonSlice);
    }

    throw new Error("Failed to parse JSON from Gemini response.");
  }
}

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
  }

  try {
    const response = await axios.post(
      `${GEMINI_ENDPOINT}?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          topK: 20
        }
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 60000
      }
    );

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return extractJsonFromText(text);
  } catch (error) {
    const details =
      error.response?.data?.error?.message || error.message || "Unknown Gemini error";
    throw new Error(`Gemini API request failed: ${details}`);
  }
}

async function parseResumeWithGemini(resumeText) {
  const prompt = `You are an expert resume parser.\n\nExtract the following details from the resume text:\n- Name\n- Email\n- Skills (array)\n- Years of Experience (number)\n- Education\n- Projects\n\nReturn ONLY JSON with this exact structure:\n{\n  \"name\": \"\",\n  \"email\": \"\",\n  \"skills\": [],\n  \"experience\": 0,\n  \"education\": \"\",\n  \"projects\": []\n}\n\nResume Text:\n${resumeText}`;

  return callGemini(prompt);
}

async function scoreCandidateWithGemini(candidateProfile, jobDescription) {
  const prompt = `You are an AI hiring assistant.\n\nJob Description:\n${jobDescription}\n\nCandidate Profile JSON:\n${JSON.stringify(candidateProfile, null, 2)}\n\nCompare candidate profile with job description.\n\nReturn ONLY JSON with this exact structure:\n{\n  \"score\": 0,\n  \"decision\": \"Shortlist\",\n  \"missing_skills\": [],\n  \"strengths\": []\n}`;

  return callGemini(prompt);
}

module.exports = {
  parseResumeWithGemini,
  scoreCandidateWithGemini
};
