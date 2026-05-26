import { useEffect, useState, useCallback } from "react";
import API from "../api/axios";
import { useSocket } from "../hooks/useSocket.jsx";
import "./verification.css";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Alert from "../components/common/Alert";

export default function Verification() {
  const [activeTab, setActiveTab] = useState("users");
  const [userFilter, setUserFilter] = useState("pending");
  const [userSearch, setUserSearch] = useState("");
  
  // User states
  const [allUsers, setAllUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [rejectedUsers, setRejectedUsers] = useState([]);

  // Employer/Job states
  const [pendingEmployers, setPendingEmployers] = useState([]);
  const [pendingJobs, setPendingJobs] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [employerCurrentPage, setEmployerCurrentPage] = useState(1);
  const [jobCurrentPage, setJobCurrentPage] = useState(1);
  const socket = useSocket();

  const ITEMS_PER_PAGE = 10;

  const fetchAll = useCallback(async () => {
      setLoading(true);
      try {
        const [usersRes, empRes, jobRes] = await Promise.all([
          API.get("/admin/users").catch(() => ({ data: [] })),
          API.get("/admin/employers/pending").catch(() => ({ data: [] })),
          API.get("/admin/jobs/pending").catch(() => ({ data: [] }))
        ]);

        // Process users data
        const users = usersRes.data || [];
        const pending = users.filter(u => u.status !== "approved" && u.status !== "rejected");
        const verified = users.filter(u => u.status === "approved" || u.profileCompletion?.completionPercentage === 100);
        const rejected = users.filter(u => u.status === "rejected");

        setAllUsers(users);
        setPendingUsers(pending);
        setVerifiedUsers(verified);
        setRejectedUsers(rejected);

        if (userFilter === "pending") {
          if (pending.length === 0 && verified.length > 0) setUserFilter("verified");
          else if (pending.length === 0 && verified.length === 0 && rejected.length > 0) setUserFilter("rejected");
        }

        setPendingEmployers(empRes.data || []);
        setPendingJobs(jobRes.data || []);
      } catch (err) {
        console.log(err);
        setMessage({ text: "Failed to fetch verification data. Please try again.", type: "error" });
      } finally {
        setLoading(false);
      }
  }, [userFilter]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Listen for real-time updates from socket
  useEffect(() => {
    if (!socket) return;
    socket.on("dashboard:refresh", fetchAll);
    return () => {
      socket.off("dashboard:refresh", fetchAll);
    };
  }, [socket, fetchAll]);

  const updateUserVerification = async (id, status) => {
    setProcessingId(id);
    try {
      const res = await API.put(`/admin/user/${id}`, { status });
      const text = res.data?.message || `User ${status} successfully!`;
      setMessage({ text, type: "success" });
      
      // Refresh users list
      const updated = allUsers.map(u => u._id === id ? { ...u, status } : u);
      setAllUsers(updated);
      setPendingUsers(updated.filter(u => u.status !== "approved" && u.status !== "rejected"));
      setVerifiedUsers(updated.filter(u => u.status === "approved" || u.profileCompletion?.completionPercentage === 100));
      setRejectedUsers(updated.filter(u => u.status === "rejected"));
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.msg || err.response?.data?.message || "Action failed. Please try again.";
      setMessage({ text: errMsg, type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  const updateEmployerStatus = async (id, status) => {
    setProcessingId(id);
    try {
      const res = await API.put(`/admin/employer/${id}`, { status });
      const message = res.data?.message || (status === "approved" 
        ? "Employer approved successfully! They can now post jobs." 
        : status === "rejected"
        ? "Employer rejected. They have been notified."
        : `Employer ${status} successfully!`);
      setMessage({ text: message, type: "success" });
      setPendingEmployers(prev => prev.filter(emp => emp._id !== id));
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.msg || err.response?.data?.message || "Action failed. Please try again.";
      setMessage({ text: errMsg, type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  const updateJobStatus = async (id, status) => {
    setProcessingId(id);
    try {
      if (status === "approved") {
        const res = await API.post(`/admin/job/${id}/approve`);
        const text = res.data?.message || "Job approved successfully! Matching users have been notified.";
        setMessage({ text, type: "success" });
      } else if (status === "rejected") {
        const res = await API.post(`/admin/job/${id}/reject`);
        const text = res.data?.message || "Job rejected. Employer has been notified.";
        setMessage({ text, type: "success" });
      } else {
        const res = await API.put(`/admin/job/${id}`, { status });
        const text = res.data?.message || `Job ${status} successfully!`;
        setMessage({ text, type: "success" });
      }
      setPendingJobs(prev => prev.filter(job => job._id !== id));
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.msg || err.response?.data?.message || "Action failed. Please try again.";
      setMessage({ text: errMsg, type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleAction = async (id, status, type) => {
    if (type === 'user') {
      await updateUserVerification(id, status);
    } else if (type === 'employer') {
      await updateEmployerStatus(id, status);
    } else {
      await updateJobStatus(id, status);
    }
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const getFilteredUsers = () => {
    let filtered = [];
    if (userFilter === "pending") filtered = pendingUsers;
    else if (userFilter === "verified") filtered = verifiedUsers;
    else filtered = rejectedUsers;

    return filtered.filter(u => 
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
    );
  };

  if (loading) return <LoadingSpinner />;

  const filteredUsers = getFilteredUsers();
  const userTotalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const userStartIdx = (userCurrentPage - 1) * ITEMS_PER_PAGE;
  const userEndIdx = userStartIdx + ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(userStartIdx, userEndIdx);

  const employerTotalPages = Math.ceil(pendingEmployers.length / ITEMS_PER_PAGE);
  const employerStartIdx = (employerCurrentPage - 1) * ITEMS_PER_PAGE;
  const employerEndIdx = employerStartIdx + ITEMS_PER_PAGE;
  const paginatedEmployers = pendingEmployers.slice(employerStartIdx, employerEndIdx);

  const jobTotalPages = Math.ceil(pendingJobs.length / ITEMS_PER_PAGE);
  const jobStartIdx = (jobCurrentPage - 1) * ITEMS_PER_PAGE;
  const jobEndIdx = jobStartIdx + ITEMS_PER_PAGE;
  const paginatedJobs = pendingJobs.slice(jobStartIdx, jobEndIdx);

  return (
    <div className="verification-page">
      <div className="verification-container">
        <h1 className="page-title">Verification Management</h1>
        <div className="info-panel card-panel" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <div style={{ color: '#475569', fontWeight: 600 }}>Users: {allUsers.length}</div>
            <div style={{ color: '#475569', fontWeight: 600 }}>Pending Employers: {pendingEmployers.length}</div>
            <div style={{ color: '#475569', fontWeight: 600 }}>Pending Jobs: {pendingJobs.length}</div>
          </div>
          {message.text && <div style={{ marginTop: 12, color: message.type === 'error' ? '#b91c1c' : '#065f46' }}>{message.text}</div>}
        </div>

        {message.text && <Alert message={message.text} type={message.type} />}

        {/* Tab Navigation */}
        <div className="verification-tabs">
          <button
            className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Users ({allUsers.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "employers" ? "active" : ""}`}
            onClick={() => setActiveTab("employers")}
          >
            Employers ({pendingEmployers.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "jobs" ? "active" : ""}`}
            onClick={() => setActiveTab("jobs")}
          >
            Jobs ({pendingJobs.length})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="tab-content users-content">
            {/* Stats Section */}
            <div className="stats-grid">
              <div className="stat-card pending">
                <div className="stat-number">{pendingUsers.length}</div>
                <div className="stat-label">Pending Users</div>
              </div>
              <div className="stat-card verified">
                <div className="stat-number">{verifiedUsers.length}</div>
                <div className="stat-label">Verified Users</div>
              </div>
              <div className="stat-card rejected">
                <div className="stat-number">{rejectedUsers.length}</div>
                <div className="stat-label">Rejected Users</div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
              <button
                className={`filter-btn ${userFilter === "pending" ? "active" : ""}`}
                onClick={() => { setUserFilter("pending"); setUserCurrentPage(1); }}
              >
                Pending
              </button>
              <button
                className={`filter-btn ${userFilter === "verified" ? "active" : ""}`}
                onClick={() => { setUserFilter("verified"); setUserCurrentPage(1); }}
              >
                Verified
              </button>
              <button
                className={`filter-btn ${userFilter === "rejected" ? "active" : ""}`}
                onClick={() => { setUserFilter("rejected"); setUserCurrentPage(1); }}
              >
                Rejected
              </button>
            </div>

            {/* Search */}
            <div className="search-box">
              <input
                type="text"
                autoComplete="off"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUserCurrentPage(1); }}
                className="search-input"
              />
            </div>

            {/* User Table */}
            {filteredUsers.length === 0 ? (
              allUsers.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, padding: 24 }}>
                  {allUsers.slice(0, 12).map(u => (
                    <div key={u._id} style={{ background: 'white', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 700 }}>{u.name || 'Unnamed'}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{u.profileCompletion?.completionPercentage || 0}%</div>
                      </div>
                      <div style={{ marginTop: 8, color: '#475569' }}>{u.email || 'No email'}</div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                        <button className="action-btn" onClick={() => { setSelectedItem(u); setSelectedType('user'); }} style={{ background: '#eef2ff', color: '#3730a3' }}>View</button>
                        <button className="action-btn approve-btn" onClick={() => handleAction(u._id, 'approved', 'user')}>✓ Approve</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  No {userFilter} users found
                </div>
              )
            ) : (
              <div className="verification-table">
                <table>
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Documents</th>
                      <th>Completion</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map(user => (
                      <tr key={user._id}>
                        <td className="user-name">{user.name || "N/A"}</td>
                        <td>{user.email || "N/A"}</td>
                        <td className="doc-count">
                          <span className="badge">{(user.documents || []).length}</span>
                        </td>
                        <td>
                          <div className="progress-bar">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${user.profileCompletion?.completionPercentage || 0}%`,
                              }}
                            />
                            <span className="progress-text">
                              {user.profileCompletion?.completionPercentage || 0}%
                            </span>
                          </div>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="actions-cell">
                          <button
                            className="action-btn"
                            onClick={() => { setSelectedItem(user); setSelectedType('user'); }}
                            disabled={processingId === user._id}
                            style={{ background: '#eef2ff', color: '#3730a3' }}
                          >
                            View
                          </button>
                          {userFilter === "pending" && (
                            <>
                              <button
                                className="action-btn approve-btn"
                                onClick={() => handleAction(user._id, "approved", "user")}
                                disabled={processingId === user._id}
                              >
                                {processingId === user._id ? "..." : "✓ Approve"}
                              </button>
                              <button
                                className="action-btn reject-btn"
                                onClick={() => handleAction(user._id, "rejected", "user")}
                                disabled={processingId === user._id}
                              >
                                {processingId === user._id ? "..." : "✕ Reject"}
                              </button>
                            </>
                          )}
                          {userFilter === "verified" && (
                            <span className="badge badge-verified">✓ Verified</span>
                          )}
                          {userFilter === "rejected" && (
                            <button
                              className="action-btn approve-btn"
                              onClick={() => handleAction(user._id, "pending", "user")}
                              disabled={processingId === user._id}
                            >
                              {processingId === user._id ? "..." : "Reconsider"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {userTotalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginTop: "20px", padding: "15px", background: "#f9f9f9", borderRadius: "5px" }}>
                    <button
                      onClick={() => setUserCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={userCurrentPage === 1}
                      style={{ padding: "8px 12px", background: userCurrentPage === 1 ? "#ccc" : "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: userCurrentPage === 1 ? "not-allowed" : "pointer" }}
                    >
                      ← Previous
                    </button>

                    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                      {Array.from({ length: userTotalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setUserCurrentPage(page)}
                          style={{ padding: "8px 10px", background: userCurrentPage === page ? "#007bff" : "#f0f0f0", color: userCurrentPage === page ? "#fff" : "#333", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: userCurrentPage === page ? "bold" : "normal" }}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setUserCurrentPage(prev => Math.min(prev + 1, userTotalPages))}
                      disabled={userCurrentPage === userTotalPages}
                      style={{ padding: "8px 12px", background: userCurrentPage === userTotalPages ? "#ccc" : "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: userCurrentPage === userTotalPages ? "not-allowed" : "pointer" }}
                    >
                      Next →
                    </button>

                    <span style={{ marginLeft: "20px", color: "#666", fontWeight: "bold" }}>
                      Page {userCurrentPage} of {userTotalPages} • Showing {Math.min(userStartIdx + 1, filteredUsers.length)}-{Math.min(userEndIdx, filteredUsers.length)} of {filteredUsers.length}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Employers Tab */}
        {activeTab === "employers" && (
          <div className="tab-content">
            <h2>Pending Employer Approvals</h2>
            {pendingEmployers.length === 0 ? (
              pendingEmployers.length === 0 && pendingJobs.length === 0 ? (
                <div className="empty-state">No employers awaiting approval</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, padding: 24 }}>
                  {pendingEmployers.slice(0,12).map(emp => (
                    <div key={emp._id} style={{ background: 'white', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 700 }}>{emp.companyName || 'Company'}</div>
                      <div style={{ color: '#475569', marginTop: 6 }}>{emp.contactEmail || 'No contact'}</div>
                      <div style={{ marginTop: 8 }}>
                        <button className="action-btn" onClick={() => { setSelectedItem(emp); setSelectedType('employer'); }} style={{ background: '#eef2ff', color: '#3730a3' }}>View</button>
                        <button className="action-btn approve-btn" onClick={() => handleAction(emp._id, 'approved', 'employer')}>✓ Approve</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="verification-table">
                <table>
                  <thead>
                    <tr>
                      <th>Company Name</th>
                      <th>Contact Email</th>
                      <th>Industry</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEmployers.map(emp => (
                        <tr key={emp._id}>
                          <td>{emp.companyName || "N/A"}</td>
                          <td>{emp.contactEmail || "N/A"}</td>
                          <td>{emp.industry || "N/A"}</td>
                          <td>
                            <span className="badge badge-pending">Pending</span>
                          </td>
                          <td>
                            <button
                              className="action-btn"
                              onClick={() => { setSelectedItem(emp); setSelectedType('employer'); }}
                              disabled={processingId === emp._id}
                              style={{ background: '#eef2ff', color: '#3730a3' }}
                            >
                              View
                            </button>
                            <button
                              className="action-btn approve-btn"
                              onClick={() => handleAction(emp._id, "approved", "employer")}
                              disabled={processingId === emp._id}
                            >
                              {processingId === emp._id ? "..." : "✓ Approve"}
                            </button>
                            <button
                              className="action-btn reject-btn"
                              onClick={() => handleAction(emp._id, "rejected", "employer")}
                              disabled={processingId === emp._id}
                            >
                              {processingId === emp._id ? "..." : "✕ Reject"}
                            </button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
                {employerTotalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginTop: "20px", padding: "15px", background: "#f9f9f9", borderRadius: "5px" }}>
                    <button
                      onClick={() => setEmployerCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={employerCurrentPage === 1}
                      style={{ padding: "8px 12px", background: employerCurrentPage === 1 ? "#ccc" : "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: employerCurrentPage === 1 ? "not-allowed" : "pointer" }}
                    >
                      ← Previous
                    </button>

                    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                      {Array.from({ length: employerTotalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setEmployerCurrentPage(page)}
                          style={{ padding: "8px 10px", background: employerCurrentPage === page ? "#007bff" : "#f0f0f0", color: employerCurrentPage === page ? "#fff" : "#333", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: employerCurrentPage === page ? "bold" : "normal" }}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setEmployerCurrentPage(prev => Math.min(prev + 1, employerTotalPages))}
                      disabled={employerCurrentPage === employerTotalPages}
                      style={{ padding: "8px 12px", background: employerCurrentPage === employerTotalPages ? "#ccc" : "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: employerCurrentPage === employerTotalPages ? "not-allowed" : "pointer" }}
                    >
                      Next →
                    </button>

                    <span style={{ marginLeft: "20px", color: "#666", fontWeight: "bold" }}>
                      Page {employerCurrentPage} of {employerTotalPages} • Showing {Math.min(employerStartIdx + 1, pendingEmployers.length)}-{Math.min(employerEndIdx, pendingEmployers.length)} of {pendingEmployers.length}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <div className="tab-content">
            <h2>Pending Job Post Approvals</h2>
            {pendingJobs.length === 0 ? (
              pendingJobs.length === 0 && pendingEmployers.length === 0 ? (
                <div className="empty-state">No job posts awaiting approval</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, padding: 24 }}>
                  {pendingJobs.slice(0,12).map(job => (
                    <div key={job._id} style={{ background: 'white', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 700 }}>{job.title || 'Job'}</div>
                      <div style={{ color: '#475569', marginTop: 6 }}>{job.company || 'Company'}</div>
                      <div style={{ marginTop: 8 }}>
                        <button className="action-btn" onClick={() => { setSelectedItem(job); setSelectedType('job'); }} style={{ background: '#eef2ff', color: '#3730a3' }}>View</button>
                        <button className="action-btn approve-btn" onClick={() => handleAction(job._id, 'approved', 'job')}>✓ Approve</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="verification-table">
                <table>
                  <thead>
                    <tr>
                      <th>Job Title</th>
                      <th>Company</th>
                      <th>Posted Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedJobs.map(job => (
                      <tr key={job._id}>
                        <td>{job.title || "N/A"}</td>
                        <td>{job.company || "N/A"}</td>
                        <td>{new Date(job.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className="badge badge-pending">Pending</span>
                        </td>
                        <td>
                          <button
                            className="action-btn"
                            onClick={() => { setSelectedItem(job); setSelectedType('job'); }}
                            disabled={processingId === job._id}
                            style={{ background: '#eef2ff', color: '#3730a3' }}
                          >
                            View
                          </button>
                          <button
                            className="action-btn approve-btn"
                            onClick={() => handleAction(job._id, "approved", "job")}
                            disabled={processingId === job._id}
                          >
                            {processingId === job._id ? "..." : "✓ Approve"}
                          </button>
                          <button
                            className="action-btn reject-btn"
                            onClick={() => handleAction(job._id, "rejected", "job")}
                            disabled={processingId === job._id}
                          >
                            {processingId === job._id ? "..." : "✕ Reject"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {jobTotalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginTop: "20px", padding: "15px", background: "#f9f9f9", borderRadius: "5px" }}>
                    <button
                      onClick={() => setJobCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={jobCurrentPage === 1}
                      style={{ padding: "8px 12px", background: jobCurrentPage === 1 ? "#ccc" : "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: jobCurrentPage === 1 ? "not-allowed" : "pointer" }}
                    >
                      ← Previous
                    </button>

                    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                      {Array.from({ length: jobTotalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setJobCurrentPage(page)}
                          style={{ padding: "8px 10px", background: jobCurrentPage === page ? "#007bff" : "#f0f0f0", color: jobCurrentPage === page ? "#fff" : "#333", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: jobCurrentPage === page ? "bold" : "normal" }}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setJobCurrentPage(prev => Math.min(prev + 1, jobTotalPages))}
                      disabled={jobCurrentPage === jobTotalPages}
                      style={{ padding: "8px 12px", background: jobCurrentPage === jobTotalPages ? "#ccc" : "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: jobCurrentPage === jobTotalPages ? "not-allowed" : "pointer" }}
                    >
                      Next →
                    </button>

                    <span style={{ marginLeft: "20px", color: "#666", fontWeight: "bold" }}>
                      Page {jobCurrentPage} of {jobTotalPages} • Showing {Math.min(jobStartIdx + 1, pendingJobs.length)}-{Math.min(jobEndIdx, pendingJobs.length)} of {pendingJobs.length}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {/* Details panel */}
        {selectedItem && (
          <div style={{ position: 'fixed', right: 24, top: 80, width: 420, maxHeight: '70vh', overflow: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, boxShadow: '0 10px 30px rgba(2,6,23,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{selectedType === 'user' ? (selectedItem.name || 'User') : selectedType === 'employer' ? (selectedItem.companyName || 'Employer') : (selectedItem.title || 'Job')}</h3>
              <button onClick={() => { setSelectedItem(null); setSelectedType(null); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ marginTop: 12, color: '#475569' }}>
              {selectedType === 'user' && (
                <div>
                  <p><strong>Email:</strong> {selectedItem.email || 'N/A'}</p>
                  <p><strong>Documents:</strong> {(selectedItem.documents || []).length}</p>
                  <p><strong>Completion:</strong> {selectedItem.profileCompletion?.completionPercentage || 0}%</p>
                  <p><strong>Joined:</strong> {new Date(selectedItem.createdAt).toLocaleString()}</p>
                  {selectedItem.bio && <p><strong>Bio:</strong> {selectedItem.bio}</p>}
                </div>
              )}
              {selectedType === 'employer' && (
                <div>
                  <p><strong>Company:</strong> {selectedItem.companyName || 'N/A'}</p>
                  <p><strong>Contact:</strong> {selectedItem.contactEmail || 'N/A'}</p>
                  <p><strong>Industry:</strong> {selectedItem.industry || 'N/A'}</p>
                  <p><strong>Registered:</strong> {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : 'N/A'}</p>
                </div>
              )}
              {selectedType === 'job' && (
                <div>
                  <p><strong>Title:</strong> {selectedItem.title || 'N/A'}</p>
                  <p><strong>Company:</strong> {selectedItem.company || 'N/A'}</p>
                  <p><strong>Posted:</strong> {selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : 'N/A'}</p>
                  {selectedItem.description && <p style={{ whiteSpace: 'pre-wrap' }}><strong>Description:</strong> {selectedItem.description}</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
