const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const axios = require("axios");

const Candidate = require("../models/Candidate");
const {
  parseResumeWithGemini,
  scoreCandidateWithGemini
} = require("../utils/gemini");

const router = express.Router();

const JOB_DESCRIPTION = "Python, Machine Learning, SQL, 2+ years experience";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const isPdfMime = file.mimetype === "application/pdf";
    const isPdfExt = file.originalname.toLowerCase().endsWith(".pdf");

    if (isPdfMime && isPdfExt) {
      cb(null, true);
      return;
    }

    cb(new Error("Invalid file type. Only PDF files are allowed."));
  }
});

function cleanResumeText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

router.get("/candidates", async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ score: -1, createdAt: -1 });
    res.json({ success: true, data: candidates });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch candidates",
      error: error.message
    });
  }
});

router.post("/", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please upload a PDF resume."
      });
    }

    const extracted = await pdfParse(req.file.buffer);
    const cleanedText = cleanResumeText(extracted.text || "");

    if (!cleanedText) {
      return res.status(400).json({
        success: false,
        message: "Could not extract text from the uploaded PDF."
      });
    }

    const parsedData = await parseResumeWithGemini(cleanedText);

    if (!parsedData?.email) {
      return res.status(422).json({
        success: false,
        message: "Parsed resume is missing an email."
      });
    }

    const scoreData = await scoreCandidateWithGemini(parsedData, JOB_DESCRIPTION);

    const normalizedScore = Math.max(
      0,
      Math.min(100, Number(scoreData?.score) || 0)
    );

    const status = normalizedScore > 70 ? "Shortlisted" : "Rejected";

    const candidatePayload = {
      name: parsedData.name || "Unknown",
      email: String(parsedData.email).toLowerCase().trim(),
      skills: Array.isArray(parsedData.skills)
        ? parsedData.skills.map((s) => String(s).trim()).filter(Boolean)
        : [],
      experience: Number(parsedData.experience) || 0,
      score: normalizedScore,
      status
    };

    let candidate;
    try {
      candidate = await Candidate.findOneAndUpdate(
        { email: candidatePayload.email },
        candidatePayload,
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true
        }
      );
    } catch (dbError) {
      if (dbError.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Candidate with this email already exists.",
          error: dbError.message
        });
      }

      throw dbError;
    }

    const webhookPayload = {
      name: candidate.name,
      email: candidate.email,
      skills: candidate.skills,
      experience: candidate.experience,
      score: candidate.score,
      status: candidate.status
    };

    const n8nWebhookUrl =
      process.env.N8N_WEBHOOK_URL ||
      "http://localhost:5678/webhook/resume-upload";

    let webhookSent = true;
    let webhookError = null;

    try {
      await axios.post(n8nWebhookUrl, webhookPayload, {
        headers: { "Content-Type": "application/json" },
        timeout: 15000
      });
    } catch (error) {
      webhookSent = false;
      webhookError = error.response?.data || error.message;
    }

    return res.json({
      success: true,
      message: "Resume processed successfully.",
      data: candidate,
      ai: {
        parsed: parsedData,
        scored: scoreData
      },
      webhook: {
        sent: webhookSent,
        error: webhookError
      }
    });
  } catch (error) {
    const isMulterError = error instanceof multer.MulterError;

    if (isMulterError) {
      return res.status(400).json({
        success: false,
        message: `Upload error: ${error.message}`
      });
    }

    if (error.message && error.message.includes("Invalid file type")) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message && error.message.includes("Gemini")) {
      return res.status(502).json({
        success: false,
        message: "Failed to process resume with Gemini API.",
        error: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to process resume.",
      error: error.message
    });
  }
});

module.exports = router;
