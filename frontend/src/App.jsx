import { useMemo, useState } from "react";
import Upload from "./components/Upload";
import Dashboard from "./components/Dashboard";

function App() {
  const [activeTab, setActiveTab] = useState("upload");
  const [refreshKey, setRefreshKey] = useState(0);

  const tabTitle = useMemo(() => {
    if (activeTab === "upload") return "Upload Resume";
    return "Candidate Dashboard";
  }, [activeTab]);

  return (
    <div className="page">
      <div className="bg-shape bg-shape-a" />
      <div className="bg-shape bg-shape-b" />

      <main className="container">
        <header className="hero">
          <p className="hero-tag">AI RECRUITMENT SUITE</p>
          <h1>Smart Resume Screening and Shortlisting</h1>
          <p>
            Upload resumes, parse candidate details with Gemini AI, auto-score
            against role requirements, and maintain a shortlisting dashboard.
          </p>
        </header>

        <section className="panel">
          <div className="tab-header">
            <button
              className={`tab-btn ${activeTab === "upload" ? "active" : ""}`}
              onClick={() => setActiveTab("upload")}
              type="button"
            >
              Upload
            </button>
            <button
              className={`tab-btn ${
                activeTab === "dashboard" ? "active" : ""
              }`}
              onClick={() => setActiveTab("dashboard")}
              type="button"
            >
              Dashboard
            </button>
          </div>

          <h2 className="panel-title">{tabTitle}</h2>

          {activeTab === "upload" ? (
            <Upload
              onUploadSuccess={() => {
                setRefreshKey((prev) => prev + 1);
                setActiveTab("dashboard");
              }}
            />
          ) : (
            <Dashboard refreshKey={refreshKey} />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
