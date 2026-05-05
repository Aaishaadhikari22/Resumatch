import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { useToast } from "../../hooks/useToast";
import Toast from "../../components/common/Toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import "./myResume.css";

export default function MyResume() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const { showToast, toast, closeToast } = useToast();
  const resumeRef = useRef(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [profileRes, resumeRes] = await Promise.all([
        API.get("/user/profile"),
        API.get("/user/resume").catch(() => null)
      ]);

      setProfileData(profileRes.data);
      if (resumeRes?.data) {
        setResumeData(resumeRes.data);
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/user/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!resumeRef.current) {
      showToast("Resume content not ready", "error");
      return;
    }

    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).jsPDF;

      const canvas = await html2canvas(resumeRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= 297;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      pdf.save(`${profileData?.name || "Resume"}.pdf`);
      showToast("✅ Resume downloaded successfully!", "success");
    } catch (err) {
      console.error("PDF download error:", err);
      showToast("Failed to download PDF. Please try again.", "error");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (!profileData) {
    return (
      <div className="resume-empty">
        <h2>No Profile Data Found</h2>
        <p>Please complete your profile first to generate your resume.</p>
      </div>
    );
  }

  const fullName = profileData?.name || "Your Name";
  const email = profileData?.email || "";
  const phone = profileData?.phone || "";
  const location = profileData?.city ? `${profileData.city}${profileData.address ? ", " + profileData.address : ""}` : "";
  const headline = profileData?.headline || profileData?.bio || "";
  const bio = profileData?.bio || "";

  const workExperiences = resumeData?.workExperiences || [];
  const educationHistory = resumeData?.educationHistory || [];
  const skills = resumeData?.skills || [];
  const languages = resumeData?.languages || [];

  const profileComplete = fullName && email && phone && workExperiences.length > 0 && educationHistory.length > 0 && skills.length > 0;

  return (
    <div className="my-resume-container">
      <Toast message={toast?.message} type={toast?.type} onClose={closeToast} />

      {/* Auto-Generated Resume Info Banner */}
      <div style={{
        background: "#f0fdf4",
        border: "1px solid #86efac",
        borderRadius: "10px",
        padding: "16px 20px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        color: "#166534",
        fontSize: "14px"
      }}>
        <span style={{ fontSize: "18px" }}>✓</span>
        <div>
          <strong>Smart Auto-Generated Resume:</strong> Your resume is built automatically from your profile details (skills, experiences, education, languages). Edit your profile to instantly update your resume. No PDF upload needed - your profile data is used for AI job matching!
        </div>
      </div>

      {/* Header Section */}
      <div className="resume-header">
        <div className="header-content">
          <h1>📄 My Resume</h1>
          <p>Your resume is automatically generated from your profile information</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={handleDownloadPDF}
            disabled={downloading || !profileData}
          >
            {downloading ? "⏳ Generating PDF..." : "⬇️ Download as PDF"}
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate("/user/profile")}
          >
            ✏️ Edit Profile
          </button>
        </div>
      </div>

      {/* Warning if incomplete */}
      {!profileComplete && (
        <div className="completion-warning">
          ⚠️ <strong>Your resume is incomplete.</strong> Complete your profile with work experience, education, and skills to generate a full resume.
          <button onClick={() => navigate("/user/profile")} className="complete-link">Complete Now →</button>
        </div>
      )}

      {/* Resume Preview */}
      <div className="resume-preview-section">
        <div className="preview-controls">
          <button 
            className={`control-btn ${showPreview ? "active" : ""}`}
            onClick={() => setShowPreview(true)}
          >
            👁️ Preview
          </button>
          <button 
            className={`control-btn ${!showPreview ? "active" : ""}`}
            onClick={() => setShowPreview(false)}
          >
            🖨️ Print View
          </button>
        </div>

        {/* Resume Content */}
        <div id="resume-preview" ref={resumeRef} className={`resume-content ${showPreview ? "preview" : "print"}`}>
          
          {/* Header */}
          <div className="resume-header-section">
            <div className="name-section">
              <h1 className="resume-name">{fullName}</h1>
              {headline && <p className="resume-headline">{headline}</p>}
            </div>
            <div className="contact-section">
              {email && <div className="contact-item">📧 {email}</div>}
              {phone && <div className="contact-item">📱 {phone}</div>}
              {location && <div className="contact-item">📍 {location}</div>}
            </div>
          </div>

          {/* Professional Summary */}
          {bio && (
            <div className="resume-section">
              <h2 className="section-title">Professional Summary</h2>
              <p className="section-content">{bio}</p>
            </div>
          )}

          {/* Work Experience */}
          {workExperiences.length > 0 && (
            <div className="resume-section">
              <h2 className="section-title">Work Experience</h2>
              {workExperiences.map((exp, idx) => (
                <div key={idx} className="resume-item">
                  <div className="item-header">
                    <h3 className="item-title">{exp.position}</h3>
                    <span className="item-date">
                      {exp.startDate && new Date(exp.startDate).getFullYear()}
                      {exp.endDate ? ` - ${new Date(exp.endDate).getFullYear()}` : " - Present"}
                    </span>
                  </div>
                  <p className="item-subtitle">{exp.company}</p>
                  {exp.description && <p className="item-description">{exp.description}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Education */}
          {educationHistory.length > 0 && (
            <div className="resume-section">
              <h2 className="section-title">Education</h2>
              {educationHistory.map((edu, idx) => (
                <div key={idx} className="resume-item">
                  <div className="item-header">
                    <h3 className="item-title">{edu.degree}</h3>
                    <span className="item-date">
                      {edu.startDate && new Date(edu.startDate).getFullYear()}
                      {edu.endDate ? ` - ${new Date(edu.endDate).getFullYear()}` : " - Present"}
                    </span>
                  </div>
                  <p className="item-subtitle">{edu.institution}</p>
                  {edu.fieldOfStudy && <p className="item-description">{edu.fieldOfStudy}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div className="resume-section">
              <h2 className="section-title">Skills</h2>
              <div className="skills-section">
                {skills.map((skill, idx) => (
                  <span key={idx} className="skill-badge">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <div className="resume-section">
              <h2 className="section-title">Languages</h2>
              <div className="languages-list">
                {languages.map((lang, idx) => (
                  <p key={idx} className="language-item">• {lang}</p>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="resume-footer">
            <p>Generated by ResuMatch • {new Date().toLocaleDateString()}</p>
          </div>

        </div>
      </div>

      {/* Info Box */}
      <div className="info-box">
        <h3>💡 How It Works</h3>
        <p>Your resume is automatically created from your profile information. Every time you update your profile, your resume updates instantly!</p>
        <ul>
          <li>✅ No manual PDF uploads needed</li>
          <li>✅ Always up-to-date with your profile</li>
          <li>✅ Professional formatting</li>
          <li>✅ Download or print anytime</li>
        </ul>
      </div>
    </div>
  );
}
