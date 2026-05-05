import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../../api/axios";
import ResumeViewerModal from "../../components/ResumeViewerModal";
import JobRequirements from "../../components/JobRequirements";
import "./employerDashboard.css";

export default function EmployerApplicants() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [applicantData, setApplicantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [selectedResume, setSelectedResume] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Sort and Filter State
  const [sortBy, setSortBy] = useState("match"); // "match" or "experience"
  const [filterSkill, setFilterSkill] = useState("");


  // Fetch employer's jobs on mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem("employerToken");
        if (!token) return navigate("/employer/login");

        const res = await API.get("/employer/jobs");
        const jobsArray = Array.isArray(res.data) ? res.data : res.data.jobs || [];
        setJobs(jobsArray);

        // Auto-select job from URL param
        const jobParam = searchParams.get("job");
        if (jobParam) {
          setSelectedJobId(jobParam);
        } else if (jobsArray.length > 0) {
          setSelectedJobId(jobsArray[0]._id);
        }
      } catch (err) {
        console.log(err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate("/employer/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [navigate, searchParams]);

  // Fetch applicants when selected job changes
  useEffect(() => {
    if (!selectedJobId) return;

    const fetchApplicants = async () => {
      setLoadingApplicants(true);
      try {
        const res = await API.get(`/employer/jobs/${selectedJobId}/applicants`);
        setApplicantData(res.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoadingApplicants(false);
      }
    };
    fetchApplicants();
  }, [selectedJobId]);

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await API.patch(`/employer/applications/${applicationId}/status`, { status: newStatus });
      // Refresh applicants
      const res = await API.get(`/employer/jobs/${selectedJobId}/applicants`);
      setApplicantData(res.data);
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.msg || "Failed to update status");
    }
  };

  const handleToggleShortlist = async (applicationId, isCurrentlyShortlisted) => {
    try {
      await API.patch(`/employer/applications/${applicationId}/shortlist`);
      // Refresh applicants
      const res = await API.get(`/employer/jobs/${selectedJobId}/applicants`);
      setApplicantData(res.data);
      alert(isCurrentlyShortlisted ? "Removed from shortlist" : "Added to shortlist");
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.msg || "Failed to update shortlist");
    }
  };

  const handleViewResume = (applicant) => {
    setSelectedResume(applicant.resume);
    setSelectedUser(applicant.user);
  };

  const closeResumeViewer = () => {
    setSelectedResume(null);
    setSelectedUser(null);
  };

  const getScoreClass = (score) => {
    if (score >= 70) return "high";
    if (score >= 40) return "medium";
    return "low";
  };

  const getDisplayedApplicants = () => {
    let list = applicantData?.applicants || [];
    if (filterSkill) {
      list = list.filter(app => 
        app.resumeSkills?.some(s => s.toLowerCase().includes(filterSkill.toLowerCase()))
      );
    }
    // Sorting happens in-place or on a copy
    let sorted = [...list];
    if (sortBy === "match") {
      sorted.sort((a,b) => b.similarityScore - a.similarityScore);
    } else if (sortBy === "experience") {
      sorted.sort((a,b) => (b.experience || 0) - (a.experience || 0));
    }
    return sorted;
  };

  if (loading) {
    return <div className="emp-loading"><h3>Loading...</h3></div>;
  }

  const displayedApplicants = getDisplayedApplicants();

  return (
    <div className="emp-applicants-container">
      <div className="emp-page-header">
        <h1>👥 Applicants</h1>
        <p>Review applicants for your jobs — sorted by AI similarity score</p>
      </div>

      {jobs.length === 0 ? (
        <div className="emp-empty-state">
          <div className="emp-empty-icon" style={{ fontSize: '64px' }}>🖼️</div>
          <h3>No jobs posted yet</h3>
          <p>Post a job first to start receiving applicants</p>
          <button 
            className="emp-view-resume-btn" 
            style={{ marginTop: '15px', display: 'inline-block' }}
            onClick={() => navigate("/employer/post-job")}
          >
            ➕ Post Job
          </button>
        </div>
      ) : (
        <>
          {/* Job Selector */}
          <div className="emp-job-selector">
            <div className="emp-job-list">
              {jobs.map((job) => {
                const status = (job.jobStatus || job.status || "active").toLowerCase();
                return (
                  <button
                    key={job._id}
                    type="button"
                    className={`emp-job-card ${selectedJobId === job._id ? 'active' : ''}`}
                    onClick={() => setSelectedJobId(job._id)}
                  >
                    <div className="emp-job-info">
                      <h3>{job.title}</h3>
                      <p>{job.applicantCount || 0} applicants • Status: {status.toUpperCase()}</p>
                      <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                        Click to load applicants for this job.
                      </p>
                    </div>
                    <div className="emp-job-meta">
                      <span className={`emp-status-badge ${status}`}>{status}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Job Detail Header */}
          {applicantData?.job && (
            <div className="emp-job-detail-header">
              <h2>{applicantData.job.title}</h2>
              {applicantData.job.skillsRequired && applicantData.job.skillsRequired.length > 0 && (
                <div className="emp-job-skills">
                  <span style={{ fontSize: "13px", color: "#64748b", marginRight: "8px", fontWeight: 500 }}>Required:</span>
                  {applicantData.job.skillsRequired.map((skill, i) => (
                    <span key={i} className="emp-job-skill-badge">{skill}</span>
                  ))}
                </div>
              )}
              {applicantData.job && (
                <JobRequirements job={applicantData.job} />
              )}
            </div>
          )}

          {/* Filter & Sort Bar */}
          {applicantData?.job && (
            <div style={{ display: "flex", gap: "15px", marginBottom: "20px", background: "white", padding: "15px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b", display: "block", marginBottom: "5px" }}>Filter by Skills</label>
                <input 
                  type="text" 
                  placeholder="e.g. React" 
                  value={filterSkill} 
                  onChange={(e) => setFilterSkill(e.target.value)} 
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b", display: "block", marginBottom: "5px" }}>Sort By</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "white" }}
                >
                  <option value="match">Match Score (%)</option>
                  <option value="experience">Experience (Years)</option>
                </select>
              </div>
            </div>
          )}

          {/* Applicants List */}
          {loadingApplicants ? (
            <div className="emp-loading"><h3>Loading applicants...</h3></div>
          ) : displayedApplicants.length === 0 ? (
            <div className="emp-empty-state">
              <div className="emp-empty-icon" style={{ fontSize: '64px' }}>📭</div>
              <h3>No applicants found</h3>
              <p>Either there are zero applications or your filter returned no results.</p>
            </div>
          ) : (
            <div className="emp-applicants-list">
              {displayedApplicants.map((applicant) => (
                <div key={applicant._id} className="emp-applicant-card">
                  <div className="emp-applicant-details">
                    <h4>{applicant.user?.name || "Unknown"}</h4>
                    <p className="emp-applicant-email">{applicant.user?.email}</p>
                    <p className="emp-applicant-resume-title">
                      📄 {applicant.resumeTitle} • {applicant.experience} yrs exp
                    </p>
                    <div className="emp-applicant-skills">
                      {applicant.resumeSkills?.map((skill, i) => {
                        const isMatched = applicant.matchedSkills?.some(
                          ms => ms.toLowerCase() === skill.toLowerCase()
                        );
                        return (
                          <span key={i} className={`emp-applicant-skill ${isMatched ? 'matched' : 'unmatched'}`}>
                            {isMatched ? '✓ ' : ''}{skill}
                          </span>
                        );
                      })}
                      {applicant.unmatchedSkills && applicant.unmatchedSkills.length > 0 && (
                        <div style={{ marginTop: "10px", padding: "8px 12px", background: "#fef2f2", borderRadius: "8px", border: "1px dashed #fca5a5" }}>
                          <span style={{ fontSize: "12px", color: "#dc2626", fontWeight: 700, display: "block", marginBottom: "6px" }}>⚠️ Missing Required Skills:</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {applicant.unmatchedSkills.map((skill, i) => (
                               <span key={`missing-${i}`} style={{ fontSize: "12px", background: "white", padding: "4px 8px", borderRadius: "4px", color: "#ef4444", border: "1px solid #fecaca", fontWeight: 600 }}>
                                 ❌ {skill}
                               </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {applicant.isShortlisted && (
                      <div className="emp-shortlisted-badge" style={{ marginTop: "10px" }}>⭐ Shortlisted</div>
                    )}
                    {applicant.status !== 'applied' && applicant.status !== 'reviewed' && (
                      <div style={{ marginTop: "10px", fontSize: "13px", fontWeight: "bold", color: applicant.status === "accepted" ? "#059669" : "#dc2626" }}>
                        Status: {applicant.status.toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="emp-applicant-right">
                    {/* Similarity Score Visualization */}
                    <div className={`emp-score ${getScoreClass(applicant.similarityScore)}`} style={{ padding: "10px", background: "#f8fafc", borderRadius: "10px", marginBottom: "15px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "#64748b" }}>AI Match Score</span>
                        <span style={{ 
                          color: applicant.similarityScore >= 70 ? "#10b981" : applicant.similarityScore >= 40 ? "#f59e0b" : "#ef4444",
                          fontWeight: "800", 
                          fontSize: "16px" 
                        }}>
                          {applicant.similarityScore}%
                        </span>
                      </div>
                      <div style={{ width: "100%", background: "#cbd5e1", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ 
                          width: `${Math.min(100, Math.max(0, applicant.similarityScore))}%`, 
                          height: "100%", 
                          background: applicant.similarityScore >= 70 ? "#10b981" : applicant.similarityScore >= 40 ? "#f59e0b" : "#ef4444", 
                          transition: "width 1s ease-in-out",
                          borderRadius: "4px"
                        }}></div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="emp-applicant-actions">
                      <button
                        className="emp-view-resume-btn"
                        onClick={() => handleViewResume(applicant)}
                        title="View full resume"
                      >
                        👁️ View Resume
                      </button>
                      <button
                        className={`emp-shortlist-btn ${applicant.isShortlisted ? 'active' : ''}`}
                        onClick={() => handleToggleShortlist(applicant._id, applicant.isShortlisted)}
                        title={applicant.isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
                      >
                        {applicant.isShortlisted ? '⭐ Shortlisted' : '⭐ Shortlist'}
                      </button>
                      <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                        {(applicant.status !== "accepted" && applicant.status !== "rejected") ? (
                          <>
                            <button
                              style={{ flex: 1, padding: "6px", background: "#ecfdf5", color: "#059669", border: "1px solid #10b981", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
                              onClick={() => handleStatusChange(applicant._id, "accepted")}
                            >
                              ✅ Accept
                            </button>
                            <button
                              style={{ flex: 1, padding: "6px", background: "#fef2f2", color: "#dc2626", border: "1px solid #ef4444", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
                              onClick={() => handleStatusChange(applicant._id, "rejected")}
                            >
                              ❌ Reject
                            </button>
                          </>
                        ) : (
                          <div style={{ padding: "6px 12px", borderRadius: "6px", fontWeight: "bold", fontSize: "13px",
                            background: applicant.status === "accepted" ? "#ecfdf5" : "#fef2f2",
                            color: applicant.status === "accepted" ? "#059669" : "#dc2626",
                            border: `1px solid ${applicant.status === "accepted" ? "#10b981" : "#ef4444"}`,
                            width: "100%", textAlign: "center"
                          }}>
                            {applicant.status === "accepted" ? "✅ Accepted" : "❌ Rejected"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Resume Viewer Modal */}
      {selectedResume && selectedUser && (
        <ResumeViewerModal
          resume={selectedResume}
          user={selectedUser}
          onClose={closeResumeViewer}
        />
      )}
    </div>
  );
}
