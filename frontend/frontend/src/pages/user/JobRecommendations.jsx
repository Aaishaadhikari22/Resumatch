import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { useToast, Toast } from "../../components/common/Toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import "../admin.css"; // Reuse card styles

export default function JobRecommendations() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [sortBy, setSortBy] = useState("match"); // match, recent, salary
  const [applyingJobId, setApplyingJobId] = useState(null);
  const { showToast, toast, closeToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await API.get("/user/jobs/recommended");
      setJobs(res.data?.jobs || []);
    } catch (err) {
      console.error(err);
      showToast("Failed to load recommendations", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId, employerId) => {
    setApplyingJobId(jobId);
    try {
      await API.post("/user/apply", { jobId, employerId });
      showToast("✓ Successfully applied for this job!", "success");
      fetchRecommendations(); // Refresh list
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to apply", "error");
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleSave = async (jobId) => {
    try {
      await API.post("/user/jobs/save", { jobId });
      showToast("✓ Job saved successfully!", "success");
      // Update UI immediately
      setJobs(jobs.map(j => j._id === jobId ? { ...j, isSaved: true } : j));
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to save job", "error");
    }
  };

  // Filter and Sort
  const filteredJobs = jobs
    .filter(job => 
      (job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       job.employer?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       job.description?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterLocation === "" || job.location?.toLowerCase().includes(filterLocation.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === "match") return b.similarityScore - a.similarityScore;
      if (sortBy === "recent") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "salary") {
        const salaryA = parseInt(a.salary) || 0;
        const salaryB = parseInt(b.salary) || 0;
        return salaryB - salaryA;
      }
      return 0;
    });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="admin-page">
      <Toast message={toast?.message} type={toast?.type} onClose={closeToast} />
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "30px" }}>
        <div>
          <h2 style={{ fontSize: "32px", margin: "0 0 8px 0", fontWeight: "800", color: "#1e293b" }}>
            Matches & Jobs 🎯
          </h2>
          <p style={{ color: "#64748b", margin: 0, fontSize: "16px" }}>
            Explore opportunities that match your skills and apply in one click.
          </p>
        </div>
        <div style={{ background: "#f1f5f9", padding: "10px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
           <span style={{ fontWeight: "700", color: "#3b82f6" }}>{jobs.length}</span> <span style={{ color: "#64748b", fontSize: "14px" }}>Jobs Available</span>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "30px", flexWrap: "wrap", background: "white", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
        <div style={{ flex: 2, minWidth: "250px", position: "relative" }}>
          <input
            type="text"
            placeholder="Search by title, company, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px 12px 40px",
              fontSize: "14px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              outline: "none",
              transition: "all 0.2s"
            }}
          />
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>🔍</span>
        </div>
        
        <div style={{ flex: 1, minWidth: "150px", position: "relative" }}>
          <input
            type="text"
            placeholder="Location..."
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px 12px 40px",
              fontSize: "14px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              outline: "none",
              transition: "all 0.2s"
            }}
          />
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>📍</span>
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: "12px 16px",
            fontSize: "14px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            background: "white",
            cursor: "pointer",
            outline: "none",
            minWidth: "160px"
          }}
        >
          <option value="recent">Sort by: Newest</option>
          <option value="match">Sort by: Best Match</option>
          <option value="salary">Sort by: Salary</option>
        </select>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="admin-card" style={{ padding: "80px 20px", textAlign: "center", borderRadius: "20px" }}>
          <div style={{ fontSize: '72px', marginBottom: '20px' }}>🔍</div>
          <h3 style={{ fontSize: "22px", color: "#1e293b", marginBottom: "10px", fontWeight: "700" }}>
            No jobs found
          </h3>
          <p style={{ color: "#64748b", fontSize: "16px", maxWidth: "400px", margin: "0 auto 30px auto" }}>
            We couldn't find any jobs matching your current filters. Try broadening your search.
          </p>
          <button 
            onClick={() => { setSearchTerm(""); setFilterLocation(""); }}
            style={{ padding: "12px 24px", background: "#3b82f6", color: "white", border: "none", borderRadius: "10px", fontWeight: "600", cursor: "pointer" }}
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "25px" }}>
          {filteredJobs.map(job => (
            <div key={job._id} className="admin-card" 
              style={{ 
                display: "flex", 
                flexDirection: "row",
                padding: "24px", 
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                overflow: "hidden"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)";
                e.currentTarget.style.borderColor = "#3b82f655";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              <div style={{ flex: 1, paddingRight: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "22px", color: "#1e293b", fontWeight: "800" }}>{job.title}</h3>
                  {job.isApplied && (
                    <span style={{ background: "#dcfce7", color: "#15803d", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", border: "1px solid #bef264" }}>
                       Applied
                    </span>
                  )}
                  {job.isSaved && !job.isApplied && (
                    <span style={{ background: "#fef3c7", color: "#d97706", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", border: "1px solid #fcd34d" }}>
                       Saved
                    </span>
                  )}
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "16px" }}>
                  <span style={{ color: "#3b82f6", fontWeight: "700", fontSize: "16px" }}>{job.employer?.companyName}</span>
                  <span style={{ color: "#94a3b8" }}>•</span>
                  <span style={{ color: "#64748b", fontSize: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
                    📍 {job.location || job.city || "Remote"}
                  </span>
                  {job.salary && (
                    <>
                      <span style={{ color: "#94a3b8" }}>•</span>
                      <span style={{ color: "#059669", fontSize: "14px", fontWeight: "600" }}>
                        💰 {typeof job.salary === 'object' ? `${job.salary.min}-${job.salary.max} ${job.salary.currency}` : job.salary}
                      </span>
                    </>
                  )}
                </div>

                {job.skillsRequired && job.skillsRequired.length > 0 && (
                  <div style={{ marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {job.skillsRequired.slice(0, 5).map((skill, idx) => (
                      <span key={idx} style={{ background: "#f8fafc", color: "#475569", padding: "4px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", border: "1px solid #e2e8f0" }}>
                        {skill}
                      </span>
                    ))}
                    {job.skillsRequired.length > 5 && (
                      <span style={{ color: "#94a3b8", fontSize: "12px", alignSelf: "center" }}>+{job.skillsRequired.length - 5} more</span>
                    )}
                  </div>
                )}
                
                <p style={{ color: "#64748b", fontSize: "15px", lineHeight: "1.6", marginBottom: "20px", display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {job.description}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                   <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "500" }}>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                   <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "500" }}>•</span>
                   <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "500" }}>{job.employmentType || "Full-time"}</span>
                   {job.similarityScore > 0 && (
                     <>
                        <span style={{ color: "#94a3b8", fontSize: "12px", fontWeight: "500" }}>•</span>
                        <span style={{ 
                          color: job.similarityScore >= 70 ? "#10b981" : job.similarityScore >= 40 ? "#f59e0b" : "#ef4444", 
                          fontSize: "12px", 
                          fontWeight: "700" 
                        }}>
                          {job.similarityScore}% Match
                        </span>
                     </>
                   )}
                </div>
              </div>

              <div style={{ width: "200px", display: "flex", flexDirection: "column", gap: "12px", paddingLeft: "24px", borderLeft: "1px solid #f1f5f9", justifyContent: "center" }}>
                <button 
                  onClick={() => handleApply(job._id, job.employer?._id)}
                  disabled={job.isApplied || applyingJobId === job._id}
                  style={{ 
                    width: "100%", 
                    padding: "14px", 
                    background: job.isApplied ? "#f1f5f9" : applyingJobId === job._id ? "#cbd5e1" : "#3b82f6", 
                    color: job.isApplied ? "#94a3b8" : "white", 
                    border: "none", 
                    borderRadius: "12px", 
                    fontWeight: "700", 
                    cursor: (job.isApplied || applyingJobId === job._id) ? "not-allowed" : "pointer", 
                    transition: "all 0.2s",
                    fontSize: "15px",
                    boxShadow: job.isApplied ? "none" : "0 4px 6px -1px rgba(59, 130, 246, 0.3)"
                  }}
                >
                  {job.isApplied ? "Applied" : applyingJobId === job._id ? "Applying..." : "Apply Now"}
                </button>

                <button 
                  onClick={() => handleSave(job._id)}
                  style={{ 
                    width: "100%", 
                    padding: "12px", 
                    background: "transparent", 
                    color: job.isSaved ? "#f59e0b" : "#64748b", 
                    border: `1px solid ${job.isSaved ? "#f59e0b" : "#e2e8f0"}`, 
                    borderRadius: "12px", 
                    fontWeight: "600", 
                    cursor: "pointer", 
                    transition: "all 0.2s",
                    fontSize: "14px"
                  }}
                >
                  {job.isSaved ? "Saved" : "Save Job"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
