import { useState, useEffect } from "react";
import API from "../api/axios";
import "./admin.css";
import "./settingsLayout.css";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Alert from "../components/common/Alert";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Profile
  const [fullName, setFullName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Algorithm Settings
  const [weightSkills, setWeightSkills] = useState(40);
  const [weightExperience, setWeightExperience] = useState(25);
  const [weightEducation, setWeightEducation] = useState(20);
  const [weightKeywords, setWeightKeywords] = useState(15);
  const [minimumSimilarityThreshold, setMinimumSimilarityThreshold] = useState(50);

  // Registration Controls
  const [userRegistrationEnabled, setUserRegistrationEnabled] = useState(true);
  const [employerRegistrationEnabled, setEmployerRegistrationEnabled] = useState(true);
  const [jobPostingEnabled, setJobPostingEnabled] = useState(true);
  const [autoApproveEmployers, setAutoApproveEmployers] = useState(false);

  // System Limits
  const [maxResumeSize, setMaxResumeSize] = useState(5);
  const [maxJobsPerEmployer, setMaxJobsPerEmployer] = useState(50);
  const [maxApplicationsPerUser, setMaxApplicationsPerUser] = useState(100);

  // Notifications
  const [emailAlertsOnRegistration, setEmailAlertsOnRegistration] = useState(true);
  const [emailAlertsOnJobPosting, setEmailAlertsOnJobPosting] = useState(false);
  const [matchAlerts, setMatchAlerts] = useState(true);
  const [weeklyReportSummary, setWeeklyReportSummary] = useState(true);

  // Data for tabs
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [pendingEmployers, setPendingEmployers] = useState([]);
  const [systemStats, setSystemStats] = useState(null);
  const [systemLogs, setSystemLogs] = useState([]);
  const [advancedData, setAdvancedData] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchSystemSettings();
  }, []);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "employers") fetchPendingEmployers();
    if (activeTab === "system") fetchSystemStats();
    if (activeTab === "maintenance") fetchLogs();
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      const res = await API.get("/admin/profile");
      setFullName(res.data.name || "");
      setEmailAddress(res.data.email || "");
    } catch (err) { console.log(err); }
  };

  const fetchSystemSettings = async (data = null) => {
    try {
      const s = data || (await API.get("/admin/system-settings")).data;
      setWeightSkills(s.weightSkills ?? 40);
      setWeightExperience(s.weightExperience ?? 25);
      setWeightEducation(s.weightEducation ?? 20);
      setWeightKeywords(s.weightKeywords ?? 15);
      setMinimumSimilarityThreshold(s.minimumSimilarityThreshold ?? 50);
      setUserRegistrationEnabled(s.userRegistrationEnabled ?? true);
      setEmployerRegistrationEnabled(s.employerRegistrationEnabled ?? true);
      setJobPostingEnabled(s.jobPostingEnabled ?? true);
      setAutoApproveEmployers(s.autoApproveEmployers ?? false);
      setMaxResumeSize(s.maxResumeSize ?? 5);
      setMaxJobsPerEmployer(s.maxJobsPerEmployer ?? 50);
      setMaxApplicationsPerUser(s.maxApplicationsPerUser ?? 100);
      setEmailAlertsOnRegistration(s.emailAlertsOnRegistration ?? true);
      setEmailAlertsOnJobPosting(s.emailAlertsOnJobPosting ?? false);
      setMatchAlerts(s.matchAlerts ?? true);
      setWeeklyReportSummary(s.weeklyReportSummary ?? true);
    } catch (err) { console.log(err); }
  };

  const fetchUsers = async () => {
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchPendingEmployers = async () => {
    try {
      const res = await API.get("/admin/employers/pending");
      setPendingEmployers(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchSystemStats = async () => {
    try {
      const res = await API.get("/admin/system-stats");
      setSystemStats(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchLogs = async () => {
    try {
      const res = await API.get("/admin/logs");
      setSystemLogs(res.data);
    } catch (err) { console.log(err); }
  };

  const showMsg = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      await API.put("/admin/profile", { name: fullName, email: emailAddress });
      showMsg("Profile updated successfully ✅");
    } catch (err) {
      showMsg(err.response?.data?.msg || "Failed to update profile", "error");
    } finally { setLoading(false); }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) return showMsg("Passwords do not match", "error");
    try {
      setLoading(true);
      await API.put("/admin/change-password", { currentPassword, newPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      showMsg("Password changed successfully ✅");
    } catch (err) {
      showMsg(err.response?.data?.msg || "Failed to change password", "error");
    } finally { setLoading(false); }
  };

  const handleSaveAlgorithm = async () => {
    const total = weightSkills + weightExperience + weightEducation + weightKeywords;
    if (total !== 100) return showMsg(`Weights must sum to 100. Current: ${total}`, "error");
    try {
      setLoading(true);
      await API.put("/admin/system-settings", {
        weightSkills, weightExperience, weightEducation, weightKeywords, minimumSimilarityThreshold
      });
      showMsg("Algorithm settings saved ✅");
      fetchLogs();
    } catch (err) { showMsg("Failed to save", "error"); } finally { setLoading(false); }
  };

  const handleSaveGeneral = async () => {
    try {
      setLoading(true);
      await API.put("/admin/system-settings", {
        userRegistrationEnabled,
        employerRegistrationEnabled,
        jobPostingEnabled,
        autoApproveEmployers,
        maxResumeSize,
        maxJobsPerEmployer,
        maxApplicationsPerUser,
        emailAlertsOnRegistration,
        emailAlertsOnJobPosting,
        matchAlerts,
        weeklyReportSummary
      });
      showMsg("System configuration updated ✅");
      fetchLogs();
    } catch (err) { showMsg("Failed to save", "error"); } finally { setLoading(false); }
  };

  // Maintenance Actions
  const handleBackup = async () => {
    try {
      setLoading(true);
      const res = await API.post("/admin/backup");
      // Create a blob and download
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = res.data.filename;
      link.click();
      showMsg("Backup generated and download started! 📦");
      fetchLogs();
    } catch (err) { showMsg("Backup failed", "error"); } finally { setLoading(false); }
  };

  const handleClearCache = async () => {
    try {
      setLoading(true);
      const res = await API.post("/admin/clear-cache");
      showMsg(res.data.message);
      fetchLogs();
    } catch (err) { showMsg("Failed to clear cache", "error"); } finally { setLoading(false); }
  };

  const handleResetSettings = async () => {
    if (!window.confirm("Are you sure? This will reset all matching weights and thresholds.")) return;
    try {
      setLoading(true);
      const res = await API.post("/admin/reset-settings");
      fetchSystemSettings(res.data.defaults);
      showMsg("Settings reset to factory defaults! 🔄");
      fetchLogs();
    } catch (err) { showMsg("Reset failed", "error"); } finally { setLoading(false); }
  };

  const filteredUsers = users.filter(u =>
    (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const weightTotal = weightSkills + weightExperience + weightEducation + weightKeywords;

  const tabs = [
    { id: "profile", icon: "👤", label: "Profile" },
    { id: "security", icon: "🔒", label: "Security" },
    { id: "algorithm", icon: "🧠", label: "Algorithm" },
    { id: "registration", icon: "📝", label: "Registration" },
    { id: "employers", icon: "🏢", label: "Employers" },
    { id: "users", icon: "👥", label: "Users" },
    { id: "limits", icon: "📏", label: "System Limits" },
    { id: "notifications", icon: "🔔", label: "Notifications" },
    { id: "system", icon: "📊", label: "System Data" },
    { id: "maintenance", icon: "🔧", label: "Maintenance" },
  ];

  return (
    <div className="admin-page" style={{ background: "#f8fafc" }}>
      <h2 style={{ marginBottom: "5px", fontSize: "32px", fontWeight: "700" }}>Super Admin Settings</h2>
      <p style={{ color: "#64748b", marginBottom: "30px", fontSize: "15px" }}>
        Complete control over platform configuration, users, and security.
      </p>

      {message.text && <Alert type={message.type} message={message.text} onClose={() => setMessage({ text: "", type: "" })} />}

      <div className="settings-container">
        <div className="settings-sidebar" style={{ width: "220px", gap: "6px" }}>
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span> {tab.label}
            </div>
          ))}
        </div>

        <div className="settings-content-area">
          {loading && <div className="loading-overlay"><LoadingSpinner /></div>}

          {/* ===== PROFILE ===== */}
          {activeTab === "profile" && (
            <>
              <h3>Profile Information</h3>
              <p className="settings-subtext">Update your name and email address.</p>
              <div className="settings-row">
                <div className="settings-field">
                  <label>Full Name</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="settings-field">
                  <label>Email Address</label>
                  <input type="email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} />
                </div>
              </div>
              <button className="save-btn" onClick={handleSaveProfile}>Save Changes</button>
            </>
          )}

          {/* ===== SECURITY ===== */}
          {activeTab === "security" && (
            <>
              <h3>Account Security</h3>
              <p className="settings-subtext">Change your password and manage session security.</p>
              <div className="settings-field">
                <label>Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="settings-field">
                <label>New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="settings-field">
                <label>Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <button className="save-btn" onClick={handleChangePassword}>Update Password</button>
            </>
          )}

          {/* ===== REGISTRATION ===== */}
          {activeTab === "registration" && (
            <>
              <h3>📝 Registration Controls</h3>
              <p className="settings-subtext">Enable or disable specific registration modules.</p>
              <div className="toggle-group">
                <ToggleRow label="Public User Registration" value={userRegistrationEnabled} onChange={setUserRegistrationEnabled} />
                <ToggleRow label="Employer Registration" value={employerRegistrationEnabled} onChange={employerRegistrationEnabled} />
                <ToggleRow label="Initial Job Posting" value={jobPostingEnabled} onChange={setJobPostingEnabled} />
                <ToggleRow label="Auto-Approve Employers" value={autoApproveEmployers} onChange={setAutoApproveEmployers} />
              </div>
              <button className="save-btn" onClick={handleSaveGeneral}>Save Registration Settings</button>
            </>
          )}

          {/* ===== LIMITS ===== */}
          {activeTab === "limits" && (
            <>
              <h3>📏 System Limits</h3>
              <p className="settings-subtext">Set quotas for users and resumes.</p>
              <div className="settings-row">
                <div className="settings-field">
                  <label>Max Resume Size (MB)</label>
                  <input type="number" value={maxResumeSize} onChange={(e) => setMaxResumeSize(Number(e.target.value))} />
                </div>
                <div className="settings-field">
                  <label>Max Jobs per Employer</label>
                  <input type="number" value={maxJobsPerEmployer} onChange={(e) => setMaxJobsPerEmployer(Number(e.target.value))} />
                </div>
              </div>
              <div className="settings-field">
                <label>Max Applications per User</label>
                <input type="number" value={maxApplicationsPerUser} onChange={(e) => setMaxApplicationsPerUser(Number(e.target.value))} />
              </div>
              <button className="save-btn" onClick={handleSaveGeneral}>Save Limits</button>
            </>
          )}

          {/* ===== NOTIFICATIONS ===== */}
          {activeTab === "notifications" && (
            <>
              <h3>🔔 Notification System</h3>
              <p className="settings-subtext">Configure what admins and users get alerted about.</p>
              <div className="toggle-group">
                <ToggleRow label="Email on New Registration" value={emailAlertsOnRegistration} onChange={setEmailAlertsOnRegistration} />
                <ToggleRow label="Email on New Job Posting" value={emailAlertsOnJobPosting} onChange={setEmailAlertsOnJobPosting} />
                <ToggleRow label="Automated Match Alerts" value={matchAlerts} onChange={setMatchAlerts} />
                <ToggleRow label="Weekly Platform Summary" value={weeklyReportSummary} onChange={setWeeklyReportSummary} />
              </div>
              <button className="save-btn" onClick={handleSaveGeneral}>Save Notification Config</button>
            </>
          )}

          {/* ===== ALGORITHM ===== */}
          {activeTab === "algorithm" && (
            <>
              <h3>🧠 Matching Algorithm</h3>
              <p className="settings-subtext">Weights must total 100%.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <SliderField label="Skills" value={weightSkills} onChange={setWeightSkills} color="#3b82f6" />
                <SliderField label="Experience" value={weightExperience} onChange={setWeightExperience} color="#10b981" />
                <SliderField label="Education" value={weightEducation} onChange={setWeightEducation} color="#f59e0b" />
                <SliderField label="Keywords" value={weightKeywords} onChange={setWeightKeywords} color="#8b5cf6" />
              </div>
              <div className={`weight-badge ${weightTotal === 100 ? "ok" : "err"}`}>
                Total Weight: {weightTotal}% {weightTotal === 100 ? "✅" : "(must be 100%)"}
              </div>
              <button className="save-btn" onClick={handleSaveAlgorithm} disabled={weightTotal !== 100}>Save Settings</button>
            </>
          )}

          {/* ===== SYSTEM DATA ===== */}
          {activeTab === "system" && (
            <>
              <h3>📊 System Data Overview</h3>
              <p className="settings-subtext">Real-time statistics across all platform entities.</p>
              {!systemStats ? <LoadingSpinner /> : (
                <div className="stats-grid-mini">
                  <StatCard icon="👥" label="Total Users" value={systemStats.totalUsers} color="#3b82f6" />
                  <StatCard icon="🏢" label="Employers" value={systemStats.totalEmployers} color="#10b981" />
                  <StatCard icon="💼" label="Total Jobs" value={systemStats.totalJobs} color="#8b5cf6" />
                  <StatCard icon="📄" label="Resumes" value={systemStats.totalResumes} color="#f59e0b" />
                  <StatCard icon="📋" label="Applications" value={systemStats.totalApplications} color="#ec4899" />
                  <StatCard icon="🛡️" label="Admins" value={systemStats.totalAdmins} color="#6366f1" />
                </div>
              )}
            </>
          )}

          {/* ===== MAINTENANCE ===== */}
          {activeTab === "maintenance" && (
            <>
              <h3>🔧 System Maintenance & Logs</h3>
              <p className="settings-subtext">Manage system health and monitor administrative activities.</p>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
                <div className="maintenance-card">
                  <h4>📦 Database Backup</h4>
                  <p>Generate a full snapshot of system data for recovery.</p>
                  <button className="action-btn-outline" onClick={handleBackup}>Generate & Download</button>
                </div>
                <div className="maintenance-card">
                  <h4>🗑️ Clear Cache</h4>
                  <p>Invalidate all system caches and refresh data.</p>
                  <button className="action-btn-outline" onClick={handleClearCache}>Purge Cache</button>
                </div>
                <div className="maintenance-card" style={{ gridColumn: "span 2", border: "1px solid #fee2e2", background: "#fef2f2" }}>
                  <h4 style={{ color: "#dc2626" }}>⚠️ Reset All Settings</h4>
                  <p>Set all matching values and thresholds back to original factory defaults.</p>
                  <button className="action-btn-danger" onClick={handleResetSettings}>Reset to Defaults</button>
                </div>
              </div>

              <h4>📜 Recent System Logs</h4>
              <div className="logs-viewer">
                {systemLogs.length === 0 ? <p>No logs found.</p> : (
                  <table className="admin-table mini-table">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Admin</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemLogs.map(log => (
                        <tr key={log._id}>
                          <td><strong>{log.action}</strong>: {log.details}</td>
                          <td>{log.admin?.name || "System"}</td>
                          <td>{new Date(log.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, value, onChange }) {
  return (
    <div className="toggle-row">
      <span>{label}</span>
      <div className={`toggle-switch ${value ? "on" : "off"}`} onClick={() => onChange(!value)}>
        <div className="toggle-dot" />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="mini-stat-card">
      <div className="icon" style={{ background: `${color}15`, color }}>{icon}</div>
      <div className="content">
        <label>{label}</label>
        <p>{value}</p>
      </div>
    </div>
  );
}

function SliderField({ label, value, onChange, color }) {
  return (
    <div className="slider-field">
      <div className="label-row"><span>{label}</span> <strong>{value}%</strong></div>
      <input type="range" min="0" max="100" value={value} onChange={e => onChange(Number(e.target.value))} style={{ accentColor: color }} />
    </div>
  );
}
