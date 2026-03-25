const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Unknown"
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    skills: {
      type: [String],
      default: []
    },
    experience: {
      type: Number,
      default: 0
    },
    score: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["Shortlisted", "Rejected"],
      default: "Rejected"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Candidate", candidateSchema);
