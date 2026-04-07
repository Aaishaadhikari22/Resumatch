import { useEffect, useState } from "react";
import API from "../../api/axios";
import { useToast, Toast } from "../../components/common/Toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import "../admin.css"; // Reuse card styles

export default function UploadResume() {
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
  const [dragActive, setDragActive] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const { showToast, toast, closeToast } = useToast();

  useEffect(() => {
    fetchResume();
  }, []);

  const fetchResume = async () => {
    setFetching(true);
    try {
      const res = await API.get("/user/resume");
      if (res.data && res.data._id) {
        setResumeData({
          title: res.data.title || "",
          experience: res.data.experience || 0,
          education: res.data.education || "Any",
          resumeUrl: res.data.resumeUrl || ""
        });
        setSkills(res.data.skills || []);
      }
    } catch (err) {
      console.error("Failed to fetch resume", err);
    } finally {
      setFetching(false);
    }
  };

  const handleAddSkill = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
    if ((e.key === "Enter" || e.key === ",") && skillInput.trim()) {      
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

  const handleSave = async (e) => {
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

    // Validation
    if (!resumeData.title.trim()) {
      showToast("Please enter your professional title", "warning");
      return;
    }
    if (resumeData.experience < 0) {
      showToast("Experience cannot be negative", "warning");
      return;
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
      fetchResume();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.msg || "Failed to save resume", "error");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <LoadingSpinner />;

  return (
    <div className="admin-page">
      <Toast message={toast?.message} type={toast?.type} onClose={closeToast} />

      <h2 style={{ fontSize: "32px", marginBottom: "8px", fontWeight: "700" }}>
        Your Resume & Skills 📋
      </h2>
      <p style={{ color: "#64748b", marginBottom: "30px", fontSize: "15px" }}>
        Upload your CV and list your core skills to get highly accurate job recommendations
      </p>

      <div className="admin-card" style={{ maxWidth: "900px" }}>
        <form onSubmit={handleSave} className="admin-form">
          
          {/* Professional Title */}
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
             <span style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginTop: "5px" }}>
               What is your current job role or designation?
             </span>
          </div>

          {/* Years of Experience */}
          <div style={{ marginBottom: "25px" }}>
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

          {/* Education Level */}
          <div style={{ marginBottom: "25px" }}>
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
             <span style={{ fontSize: "12px", color: "#94a3b8", display: "block", marginTop: "5px" }}>
               Your highest level of education completed
             </span>
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
                   Maximum file size: 5MB
                 </p>
               </label>
             </div>

             {resumeData.resumeUrl && resumeData.resumeUrl !== 'pending' && !resumeFile && (
               <p style={{ fontSize: "13px", color: "#3b82f6", marginTop: "10px" }}>
                 💾 Current resume: <a href={resumeData.resumeUrl.startsWith('http') ? resumeData.resumeUrl : `http://localhost:5000${resumeData.resumeUrl}`} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "underline" }}>View</a>
               </p>
             )}
          </div>

          {/* Core Skills */}
          <div style={{ marginBottom: "30px" }}>
             <label style={{ display: "block", marginBottom: "10px", fontWeight: "600", color: "#334155", fontSize: "15px" }}>
               Core Skills <span style={{ color: "#ef4444" }}>*</span> <span style={{color: "#94a3b8", fontWeight: "400", fontSize: "13px"}}>(Press Enter to add)</span>
             </label>
             
             {/* Skills Display */}
             {skills.length > 0 && (
               <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "15px" }}>
                 {skills.map((skill, idx) => (
                   <div key={idx} style={{ 
                     background: "#eff6ff", 
                     color: "#1e40af", 
                     padding: "7px 14px", 
                     borderRadius: "20px", 
                     display: "flex", 
                     alignItems: "center", 
                     gap: "8px", 
                     fontSize: "13px", 
                     fontWeight: "600",
                     border: "1px solid #bfdbfe"
                   }}>
                     ✓ {skill}
                     <span 
                       onClick={() => removeSkill(idx)} 
                       style={{ 
                         cursor: "pointer", 
                         color: "#ef4444", 
                         fontWeight: "bold",
                         fontSize: "16px",
                         lineHeight: "1"
                       }}
                     >
                       ×
                     </span>
                   </div>
                 ))}
               </div>
             )}

             {/* Skills Input */}
             <input 
               type="text" 
               placeholder="Add a skill (e.g. React, Node.js, AWS) and press Enter"
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
                 transition: "all 0.2s"
               }}
               onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
               onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
             />
             <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "8px" }}>
               Added {skills.length} skill{skills.length !== 1 ? 's' : ''} • Maximum 50 skills recommended
             </p>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            style={{
              width: "100%", 
              padding: "14px", 
              fontSize: "15px", 
              fontWeight: "700",
              borderRadius: "10px",
              background: loading ? "#cbd5e1" : "#3b82f6",
              color: "white",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s"
            }}
            disabled={loading}
            onMouseOver={(e) => !loading && (e.target.style.background = "#2563eb")}
            onMouseOut={(e) => !loading && (e.target.style.background = "#3b82f6")}
          >
            {loading ? "Saving Your Resume..." : "Save Resume & Update Profile"}
          </button>
        </form>

        {/* Info Box */}
        <div style={{ 
          background: "#eff6ff", 
          border: "1px solid #bfdbfe", 
          padding: "16px", 
          borderRadius: "10px", 
          marginTop: "25px" 
        }}>
          <p style={{ fontSize: "13px", color: "#1e40af", margin: "0" }}>
            💡 <strong>Tip:</strong> Add as many relevant skills as possible to get better job matches. The system uses your skills to find the most suitable positions for you.
          </p>
        </div>
      </div>
    </div>
  );
}
