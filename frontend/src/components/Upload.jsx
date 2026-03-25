import { useMemo, useState } from "react";
import axios from "axios";
import Loader from "./Loader";

const N8N_WEBHOOK_URL =
  import.meta.env.VITE_N8N_WEBHOOK_URL ||
  "http://localhost:5678/webhook/resume-upload";

function Upload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedFileName = useMemo(() => {
    if (!file) return "No file selected";
    return file.name;
  }, [file]);

  function handleFileChange(event) {
    const selected = event.target.files?.[0];
    setError("");
    setSuccess("");
    setStatus("");
    setProgress(0);

    if (!selected) {
      setFile(null);
      return;
    }

    const isPdfType = selected.type === "application/pdf";
    const isPdfName = selected.name.toLowerCase().endsWith(".pdf");

    if (!isPdfType && !isPdfName) {
      setError("Only PDF files are allowed.");
      setFile(null);
      return;
    }

    setFile(selected);
  }

  async function handleUpload() {
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setStatus("Uploading...");

    try {
      const formData = new FormData();
      // n8n Webhook + Extract From File node expects multipart field name "file".
      formData.append("file", file);

      const response = await axios.post(N8N_WEBHOOK_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (!event.total) return;
          const percent = Math.round((event.loaded * 100) / event.total);
          setProgress(percent);
          if (percent >= 100) {
            setStatus("Processing...");
          }
        },
        timeout: 120000
      });

      setProgress(100);
      setStatus("Completed");

      const payload = response.data || {};
      const accepted = Array.isArray(response.data?.accepted)
        ? response.data.accepted.join(", ")
        : "";

      const candidateRecord = {
        name: payload.name || "Unknown",
        email: payload.email || "",
        skills: Array.isArray(payload.skills) ? payload.skills : [],
        experience: Number(payload.experience) || 0,
        score: Number(payload.score) || 0,
        status:
          payload.status ||
          (Array.isArray(payload.accepted) && payload.accepted.length
            ? "Shortlisted"
            : "Rejected"),
        processedAt: new Date().toISOString()
      };

      try {
        const raw = localStorage.getItem("n8nDashboardCandidates") || "[]";
        const existing = JSON.parse(raw);
        const next = [candidateRecord, ...(Array.isArray(existing) ? existing : [])].slice(0, 200);
        localStorage.setItem("n8nDashboardCandidates", JSON.stringify(next));
      } catch {
        // Ignore local storage errors and continue UX flow.
      }

      setSuccess(
        accepted
          ? `Workflow completed. Email accepted for: ${accepted}`
          : "Workflow completed successfully."
      );
      setFile(null);

      if (typeof onUploadSuccess === "function") {
        onUploadSuccess(candidateRecord);
      }
    } catch (uploadError) {
      setStatus("Error");
      setError(
        uploadError.response?.data?.message ||
          uploadError.response?.data?.error ||
          "Upload failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="upload-box fade-in">
      <label className="file-label" htmlFor="resume-input">
        Select Resume (PDF)
      </label>

      <input
        id="resume-input"
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleFileChange}
      />

      <p className="file-name">Selected: {selectedFileName}</p>

      <button
        className="primary-btn"
        type="button"
        onClick={handleUpload}
        disabled={loading}
      >
        {loading ? "Please wait..." : "Upload Resume"}
      </button>

      {loading && <Loader text={status || "Uploading..."} />}

      {!loading && status && <p className="status-text">Status: {status}</p>}

      {progress > 0 && (
        <div className="progress-wrap" aria-label="Upload progress">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}
    </div>
  );
}

export default Upload;
