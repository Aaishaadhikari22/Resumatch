import { useCallback, useEffect, useState } from "react";
import API from "../../api/axios";
import { useToast } from "../../hooks/useToast";
import Toast from "../../components/common/Toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatSalary } from "../../utils/formatSalary";
import "../admin.css"; 
import { Link, useNavigate } from "react-router-dom";

export default function SavedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [sortBy, setSortBy] = useState("match"); // match, date
  const { showToast, toast, closeToast } = useToast();
  const navigate = useNavigate();

  const fetchSavedJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/user/jobs/saved");
      setJobs(res.data || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load saved jobs", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const handleApply = async (jobId, employerId) => {
    setApplyingJobId(jobId);
    try {
      await API.post("/user/apply", { jobId, employerId });
      showToast("✓ Successfully applied! Good luck with your application.", "success");
      // Refresh list after applying
      fetchSavedJobs();
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to apply", "error");
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleUnsave = async (jobId) => {
    try {
      await API.post("/user/jobs/unsave", { jobId });
      // Remove from UI immediately for snappy feel
      setJobs(jobs.filter(job => job._id !== jobId));
      showToast("✓ Job removed from saved", "info");
    } catch {
      showToast("Failed to remove saved job", "error");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-page">
      <Toast message={toast?.message} type={toast?.type} onClose={closeToast} />

      <h2 style={{ fontSize: "32px", marginBottom: "8px", fontWeight: "700" }}>
        Saved Jobs 💼
      </h2>
      <p style={{ color: "#64748b", marginBottom: "30px", fontSize: "15px" }}>
        {jobs.length} jobs bookmarked. Apply when you're ready!
      </p>

      {/* Sort Bar */}
      {jobs.length > 0 && (
        <div style={{ display: "flex", gap: "15px", marginBottom: "30px", background: "white", padding: "15px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <label style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b", display: "block", marginBottom: "5px" }}>Sort By</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none" }}
            >
              <option value="match">Highest Match %</option>
              <option value="date">Saved / Listed Date</option>
            </select>
          </div>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="admin-card" style={{ padding: "50px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: '64px', marginBottom: '15px' }}>🔖</div>
          <p style={{ fontSize: "18px", color: "#64748b", marginBottom: "10px", fontWeight: "bold" }}>
             Start saving jobs to track opportunities
          </p>
          <button 
            onClick={() => navigate("/user/recommendations")}
            style={{ padding: "12px 24px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "15px", marginTop: "15px" }}
          >
            Explore Jobs
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
          {[...jobs].sort((a,b) => {
            if (sortBy === "match") return (b.similarityScore || 0) - (a.similarityScore || 0);
            if (sortBy === "date") return new Date(b.createdAt) - new Date(a.createdAt);
            return 0;
          }).map(job => (
            <div key={job._id} className="admin-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "25px", transition: "all 0.2s" }}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)"}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)"}
            >
              
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <h3 style={{ margin: "0", fontSize: "20px", color: "#1e293b", fontWeight: "700" }}>{job.title}</h3>
                  {job.similarityScore !== undefined && (
                     <span style={{ background: "#dcfce7", color: "#16a34a", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>
                        🧠 {job.similarityScore}% Match
                     </span>
                  )}
                </div>
                
                <p style={{ margin: "0 0 10px 0", color: "#475569", fontWeight: "500", fontSize: "15px" }}>
                  🏢 {job.employer?.companyName || "Unknown Company"}
                </p>
                
                {job.skillsRequired && job.skillsRequired.length > 0 && (
                  <div style={{ marginBottom: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "bold", marginRight: "5px" }}>Skills:</span>
                    {job.skillsRequired.map((skill, idx) => (
                      <span key={idx} style={{ background: "#f1f5f9", color: "#334155", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "500", border: "1px solid #e2e8f0" }}>{skill}</span>
                    ))}
                  </div>
                )}
                
                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "15px" }}>
                  {job.location && <span style={{ color: "#64748b", fontSize: "13px", display: "flex", alignItems: "center", gap: "5px" }}>📍 {job.location}</span>}
                  {job.salary && <span style={{ color: "#64748b", fontSize: "13px", display: "flex", alignItems: "center", gap: "5px" }}>💰 {formatSalary(job.salary)}</span>}
                  <span style={{ color: "#64748b", fontSize: "13px", display: "flex", alignItems: "center", gap: "5px" }}>📅 Saved on: {new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div style={{ width: "160px", display: "flex", flexDirection: "column", alignItems: "center", marginLeft: "20px", gap: "10px", minWidth: "160px" }}>
                
                <button 
                  onClick={() => handleApply(job._id, job.employer?._id)}
                  disabled={applyingJobId === job._id}
                  style={{ 
                    width: "100%", 
                    padding: "10px", 
                    background: applyingJobId === job._id ? "#cbd5e1" : "#10b981", 
                    color: "white", 
                    border: "none", 
                    borderRadius: "8px", 
                    fontWeight: "600", 
                    cursor: applyingJobId === job._id ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                    fontSize: "14px"
                  }}
                  onMouseOver={(e) => !applyingJobId && (e.target.style.background = "#059669")}
                  onMouseOut={(e) => !applyingJobId && (e.target.style.background = "#10b981")}
                >
                  🚀 {applyingJobId === job._id ? "Applying..." : "Apply Now"}
                </button>

                <button onClick={() => navigate("/user/recommendations")} style={{ width: "100%", padding: "10px", background: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s", fontSize: "14px" }} onMouseOver={(e) => e.target.style.background = "#f1f5f9"} onMouseOut={(e) => e.target.style.background = "#f8fafc"}>
                  👁️ View Job
                </button>

                <button 
                  onClick={() => handleUnsave(job._id)}
                  disabled={applyingJobId === job._id}
                  style={{ 
                    width: "100%", 
                    padding: "10px", 
                    background: "#fef2f2", 
                    color: "#ef4444", 
                    border: "1px solid #fecaca", 
                    borderRadius: "8px", 
                    fontWeight: "600", 
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontSize: "14px",
                    opacity: applyingJobId === job._id ? 0.5 : 1
                  }}
                  onMouseOver={(e) => !applyingJobId && (e.target.style.background = "#fee2e2")}
                  onMouseOut={(e) => !applyingJobId && (e.target.style.background = "#fef2f2")}
                >
                  ❌ Remove
                </button>

              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
