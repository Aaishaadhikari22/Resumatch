import { useEffect, useState } from "react";
import API from "../api/axios";
import "./admin.css";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Alert from "../components/common/Alert";
import ConfirmationModal from "../components/common/ConfirmationModal";

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // VIVA REQUIRED: SORT AND SEARCH STATES
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState(null);
  
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, title: "", text: "", type: "danger" });

  const fetchJobs = async () => {
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
  };

  const attemptStatusUpdate = (job, newStatus) => {
    const isApproving = newStatus === "approved";
    setConfirmDialog({
      isOpen: true,
      title: isApproving ? "Approve Job" : "Reject Job",
      text: isApproving 
        ? `Are you sure you want to approve "${job.title}"? It will go live immediately.` 
        : `Are you sure you want to reject "${job.title}"? It will be hidden from job seekers.`,
      type: isApproving ? "primary" : "warning",
      action: () => executeStatusUpdate(job._id, newStatus)
    });
  };

  const executeStatusUpdate = async (id, status) => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    setProcessingId(id);
    try {
      await API.put(`/admin/job/${id}`, { status });
      setMessage({ text: `Job ${status} successfully!`, type: "success" });
      
      if (selectedJob && selectedJob._id === id) {
        setSelectedJob({ ...selectedJob, jobStatus: status });
      }

      fetchJobs();
    } catch (error) {
      console.error(error);
      setMessage({ text: error.response?.data?.message || "Failed to update job", type: "error" });
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    }
  };

  const attemptDelete = (job) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Job",
      text: `Are you sure you want to permanently delete "${job.title}"? This cannot be undone.`,
      type: "danger",
      action: () => executeDelete(job._id)
    });
  };

  const executeDelete = async (id) => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    setProcessingId(id);
    try {
      await API.delete(`/admin/job/${id}`);
      setMessage({ text: "Job deleted permanently", type: "success" });
      if (selectedJob && selectedJob._id === id) setSelectedJob(null);
      fetchJobs();
    } catch(err) {
      console.error(err);
      setMessage({ text: "Error deleting job", type: "error" });
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title?.toLowerCase().includes(search.toLowerCase()) || 
                          job.employer?.companyName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.jobStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-page" style={{ padding: "20px" }}>
      <h2>Job Moderation Center</h2>
      
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
        <h3>All Posted Jobs</h3>

        {/* VIVA REQUIRED: SEARCH & FILTER SECTION */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
          <input 
            type="text" 
            placeholder="🔍 Search Job Title or Company..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc", width: "100%", maxWidth: "400px" }}
          />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
          >
            <option value="all">📊 All Status</option>
            <option value="pending">🟡 Pending</option>
            <option value="approved">🟢 Approved</option>
            <option value="rejected">🔴 Rejected</option>
          </select>
        </div>

        {loading ? (
           <div style={{ padding: "40px", display: "flex", justifyContent: "center" }}>
              <LoadingSpinner />
           </div>
        ) : (
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
                {filteredJobs.length === 0 ? (
                <tr>
                    <td colSpan="7" className="no-data" style={{ textAlign: "center", padding: "20px" }}>No jobs match your search</td>
                </tr>
                ) : (
                filteredJobs.map((job) => (
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
                        {/* VIVA REQUIRED: View Details Button */}
                        <button 
                            onClick={() => setSelectedJob(job)}
                            style={{ background: "#f0f0f0", color: "#333", border: "none", padding: "6px 12px", borderRadius: "4px", marginRight: "5px", cursor: "pointer", fontWeight: "bold" }}
                        >
                            👁️ View
                        </button>

                        {job.jobStatus !== "approved" && (
                            <button
                            className="action-btn accept-btn"
                            style={{ marginRight: "5px", background: "#4caf50", color: "white" }}
                            onClick={() => attemptStatusUpdate(job, "approved")}
                            disabled={processingId === job._id}
                            >
                            {processingId === job._id ? "..." : "Approve"}
                            </button>
                        )}
                        {job.jobStatus !== "rejected" && (
                            <button
                            className="action-btn danger"
                            style={{ marginRight: "5px", background: "#f44336", color: "white" }}
                            onClick={() => attemptStatusUpdate(job, "rejected")}
                            disabled={processingId === job._id}
                            >
                            {processingId === job._id ? "..." : "Reject"}
                            </button>
                        )}
                        <button
                            className="action-btn"
                            onClick={() => attemptDelete(job)}
                            disabled={processingId === job._id}
                            style={{ background: "#000", border: "none", color: "#fff", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                        >
                            {processingId === job._id ? "..." : "🗑️ Delete"}
                        </button>
                    </td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
        )}
      </div>

      {/* VIVA REQUIRED: VIEW DETAILS POPUP MODAL */}
      {selectedJob && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "30px", borderRadius: "10px", maxWidth: "600px", width: "90%", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2>Job Specification</h2>
              <button onClick={() => setSelectedJob(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>&times;</button>
            </div>
            
            <div style={{ marginBottom: "15px" }}><strong>Company:</strong> {selectedJob.employer?.companyName}</div>
            <div style={{ marginBottom: "15px" }}><strong>Title:</strong> {selectedJob.title}</div>
            <div style={{ marginBottom: "15px" }}><strong>Location:</strong> {selectedJob.location} ({selectedJob.jobType})</div>
            <div style={{ marginBottom: "15px" }}><strong>Salary:</strong> {selectedJob.salary || "Not Specified"}</div>
            
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
