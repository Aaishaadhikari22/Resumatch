import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";
import "./userProfileNew.css";

export default function UserProfilePreview() {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [skills, setSkills] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [workExperiences, setWorkExperiences] = useState([]);
  const [educationHistory, setEducationHistory] = useState([]);
  const [fetching, setFetching] = useState(true);
  const { showToast, toast, closeToast } = useToast();

  useEffect(() => {
    const loadPreview = async () => {
      setFetching(true);
      try {
        const [profileRes, resumeRes] = await Promise.all([
          API.get("/user/profile"),
          API.get("/user/resume")
        ]);

        setProfileData(profileRes.data);
        setResumeData(resumeRes.data);
        setSkills(resumeRes.data?.skills || []);
        setLanguages(resumeRes.data?.languages || []);
        setWorkExperiences(resumeRes.data?.workExperiences || []);
        setEducationHistory(resumeRes.data?.educationHistory || []);
      } catch (err) {
        showToast(err.response?.data?.msg || "Failed to load profile preview", "error");
      } finally {
        setFetching(false);
      }
    };

    loadPreview();
  }, []);

  if (fetching) return <LoadingSpinner />;

  if (!profileData) {
    return (
      <div className="profile-preview-container">
        <Toast message={toast?.message} type={toast?.type} onClose={closeToast} />
        <div className="preview-error">
          <p>Unable to load preview.</p>
          <button className="btn-save" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-page-container">
      <Toast message={toast?.message} type={toast?.type} onClose={closeToast} />
      <div className="preview-header">
        <button className="btn-cancel" onClick={() => navigate(-1)}>← Back</button>
        <h2>Profile Preview</h2>
      </div>

      <div className="preview-card">
        <div className="preview-top">
          <div>
            <h1>{profileData.name || "Your Name"}</h1>
            <p className="profile-title">{profileData.headline || "No headline set"}</p>
            <div className="profile-meta">
              {profileData.email && <span>{profileData.email}</span>}
              {profileData.phone && <span>{profileData.phone}</span>}
              {profileData.city && <span>📍 {profileData.city}</span>}
            </div>
          </div>
        </div>

        <div className="preview-section">
          <h3>About</h3>
          <p>{profileData.bio || "No career summary yet."}</p>
        </div>

        <div className="preview-section">
          <h3>Job Preference</h3>
          <p>{resumeData?.title || "No job preference set."}</p>
        </div>

        <div className="preview-section">
          <h3>Skills</h3>
          <div className="skills-list">
            {skills.length > 0 ? skills.map((skill, idx) => (
              <span className="skill-pill" key={idx}>{skill}</span>
            )) : <p>No skills added yet.</p>}
          </div>
        </div>

        <div className="preview-section">
          <h3>Work Experience</h3>
          {workExperiences.length > 0 ? workExperiences.map((exp, idx) => (
            <div className="preview-item" key={idx}>
              <strong>{exp.position || "Position"}</strong> at <span>{exp.company || "Company"}</span>
              <div>{exp.startDate ? new Date(exp.startDate).toLocaleDateString() : ""} - {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : "Present"}</div>
              <p>{exp.description || "No description added."}</p>
            </div>
          )) : <p>No work experience added yet.</p>}
        </div>

        <div className="preview-section">
          <h3>Education</h3>
          {educationHistory.length > 0 ? educationHistory.map((edu, idx) => (
            <div className="preview-item" key={idx}>
              <strong>{edu.degree || "Degree"}</strong> in <span>{edu.fieldOfStudy || "Field"}</span>
              <div>{edu.institution || "Institution"}</div>
              <div>{edu.startDate ? new Date(edu.startDate).toLocaleDateString() : ""} - {edu.endDate ? new Date(edu.endDate).toLocaleDateString() : "Present"}</div>
            </div>
          )) : <p>No education information added yet.</p>}
        </div>

        <div className="preview-section">
          <h3>Languages</h3>
          <div className="languages-list">
            {languages.length > 0 ? languages.map((lang, idx) => (
              <span key={idx} className="language-item">{lang}</span>
            )) : <p>No languages added yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
