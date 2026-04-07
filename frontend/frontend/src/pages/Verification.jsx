import { useEffect, useState } from "react";
import API from "../api/axios";
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

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [usersRes, empRes, jobRes] = await Promise.all([
        API.get("/admin/users").catch(() => ({ data: [] })),
        API.get("/admin/employers/pending").catch(() => ({ data: [] })),
        API.get("/admin/jobs/pending").catch(() => ({ data: [] }))
      ]);

      // Process users data
      const users = usersRes.data || [];
      setAllUsers(users);
      setPendingUsers(users.filter(u => u.profileCompletion?.completionPercentage < 100));
      setVerifiedUsers(users.filter(u => u.profileCompletion?.completionPercentage === 100));
      setRejectedUsers(users.filter(u => u.status === "rejected"));

      setPendingEmployers(empRes.data || []);
      setPendingJobs(jobRes.data || []);
    } catch (err) {
      console.log(err);
      setMessage({ text: "Failed to fetch verification data. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const updateUserVerification = async (id, status) => {
    setProcessingId(id);
    try {
      await API.put(`/admin/user/${id}`, { status });
      setMessage({ text: `User ${status} successfully!`, type: "success" });
      
      // Refresh users list
      setAllUsers(prev => prev.map(u => u._id === id ? { ...u, status } : u));
      const updated = allUsers.map(u => u._id === id ? { ...u, status } : u);
      setPendingUsers(updated.filter(u => u.profileCompletion?.completionPercentage < 100));
      setVerifiedUsers(updated.filter(u => u.profileCompletion?.completionPercentage === 100));
      setRejectedUsers(updated.filter(u => u.status === "rejected"));
    } catch (err) {
      console.error(err);
      setMessage({ text: "Action failed. Please try again.", type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  const updateEmployerStatus = async (id, status) => {
    setProcessingId(id);
    try {
      await API.put(`/admin/employer/${id}`, { status });
      const message = status === "approved" 
        ? "Employer approved successfully! They can now post jobs." 
        : status === "rejected"
        ? "Employer rejected. They have been notified."
        : `Employer ${status} successfully!`;
      setMessage({ text: message, type: "success" });
      setPendingEmployers(prev => prev.filter(emp => emp._id !== id));
    } catch (err) {
      console.error(err);
      setMessage({ text: err.response?.data?.message || "Action failed. Please try again.", type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  const updateJobStatus = async (id, status) => {
    setProcessingId(id);
    try {
      if (status === "approved") {
        await API.post(`/admin/job/${id}/approve`);
        setMessage({ text: "Job approved successfully! Matching users have been notified.", type: "success" });
      } else if (status === "rejected") {
        await API.post(`/admin/job/${id}/reject`);
        setMessage({ text: "Job rejected. Employer has been notified.", type: "success" });
      } else {
        await API.put(`/admin/job/${id}`, { status });
        setMessage({ text: `Job ${status} successfully!`, type: "success" });
      }
      setPendingJobs(prev => prev.filter(job => job._id !== id));
    } catch (err) {
      console.error(err);
      setMessage({ text: err.response?.data?.message || "Action failed. Please try again.", type: "error" });
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

  return (
    <div className="verification-page">
      <div className="verification-container">
        <h1 className="page-title">Verification Management</h1>

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
                onClick={() => setUserFilter("pending")}
              >
                Pending
              </button>
              <button
                className={`filter-btn ${userFilter === "verified" ? "active" : ""}`}
                onClick={() => setUserFilter("verified")}
              >
                Verified
              </button>
              <button
                className={`filter-btn ${userFilter === "rejected" ? "active" : ""}`}
                onClick={() => setUserFilter("rejected")}
              >
                Rejected
              </button>
            </div>

            {/* Search */}
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="search-input"
              />
            </div>

            {/* User Table */}
            {filteredUsers.length === 0 ? (
              <div className="empty-state">
                No {userFilter} users found
              </div>
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
                    {filteredUsers.map(user => (
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
              </div>
            )}
          </div>
        )}

        {/* Employers Tab */}
        {activeTab === "employers" && (
          <div className="tab-content">
            <h2>Pending Employer Approvals</h2>
            {pendingEmployers.length === 0 ? (
              <div className="empty-state">No employers awaiting approval</div>
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
                    {pendingEmployers.map(emp => (
                      <tr key={emp._id}>
                        <td>{emp.companyName || "N/A"}</td>
                        <td>{emp.contactEmail || "N/A"}</td>
                        <td>{emp.industry || "N/A"}</td>
                        <td>
                          <span className="badge badge-pending">Pending</span>
                        </td>
                        <td>
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
              </div>
            )}
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <div className="tab-content">
            <h2>Pending Job Post Approvals</h2>
            {pendingJobs.length === 0 ? (
              <div className="empty-state">No job posts awaiting approval</div>
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
                    {pendingJobs.map(job => (
                      <tr key={job._id}>
                        <td>{job.title || "N/A"}</td>
                        <td>{job.company || "N/A"}</td>
                        <td>{new Date(job.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className="badge badge-pending">Pending</span>
                        </td>
                        <td>
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
