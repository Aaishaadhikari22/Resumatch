import { useState, useEffect } from "react";
import API from "../api/axios";
import "./admin.css";
import "./settingsLayout.css";

export default function SectorAdminSettings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Profile
  const [fullName, setFullName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [adminSector, setAdminSector] = useState("");

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Algorithm (read-only)
  const [weightSkills, setWeightSkills] = useState(40);
  const [weightExperience, setWeightExperience] = useState(25);
  const [weightEducation, setWeightEducation] = useState(20);
  const [weightKeywords, setWeightKeywords] = useState(15);
  const [minimumSimilarityThreshold, setMinimumSimilarityThreshold] = useState(50);

  // Users
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");

  // Jobs
  const [jobs, setJobs] = useState([]);
  const [jobFilter, setJobFilter] = useState("all");

  // Employers
  const [employers, setEmployers] = useState([]);

  // Notifications
  const [notifNewJob, setNotifNewJob] = useState(true);
  const [notifNewApp, setNotifNewApp] = useState(true);
  const [notifEmployer, setNotifEmployer] = useState(false);
  const [notifWeekly, setNotifWeekly] = useState(true);

  // Monitoring stats
  const [sectorStats, setSectorStats] = useState(null);

  // Applications (for monitoring)
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    fetchProfile();
    fetchAlgorithmSettings();
  }, []);

  useEffect(() => {
    if (activeTab === "users") fetchSectorUsers();
    if (activeTab === "jobs") fetchSectorJobs();
    if (activeTab === "employers") fetchSectorEmployers();
    if (activeTab === "notifications") fetchNotificationPrefs();
    if (activeTab === "monitoring") { fetchSectorStats(); fetchSectorApplications(); }
    if (activeTab === "reports") fetchSectorStats();
  }, [activeTab]);

  /* ===== API CALLS ===== */

  const fetchProfile = async () => {
    try {
      const res = await API.get("/admin/profile");
      setFullName(res.data.name || "");
      setEmailAddress(res.data.email || "");
      setAdminSector(res.data.sector || "Not assigned");
    } catch (err) { console.log(err); }
  };

  const fetchAlgorithmSettings = async () => {
    try {
      const res = await API.get("/admin/system-settings");
      const s = res.data;
      setWeightSkills(s.weightSkills ?? 40);
      setWeightExperience(s.weightExperience ?? 25);
      setWeightEducation(s.weightEducation ?? 20);
      setWeightKeywords(s.weightKeywords ?? 15);
      setMinimumSimilarityThreshold(s.minimumSimilarityThreshold ?? 50);
    } catch (err) { console.log(err); }
  };

  const fetchSectorUsers = async () => {
    try {
      const res = await API.get("/admin/sector/users");
      setUsers(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchSectorJobs = async () => {
    try {
      const res = await API.get("/admin/sector/jobs");
      setJobs(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchSectorEmployers = async () => {
    try {
      const res = await API.get("/admin/sector/employers");
      setEmployers(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchSectorStats = async () => {
    try {
      const res = await API.get("/admin/sector/stats");
      setSectorStats(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchSectorApplications = async () => {
    try {
      const res = await API.get("/admin/sector/applications");
      setApplications(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchNotificationPrefs = async () => {
    try {
      const res = await API.get("/admin/sector/notifications");
      setNotifNewJob(res.data.newJobPosting ?? true);
      setNotifNewApp(res.data.newApplication ?? true);
      setNotifEmployer(res.data.employerActivity ?? false);
      setNotifWeekly(res.data.weeklyDigest ?? true);
    } catch (err) { console.log(err); }
  };

  /* ===== HANDLERS ===== */

  const showSave = (msg) => {
    setSaveMsg(msg);
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      await API.put("/admin/profile", { name: fullName, email: emailAddress });
      showSave("Profile updated successfully ✅");
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to update profile");
    } finally { setLoading(false); }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) return alert("New passwords do not match");
    if (newPassword.length < 6) return alert("Password must be at least 6 characters");
    try {
      setLoading(true);
      await API.put("/admin/change-password", { currentPassword, newPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      showSave("Password changed successfully ✅");
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to change password");
    } finally { setLoading(false); }
  };

  const handleUserStatusChange = async (id, status) => {
    try {
      await API.put(`/admin/sector/user/${id}/status`, { status });
      fetchSectorUsers();
      showSave(`User ${status} ✅`);
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to update user");
    }
  };

  const handleJobStatusChange = async (id, status) => {
    try {
      await API.put(`/admin/sector/job/${id}`, { status });
      fetchSectorJobs();
      showSave(`Job ${status} ✅`);
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to update job");
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setLoading(true);
      await API.put("/admin/sector/notifications", {
        newJobPosting: notifNewJob,
        newApplication: notifNewApp,
        employerActivity: notifEmployer,
        weeklyDigest: notifWeekly
      });
      showSave("Notification settings saved ✅");
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to save");
    } finally { setLoading(false); }
  };

  /* ===== FILTERS ===== */

  const filteredUsers = users.filter(u =>
    (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredJobs = jobFilter === "all" ? jobs : jobs.filter(j => j.jobStatus === jobFilter);

  const weightTotal = weightSkills + weightExperience + weightEducation + weightKeywords;

  /* ===== TABS ===== */

  const tabs = [
    { id: "profile", icon: "👤", label: "Profile" },
    { id: "security", icon: "🔒", label: "Security" },
    { id: "algorithm", icon: "🧠", label: "Algorithm" },
    { id: "users", icon: "👥", label: "Users" },
    { id: "jobs", icon: "💼", label: "Jobs" },
    { id: "employers", icon: "🏢", label: "Employers" },
    { id: "notifications", icon: "🔔", label: "Notifications" },
    { id: "monitoring", icon: "📊", label: "Monitoring" },
    { id: "reports", icon: "📄", label: "Reports" },
  ];

  return (
    <div className="admin-page" style={{ background: "#f8fafc" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "5px" }}>
        <h2 style={{ fontSize: "32px", fontWeight: "700", margin: 0 }}>Sector Admin Settings</h2>
        <span style={{
          padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white",
          letterSpacing: "0.5px"
        }}>
          {adminSector}
        </span>
      </div>
      <p style={{ color: "#64748b", marginBottom: "30px", fontSize: "15px" }}>
        Manage your sector's users, jobs, and settings. Some settings are read-only.
      </p>

      {saveMsg && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#059669",
          padding: "12px 24px", borderRadius: "10px", fontWeight: 600, fontSize: "14px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)", animation: "fadeIn 0.3s"
        }}>
          {saveMsg}
        </div>
      )}

      <div className="settings-container">
        {/* Sidebar Tabs */}
        <div className="settings-sidebar" style={{ width: "220px", gap: "6px" }}>
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ padding: "10px 16px", fontSize: "13px" }}
            >
              <span>{tab.icon}</span> {tab.label}
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="settings-content-area">

          {/* ===== PROFILE ===== */}
          {activeTab === "profile" && (
            <>
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px" }}>Profile Information</h3>
              <p className="settings-subtext">Update your name and email address.</p>

              <div style={{
                padding: "14px 20px", borderRadius: "10px", marginBottom: "24px",
                background: "linear-gradient(135deg, #ede9fe, #f3e8ff)",
                border: "1px solid #c4b5fd", fontSize: "13px", color: "#6d28d9"
              }}>
                <strong>Assigned Sector:</strong> {adminSector}
              </div>

              <div className="settings-row">
                <div className="settings-field">
                  <label>Full Name</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter full name" />
                </div>
                <div className="settings-field">
                  <label>Email Address</label>
                  <input type="email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} placeholder="Enter email" />
                </div>
              </div>

              <div className="save-action-row">
                <button className="save-btn" onClick={handleSaveProfile} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </>
          )}

          {/* ===== SECURITY ===== */}
          {activeTab === "security" && (
            <>
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px" }}>🔒 Security Settings</h3>
              <p className="settings-subtext">Change your password and manage session security.</p>

              <div className="settings-field" style={{ marginBottom: "16px", maxWidth: "400px" }}>
                <label>Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
              </div>
              <div className="settings-row" style={{ maxWidth: "400px" }}>
                <div className="settings-field">
                  <label>New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
                </div>
              </div>
              <div className="settings-row" style={{ maxWidth: "400px" }}>
                <div className="settings-field">
                  <label>Confirm New Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" />
                </div>
              </div>

              <div style={{ marginTop: "20px", padding: "16px", background: "#fef3c7", borderRadius: "10px", borderLeft: "4px solid #f59e0b", fontSize: "13px", color: "#92400e", maxWidth: "500px" }}>
                <strong>Session Control:</strong> Changing your password will invalidate all other active sessions. You will remain logged in on this device only.
              </div>

              <div className="save-action-row">
                <button className="save-btn" onClick={handleChangePassword} disabled={loading}>
                  {loading ? "Changing..." : "Change Password"}
                </button>
              </div>
            </>
          )}

          {/* ===== ALGORITHM (READ-ONLY) ===== */}
          {activeTab === "algorithm" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>🧠 Matching Algorithm</h3>
                <span style={{
                  padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
                  background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a"
                }}>READ-ONLY</span>
              </div>
              <p className="settings-subtext">View how the AI matching algorithm weighs different factors. Contact a Super Admin to make changes.</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
                <ReadOnlySlider label="Skill Weight" value={weightSkills} color="#3b82f6" />
                <ReadOnlySlider label="Experience Weight" value={weightExperience} color="#10b981" />
                <ReadOnlySlider label="Education Weight" value={weightEducation} color="#f59e0b" />
                <ReadOnlySlider label="Keywords Weight" value={weightKeywords} color="#8b5cf6" />
              </div>

              <div style={{
                padding: "14px 20px", borderRadius: "10px", marginBottom: "24px",
                background: weightTotal === 100 ? "#ecfdf5" : "#fef2f2",
                border: `1px solid ${weightTotal === 100 ? "#a7f3d0" : "#fecaca"}`,
                color: weightTotal === 100 ? "#059669" : "#dc2626",
                fontWeight: 600, fontSize: "14px"
              }}>
                Total Weight: {weightTotal}% {weightTotal === 100 ? "✅" : `(must be 100%)`}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: "600", color: "#334155", marginBottom: "10px" }}>Minimum Similarity Threshold</h4>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{
                    flex: 1, height: "8px", borderRadius: "4px",
                    background: `linear-gradient(90deg, #2563eb ${minimumSimilarityThreshold}%, #e2e8f0 ${minimumSimilarityThreshold}%)`
                  }} />
                  <span style={{ fontWeight: 700, fontSize: "18px", color: "#1e293b", minWidth: "50px" }}>{minimumSimilarityThreshold}%</span>
                </div>
                <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px" }}>
                  Jobs below this threshold won't appear in recommendations
                </p>
              </div>

              <div style={{ padding: "16px", background: "#f0f9ff", borderRadius: "10px", borderLeft: "4px solid #3b82f6", fontSize: "13px", color: "#1e40af" }}>
                <strong>ℹ️ Note:</strong> Only Super Admins can modify algorithm settings. Contact your system administrator for changes.
              </div>
            </>
          )}

          {/* ===== USERS ===== */}
          {activeTab === "users" && (
            <>
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px" }}>👥 Manage Sector Users</h3>
              <p className="settings-subtext">Manage users within your assigned sector.</p>

              <div className="settings-field" style={{ marginBottom: "20px", maxWidth: "400px" }}>
                <input type="text" placeholder="🔍 Search by name or email..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
              </div>

              {filteredUsers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  <div style={{ fontSize: "40px", marginBottom: "10px" }}>👥</div>
                  <p>No users found in your sector</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "10px", maxHeight: "500px", overflowY: "auto" }}>
                  {filteredUsers.map(user => (
                    <div key={user._id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "14px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc"
                    }}>
                      <div>
                        <h4 style={{ margin: "0 0 2px 0", fontSize: "14px", color: "#0f172a" }}>{user.name || "—"}</h4>
                        <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{user.email}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
                          background: "#ede9fe", color: "#7c3aed"
                        }}>{user.sector || "—"}</span>
                        <select
                          value={user.status || "active"}
                          onChange={(e) => handleUserStatusChange(user._id, e.target.value)}
                          style={{
                            padding: "5px 10px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "12px", fontWeight: 600,
                            color: user.status === "active" ? "#059669" : user.status === "suspended" ? "#d97706" : "#dc2626",
                            background: user.status === "active" ? "#ecfdf5" : user.status === "suspended" ? "#fffbeb" : "#fef2f2"
                          }}
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="banned">Banned</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ===== JOBS ===== */}
          {activeTab === "jobs" && (
            <>
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px" }}>💼 Sector Job Management</h3>
              <p className="settings-subtext">Approve or reject job postings in your sector.</p>

              <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                {["all", "pending", "approved", "rejected"].map(f => (
                  <button
                    key={f}
                    onClick={() => setJobFilter(f)}
                    style={{
                      padding: "6px 16px", borderRadius: "20px", border: "none",
                      fontSize: "12px", fontWeight: 600, cursor: "pointer",
                      background: jobFilter === f ? "#2563eb" : "#f1f5f9",
                      color: jobFilter === f ? "white" : "#64748b",
                      transition: "all 0.2s"
                    }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {filteredJobs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  <div style={{ fontSize: "40px", marginBottom: "10px" }}>💼</div>
                  <p>No jobs found</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "12px", maxHeight: "500px", overflowY: "auto" }}>
                  {filteredJobs.map(job => (
                    <div key={job._id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc"
                    }}>
                      <div>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", color: "#0f172a" }}>{job.title || "Untitled Job"}</h4>
                        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                          {job.employer?.companyName || "Unknown employer"} • {job.sector || "No sector"}
                        </p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                          padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
                          background: job.jobStatus === "approved" ? "#ecfdf5" : job.jobStatus === "rejected" ? "#fef2f2" : "#fffbeb",
                          color: job.jobStatus === "approved" ? "#059669" : job.jobStatus === "rejected" ? "#dc2626" : "#d97706"
                        }}>{job.jobStatus}</span>
                        {job.jobStatus === "pending" && (
                          <>
                            <button onClick={() => handleJobStatusChange(job._id, "approved")} style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: "#10b981", color: "white", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}>Approve</button>
                            <button onClick={() => handleJobStatusChange(job._id, "rejected")} style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: "#ef4444", color: "white", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}>Reject</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ===== EMPLOYERS ===== */}
          {activeTab === "employers" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>🏢 Employer Verification Status</h3>
                <span style={{
                  padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
                  background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a"
                }}>VIEW ONLY</span>
              </div>
              <p className="settings-subtext">View employer accounts and their verification status. Only Super Admins can approve/reject employers.</p>

              {employers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                  <div style={{ fontSize: "40px", marginBottom: "10px" }}>🏢</div>
                  <p>No employers registered</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {employers.map(emp => (
                    <div key={emp._id} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "16px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc"
                    }}>
                      <div>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", color: "#0f172a" }}>{emp.companyName || emp.name}</h4>
                        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>{emp.email}</p>
                      </div>
                      <span style={{
                        padding: "4px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
                        background: emp.status === "approved" ? "#ecfdf5" : emp.status === "rejected" ? "#fef2f2" : "#fffbeb",
                        color: emp.status === "approved" ? "#059669" : emp.status === "rejected" ? "#dc2626" : "#d97706"
                      }}>{emp.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ===== NOTIFICATIONS ===== */}
          {activeTab === "notifications" && (
            <>
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px" }}>🔔 Sector Notification Settings</h3>
              <p className="settings-subtext">Control which notifications you receive for your sector.</p>

              <div style={{ marginTop: "10px" }}>
                <Toggle label="New Job Posting in Sector" value={notifNewJob} onChange={() => setNotifNewJob(!notifNewJob)} />
                <Toggle label="New Application Received" value={notifNewApp} onChange={() => setNotifNewApp(!notifNewApp)} />
                <Toggle label="Employer Activity Alerts" value={notifEmployer} onChange={() => setNotifEmployer(!notifEmployer)} />
                <Toggle label="Weekly Sector Digest" value={notifWeekly} onChange={() => setNotifWeekly(!notifWeekly)} />
              </div>

              <div className="save-action-row">
                <button className="save-btn" onClick={handleSaveNotifications} disabled={loading}>
                  {loading ? "Saving..." : "Save Notifications"}
                </button>
              </div>
            </>
          )}

          {/* ===== MONITORING ===== */}
          {activeTab === "monitoring" && (
            <>
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px" }}>📊 Sector Monitoring</h3>
              <p className="settings-subtext">Monitor job postings and applications within your sector.</p>

              {!sectorStats ? (
                <p style={{ color: "#94a3b8" }}>Loading stats...</p>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "30px" }}>
                    <StatCard icon="👥" label="Sector Users" value={sectorStats.totalUsers} sub={`${sectorStats.activeUsers} active`} color="#3b82f6" />
                    <StatCard icon="💼" label="Total Jobs" value={sectorStats.totalJobs} sub={`${sectorStats.pendingJobs} pending`} color="#10b981" />
                    <StatCard icon="✅" label="Approved Jobs" value={sectorStats.approvedJobs} sub={`${sectorStats.rejectedJobs} rejected`} color="#8b5cf6" />
                    <StatCard icon="📋" label="Applications" value={sectorStats.totalApplications} color="#ec4899" />
                    <StatCard icon="🏢" label="Employers" value={sectorStats.totalEmployers} sub={`${sectorStats.pendingEmployers} pending`} color="#f59e0b" />
                    <StatCard icon="🌐" label="Sector" value={sectorStats.sector} color="#6366f1" />
                  </div>

                  <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", marginBottom: "14px" }}>Recent Applications</h4>
                  {applications.length === 0 ? (
                    <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>No applications in your sector</p>
                  ) : (
                    <div style={{ display: "grid", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
                      {applications.slice(0, 20).map(app => (
                        <div key={app._id} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "13px"
                        }}>
                          <div>
                            <strong style={{ color: "#0f172a" }}>{app.user?.name || "Unknown"}</strong>
                            <span style={{ color: "#94a3b8", margin: "0 8px" }}>→</span>
                            <span style={{ color: "#475569" }}>{app.job?.title || "Untitled"}</span>
                          </div>
                          <span style={{
                            padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
                            background: app.status === "accepted" ? "#ecfdf5" : app.status === "rejected" ? "#fef2f2" : app.status === "reviewed" ? "#f0f9ff" : "#fffbeb",
                            color: app.status === "accepted" ? "#059669" : app.status === "rejected" ? "#dc2626" : app.status === "reviewed" ? "#2563eb" : "#d97706"
                          }}>{app.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ===== REPORTS ===== */}
          {activeTab === "reports" && (
            <>
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px" }}>📄 Sector Reports</h3>
              <p className="settings-subtext">Generate and view reports for your sector.</p>

              {!sectorStats ? (
                <p style={{ color: "#94a3b8" }}>Loading report data...</p>
              ) : (
                <>
                  <div style={{ display: "grid", gap: "16px", maxWidth: "600px" }}>
                    <ReportCard
                      title="Sector Overview Report"
                      description={`Summary of ${sectorStats.sector} sector — ${sectorStats.totalUsers} users, ${sectorStats.totalJobs} jobs, ${sectorStats.totalApplications} applications`}
                      icon="📊"
                    />
                    <ReportCard
                      title="Job Posting Activity"
                      description={`${sectorStats.pendingJobs} pending • ${sectorStats.approvedJobs} approved • ${sectorStats.rejectedJobs} rejected`}
                      icon="💼"
                    />
                    <ReportCard
                      title="User Activity Report"
                      description={`${sectorStats.totalUsers} total users in sector • ${sectorStats.activeUsers} currently active`}
                      icon="👥"
                    />
                    <ReportCard
                      title="Employer Status Report"
                      description={`${sectorStats.totalEmployers} employers • ${sectorStats.pendingEmployers} pending verification`}
                      icon="🏢"
                    />
                  </div>

                  <div style={{ marginTop: "24px", padding: "16px", background: "#f0f9ff", borderRadius: "10px", borderLeft: "4px solid #3b82f6", fontSize: "13px", color: "#1e40af" }}>
                    <strong>ℹ️ Note:</strong> Reports are generated from live data. In production, downloadable PDF/CSV exports would be available here.
                  </div>
                </>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}

/* ==================== SUB-COMPONENTS ==================== */

function Toggle({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", padding: "14px 18px", border: "1px solid #e2e8f0", borderRadius: "10px", background: "#f8fafc" }}>
      <span style={{ color: "#334155", fontWeight: "600", fontSize: "14px" }}>{label}</span>
      <button
        onClick={onChange}
        style={{
          border: "none", color: "white", padding: "6px 16px", borderRadius: "20px",
          cursor: "pointer", backgroundColor: value ? "#2563eb" : "#cbd5e1",
          fontWeight: "600", fontSize: "13px", transition: "all 0.2s ease", minWidth: "90px"
        }}
      >
        {value ? "ENABLED" : "DISABLED"}
      </button>
    </div>
  );
}

function ReadOnlySlider({ label, value, color }) {
  return (
    <div style={{ padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "white" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>{label}</span>
        <span style={{ fontSize: "15px", fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{
        width: "100%", height: "8px", borderRadius: "4px",
        background: `linear-gradient(90deg, ${color} ${value}%, #e2e8f0 ${value}%)`
      }} />
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{
      padding: "20px", borderRadius: "14px", border: "1px solid #f1f5f9", background: "white",
      boxShadow: "0 2px 4px rgba(0,0,0,0.03)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "10px",
          background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px"
        }}>{icon}</div>
        <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a", marginBottom: "4px" }}>{value}</div>
      {sub && <div style={{ fontSize: "12px", color: "#94a3b8" }}>{sub}</div>}
    </div>
  );
}

function ReportCard({ title, description, icon }) {
  return (
    <div style={{
      padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc",
      display: "flex", alignItems: "flex-start", gap: "16px"
    }}>
      <div style={{
        width: "44px", height: "44px", borderRadius: "10px",
        background: "linear-gradient(135deg, #ede9fe, #e0e7ff)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "20px", flexShrink: 0
      }}>{icon}</div>
      <div>
        <h4 style={{ margin: "0 0 6px 0", fontSize: "15px", color: "#0f172a", fontWeight: 600 }}>{title}</h4>
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: "1.5" }}>{description}</p>
        <button
          onClick={() => alert("In production, this would generate a downloadable report.")}
          style={{
            marginTop: "10px", padding: "6px 16px", borderRadius: "8px",
            border: "1px solid #cbd5e1", background: "white", color: "#334155",
            fontWeight: 600, fontSize: "12px", cursor: "pointer"
          }}
        >
          Generate Report
        </button>
      </div>
    </div>
  );
}
