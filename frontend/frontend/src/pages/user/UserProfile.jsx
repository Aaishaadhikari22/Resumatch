import { useEffect, useState } from "react";
import API from "../../api/axios";
import { useToast, Toast } from "../../components/common/Toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import "../admin.css";

export default function UserProfile() {
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    address: "",
    city: ""
  });

  const [resumeData, setResumeData] = useState({
    title: "",
    experience: 0,
    education: "Any",
    resumeUrl: ""
  });

  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [resumeFile, setResumeFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const { showToast, toast, closeToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setFetching(true);
    try {
      const [profileRes, resumeRes] = await Promise.all([
        API.get("/user/profile"),
        API.get("/user/resume")
      ]);

      // Set profile data
      setProfileData({
        name: profileRes.data.name || "",
        email: profileRes.data.email || "",
        phone: profileRes.data.phone || "",
        gender: profileRes.data.gender || "",
        address: profileRes.data.address || "",
        city: profileRes.data.city || ""
      });

      // Set resume data
      if (resumeRes.data && resumeRes.data._id) {
        setResumeData({
          title: resumeRes.data.title || "",
          experience: resumeRes.data.experience || 0,
          education: resumeRes.data.education || "Any",
          resumeUrl: resumeRes.data.resumeUrl || ""
        });
        setSkills(resumeRes.data.skills || []);
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setFetching(false);
    }
  };

  const handleAddSkill = (e) => {
    if ((e.key === "Enter" || e.key === ",") && skillInput.trim()) {
      e.preventDefault();

      const parts = skillInput.split(',').map(s => s.trim()).filter(Boolean);
      let updatedSkills = [...skills];
      let hasError = false;

      parts.forEach(newSkill => {
        if (updatedSkills.some(s => s.toLowerCase() === newSkill.toLowerCase())) {
          return;
        }
        if (!/^[a-zA-Z0-9\s\-\.\+#]+$/.test(newSkill)) {
          hasError = true;
          return;
        }
        updatedSkills.push(newSkill);
      });

      if (hasError) {
        showToast("Some skills contained invalid characters and were skipped", "warning");
      }

      setSkills(updatedSkills);
      setSkillInput("");
    }
  };

  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type === "application/pdf") {
        setResumeFile(file);
        showToast("✓ Resume file selected", "success");
      } else {
        showToast("Please upload a PDF file", "error");
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        setResumeFile(file);
        showToast("✓ Resume file selected", "success");
      } else {
        showToast("Please upload a PDF file", "error");
      }
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await API.put("/user/profile", profileData);
      showToast("✓ Profile updated successfully!", "success");
      // Form stays populated. Refresh from DB to confirm it's in sync
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResume = async (e) => {
    e.preventDefault();

    let finalSkills = [...skills];
    if (skillInput.trim()) {
      const parts = skillInput.split(',').map(s => s.trim()).filter(Boolean);
      parts.forEach(newSkill => {
        if (!finalSkills.some(s => s.toLowerCase() === newSkill.toLowerCase()) && /^[a-zA-Z0-9\s\-\.\+#]+$/.test(newSkill)) {
          finalSkills.push(newSkill);
        }
      });
      setSkills(finalSkills);
      setSkillInput("");
    }

    if (finalSkills.length === 0) {
      showToast("Please add at least one skill", "warning");
      return;
    }

    setLoading(true);

    try {
      let updatedResumeUrl = resumeData.resumeUrl;
      // If file is uploaded, upload it first
      if (resumeFile) {
        const formData = new FormData();
        formData.append("resume", resumeFile);
        // Upload file and get URL
        const fileRes = await API.post("/user/resume/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        updatedResumeUrl = fileRes.data.resumeUrl;
        resumeData.resumeUrl = updatedResumeUrl;
      }

      await API.post("/user/resume", {
        title: resumeData.title,
        experience: resumeData.experience,
        education: resumeData.education,
        resumeUrl: updatedResumeUrl,
        skills: finalSkills
      });

      showToast("✓ Resume & Profile updated successfully!", "success");
      setResumeFile(null);
      // Prevent going blank, verify by refetching from DB
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to update resume", "error");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <LoadingSpinner />;

  return (
    <div className="admin-page">
      <Toast message={toast?.message} type={toast?.type} onClose={closeToast} />

      <h2 style={{ fontSize: "32px", marginBottom: "8px", fontWeight: "700" }}>
        My Profile & Resume 👤
      </h2>
      <p style={{ color: "#64748b", marginBottom: "30px", fontSize: "15px" }}>
        Complete your profile and resume to get the best job recommendations
      </p>

      {/* Tab Navigation */}
      <div style={{ display: "flex", marginBottom: "30px", borderBottom: "1px solid #e2e8f0" }}>
        <button
          onClick={() => setActiveTab("profile")}
          style={{
            padding: "12px 24px",
            border: "none",
            background: activeTab === "profile" ? "#3b82f6" : "transparent",
            color: activeTab === "profile" ? "white" : "#64748b",
            fontWeight: "600",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          📝 Profile Information
        </button>
        <button
          onClick={() => setActiveTab("resume")}
          style={{
            padding: "12px 24px",
            border: "none",
            background: activeTab === "resume" ? "#3b82f6" : "transparent",
            color: activeTab === "resume" ? "white" : "#64748b",
            fontWeight: "600",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          📋 Resume & Skills
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="admin-card" style={{ maxWidth: "800px" }}>
          <form onSubmit={handleSaveProfile} className="admin-form">
            <h3 style={{ marginBottom: "20px", color: "#1e293b" }}>Personal Information</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>
                  Full Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                  onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>
                  Email Address <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                  onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                  onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>
                  Gender
                </label>
                <select
                  value={profileData.gender}
                  onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.2s",
                    background: "white"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                  onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>
                  City
                </label>
                <input
                  type="text"
                  value={profileData.city}
                  onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                  onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>
                  Address
                </label>
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                  onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 24px",
                background: loading ? "#cbd5e1" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => !loading && (e.target.style.background = "#2563eb")}
              onMouseOut={(e) => !loading && (e.target.style.background = "#3b82f6")}
            >
              {loading ? "Saving..." : "💾 Save Profile"}
            </button>
          </form>
        </div>
      )}

      {/* Resume Tab */}
      {activeTab === "resume" && (
        <div className="admin-card" style={{ maxWidth: "800px" }}>
          <form onSubmit={handleSaveResume} className="admin-form">
            <h3 style={{ marginBottom: "20px", color: "#1e293b" }}>Resume Information</h3>

            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>
                Professional Title <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Frontend Developer, Data Scientist, etc."
                value={resumeData.title}
                onChange={(e) => setResumeData({...resumeData, title: e.target.value})}
                required
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none",
                  transition: "all 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>
                  Years of Experience <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  max="70"
                  value={resumeData.experience}
                  onChange={(e) => setResumeData({...resumeData, experience: Math.max(0, Number(e.target.value))})}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                  onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>
                  Education Level <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  value={resumeData.education}
                  onChange={(e) => setResumeData({...resumeData, education: e.target.value})}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.2s",
                    background: "white"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                  onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                >
                  <option value="Any">Any</option>
                  <option value="High School">High School</option>
                  <option value="Associate">Associate Degree</option>
                  <option value="Bachelor's">Bachelor's Degree</option>
                  <option value="Master's">Master's Degree</option>
                  <option value="Ph.D.">Ph.D.</option>
                </select>
              </div>
            </div>

            {/* Resume Upload - Drag and Drop */}
            <div style={{ marginBottom: "25px" }}>
               <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>
                 📄 Upload Resume / CV (PDF)
               </label>
               
               <div
                 onDragEnter={handleDrag}
                 onDragLeave={handleDrag}
                 onDragOver={handleDrag}
                 onDrop={handleDrop}
                 style={{
                   padding: "30px",
                   borderRadius: "12px",
                   border: dragActive ? "2px dashed #3b82f6" : "2px dashed #cbd5e1",
                   background: dragActive ? "#eff6ff" : "#f8fafc",
                   textAlign: "center",
                   transition: "all 0.2s",
                   cursor: "pointer"
                 }}
               >
                 <input
                   type="file"
                   accept=".pdf"
                   onChange={handleFileChange}
                   id="resumeFile"
                   style={{ display: "none" }}
                 />
                 
                 <label htmlFor="resumeFile" style={{ cursor: "pointer" }}>
                   <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "8px" }}>
                     {resumeFile ? `✓ ${resumeFile.name}` : "Drag and drop your PDF here or click to browse"}
                   </p>
                   <p style={{ fontSize: "12px", color: "#94a3b8" }}>
                     Maximum file size: 10MB
                   </p>
                 </label>
               </div>

               {resumeData.resumeUrl && resumeData.resumeUrl !== 'pending' && !resumeFile && (
                 <p style={{ fontSize: "13px", color: "#3b82f6", marginTop: "10px" }}>
                   💾 Current resume: <a href={resumeData.resumeUrl.startsWith('http') ? resumeData.resumeUrl : `http://localhost:5000${resumeData.resumeUrl}`} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "underline" }}>View</a>
                 </p>
               )}
            </div>

            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>
                Skills <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Type a skill and press Enter (e.g. JavaScript, Python, React)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none",
                  transition: "all 0.2s",
                  marginBottom: "10px"
                }}
                onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    style={{
                      background: "#e0f2fe",
                      color: "#0277bd",
                      padding: "6px 12px",
                      borderRadius: "16px",
                      fontSize: "13px",
                      fontWeight: "500",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0277bd",
                        cursor: "pointer",
                        fontSize: "16px",
                        lineHeight: "1",
                        padding: "0",
                        marginLeft: "4px"
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {skills.length === 0 && (
                <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "5px" }}>
                  Add your technical skills, programming languages, and expertise areas
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px 24px",
                background: loading ? "#cbd5e1" : "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => !loading && (e.target.style.background = "#059669")}
              onMouseOut={(e) => !loading && (e.target.style.background = "#10b981")}
            >
              {loading ? "Saving..." : "💾 Save Resume"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}