import { useEffect, useState } from "react";
import API from "../../api/axios";
import { useToast } from "../../hooks/useToast";
import Toast from "../../components/common/Toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import "../admin.css";

export default function UserProfile() {
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    address: "",
    city: "",
    bio: "",
    dateOfBirth: "",
    headline: "",
    portfolioWebsite: "",
    linkedinProfile: "",
    githubProfile: ""
  });

  const [resumeData, setResumeData] = useState({
    title: "",
    experience: 0,
    education: "Any",
    resumeUrl: "",
    expectedSalary: 0
  });

  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  
  const [languages, setLanguages] = useState([]);
  const [languageInput, setLanguageInput] = useState("");

  const [workExperiences, setWorkExperiences] = useState([]);
  const [educationHistory, setEducationHistory] = useState([]);

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
        city: profileRes.data.city || "",
        bio: profileRes.data.bio || "",
        dateOfBirth: profileRes.data.dateOfBirth ? new Date(profileRes.data.dateOfBirth).toISOString().split('T')[0] : "",
        headline: profileRes.data.headline || "",
        portfolioWebsite: profileRes.data.portfolioWebsite || "",
        linkedinProfile: profileRes.data.linkedinProfile || "",
        githubProfile: profileRes.data.githubProfile || ""
      });

      // Set resume data
      if (resumeRes.data && resumeRes.data._id) {
        setResumeData({
          title: resumeRes.data.title || "",
          experience: resumeRes.data.experience || 0,
          education: resumeRes.data.education || "Any",
          resumeUrl: resumeRes.data.resumeUrl || "",
          expectedSalary: resumeRes.data.expectedSalary || 0
        });
        setSkills(resumeRes.data.skills || []);
        setLanguages(resumeRes.data.languages || []);
        
        // Format dates for inputs
        const formattedWork = (resumeRes.data.workExperiences || []).map(w => ({
          ...w,
          startDate: w.startDate ? new Date(w.startDate).toISOString().split('T')[0] : "",
          endDate: w.endDate ? new Date(w.endDate).toISOString().split('T')[0] : ""
        }));
        setWorkExperiences(formattedWork);
        
        const formattedEducation = (resumeRes.data.educationHistory || []).map(e => ({
          ...e,
          startDate: e.startDate ? new Date(e.startDate).toISOString().split('T')[0] : "",
          endDate: e.endDate ? new Date(e.endDate).toISOString().split('T')[0] : ""
        }));
        setEducationHistory(formattedEducation);
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setFetching(false);
    }
  };

  const handleAddArrayItem = (e, inputState, setInputState, arrayState, setArrayState) => {
    if ((e.key === "Enter" || e.key === ",") && inputState.trim()) {
      e.preventDefault();

      const parts = inputState.split(',').map(s => s.trim()).filter(Boolean);
      let updatedArray = [...arrayState];
      let hasError = false;

      parts.forEach(newItem => {
        if (updatedArray.some(s => s.toLowerCase() === newItem.toLowerCase())) {
          return;
        }
        if (!/^[a-zA-Z0-9\s\-.+]+$/.test(newItem)) {
          hasError = true;
          return;
        }
        updatedArray.push(newItem);
      });

      if (hasError) {
        showToast("Some entries contained invalid characters and were skipped", "warning");
      }

      setArrayState(updatedArray);
      setInputState("");
    }
  };

  const removeArrayItem = (index, arrayState, setArrayState) => {
    setArrayState(arrayState.filter((_, i) => i !== index));
  };
  
  // Work Experience Form Handlers
  const addWorkExperience = () => {
    setWorkExperiences([...workExperiences, { company: "", position: "", startDate: "", endDate: "", description: "" }]);
  };

  const removeWorkExperience = (index) => {
    setWorkExperiences(workExperiences.filter((_, i) => i !== index));
  };
  
  const updateWorkExperience = (index, field, value) => {
    const updated = [...workExperiences];
    updated[index][field] = value;
    setWorkExperiences(updated);
  };
  
  // Education History Form Handlers
  const addEducation = () => {
    setEducationHistory([...educationHistory, { institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "" }]);
  };

  const removeEducation = (index) => {
    setEducationHistory(educationHistory.filter((_, i) => i !== index));
  };
  
  const updateEducation = (index, field, value) => {
    const updated = [...educationHistory];
    updated[index][field] = value;
    setEducationHistory(updated);
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
        if (!finalSkills.some(s => s.toLowerCase() === newSkill.toLowerCase()) && /^[a-zA-Z0-9\s\-.+]+$/.test(newSkill)) {
          finalSkills.push(newSkill);
        }
      });
      setSkills(finalSkills);
      setSkillInput("");
    }

    let finalLanguages = [...languages];
    if (languageInput.trim()) {
      const parts = languageInput.split(',').map(s => s.trim()).filter(Boolean);
      parts.forEach(newLang => {
        if (!finalLanguages.some(s => s.toLowerCase() === newLang.toLowerCase()) && /^[a-zA-Z0-9\s\-.+]+$/.test(newLang)) {
          finalLanguages.push(newLang);
        }
      });
      setLanguages(finalLanguages);
      setLanguageInput("");
    }

    if (finalSkills.length === 0) {
      showToast("Please add at least one skill", "warning");
      return;
    }

    setLoading(true);

    try {
      let updatedResumeUrl = resumeData.resumeUrl;
      if (resumeFile) {
        const formData = new FormData();
        formData.append("resume", resumeFile);
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
        expectedSalary: resumeData.expectedSalary,
        skills: finalSkills,
        languages: finalLanguages,
        workExperiences: workExperiences,
        educationHistory: educationHistory
      });

      showToast("✓ Resume & Professional History updated successfully!", "success");
      setResumeFile(null);
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
          📋 Resume, Experience & Skills
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="admin-card" style={{ maxWidth: "800px" }}>
          <form onSubmit={handleSaveProfile} className="admin-form">
            <h3 style={{ marginBottom: "20px", color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>Personal Information</h3>

            <div style={{ marginBottom: "25px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>
                  Professional Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full Stack Developer | UI/UX Enthusiast"
                  value={profileData.headline}
                  onChange={(e) => setProfileData({...profileData, headline: e.target.value})}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", transition: "all 0.2s" }}
                  onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                  onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>Full Name <span style={{ color: "#ef4444" }}>*</span></label>
                <input type="text" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} required style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>Email Address <span style={{ color: "#ef4444" }}>*</span></label>
                <input type="email" value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} required style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>Phone Number</label>
                <input type="tel" value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>Gender</label>
                <select value={profileData.gender} onChange={(e) => setProfileData({...profileData, gender: e.target.value})} style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", background: "white" }}>
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
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>City</label>
                <input type="text" value={profileData.city} onChange={(e) => setProfileData({...profileData, city: e.target.value})} style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>Address</label>
                <input type="text" value={profileData.address} onChange={(e) => setProfileData({...profileData, address: e.target.value})} style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }} />
              </div>
            </div>

            <h3 style={{ marginBottom: "20px", marginTop: "35px", color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>Online Presence & Bio</h3>

            <div style={{ marginBottom: "25px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>About / Bio</label>
              <textarea value={profileData.bio} onChange={(e) => setProfileData({...profileData, bio: e.target.value})} rows="4" style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", resize: "vertical" }} placeholder="Tell employers a little about yourself..."></textarea>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "25px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "13px" }}>Portfolio / Website</label>
                <input type="url" placeholder="https://" value={profileData.portfolioWebsite} onChange={(e) => setProfileData({...profileData, portfolioWebsite: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "13px" }}>LinkedIn Profile</label>
                <input type="url" placeholder="https://linkedin.com/in/..." value={profileData.linkedinProfile} onChange={(e) => setProfileData({...profileData, linkedinProfile: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "13px" }}>GitHub Profile</label>
                <input type="url" placeholder="https://github.com/..." value={profileData.githubProfile} onChange={(e) => setProfileData({...profileData, githubProfile: e.target.value})} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }} />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ padding: "12px 24px", background: loading ? "#cbd5e1" : "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s" }} >
              {loading ? "Saving..." : "💾 Save Profile"}
            </button>
          </form>
        </div>
      )}

      {/* Resume Tab */}
      {activeTab === "resume" && (
        <div className="admin-card" style={{ maxWidth: "800px" }}>
          <form onSubmit={handleSaveResume} className="admin-form">
            <h3 style={{ marginBottom: "20px", color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>Job Preferences</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>Professional Title / Role <span style={{ color: "#ef4444" }}>*</span></label>
                <input type="text" placeholder="e.g. Senior Frontend Developer" value={resumeData.title} onChange={(e) => setResumeData({...resumeData, title: e.target.value})} required style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>Expected Salary (Annual/Monthly)</label>
                <input type="number" placeholder="e.g. 50000" min="0" value={resumeData.expectedSalary} onChange={(e) => setResumeData({...resumeData, expectedSalary: Number(e.target.value)})} style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }} />
              </div>
            </div>

            <h3 style={{ marginBottom: "20px", marginTop: "35px", color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>Work Experience</h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <p style={{ color: "#64748b", fontSize: "14px" }}>List your previous roles and their responsibilities.</p>
              <button type="button" onClick={addWorkExperience} style={{ padding: "8px 16px", background: "#f8fafc", color: "#3b82f6", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>+ Add Experience</button>
            </div>
            
            {workExperiences.map((exp, index) => (
              <div key={index} style={{ padding: "20px", border: "1px solid #e2e8f0", borderRadius: "10px", marginBottom: "20px", background: "#f8fafc", position: "relative" }}>
                <button type="button" onClick={() => removeWorkExperience(index)} style={{ position: "absolute", top: "15px", right: "15px", background: "#fee2e2", border: "none", color: "#ef4444", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: "bold" }}>×</button>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px", paddingRight: "30px" }}>
                  <div><label style={{ display: "block", fontSize: "13px", color: "#475569", marginBottom: "5px" }}>Company <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="text" value={exp.company} onChange={(e) => updateWorkExperience(index, "company", e.target.value)} required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} /></div>
                  <div><label style={{ display: "block", fontSize: "13px", color: "#475569", marginBottom: "5px" }}>Position / Title <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="text" value={exp.position} onChange={(e) => updateWorkExperience(index, "position", e.target.value)} required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px", paddingRight: "30px" }}>
                  <div><label style={{ display: "block", fontSize: "13px", color: "#475569", marginBottom: "5px" }}>Start Date</label>
                  <input type="date" value={exp.startDate} onChange={(e) => updateWorkExperience(index, "startDate", e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} /></div>
                  <div><label style={{ display: "block", fontSize: "13px", color: "#475569", marginBottom: "5px" }}>End Date (Leave blank if present)</label>
                  <input type="date" value={exp.endDate} onChange={(e) => updateWorkExperience(index, "endDate", e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} /></div>
                </div>
                <div><label style={{ display: "block", fontSize: "13px", color: "#475569", marginBottom: "5px" }}>Description</label>
                  <textarea rows="3" value={exp.description} onChange={(e) => updateWorkExperience(index, "description", e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}></textarea></div>
              </div>
            ))}

            <h3 style={{ marginBottom: "20px", marginTop: "35px", color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>Education History</h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <p style={{ color: "#64748b", fontSize: "14px" }}>List your relevant degrees and institutions.</p>
              <button type="button" onClick={addEducation} style={{ padding: "8px 16px", background: "#f8fafc", color: "#3b82f6", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>+ Add Education</button>
            </div>

            {educationHistory.map((edu, index) => (
              <div key={index} style={{ padding: "20px", border: "1px solid #e2e8f0", borderRadius: "10px", marginBottom: "20px", background: "#f8fafc", position: "relative" }}>
                <button type="button" onClick={() => removeEducation(index)} style={{ position: "absolute", top: "15px", right: "15px", background: "#fee2e2", border: "none", color: "#ef4444", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: "bold" }}>×</button>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px", paddingRight: "30px" }}>
                  <div><label style={{ display: "block", fontSize: "13px", color: "#475569", marginBottom: "5px" }}>Institution / School <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="text" value={edu.institution} onChange={(e) => updateEducation(index, "institution", e.target.value)} required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} /></div>
                  <div><label style={{ display: "block", fontSize: "13px", color: "#475569", marginBottom: "5px" }}>Degree <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="text" value={edu.degree} onChange={(e) => updateEducation(index, "degree", e.target.value)} required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px", paddingRight: "30px" }}>
                  <div><label style={{ display: "block", fontSize: "13px", color: "#475569", marginBottom: "5px" }}>Start Date</label>
                  <input type="date" value={edu.startDate} onChange={(e) => updateEducation(index, "startDate", e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} /></div>
                  <div><label style={{ display: "block", fontSize: "13px", color: "#475569", marginBottom: "5px" }}>End Date</label>
                  <input type="date" value={edu.endDate} onChange={(e) => updateEducation(index, "endDate", e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} /></div>
                </div>
                <div><label style={{ display: "block", fontSize: "13px", color: "#475569", marginBottom: "5px" }}>Field of Study</label>
                  <input type="text" value={edu.fieldOfStudy} onChange={(e) => updateEducation(index, "fieldOfStudy", e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} /></div>
              </div>
            ))}

            <h3 style={{ marginBottom: "20px", marginTop: "35px", color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>Skills & Capabilities</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px", marginBottom: "25px" }}>
              
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>Total Years of Experience <span style={{ color: "#ef4444" }}>*</span></label>
                <input type="number" placeholder="0" min="0" max="70" value={resumeData.experience} onChange={(e) => setResumeData({...resumeData, experience: Math.max(0, Number(e.target.value))})} required style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" }} />
              </div>

               <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>Professional Skills <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="text" placeholder="Type a skill and press Enter" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => handleAddArrayItem(e, skillInput, setSkillInput, skills, setSkills)} style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", marginBottom: "10px" }} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {skills.map((skill, index) => (
                      <span key={index} style={{ background: "#e0f2fe", color: "#0277bd", padding: "6px 12px", borderRadius: "16px", fontSize: "13px", fontWeight: "500", display: "inline-flex", alignItems: "center" }}>
                        {skill}
                        <button type="button" onClick={() => removeArrayItem(index, skills, setSkills)} style={{ background: "none", border: "none", color: "#0277bd", cursor: "pointer", marginLeft: "6px" }}>×</button>
                      </span>
                    ))}
                  </div>
               </div>

               <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>Languages Supported</label>
                  <input type="text" placeholder="Type a language and press Enter (e.g. English, Spanish)" value={languageInput} onChange={(e) => setLanguageInput(e.target.value)} onKeyDown={(e) => handleAddArrayItem(e, languageInput, setLanguageInput, languages, setLanguages)} style={{ width: "100%", padding: "12px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none", marginBottom: "10px" }} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {languages.map((language, index) => (
                      <span key={index} style={{ background: "#f3e8ff", color: "#7e22ce", padding: "6px 12px", borderRadius: "16px", fontSize: "13px", fontWeight: "500", display: "inline-flex", alignItems: "center" }}>
                        {language}
                        <button type="button" onClick={() => removeArrayItem(index, languages, setLanguages)} style={{ background: "none", border: "none", color: "#7e22ce", cursor: "pointer", marginLeft: "6px" }}>×</button>
                      </span>
                    ))}
                  </div>
               </div>
            </div>

            <h3 style={{ marginBottom: "20px", marginTop: "35px", color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: "10px" }}>Resume Document</h3>
            <div style={{ marginBottom: "25px" }}>
               <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} style={{ padding: "30px", borderRadius: "12px", border: dragActive ? "2px dashed #3b82f6" : "2px dashed #cbd5e1", background: dragActive ? "#eff6ff" : "#f8fafc", textAlign: "center", cursor: "pointer" }}>
                 <input type="file" accept=".pdf" onChange={handleFileChange} id="resumeFile" style={{ display: "none" }} />
                 <label htmlFor="resumeFile" style={{ cursor: "pointer" }}>
                   <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "8px" }}>{resumeFile ? `✓ ${resumeFile.name}` : "Drag and drop your PDF here or click to browse"}</p>
                   <p style={{ fontSize: "12px", color: "#94a3b8" }}>Maximum file size: 10MB</p>
                 </label>
               </div>
               {resumeData.resumeUrl && resumeData.resumeUrl !== 'pending' && !resumeFile && (
                 <p style={{ fontSize: "13px", color: "#3b82f6", marginTop: "10px" }}>💾 Current resume: <a href={resumeData.resumeUrl.startsWith('http') ? resumeData.resumeUrl : `http://localhost:5000${resumeData.resumeUrl}`} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>View PDF Document</a></p>
               )}
            </div>

            <button type="submit" disabled={loading} style={{ padding: "12px 24px", background: loading ? "#cbd5e1" : "#10b981", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", width: "100%", fontSize: "16px" }} >
              {loading ? "Saving Resume..." : "💾 Save Overview & Experience"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}