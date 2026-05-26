import { useEffect, useState, useCallback } from "react";
import API from "../api/axios";
import { useSocket } from "../hooks/useSocket.jsx";
import { formatSalary } from "../utils/formatSalary";
import "./admin.css";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Alert from "../components/common/Alert";
import ConfirmationModal from "../components/common/ConfirmationModal";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const socket = useSocket();
  
  const ITEMS_PER_PAGE = 10;
  
  // VIVA REQUIRED: SORT AND SEARCH STATES
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState(null);
  
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, title: "", text: "", type: "danger" });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/jobs");
      setJobs(res.data || []);
    } catch (error) {
      console.error(error);
      setMessage({ text: "Failed to load jobs", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Listen for real-time updates from socket
  useEffect(() => {
    if (!socket) return;
    socket.on("dashboard:refresh", fetchJobs);
    return () => {
      socket.off("dashboard:refresh", fetchJobs);
    };
  }, [socket, fetchJobs]);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title?.toLowerCase().includes(search.toLowerCase()) || 
                          job.employer?.companyName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.jobStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedJobs = filteredJobs.slice(startIdx, endIdx);

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2>Job Moderation Center</h2>
        <p>Approve, reject, and monitor job postings from employers with a cleaner admin workflow.</p>
      </div>

      <ConfirmationModal 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.text}
        type={confirmDialog.type}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      {message.text && (
        <Alert 
          type={message.type} 
          message={message.text} 
          onClose={() => setMessage({ text: "", type: "" })} 
        />
      )}

      {/* Stats Overview */}
      <div className="reports-grid" style={{ marginBottom: "30px" }}>
        <div className="stat-card">
           <h4>Total Jobs</h4>
           <p>{jobs.length}</p>
        </div>
        <div className="stat-card">
           <h4>Pending Approval</h4>
           <p style={{ color: "#facc15" }}>{jobs.filter(j => j.jobStatus === "pending").length}</p>
        </div>
        <div className="stat-card">
           <h4>Approved</h4>
           <p style={{ color: "#22c55e" }}>{jobs.filter(j => j.jobStatus === "approved").length}</p>
        </div>
      </div>

      <div className="admin-card">
        <div className="page-header" style={{ marginBottom: "20px" }}>
          <h3>All Posted Jobs</h3>
        </div>

        <div className="filter-row">
          <input
            type="text"
            autoComplete="off"
            placeholder="🔍 Search job title or employer..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="search-input"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">📊 All Status</option>
            <option value="pending">🟡 Pending</option>
            <option value="approved">🟢 Approved</option>
            <option value="rejected">🔴 Rejected</option>
          </select>
        </div>

        {loading ? (
           <div className="info-panel" style={{ justifyContent: "center", display: "flex", padding: "40px" }}>
              <LoadingSpinner />
           </div>
        ) : (
            <>
            <div className="table-wrapper">
              <table className="admin-table">
            <thead>
                <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>Sector</th>
                <th>Avg Match %</th>
                <th>👥 Applicants</th>
                <th>Status</th>
                <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {paginatedJobs.length === 0 ? (
                <tr>
                    <td colSpan="7" className="no-data">No jobs match your search</td>
                </tr>
                ) : (
                paginatedJobs.map((job) => (
                    <tr key={job._id}>
                    <td><strong>{job.title}</strong></td>
                    <td>{job.employer?.companyName || "Unknown"}</td>
                    <td>{job.sector || "General"}</td>
                    <td><strong style={{ color: "#2563eb" }}>{job.avgMatch || "0"}%</strong></td>
                    <td>{job.applicantsCount || 0}</td>
                    <td>
                        <span className={`status-badge ${job.jobStatus === "approved" ? "active" : job.jobStatus === "rejected" ? "rejected" : "pending"}`}>
                        {job.jobStatus}
                        </span>
                    </td>
                    <td>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setSelectedJob(job)}
                        >
                            👁️ View
                        </button>

                        {job.jobStatus !== "approved" && (
                            <button
                              className="btn btn-success"
                              onClick={() => attemptStatusUpdate(job, "approved")}
                              disabled={processingId === job._id}
                            >
                              {processingId === job._id ? "..." : "Approve"}
                            </button>
                        )}
                        {job.jobStatus !== "rejected" && (
                            <button
                              className="btn btn-danger"
                              onClick={() => attemptStatusUpdate(job, "rejected")}
                              disabled={processingId === job._id}
                            >
                              {processingId === job._id ? "..." : "Reject"}
                            </button>
                        )}
                        <button
                            className="btn btn-neutral"
                            onClick={() => attemptDelete(job)}
                            disabled={processingId === job._id}
                        >
                            {processingId === job._id ? "..." : "🗑️ Delete"}
                        </button>
                    </td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
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
                
                <div style={{ display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
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
      </div>

      {/* VIVA REQUIRED: VIEW DETAILS POPUP MODAL */}
      {selectedJob && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h2>Job Specification</h2>
              <button className="modal-close" onClick={() => setSelectedJob(null)}>&times;</button>
            </div>
            
            <div style={{ marginBottom: "15px" }}><strong>Company:</strong> {selectedJob.employer?.companyName}</div>
            <div style={{ marginBottom: "15px" }}><strong>Title:</strong> {selectedJob.title}</div>
            <div style={{ marginBottom: "15px" }}><strong>Location:</strong> {selectedJob.location} ({selectedJob.jobType})</div>
            <div style={{ marginBottom: "15px" }}><strong>Salary:</strong> {selectedJob.salary ? formatSalary(selectedJob.salary) : "Not Specified"}</div>
            
            <div style={{ marginBottom: "15px", padding: "10px", background: "#f8f9fa", borderRadius: "5px", borderLeft: selectedJob.jobStatus === "approved" ? "4px solid #4caf50" : selectedJob.jobStatus === "rejected" ? "4px solid #f44336" : "4px solid #ffeb3b" }}>
              <strong>Status:</strong> 
              <span className={`status-badge ${selectedJob.jobStatus === "approved" ? "active" : selectedJob.jobStatus === "rejected" ? "rejected" : "pending"}`} style={{ marginLeft: "10px" }}>
                {selectedJob.jobStatus}
              </span>
            </div>

            <div style={{ marginBottom: "15px" }}>
                <strong>Required Skills:</strong>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
                    {selectedJob.skillsRequired?.map((skill, i) => (
                        <span key={i} style={{ background: "#e0f2fe", color: "#0284c7", padding: "4px 8px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            <div style={{ marginBottom: "25px" }}>
                <strong>Full Description:</strong>
                <p style={{ marginTop: "10px", fontSize: "14px", lineHeight: "1.5", color: "#475569" }}>
                    {selectedJob.description}
                </p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
              {selectedJob.jobStatus !== "approved" && (
                 <button onClick={() => attemptStatusUpdate(selectedJob, "approved")} style={{ padding: "10px 20px", background: "#4caf50", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Approve Job</button>
              )}
               {selectedJob.jobStatus !== "rejected" && (
                 <button onClick={() => attemptStatusUpdate(selectedJob, "rejected")} style={{ padding: "10px 20px", background: "#f44336", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Reject Job</button>
              )}
              <button className="delete-btn" style={{ padding: "10px 20px", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }} onClick={() => attemptDelete(selectedJob)}>Delete Job</button>
              <button onClick={() => setSelectedJob(null)} style={{ padding: "10px 20px", background: "#0f172a", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
