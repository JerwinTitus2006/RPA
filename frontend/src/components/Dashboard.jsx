import { useEffect, useMemo, useState } from "react";
import Loader from "./Loader";

function Dashboard({ refreshKey }) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    try {
      const raw = localStorage.getItem("n8nDashboardCandidates") || "[]";
      const parsed = JSON.parse(raw);
      setCandidates(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [candidates]);

  if (loading) {
    return <Loader text="Loading candidates..." />;
  }

  if (!sortedCandidates.length) {
    return <div className="empty-state">No candidates processed yet from n8n.</div>;
  }

  return (
    <div className="table-wrap fade-in">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Skills</th>
            <th>Score</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedCandidates.map((candidate) => {
            const shortlisted = candidate.status === "Shortlisted";
            return (
              <tr
                key={candidate._id || candidate.email}
                className={shortlisted ? "shortlisted-row" : ""}
              >
                <td>{candidate.name || "Unknown"}</td>
                <td>{candidate.email || "-"}</td>
                <td>{(candidate.skills || []).join(", ") || "-"}</td>
                <td>{candidate.score ?? 0}</td>
                <td>
                  <span
                    className={`status-pill ${
                      shortlisted ? "status-shortlisted" : "status-rejected"
                    }`}
                  >
                    {candidate.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;
