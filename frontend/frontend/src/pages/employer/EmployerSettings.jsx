import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import VerificationStatus from "../../components/VerificationStatus";
import "../settingsLayout.css";

export default function EmployerSettings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const navigate = useNavigate();

  // Company Profile
  const [employer, setEmployer] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [logo, setLogo] = useState("");
  const [contactName, setContactName] = useState("");

  // Contact Info
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Job Preferences
  const [defaultSector, setDefaultSector] = useState("");
  const [autoPublish, setAutoPublish] = useState(false);
  const [requireSkills, setRequireSkills] = useState(true);
  const [defaultJobDuration, setDefaultJobDuration] = useState(30);

  // Matching Results
  const [matchingResults, setMatchingResults] = useState([]);

  // Manage Jobs
  const [jobs, setJobs] = useState([]);
  const [editingJob, setEditingJob] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editSkills, setEditSkills] = useState("");

  // Shortlisted
  const [shortlisted, setShortlisted] = useState([]);

  // Notifications
  const [notifNewApp, setNotifNewApp] = useState(true);
  const [notifMatch, setNotifMatch] = useState(true);
  const [notifStatus, setNotifStatus] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("employerToken");
    if (!token) return navigate("/employer/login");
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === "jobprefs") fetchJobPrefs();
    if (activeTab === "matching") fetchMatchingResults();
    if (activeTab === "managejobs") fetchJobs();
    if (activeTab === "shortlisted") fetchShortlisted();
    if (activeTab === "notifications") fetchNotificationPrefs();
  }, [activeTab]);

  /* ===== FETCH FUNCTIONS ===== */

  const fetchProfile = async () => {
    try {
      const res = await API.get("/employer/profile");
      setEmployer(res.data);
      setCompanyName(res.data.companyName || "");
      setCompanyDescription(res.data.companyDescription || "");
      setLogo(res.data.logo || "");
      setContactName(res.data.name || "");
      setPhone(res.data.phone || "");
      setEmail(res.data.email || "");
      setWebsite(res.data.website || "");
    } catch (err) { console.log(err); }
  };

  const fetchJobPrefs = async () => {
    try {
      const res = await API.get("/employer/job-prefs");
      setDefaultSector(res.data.defaultSector || "");
      setAutoPublish(res.data.autoPublish ?? false);
      setRequireSkills(res.data.requireSkills ?? true);
      setDefaultJobDuration(res.data.defaultJobDuration ?? 30);
    } catch (err) { console.log(err); }
  };

  const fetchMatchingResults = async () => {
    try {
      const res = await API.get("/employer/matching-results");
      setMatchingResults(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.log(err); }
  };

  const fetchJobs = async () => {
    try {
      const res = await API.get("/employer/jobs");
      setJobs(Array.isArray(res.data) ? res.data : res.data.jobs || []);
    } catch (err) { console.log(err); }
  };

  const fetchShortlisted = async () => {
    try {
      const res = await API.get("/employer/shortlisted");
      setShortlisted(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.log(err); }
  };

  const fetchNotificationPrefs = async () => {
    try {
      const res = await API.get("/employer/notification-prefs");
      setNotifNewApp(res.data?.newApplicationAlert ?? true);
      setNotifMatch(res.data?.matchAlert ?? true);
      setNotifStatus(res.data?.applicationStatusChange ?? true);
      setNotifWeekly(res.data?.weeklyDigest ?? true);
    } catch (err) { 
      console.log(err);
      // Set defaults if endpoint fails or doesn't exist
      setNotifNewApp(true);
      setNotifMatch(true);
      setNotifStatus(true);
      setNotifWeekly(true);
    }
  };

  /* ===== HANDLERS ===== */

  const showSave = (msg) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(""), 3000); };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      await API.put("/employer/profile", { companyName, companyDescription, logo });
      showSave("Company profile updated ✅");
    } catch (err) { alert(err.response?.data?.msg || "Failed to update"); }
    finally { setLoading(false); }
  };

  const handleSaveContact = async () => {
    try {
      setLoading(true);
      await API.put("/employer/contact", { phone, email, website });
      showSave("Contact info updated ✅");
    } catch (err) { alert(err.response?.data?.msg || "Failed to update"); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) return alert("Passwords do not match");
    if (newPassword.length < 6) return alert("Password must be at least 6 characters");
    try {
      setLoading(true);
      await API.put("/employer/change-password", { currentPassword, newPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      showSave("Password changed ✅");
    } catch (err) { alert(err.response?.data?.msg || "Failed"); }
    finally { setLoading(false); }
  };

  const handleSaveJobPrefs = async () => {
    try {
      setLoading(true);
      await API.put("/employer/job-prefs", { defaultSector, autoPublish, requireSkills, defaultJobDuration });
      showSave("Job preferences updated ✅");
    } catch (err) { alert(err.response?.data?.msg || "Failed"); }
    finally { setLoading(false); }
  };

  const handleEditJob = (job) => {
    setEditingJob(job._id);
    setEditTitle(job.title);
    setEditDesc(job.description || "");
    setEditSkills((job.skillsRequired || []).join(", "));
  };

  const handleSaveEditJob = async () => {
    try {
      setLoading(true);
      await API.put(`/employer/jobs/${editingJob}`, {
        title: editTitle,
        description: editDesc,
        skillsRequired: editSkills.split(",").map(s => s.trim()).filter(Boolean)
      });
      setEditingJob(null);
      fetchJobs();
      showSave("Job updated ✅");
    } catch (err) { alert(err.response?.data?.msg || "Failed"); }
    finally { setLoading(false); }
  };

  const handleCloseJob = async (id) => {
    if (!window.confirm("Are you sure you want to close this job?")) return;
    try {
      await API.patch(`/employer/jobs/${id}/close`);
      fetchJobs();
      showSave("Job closed ✅");
    } catch (err) { alert(err.response?.data?.msg || "Failed"); }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Are you sure? This will delete the job and all associated applications.")) return;
    try {
      await API.delete(`/employer/jobs/${id}`);
      fetchJobs();
      showSave("Job deleted ✅");
    } catch (err) { alert(err.response?.data?.msg || "Failed"); }
  };

  const handleSaveNotifications = async () => {
    try {
      setLoading(true);
      await API.put("/employer/notification-prefs", {
        newApplicationAlert: notifNewApp,
        matchAlert: notifMatch,
        applicationStatusChange: notifStatus,
        weeklyDigest: notifWeekly
      });
      showSave("Notification preferences saved ✅");
    } catch (err) { alert(err.response?.data?.msg || "Failed"); }
    finally { setLoading(false); }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return "#059669";
    if (score >= 40) return "#d97706";
    return "#dc2626";
  };

  const getScoreBg = (score) => {
    if (score >= 70) return "#ecfdf5";
    if (score >= 40) return "#fffbeb";
    return "#fef2f2";
  };

  /* ===== TABS ===== */

  const tabs = [
    { id: "profile", icon: "🏢", label: "Company Profile" },
    { id: "contact", icon: "📞", label: "Contact Info" },
    { id: "security", icon: "🔒", label: "Security" },
    { id: "jobprefs", icon: "⚙️", label: "Job Preferences" },
    { id: "matching", icon: "📊", label: "Matching Results" },
    { id: "managejobs", icon: "📋", label: "Manage Jobs" },
    { id: "shortlisted", icon: "🏆", label: "Shortlisted" },
    { id: "notifications", icon: "🔔", label: "Notifications" },
  ];

  /* ===== STYLES (employer teal theme overrides) ===== */
  const tealActive = {
    background: "linear-gradient(135deg, #0d9488, #0891b2)",
    color: "white",
    borderColor: "#0d9488"
  };

  const tealBtn = {
    background: "linear-gradient(135deg, #0d9488, #0891b2)",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s"
  };

  return (
    <div style={{ padding: "30px", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "5px" }}>
        <h2 style={{ fontSize: "32px", fontWeight: "700", margin: 0, color: "#0f172a" }}>Settings</h2>
        <span style={{
          padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
          background: "linear-gradient(135deg, #0d9488, #0891b2)", color: "white",
          letterSpacing: "0.5px"
        }}>
          Employer
        </span>
      </div>
      <p style={{ color: "#64748b", marginBottom: "30px", fontSize: "15px" }}>
        Manage your company profile, jobs, and notification preferences.
      </p>

      {saveMsg && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: "#f0fdfa", border: "1px solid #99f6e4", color: "#0f766e",
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
              style={{
                padding: "10px 16px", fontSize: "13px",
                ...(activeTab === tab.id ? tealActive : {})
              }}
            >
              <span>{tab.icon}</span> {tab.label}
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="settings-content-area">

          {/* ===== COMPANY PROFILE ===== */}
          {activeTab === "profile" && (
            <>
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px", color: "#0f172a" }}>🏢 Company Profile</h3>
              <p className="settings-subtext">Manage your company name, description, and logo.</p>

              {employer && <VerificationStatus employer={employer} />}

              <div className="settings-row">
                <div className="settings-field">
                  <label>Company Name</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Enter company name" />
                </div>
                <div className="settings-field">
                  <label>Contact Person Name</label>
                  <input type="text" value={contactName} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
                </div>
              </div>

              <div className="settings-field" style={{ marginBottom: "20px" }}>
                <label>Company Description</label>
                <textarea
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Describe your company, culture, and what you do..."
                  style={{
                    width: "100%", minHeight: "120px", padding: "12px 16px", border: "1px solid #cbd5e1",
                    borderRadius: "8px", background: "#f8fafc", color: "#1e293b", fontSize: "14px",
                    fontFamily: "inherit", resize: "vertical", boxSizing: "border-box"
                  }}
                />
              </div>

              <div className="settings-field" style={{ maxWidth: "500px", marginBottom: "20px" }}>
                <label>Logo URL</label>
                <input type="text" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://example.com/logo.png" />
                {logo && (
                  <div style={{ marginTop: "12px", padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                    <img src={logo} alt="Company Logo" style={{ maxWidth: "120px", maxHeight: "120px", borderRadius: "8px", objectFit: "contain" }} onError={(e) => e.target.style.display = "none"} />
                  </div>
                )}
              </div>

              <div style={{ marginTop: "auto", paddingTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                <button style={tealBtn} onClick={handleSaveProfile} disabled={loading}>
                  {loading ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </>
          )}

          {/* ===== CONTACT INFO ===== */}
          {activeTab === "contact" && (
            <>
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px", color: "#0f172a" }}>📞 Contact Information</h3>
              <p className="settings-subtext">Update your company contact details.</p>

              <div className="settings-row">
                <div className="settings-field">
                  <label>Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="company@example.com" />
                </div>
                <div className="settings-field">
                  <label>Phone Number</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" />
                </div>
              </div>

              <div className="settings-field" style={{ maxWidth: "500px" }}>
                <label>Website</label>
                <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://www.yourcompany.com" />
              </div>

              <div style={{ marginTop: "auto", paddingTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                <button style={tealBtn} onClick={handleSaveContact} disabled={loading}>
                  {loading ? "Saving..." : "Save Contact Info"}
                </button>
              </div>
            </>
          )}

          {/* ===== SECURITY ===== */}
          {activeTab === "security" && (
            <>
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px", color: "#0f172a" }}>🔒 Security Settings</h3>
              <p className="settings-subtext">Change your password to keep your account secure.</p>

              <div className="settings-field" style={{ marginBottom: "16px", maxWidth: "400px" }}>
                <label>Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
              </div>
              <div className="settings-field" style={{ marginBottom: "16px", maxWidth: "400px" }}>
                <label>New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
              </div>
              <div className="settings-field" style={{ maxWidth: "400px" }}>
                <label>Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
              </div>

              <div style={{ marginTop: "20px", padding: "16px", background: "#fef3c7", borderRadius: "10px", borderLeft: "4px solid #f59e0b", fontSize: "13px", color: "#92400e", maxWidth: "500px" }}>
                <strong>Security Tip:</strong> Use a strong, unique password with letters, numbers, and symbols. Never share your password with anyone.
              </div>

              <div style={{ marginTop: "auto", paddingTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                <button style={tealBtn} onClick={handleChangePassword} disabled={loading}>
                  {loading ? "Changing..." : "Change Password"}
                </button>
              </div>
            </>
          )}

          {/* ===== JOB PREFERENCES ===== */}
          {activeTab === "jobprefs" && (
            <>
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px", color: "#0f172a" }}>⚙️ Job Posting Preferences</h3>
              <p className="settings-subtext">Configure default settings for your job postings.</p>

              <div className="settings-field" style={{ marginBottom: "20px", maxWidth: "500px" }}>
                <label>Default Sector</label>
                <input type="text" value={defaultSector} onChange={(e) => setDefaultSector(e.target.value)} placeholder="e.g. Technology, Healthcare, Finance" />
              </div>

              <div className="settings-field" style={{ marginBottom: "20px", maxWidth: "300px" }}>
                <label>Default Job Duration (days)</label>
                <input type="number" value={defaultJobDuration} onChange={(e) => setDefaultJobDuration(Number(e.target.value))} min="1" max="365" />
              </div>

              <div style={{ marginTop: "10px" }}>
                <Toggle label="Auto-Publish Jobs" desc="Automatically publish jobs without review" value={autoPublish} onChange={() => setAutoPublish(!autoPublish)} color="#0d9488" />
                <Toggle label="Require Skills" desc="Require candidates to have specific skills listed" value={requireSkills} onChange={() => setRequireSkills(!requireSkills)} color="#0d9488" />
              </div>

              <div style={{ marginTop: "auto", paddingTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                <button style={tealBtn} onClick={handleSaveJobPrefs} disabled={loading}>
                  {loading ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </>
          )}

          {/* ===== MATCHING RESULTS ===== */}
          {activeTab === "matching" && (
            <>
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px", color: "#0f172a" }}>📊 Matching Results</h3>
              <p className="settings-subtext">View AI-powered matching results for all applicants across your jobs.</p>

              {matchingResults.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
                  <h4 style={{ color: "#64748b", margin: "0 0 8px 0" }}>No matching results yet</h4>
                  <p style={{ fontSize: "14px" }}>Post jobs and receive applications to see match scores</p>
                </div>
              ) : (
                <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                        <th style={thStyle}>Job Title</th>
                        <th style={thStyle}>Applicant</th>
                        <th style={thStyle}>Score</th>
                        <th style={thStyle}>Matched Skills</th>
                        <th style={thStyle}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchingResults.map((r, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={tdStyle}><strong>{r.jobTitle}</strong></td>
                          <td style={tdStyle}>
                            <div>{r.applicantName}</div>
                            <div style={{ fontSize: "11px", color: "#94a3b8" }}>{r.applicantEmail}</div>
                          </td>
                          <td style={tdStyle}>
                            <span style={{
                              padding: "4px 12px", borderRadius: "20px", fontWeight: 700, fontSize: "12px",
                              background: getScoreBg(r.similarityScore), color: getScoreColor(r.similarityScore)
                            }}>
                              {r.similarityScore}%
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              {r.matchedSkills?.map((s, j) => (
                                <span key={j} style={{
                                  padding: "2px 8px", borderRadius: "10px", fontSize: "11px",
                                  background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0"
                                }}>{s}</span>
                              ))}
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <span style={{
                              padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
                              background: r.status === "accepted" ? "#ecfdf5" : r.status === "rejected" ? "#fef2f2" : "#fffbeb",
                              color: r.status === "accepted" ? "#059669" : r.status === "rejected" ? "#dc2626" : "#d97706"
                            }}>{r.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ===== MANAGE JOBS ===== */}
          {activeTab === "managejobs" && (
            <>
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px", color: "#0f172a" }}>📋 Manage Jobs</h3>
              <p className="settings-subtext">Edit, close, or delete your posted jobs.</p>

              {jobs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
                  <h4 style={{ color: "#64748b", margin: "0 0 8px 0" }}>No jobs posted yet</h4>
                  <p style={{ fontSize: "14px" }}>Post your first job to manage it here</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "16px", maxHeight: "500px", overflowY: "auto" }}>
                  {jobs.map(job => (
                    <div key={job._id} style={{
                      padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0",
                      background: editingJob === job._id ? "#f0fdfa" : "#f8fafc",
                      transition: "all 0.2s"
                    }}>
                      {editingJob === job._id ? (
                        /* Edit Mode */
                        <div>
                          <div className="settings-field" style={{ marginBottom: "12px" }}>
                            <label>Job Title</label>
                            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                          </div>
                          <div className="settings-field" style={{ marginBottom: "12px" }}>
                            <label>Description</label>
                            <textarea
                              value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                              style={{
                                width: "100%", minHeight: "80px", padding: "10px", border: "1px solid #cbd5e1",
                                borderRadius: "8px", fontSize: "14px", fontFamily: "inherit", boxSizing: "border-box"
                              }}
                            />
                          </div>
                          <div className="settings-field" style={{ marginBottom: "12px" }}>
                            <label>Skills (comma separated)</label>
                            <input type="text" value={editSkills} onChange={(e) => setEditSkills(e.target.value)} />
                          </div>
                          <div style={{ display: "flex", gap: "10px" }}>
                            <button style={{ ...tealBtn, padding: "8px 18px", fontSize: "13px" }} onClick={handleSaveEditJob} disabled={loading}>
                              {loading ? "Saving..." : "Save Changes"}
                            </button>
                            <button style={{ padding: "8px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: 600, fontSize: "13px" }} onClick={() => setEditingJob(null)}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#0f172a", fontWeight: 600 }}>{job.title}</h4>
                            <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#64748b", maxWidth: "500px" }}>
                              {job.description?.substring(0, 100)}{job.description?.length > 100 ? "..." : ""}
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <span style={{
                                padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600,
                                background: job.jobStatus === "approved" ? "#ecfdf5" : job.jobStatus === "rejected" ? "#fef2f2" : "#fffbeb",
                                color: job.jobStatus === "approved" ? "#059669" : job.jobStatus === "rejected" ? "#dc2626" : "#d97706"
                              }}>{job.jobStatus || job.status}</span>
                              <span style={{ fontSize: "12px", color: "#94a3b8" }}>👥 {job.applicantCount || 0} applicants</span>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                            <button style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid #0d9488", background: "white", color: "#0d9488", cursor: "pointer", fontWeight: 600, fontSize: "12px", transition: "all 0.2s" }} onClick={() => handleEditJob(job)}>
                              ✏️ Edit
                            </button>
                            {job.jobStatus !== "rejected" && (
                              <button style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid #f59e0b", background: "white", color: "#d97706", cursor: "pointer", fontWeight: 600, fontSize: "12px", transition: "all 0.2s" }} onClick={() => handleCloseJob(job._id)}>
                                🔒 Close
                              </button>
                            )}
                            <button style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid #ef4444", background: "white", color: "#dc2626", cursor: "pointer", fontWeight: 600, fontSize: "12px", transition: "all 0.2s" }} onClick={() => handleDeleteJob(job._id)}>
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ===== SHORTLISTED ===== */}
          {activeTab === "shortlisted" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: "600", margin: 0, color: "#0f172a" }}>🏆 Shortlisted Candidates</h3>
                <span style={{
                  padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700,
                  background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0"
                }}>≥70% Match</span>
              </div>
              <p className="settings-subtext">Candidates with high similarity scores based on AI matching.</p>

              {shortlisted.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏆</div>
                  <h4 style={{ color: "#64748b", margin: "0 0 8px 0" }}>No shortlisted candidates yet</h4>
                  <p style={{ fontSize: "14px" }}>Candidates scoring 70% or above on similarity will appear here</p>
                </div>
              ) : (
                <div style={{ display: "grid", gap: "14px", maxHeight: "500px", overflowY: "auto" }}>
                  {shortlisted.map((c, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "18px 20px", borderRadius: "12px", border: "1px solid #a7f3d0",
                      background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)"
                    }}>
                      <div>
                        <h4 style={{ margin: "0 0 4px 0", fontSize: "15px", color: "#0f172a", fontWeight: 600 }}>{c.applicantName}</h4>
                        <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#64748b" }}>{c.applicantEmail}</p>
                        <p style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#475569" }}>
                          Applied for: <strong>{c.jobTitle}</strong> {c.experience > 0 && `• ${c.experience} yrs exp`}
                        </p>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                          {c.matchedSkills?.map((s, j) => (
                            <span key={j} style={{
                              padding: "2px 8px", borderRadius: "10px", fontSize: "10px",
                              background: "#d1fae5", color: "#065f46", fontWeight: 500
                            }}>✓ {s}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{
                        width: "64px", height: "64px", borderRadius: "50%", display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "18px",
                        background: "linear-gradient(135deg, #ecfdf5, #d1fae5)", color: "#059669",
                        border: "2px solid #a7f3d0", flexShrink: 0
                      }}>
                        {c.similarityScore}%
                        <small style={{ fontSize: "8px", fontWeight: 500, opacity: 0.8 }}>match</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ===== NOTIFICATIONS ===== */}
          {activeTab === "notifications" && (
            <>
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px", color: "#0f172a" }}>🔔 Notification Settings</h3>
              <p className="settings-subtext">Configure email alerts for applications and matches.</p>

              <div style={{ marginTop: "10px" }}>
                <Toggle label="New Application Alerts" desc="Get notified when someone applies to your job" value={notifNewApp} onChange={() => setNotifNewApp(!notifNewApp)} color="#0d9488" />
                <Toggle label="Match Notifications" desc="Receive alerts for high-match candidates" value={notifMatch} onChange={() => setNotifMatch(!notifMatch)} color="#0d9488" />
                <Toggle label="Application Status Changes" desc="Know when application statuses are updated" value={notifStatus} onChange={() => setNotifStatus(!notifStatus)} color="#0d9488" />
                <Toggle label="Weekly Digest" desc="Get a weekly summary of applicants and job performance" value={notifWeekly} onChange={() => setNotifWeekly(!notifWeekly)} color="#0d9488" />
              </div>

              <div style={{ marginTop: "24px", padding: "16px", background: "#f0fdfa", borderRadius: "10px", borderLeft: "4px solid #0d9488", fontSize: "13px", color: "#134e4a" }}>
                <strong>💡 Tip:</strong> Enable email alerts to stay on top of new applications and never miss a great candidate.
              </div>

              <div style={{ marginTop: "auto", paddingTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                <button style={tealBtn} onClick={handleSaveNotifications} disabled={loading}>
                  {loading ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

/* ==================== SUB-COMPONENTS ==================== */

function Toggle({ label, desc, value, onChange, color = "#10b981" }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      marginBottom: "14px", padding: "14px 18px", border: "1px solid #e2e8f0",
      borderRadius: "10px", background: "#f8fafc"
    }}>
      <div>
        <span style={{ color: "#334155", fontWeight: "600", fontSize: "14px", display: "block" }}>{label}</span>
        {desc && <span style={{ color: "#94a3b8", fontSize: "12px" }}>{desc}</span>}
      </div>
      <button
        onClick={onChange}
        style={{
          border: "none", color: "white", padding: "6px 16px", borderRadius: "20px",
          cursor: "pointer", backgroundColor: value ? color : "#cbd5e1",
          fontWeight: "600", fontSize: "13px", transition: "all 0.2s ease", minWidth: "90px"
        }}
      >
        {value ? "ENABLED" : "DISABLED"}
      </button>
    </div>
  );
}

/* Table header/cell styles */
const thStyle = {
  textAlign: "left", padding: "10px 12px", fontSize: "12px", fontWeight: 700,
  color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px"
};

const tdStyle = {
  padding: "12px", verticalAlign: "middle"
};
