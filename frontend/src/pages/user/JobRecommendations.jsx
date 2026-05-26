import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { useToast } from "../../hooks/useToast";
import Toast from "../../components/common/Toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatSalary } from "../../utils/formatSalary";
import "../admin.css"; // Reuse card styles

export default function JobRecommendations() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [sortBy, setSortBy] = useState("match"); // match, recent, salary
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { showToast, toast, closeToast } = useToast();

  const ITEMS_PER_PAGE = 10;

  const bestMatchScore = jobs.length > 0 ? Math.max(...jobs.map(job => job.similarityScore || 0)) : 0;
  const averageMatchScore = jobs.length > 0 ? Math.round(jobs.reduce((sum, job) => sum + (job.similarityScore || 0), 0) / jobs.length) : 0;

  // Fetch recommendations function (defined outside useEffect so it can be called elsewhere)
  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await API.get("/user/jobs/recommended");
      console.log('Recommendations API response:', res.data);
      setJobs(res.data?.jobs || []);
    } catch (err) {
      console.error(err);
      try { showToast("Failed to load recommendations", "error"); } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

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

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
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

  // Pagination Logic
  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedJobs = filteredJobs.slice(startIdx, endIdx);

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
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "12px" }}>
            <div style={{ background: "#eff6ff", color: "#2563eb", padding: "10px 16px", borderRadius: "14px", border: "1px solid #bfdbfe", fontSize: "14px" }}>
              Best Match: <strong>{bestMatchScore}%</strong>
            </div>
            <div style={{ background: "#f0fdf4", color: "#15803d", padding: "10px 16px", borderRadius: "14px", border: "1px solid #bbf7d0", fontSize: "14px" }}>
              Average Match: <strong>{averageMatchScore}%</strong>
            </div>
          </div>
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
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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
            onChange={(e) => { setFilterLocation(e.target.value); setCurrentPage(1); }}
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
          onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
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
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "25px" }}>
            {paginatedJobs.map(job => (
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
                  <h3 style={{ margin: 0, fontSize: "22px", color: "#1e293b", fontWeight: "800", cursor: 'pointer' }} onClick={async () => {
                    setJobLoading(true);
                    try {
                      const res = await API.get(`/user/jobs/${job._id}`);
                      setSelectedJob(res.data.job || null);
                    } catch (err) {
                      console.error(err);
                    } finally { setJobLoading(false); }
                  }}>{job.title}</h3>
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
                  {job.deadline && isDeadlinePassed(job.deadline) && (
                    <span style={{ background: "#fee2e2", color: "#dc2626", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", border: "1px solid #fecaca" }}>
                       ⏰ Deadline Passed
                    </span>
                  )}
                  {job.deadline && !isDeadlinePassed(job.deadline) && (
                    <span style={{ background: "#fef3c7", color: "#d97706", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", border: "1px solid #fde68a" }}>
                       ⌛ Closing Soon
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
                        💰 {formatSalary(job.salary)}
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
                </div>
                
                {(job.similarityScore !== undefined && job.similarityScore !== null) && (
                  <div style={{ marginTop: "16px", background: "#f8fafc", padding: "12px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Applicant Match Score</span>
                      <span style={{ 
                        color: job.similarityScore >= 70 ? "#10b981" : job.similarityScore >= 40 ? "#f59e0b" : "#ef4444", 
                        fontSize: "14px", 
                        fontWeight: "800" 
                      }}>{job.similarityScore}%</span>
                    </div>
                    <div style={{ width: "100%", background: "#e2e8f0", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ 
                        width: `${Math.min(100, Math.max(0, job.similarityScore))}%`, 
                        height: "100%", 
                        background: job.similarityScore >= 70 ? "#10b981" : job.similarityScore >= 40 ? "#f59e0b" : "#ef4444", 
                        transition: "width 1s ease-in-out",
                        borderRadius: "4px"
                      }}></div>
                    </div>
                    {/* Matched / Missing Skills */}
                    <div style={{ marginTop: "12px", display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      { (job.matchDetails?.matchedSkills || job.bestMatch?.matchedSkills || []).length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {(job.matchDetails?.matchedSkills || job.bestMatch?.matchedSkills || []).slice(0,5).map((s, i) => (
                            <span key={`m-${i}`} style={{ background: '#ecfccb', color: '#166534', padding: '6px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}>
                              ✓ {s}
                            </span>
                          ))}
                        </div>
                      )}

                      { (job.matchDetails?.unmatchedSkills || job.bestMatch?.unmatchedSkills || []).length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {(job.matchDetails?.unmatchedSkills || job.bestMatch?.unmatchedSkills || []).slice(0,5).map((s, i) => (
                            <span key={`u-${i}`} style={{ background: '#fff7f6', color: '#9f1239', padding: '6px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 700 }}>
                              ✕ {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                <button onClick={async () => { setJobLoading(true); try { const res = await API.get(`/user/jobs/${job._id}`); setSelectedJob(res.data.job || null); } catch(e){console.error(e);} finally { setJobLoading(false);} }} style={{ width: '100%', padding: '10px', background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>👁️ View Job</button>
              </div>
            </div>
          ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <button
                className="pagination-btn secondary"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                ← Previous
              </button>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`pagination-btn ${currentPage === page ? "primary" : "secondary"}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                className="pagination-btn secondary"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>

              <span className="pagination-summary">
                Page {currentPage} of {totalPages} • Showing {Math.min(startIdx + 1, filteredJobs.length)}-{Math.min(endIdx, filteredJobs.length)} of {filteredJobs.length}
              </span>
            </div>
          )}
        </>
      )}

      {/* Job Details Modal for seekers */}
      {selectedJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#fff', width: '95%', maxWidth: 800, borderRadius: 16, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{selectedJob.title}</h2>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>{selectedJob.employer?.companyName || 'Unknown Company'}</div>
              </div>
              <button onClick={() => setSelectedJob(null)} style={{ background: 'transparent', border: 'none', fontSize: '32px', cursor: 'pointer', color: '#6b7280', padding: '0', lineHeight: 1, minWidth: '40px', textAlign: 'center' }} title="Close">×</button>
            </div>
            
            {/* Content */}
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ color: '#1f2937' }}>Location:</strong> <span style={{ color: '#4b5563' }}>{selectedJob.location || selectedJob.city || 'Remote'}</span> • <strong style={{ color: '#1f2937' }}>Type:</strong> <span style={{ color: '#4b5563' }}>{selectedJob.employmentType || 'Full-time'}</span>
              </div>

              {/* Deadline Warning */}
              {selectedJob.deadline && isDeadlinePassed(selectedJob.deadline) && (
                <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>⏰</span>
                  <div>
                    <strong style={{ color: '#b91c1c', display: 'block', marginBottom: '4px' }}>Application Deadline Passed</strong>
                    <span style={{ color: '#dc2626', fontSize: '13px' }}>The application deadline for this job was {new Date(selectedJob.deadline).toLocaleDateString()}. You can no longer apply.</span>
                  </div>
                </div>
              )}

              {/* Upcoming Deadline Warning */}
              {selectedJob.deadline && !isDeadlinePassed(selectedJob.deadline) && (
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>⌛</span>
                  <div>
                    <strong style={{ color: '#92400e', display: 'block', marginBottom: '4px' }}>Hurry! Application Deadline Soon</strong>
                    <span style={{ color: '#d97706', fontSize: '13px' }}>Apply by {new Date(selectedJob.deadline).toLocaleDateString()} to not miss this opportunity.</span>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#4b5563', lineHeight: 1.6, margin: 0 }}>{selectedJob.description}</p>
              </div>
              {selectedJob.skillsRequired && selectedJob.skillsRequired.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ marginBottom: '12px', color: '#1f2937', fontSize: '14px', fontWeight: '600' }}>Skills Required</h4>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedJob.skillsRequired.map((s,i) => <span key={i} style={{ background: '#eff6ff', color: '#0369a1', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '500' }}>{s}</span>)}
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer with buttons */}
            <div style={{ display: 'flex', gap: 12, padding: '20px 24px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
              <button 
                onClick={() => { setSelectedJob(null); handleApply(selectedJob._id, selectedJob.employer?._id); }} 
                disabled={selectedJob.deadline && isDeadlinePassed(selectedJob.deadline)}
                style={{ 
                  flex: 1, 
                  padding: '12px 24px', 
                  background: selectedJob.deadline && isDeadlinePassed(selectedJob.deadline) ? '#d1d5db' : '#3b82f6', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontWeight: '600', 
                  cursor: selectedJob.deadline && isDeadlinePassed(selectedJob.deadline) ? 'not-allowed' : 'pointer', 
                  fontSize: '14px', 
                  transition: 'background 0.3s',
                  opacity: selectedJob.deadline && isDeadlinePassed(selectedJob.deadline) ? 0.6 : 1
                }} 
                onMouseEnter={(e) => {
                  if (!(selectedJob.deadline && isDeadlinePassed(selectedJob.deadline))) {
                    e.target.style.background = '#2563eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(selectedJob.deadline && isDeadlinePassed(selectedJob.deadline))) {
                    e.target.style.background = '#3b82f6';
                  }
                }}
              >
                {selectedJob.deadline && isDeadlinePassed(selectedJob.deadline) ? '✗ Deadline Passed' : '✓ Apply Now'}
              </button>
              <button onClick={async () => { try { await API.post('/user/jobs/save', { jobId: selectedJob._id }); setSelectedJob(null); showToast('Job saved', 'success'); } catch(e){ showToast('Failed to save', 'error'); } }} style={{ flex: 1, padding: '12px 24px', background: '#f8fafc', color: '#374151', border: '1.5px solid #d1d5db', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.target.style.background = '#f3f4f6'; e.target.style.borderColor = '#9ca3af'; }} onMouseLeave={(e) => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#d1d5db'; }}>💾 Save Job</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
