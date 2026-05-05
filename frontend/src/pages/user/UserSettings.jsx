import { useState, useEffect } from "react";
import API from "../../api/axios";
import "../admin.css";
import "../settingsLayout.css";
import ProfileCompletion from "../../components/ProfileCompletion";

export default function UserSettings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Profile
  const [fullName, setFullName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [headline, setHeadline] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

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

  // Notifications
  const [notifJobs, setNotifJobs] = useState(true);
  const [notifApps, setNotifApps] = useState(true);
  const [notifMatch, setNotifMatch] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(true);

  // Stats for monitoring/reports
  const [stats, setStats] = useState(null);

  // Applications for monitoring
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    fetchProfile();
    fetchAlgorithmSettings();
  }, []);

  useEffect(() => {
    if (activeTab === "notifications") fetchNotificationPrefs();
    if (activeTab === "monitoring" || activeTab === "reports") { fetchStats(); fetchApplications(); }
  }, [activeTab]);

  /* ===== API CALLS ===== */

  const fetchProfile = async () => {
    try {
      const res = await API.get("/user/profile");
      setFullName(res.data.name || "");
      setEmailAddress(res.data.email || "");
      setHeadline(res.data.headline || "");
      setPhone(res.data.phone || "");
      setAddress(res.data.address || "");
      setCity(res.data.city || "");
      setGender(res.data.gender || "");
      setBio(res.data.bio || "");
      if(res.data.dateOfBirth) setDateOfBirth(new Date(res.data.dateOfBirth).toISOString().split('T')[0]);
    } catch (err) { console.log(err); }
  };

  const fetchAlgorithmSettings = async () => {
    try {
      const res = await API.get("/user/algorithm-settings");
      const s = res.data;
      setWeightSkills(s.weightSkills ?? 40);
      setWeightExperience(s.weightExperience ?? 25);
      setWeightEducation(s.weightEducation ?? 20);
      setWeightKeywords(s.weightKeywords ?? 15);
      setMinimumSimilarityThreshold(s.minimumSimilarityThreshold ?? 50);
    } catch (err) { console.log(err); }
  };

  const fetchNotificationPrefs = async () => {
    try {
      const res = await API.get("/user/notifications");
      setNotifJobs(res.data.jobAlerts ?? true);
      setNotifApps(res.data.applicationUpdates ?? true);
      setNotifMatch(res.data.matchNotifications ?? true);
      setNotifWeekly(res.data.weeklyDigest ?? true);
    } catch (err) { console.log(err); }
  };

  const fetchStats = async () => {
    try {
      const res = await API.get("/user/stats");
      setStats(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchApplications = async () => {
    try {
      const res = await API.get("/user/applications");
      setApplications(res.data);
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
      await API.put("/user/profile", { name: fullName, email: emailAddress, headline, phone, address, city, gender, bio, dateOfBirth });
      showSave("Profile updated successfully ✅");
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to update profile");
    } finally { setLoading(false); }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) return alert("New passwords do not match");
    if (newPassword.length < 6) return alert("Password must be at least 6 characters");
    try {
      setLoading(true);
      await API.put("/user/change-password", { currentPassword, newPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      showSave("Password changed successfully ✅");
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to change password");
    } finally { setLoading(false); }
  };

  const handleSaveNotifications = async () => {
    try {
      setLoading(true);
      await API.put("/user/notifications", {
        jobAlerts: notifJobs,
        applicationUpdates: notifApps,
        matchNotifications: notifMatch,
        weeklyDigest: notifWeekly
      });
      showSave("Notification settings saved ✅");
    } catch (err) {
      alert(err.response?.data?.msg || "Failed to save");
    } finally { setLoading(false); }
  };

  const weightTotal = weightSkills + weightExperience + weightEducation + weightKeywords;

  /* ===== TABS ===== */

  const tabs = [
    { id: "verification", icon: "✓", label: "Verification" },
    { id: "profile", icon: "👤", label: "Profile" },
    { id: "security", icon: "🔒", label: "Security" },
    { id: "algorithm", icon: "🧠", label: "Algorithm" },
    { id: "notifications", icon: "🔔", label: "Notifications" },
    { id: "monitoring", icon: "📊", label: "Monitoring" },
    { id: "reports", icon: "📄", label: "Reports" },
  ];

  return (
    <div className="admin-page" style={{ background: "#f8fafc" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "5px" }}>
        <h2 style={{ fontSize: "32px", fontWeight: "700", margin: 0 }}>Settings</h2>
        <span style={{
          padding: "5px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
          background: "linear-gradient(135deg, #10b981, #059669)", color: "white",
          letterSpacing: "0.5px"
        }}>
          Job Seeker
        </span>
      </div>
      <p style={{ color: "#64748b", marginBottom: "30px", fontSize: "15px" }}>
        Manage your profile, security, and notification preferences.
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

          {/* ===== VERIFICATION ===== */}
          {activeTab === "verification" && (
            <ProfileCompletion showWarnings={true} onEditProfile={() => setActiveTab("profile")} />
          )}

          {/* ===== PROFILE ===== */}
          {activeTab === "profile" && (
            <>
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px" }}>Profile Information</h3>
              <p className="settings-subtext">Update your personal and contact details.</p>

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
              
              <div className="settings-row">
                <div className="settings-field">
                  <label>Professional Headline</label>
                  <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Full Stack Developer | Product Builder" />
                </div>
                <div className="settings-field">
                  <label>Phone Number</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" />
                </div>
              </div>
              
              <div className="settings-row">
                <div className="settings-field">
                  <label>Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", backgroundColor: "#f8fafc" }}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="settings-row">
                <div className="settings-field">
                  <label>Address</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your address" />
                </div>
                <div className="settings-field">
                  <label>City</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Enter your city" />
                </div>
              </div>
              
              <div className="settings-row">
                <div className="settings-field">
                  <label>Date of Birth</label>
                  <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", backgroundColor: "#f8fafc" }} />
                </div>
                <div className="settings-field"></div>
              </div>

              <div className="settings-field" style={{ marginBottom: "16px" }}>
                  <label>Professional Bio</label>
                  <textarea 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)} 
                    placeholder="Tell employers a bit about yourself..."
                    rows="4"
                    style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", backgroundColor: "#f8fafc", width: "100%", resize: "vertical" }}
                  ></textarea>
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
              <p className="settings-subtext">Change your password to keep your account secure.</p>

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
                <strong>Security Tip:</strong> Use a strong, unique password with letters, numbers, and symbols. Never share your password with anyone.
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
              <p className="settings-subtext">See how the AI matches your resume to job postings. These settings are configured by the platform administrators.</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
                <ReadOnlySlider label="Skill Weight" value={weightSkills} color="#10b981" />
                <ReadOnlySlider label="Experience Weight" value={weightExperience} color="#3b82f6" />
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
                    background: `linear-gradient(90deg, #10b981 ${minimumSimilarityThreshold}%, #e2e8f0 ${minimumSimilarityThreshold}%)`
                  }} />
                  <span style={{ fontWeight: 700, fontSize: "18px", color: "#1e293b", minWidth: "50px" }}>{minimumSimilarityThreshold}%</span>
                </div>
                <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px" }}>
                  Jobs below this threshold won't appear in your recommendations
                </p>
              </div>

              <div style={{ padding: "16px", background: "#f0fdf4", borderRadius: "10px", borderLeft: "4px solid #10b981", fontSize: "13px", color: "#166534" }}>
                <strong>💡 Tip:</strong> To improve your match scores, make sure your resume skills align closely with the job requirements. Upload your latest resume from the Resume page.
              </div>
            </>
          )}

          {/* ===== NOTIFICATIONS ===== */}
          {activeTab === "notifications" && (
            <>
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px" }}>🔔 Notification Preferences</h3>
              <p className="settings-subtext">Choose which notifications you'd like to receive.</p>

              <div style={{ marginTop: "10px" }}>
                <Toggle label="New Job Alerts" desc="Get notified when new jobs match your skills" value={notifJobs} onChange={() => setNotifJobs(!notifJobs)} />
                <Toggle label="Application Status Updates" desc="Know when employers review your applications" value={notifApps} onChange={() => setNotifApps(!notifApps)} />
                <Toggle label="AI Match Notifications" desc="Receive alerts for high-match job recommendations" value={notifMatch} onChange={() => setNotifMatch(!notifMatch)} />
                <Toggle label="Weekly Job Digest" desc="Get a weekly summary of relevant job opportunities" value={notifWeekly} onChange={() => setNotifWeekly(!notifWeekly)} />
              </div>

              <div className="save-action-row">
                <button className="save-btn" onClick={handleSaveNotifications} disabled={loading}>
                  {loading ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </>
          )}

          {/* ===== MONITORING ===== */}
          {activeTab === "monitoring" && (
            <>
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px" }}>📊 Application Monitoring</h3>
              <p className="settings-subtext">Track your job applications and activity at a glance.</p>

              {!stats ? (
                <p style={{ color: "#94a3b8" }}>Loading stats...</p>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "30px" }}>
                    <StatCard icon="📋" label="Total Applications" value={stats.totalApplications} color="#3b82f6" />
                    <StatCard icon="⏳" label="Pending" value={stats.pendingApplications} color="#f59e0b" />
                    <StatCard icon="👀" label="Reviewed" value={stats.reviewedApplications} color="#8b5cf6" />
                    <StatCard icon="✅" label="Accepted" value={stats.acceptedApplications} color="#10b981" />
                    <StatCard icon="❌" label="Rejected" value={stats.rejectedApplications} color="#ef4444" />
                    <StatCard icon="💼" label="Saved Jobs" value={stats.savedJobsCount} color="#0d9488" />
                  </div>

                  <h4 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", marginBottom: "14px" }}>Recent Applications</h4>
                  {applications.length === 0 ? (
                    <p style={{ color: "#94a3b8", textAlign: "center", padding: "20px" }}>No applications yet. Start applying to jobs!</p>
                  ) : (
                    <div style={{ display: "grid", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
                      {applications.slice(0, 15).map(app => (
                        <div key={app._id} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "13px"
                        }}>
                          <div>
                            <strong style={{ color: "#0f172a" }}>{app.job?.title || "Untitled Job"}</strong>
                            <span style={{ color: "#94a3b8", margin: "0 8px" }}>at</span>
                            <span style={{ color: "#475569" }}>{app.employer?.companyName || "Unknown"}</span>
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
              <h3 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px" }}>📄 Activity Reports</h3>
              <p className="settings-subtext">View summaries of your job search activity.</p>

              {!stats ? (
                <p style={{ color: "#94a3b8" }}>Loading report data...</p>
              ) : (
                <>
                  <div style={{ display: "grid", gap: "16px", maxWidth: "600px" }}>
                    <ReportCard
                      title="Application Summary"
                      description={`${stats.totalApplications} total applications — ${stats.acceptedApplications} accepted, ${stats.pendingApplications} pending, ${stats.rejectedApplications} rejected`}
                      icon="📋"
                    />
                    <ReportCard
                      title="Profile Strength"
                      description={`${stats.skillsCount} skills on resume • ${stats.savedJobsCount} saved jobs • Member since ${new Date(stats.memberSince).toLocaleDateString()}`}
                      icon="💪"
                    />
                    <ReportCard
                      title="Application Success Rate"
                      description={stats.totalApplications > 0 
                        ? `${Math.round((stats.acceptedApplications / stats.totalApplications) * 100)}% acceptance rate out of ${stats.totalApplications} applications`
                        : "No applications yet — start applying to see your success rate!"}
                      icon="📊"
                    />
                    <ReportCard
                      title="Review Progress"
                      description={stats.totalApplications > 0
                        ? `${Math.round(((stats.reviewedApplications + stats.acceptedApplications + stats.rejectedApplications) / stats.totalApplications) * 100)}% of your applications have been reviewed`
                        : "Submit applications to track review progress"}
                      icon="👀"
                    />
                  </div>

                  <div style={{ marginTop: "24px", padding: "16px", background: "#f0fdf4", borderRadius: "10px", borderLeft: "4px solid #10b981", fontSize: "13px", color: "#166534" }}>
                    <strong>💡 Tip:</strong> Improve your acceptance rate by tailoring your resume skills to match the job descriptions. High-match scores lead to better results!
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

function Toggle({ label, desc, value, onChange }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", padding: "14px 18px", border: "1px solid #e2e8f0", borderRadius: "10px", background: "#f8fafc" }}>
      <div>
        <span style={{ color: "#334155", fontWeight: "600", fontSize: "14px", display: "block" }}>{label}</span>
        {desc && <span style={{ color: "#94a3b8", fontSize: "12px" }}>{desc}</span>}
      </div>
      <button
        onClick={onChange}
        style={{
          border: "none", color: "white", padding: "6px 16px", borderRadius: "20px",
          cursor: "pointer", backgroundColor: value ? "#10b981" : "#cbd5e1",
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

function StatCard({ icon, label, value, color }) {
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
      <div style={{ fontSize: "28px", fontWeight: 700, color: "#0f172a" }}>{value}</div>
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
        background: "linear-gradient(135deg, #d1fae5, #ecfdf5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "20px", flexShrink: 0
      }}>{icon}</div>
      <div>
        <h4 style={{ margin: "0 0 6px 0", fontSize: "15px", color: "#0f172a", fontWeight: 600 }}>{title}</h4>
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: "1.5" }}>{description}</p>
      </div>
    </div>
  );
}
