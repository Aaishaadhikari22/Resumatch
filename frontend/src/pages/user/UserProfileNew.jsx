import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { useToast } from "../../hooks/useToast";
import Toast from "../../components/common/Toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import "./userProfileNew.css";

export default function UserProfileNew() {
  const navigate = useNavigate();
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
  const [workExperiences, setWorkExperiences] = useState([]);
  const [educationHistory, setEducationHistory] = useState([]);
  const [editMode, setEditMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const { showToast, toast, closeToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateProfileCompletion(profileData, {
      title: resumeData.title,
      skills,
      workExperiences,
      educationHistory,
    });
  }, [profileData, resumeData.title, skills, workExperiences, educationHistory]);

  const fetchData = async () => {
    setFetching(true);
    try {
      const [profileRes, resumeRes] = await Promise.all([
        API.get("/user/profile"),
        API.get("/user/resume")
      ]);

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

      setProfilePhoto(profileRes.data.profilePhoto);
      calculateProfileCompletion(profileRes.data, resumeRes.data);

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
        setWorkExperiences(resumeRes.data.workExperiences || []);
        setEducationHistory(resumeRes.data.educationHistory || []);
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setFetching(false);
    }
  };

  const calculateProfileCompletion = (profile, resume) => {
    let completed = 0;
    const total = 10;
    const resumeSkills = resume?.skills || [];
    const resumeWorkExperiences = resume?.workExperiences || [];
    const resumeEducationHistory = resume?.educationHistory || [];

    if (profile.name) completed++;
    if (profile.email) completed++;
    if (profile.phone) completed++;
    if (profile.headline) completed++;
    if (profile.bio) completed++;
    if (profile.city) completed++;
    if (resume?.title) completed++;
    if (resumeSkills.length > 0) completed++;
    if (resumeWorkExperiences.length > 0) completed++;
    if (resumeEducationHistory.length > 0) completed++;

    const percentage = Math.round((completed / total) * 100);
    setProfileCompletion(Math.min(percentage, 100));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await API.put("/user/profile", profileData);
      await API.post("/user/resume/generate-from-profile");
      showToast("✓ Profile updated and resume auto-generated!", "success");
      setEditMode(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  // Save resume data (skills, work experience, education, languages, job preference)
  const handleSaveResume = async () => {
    setLoading(true);
    try {
      await API.post("/user/resume", {
        title: resumeData.title,
        skills: skills,
        experience: resumeData.experience,
        education: resumeData.education,
        resumeUrl: resumeData.resumeUrl,
        expectedSalary: resumeData.expectedSalary,
        workExperiences: workExperiences,
        educationHistory: educationHistory,
        languages: languages
      });
      await API.post("/user/resume/generate-from-profile");
      showToast("✓ Resume updated and auto-generated from profile!", "success");
      setEditMode(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.msg || "Failed to update resume", "error");
    } finally {
      setLoading(false);
    }
  };

  // Add new work experience
  const addWorkExperience = () => {
    setWorkExperiences([...workExperiences, {
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: ""
    }]);
  };

  // Update work experience
  const updateWorkExperience = (index, field, value) => {
    const updated = [...workExperiences];
    updated[index][field] = value;
    setWorkExperiences(updated);
  };

  // Remove work experience
  const removeWorkExperience = (index) => {
    setWorkExperiences(workExperiences.filter((_, i) => i !== index));
  };

  // Add new education
  const addEducation = () => {
    setEducationHistory([...educationHistory, {
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: ""
    }]);
  };

  // Update education
  const updateEducation = (index, field, value) => {
    const updated = [...educationHistory];
    updated[index][field] = value;
    setEducationHistory(updated);
  };

  // Remove education
  const removeEducation = (index) => {
    setEducationHistory(educationHistory.filter((_, i) => i !== index));
  };

  // Add new language
  const [newLanguage, setNewLanguage] = useState("");
  const addLanguage = () => {
    if (newLanguage.trim() && !languages.includes(newLanguage.trim())) {
      setLanguages([...languages, newLanguage.trim()]);
      setNewLanguage("");
    }
  };

  // Remove language
  const removeLanguage = (index) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const getMissingItems = () => {
    const missing = [];
    if (!profileData.headline) missing.push("Professional headline");
    if (!profileData.bio) missing.push("Career summary");
    if (workExperiences.length === 0) missing.push("Work experience");
    if (skills.length === 0) missing.push("Skills");
    if (educationHistory.length === 0) missing.push("Education");
    if (languages.length === 0) missing.push("Languages");
    return missing;
  };

  if (fetching) return <LoadingSpinner />;

  const initials = profileData.name?.split(" ").map(n => n[0]).join("") || "U";
  const missingItems = getMissingItems();

  return (
    <div className="new-profile-container">
      <Toast message={toast?.message} type={toast?.type} onClose={closeToast} />

      {/* Main Profile Section */}
      <div className="profile-main-section">
        
        {/* Header with Avatar and Info */}
        <div className="profile-header-card">
          <div className="header-top">
            <div className="avatar-section">
              <div className="avatar-circle">
                {profilePhoto ? (
                  <img src={profilePhoto} alt={profileData.name} />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
            </div>

            <div className="header-info">
              <h1 className="profile-name">{profileData.name || "Your Name"}</h1>
              <p className="profile-title">{profileData.headline || "Add your professional headline"}</p>
              <div className="profile-meta">
                <span className="meta-item">
                  {workExperiences.length > 0 
                    ? `${workExperiences.length} Years ${workExperiences.length > 1 ? 'Experience' : 'Experience'}` 
                    : "0 Years Experience"}
                </span>
                {profileData.email && (
                  <span className="meta-item verification">
                    <span className="online-dot"></span> {profileData.email}
                  </span>
                )}
              </div>
              {profileData.phone && (
                <div className="meta-item">{profileData.phone}</div>
              )}
              {profileData.city && (
                <div className="meta-item">📍 {profileData.city}</div>
              )}
            </div>

            <div className="header-actions">
              <div className="completion-box">
                <div className="completion-circle" style={{ background: `conic-gradient(#3b82f6 0deg ${profileCompletion * 3.6}deg, #e5e7eb ${profileCompletion * 3.6}deg)` }}>
                  <div className="completion-inner">{profileCompletion}%</div>
                </div>
                <p className="completion-label">Profile Completeness</p>
              </div>
            </div>
          </div>

          {/* Suggestions Box */}
          {missingItems.length > 0 && (
            <div className="suggestions-box">
              <h4>🎯 Profile Improvement Tips</h4>
              <p className="suggestion-text">
                Your profile misses <strong>{missingItems.length} item{missingItems.length > 1 ? 's' : ''}</strong> - add them to improve your profile visibility!
              </p>
              <div className="suggestion-items">
                {missingItems.map((item, idx) => (
                  <div key={idx} className="suggestion-item">
                    <span className="item-name">{item}</span>
                    <span className="improvement">+10%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="profile-content-grid">
          
          {/* Left Sidebar - Profile Elements */}
          <div className="profile-sidebar">
            <div className="sidebar-card">
              <h3>Profile Elements</h3>
              <div className="profile-elements-list">
                <div className="element-item" onClick={() => setEditMode("job-preference")}>
                  <span className="icon">💼</span>
                  <span className="label">Job Preference</span>
                  <span className="action">{resumeData.title ? "Update" : "Add"}</span>
                </div>
                <div className="element-item" onClick={() => setEditMode("bio")}>
                  <span className="icon">📝</span>
                  <span className="label">Career Summary</span>
                  <span className="action">{profileData.bio ? "Update" : "Add"}</span>
                </div>
                <div className="element-item" onClick={() => setEditMode("experience")}>
                  <span className="icon">💻</span>
                  <span className="label">Work Experience</span>
                  <span className="action">{workExperiences.length > 0 ? "Update" : "Add"}</span>
                </div>
                <div className="element-item" onClick={() => setEditMode("education")}>
                  <span className="icon">🎓</span>
                  <span className="label">Education</span>
                  <span className="action">{educationHistory.length > 0 ? "Update" : "Add"}</span>
                </div>
                <div className="element-item" onClick={() => setEditMode("skills")}>
                  <span className="icon">⭐</span>
                  <span className="label">Skills</span>
                  <span className="action">{skills.length > 0 ? "Update" : "Add"}</span>
                </div>
                <div className="element-item" onClick={() => setEditMode("languages")}>
                  <span className="icon">🌐</span>
                  <span className="label">Languages</span>
                  <span className="action">{languages.length > 0 ? "Update" : "Add"}</span>
                </div>
                <div className="element-item" onClick={() => setEditMode("personal")}>
                  <span className="icon">👤</span>
                  <span className="label">Personal Info</span>
                  <span className="action">Update</span>
                </div>
              </div>
            </div>

            <button className="preview-btn" onClick={() => navigate("/user/profile-preview")}>
              👁️ Preview Profile
            </button>
          </div>

          {/* Right Content Area */}
          <div className="profile-content">
            
            {/* Job Preference Section */}
            <div className="content-card">
              <div className="card-header">
                <h3>💼 Job Preference</h3>
                <button className="edit-btn" onClick={() => setEditMode("job-preference")}>Edit</button>
              </div>
              {editMode === "job-preference" ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label>Professional Title / Role</label>
                    <input
                      type="text"
                      value={resumeData.title}
                      onChange={(e) => setResumeData({...resumeData, title: e.target.value})}
                      placeholder="e.g. Senior Frontend Developer"
                    />
                  </div>
                  <div className="form-group">
                    <label>Expected Salary</label>
                    <input
                      type="number"
                      value={resumeData.expectedSalary}
                      onChange={(e) => setResumeData({...resumeData, expectedSalary: Number(e.target.value)})}
                      placeholder="e.g. 50000"
                    />
                  </div>
                  <div className="form-actions">
                    <button className="btn-save" onClick={handleSaveResume} disabled={loading}>
                      {loading ? "Saving..." : "Save"}
                    </button>
                    <button className="btn-cancel" onClick={() => setEditMode(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="card-content">
                  {resumeData.title ? (
                    <>
                      <div className="info-row">
                        <label>Preferred Job Title:</label>
                        <span>{resumeData.title}</span>
                      </div>
                      {resumeData.expectedSalary > 0 && (
                        <div className="info-row">
                          <label>Expected Salary:</label>
                          <span>Rs. {resumeData.expectedSalary}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="empty-state">No job preference added yet. Add your preferred job title and salary expectations.</p>
                  )}
                </div>
              )}
            </div>

            {/* Professional Headline Section */}
            <div className="content-card">
              <div className="card-header">
                <h3>🧾 Professional Headline</h3>
                <button className="edit-btn" onClick={() => setEditMode("headline")}>Edit</button>
              </div>
              {editMode === "headline" ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label>Professional Headline</label>
                    <input
                      type="text"
                      value={profileData.headline}
                      onChange={(e) => setProfileData({...profileData, headline: e.target.value})}
                      placeholder="e.g. Full Stack Developer | Product Builder"
                    />
                  </div>
                  <div className="form-actions">
                    <button className="btn-save" onClick={handleSaveProfile} disabled={loading}>
                      {loading ? "Saving..." : "Save"}
                    </button>
                    <button className="btn-cancel" onClick={() => setEditMode(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="card-content">
                  {profileData.headline ? (
                    <p>{profileData.headline}</p>
                  ) : (
                    <p className="empty-state">No professional headline added yet. Add one to improve your profile visibility.</p>
                  )}
                </div>
              )}
            </div>

            {/* Career Summary Section */}
            <div className="content-card">
              <div className="card-header">
                <h3>📝 Career Summary / Objective</h3>
                <button className="edit-btn" onClick={() => setEditMode("bio")}>Edit</button>
              </div>
              {editMode === "bio" ? (
                <div className="edit-form">
                  <textarea
                    rows="5"
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    placeholder="Write a short summary that highlights your professional background, key skills, achievements, and career goals..."
                  />
                  <div className="form-actions">
                    <button className="btn-save" onClick={handleSaveProfile} disabled={loading}>
                      {loading ? "Saving..." : "Save"}
                    </button>
                    <button className="btn-cancel" onClick={() => setEditMode(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="card-content">
                  {profileData.bio ? (
                    <p>{profileData.bio}</p>
                  ) : (
                    <p className="empty-state">No career summary added yet. Add a brief overview of your professional background and goals.</p>
                  )}
                </div>
              )}
            </div>

            {/* Work Experience Section */}
            <div className="content-card">
              <div className="card-header">
                <h3>💻 Work Experience</h3>
                <button className="edit-btn" onClick={() => setEditMode("experience")}>
                  {workExperiences.length > 0 ? "Edit" : "Add"}
                </button>
              </div>
              {editMode === "experience" ? (
                <div className="edit-form">
                  {workExperiences.map((exp, idx) => (
                    <div key={idx} className="experience-form-item">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Position/Title</label>
                          <input
                            type="text"
                            value={exp.position}
                            onChange={(e) => updateWorkExperience(idx, "position", e.target.value)}
                            placeholder="e.g. Software Engineer"
                          />
                        </div>
                        <div className="form-group">
                          <label>Company</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => updateWorkExperience(idx, "company", e.target.value)}
                            placeholder="e.g. Google"
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Start Date</label>
                          <input
                            type="date"
                            value={exp.startDate ? exp.startDate.split('T')[0] : ''}
                            onChange={(e) => updateWorkExperience(idx, "startDate", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>End Date</label>
                          <input
                            type="date"
                            value={exp.endDate ? exp.endDate.split('T')[0] : ''}
                            onChange={(e) => updateWorkExperience(idx, "endDate", e.target.value)}
                            disabled={exp.current}
                          />
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={!exp.endDate}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  updateWorkExperience(idx, "endDate", "");
                                }
                              }}
                            /> Currently working here
                          </label>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          rows="3"
                          value={exp.description}
                          onChange={(e) => updateWorkExperience(idx, "description", e.target.value)}
                          placeholder="Describe your responsibilities and achievements..."
                        />
                      </div>
                      <button type="button" className="btn-remove" onClick={() => removeWorkExperience(idx)}>Remove</button>
                    </div>
                  ))}
                  <button type="button" className="btn-add" onClick={addWorkExperience}>+ Add Work Experience</button>
                  <div className="form-actions">
                    <button className="btn-save" onClick={handleSaveResume} disabled={loading}>
                      {loading ? "Saving..." : "Save"}
                    </button>
                    <button className="btn-cancel" onClick={() => setEditMode(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="card-content">
                  {workExperiences.length > 0 ? (
                    workExperiences.map((exp, idx) => (
                      <div key={idx} className="experience-item">
                        <h4>{exp.position}</h4>
                        <p className="company">{exp.company}</p>
                        <p className="date-range">
                          {exp.startDate && new Date(exp.startDate).getFullYear()} 
                          {exp.endDate ? ` - ${new Date(exp.endDate).getFullYear()}` : " - Present"}
                        </p>
                        {exp.description && <p className="description">{exp.description}</p>}
                      </div>
                    ))
                  ) : (
                    <p className="empty-state">No work experience added yet. Add your professional work history to showcase your expertise.</p>
                  )}
                </div>
              )}
            </div>

            {/* Education Section */}
            <div className="content-card">
              <div className="card-header">
                <h3>🎓 Education</h3>
                <button className="edit-btn" onClick={() => setEditMode("education")}>
                  {educationHistory.length > 0 ? "Edit" : "Add"}
                </button>
              </div>
              {editMode === "education" ? (
                <div className="edit-form">
                  {educationHistory.map((edu, idx) => (
                    <div key={idx} className="education-form-item">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Degree</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                            placeholder="e.g. Bachelor of Science"
                          />
                        </div>
                        <div className="form-group">
                          <label>Institution</label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => updateEducation(idx, "institution", e.target.value)}
                            placeholder="e.g. MIT"
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Field of Study</label>
                          <input
                            type="text"
                            value={edu.fieldOfStudy}
                            onChange={(e) => updateEducation(idx, "fieldOfStudy", e.target.value)}
                            placeholder="e.g. Computer Science"
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Start Date</label>
                          <input
                            type="date"
                            value={edu.startDate ? edu.startDate.split('T')[0] : ''}
                            onChange={(e) => updateEducation(idx, "startDate", e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>End Date</label>
                          <input
                            type="date"
                            value={edu.endDate ? edu.endDate.split('T')[0] : ''}
                            onChange={(e) => updateEducation(idx, "endDate", e.target.value)}
                          />
                        </div>
                      </div>
                      <button type="button" className="btn-remove" onClick={() => removeEducation(idx)}>Remove</button>
                    </div>
                  ))}
                  <button type="button" className="btn-add" onClick={addEducation}>+ Add Education</button>
                  <div className="form-actions">
                    <button className="btn-save" onClick={handleSaveResume} disabled={loading}>
                      {loading ? "Saving..." : "Save"}
                    </button>
                    <button className="btn-cancel" onClick={() => setEditMode(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="card-content">
                  {educationHistory.length > 0 ? (
                    educationHistory.map((edu, idx) => (
                      <div key={idx} className="education-item">
                        <h4>{edu.degree}</h4>
                        <p className="institution">{edu.institution}</p>
                        {edu.fieldOfStudy && <p className="field">{edu.fieldOfStudy}</p>}
                        <p className="date-range">
                          {edu.startDate && new Date(edu.startDate).getFullYear()} 
                          {edu.endDate ? ` - ${new Date(edu.endDate).getFullYear()}` : " - Present"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="empty-state">No education added yet. Add your academic qualifications and degrees.</p>
                  )}
                </div>
              )}
            </div>

            {/* Skills Section */}
            <div className="content-card">
              <div className="card-header">
                <h3>⭐ Skills</h3>
                <button className="edit-btn" onClick={() => setEditMode("skills")}>
                  {skills.length > 0 ? "Edit" : "Add"}
                </button>
              </div>
              <div className="card-content">
                {editMode === "skills" ? (
                  <div className="edit-form">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.key === "Enter" || e.key === ",") && skillInput.trim()) {
                          e.preventDefault();
                          const newSkill = skillInput.trim();
                          if (!skills.includes(newSkill)) {
                            setSkills([...skills, newSkill]);
                            setSkillInput("");
                          }
                        }
                      }}
                      placeholder="Type a skill and press Enter"
                    />
                    <div className="skills-list">
                      {skills.map((skill, idx) => (
                        <div key={idx} className="skill-tag">
                          {skill}
                          <button onClick={() => setSkills(skills.filter((_, i) => i !== idx))} className="remove">×</button>
                        </div>
                      ))}
                    </div>
                    <div className="form-actions">
                      <button className="btn-save" onClick={handleSaveResume} disabled={loading}>{loading ? "Saving..." : "Done"}</button>
                    </div>
                  </div>
                ) : (
                  <div className="skills-list">
                    {skills.length > 0 ? (
                      skills.map((skill, idx) => (
                        <span key={idx} className="skill-tag">{skill}</span>
                      ))
                    ) : (
                      <p className="empty-state">No skills added yet. Add your key professional skills.</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Languages Section */}
            <div className="content-card">
              <div className="card-header">
                <h3>🌐 Languages</h3>
                <button className="edit-btn" onClick={() => setEditMode("languages")}>
                  {languages.length > 0 ? "Edit" : "Add"}
                </button>
              </div>
              {editMode === "languages" ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label>Add Language</label>
                    <div className="language-input-row">
                      <input
                        type="text"
                        value={newLanguage}
                        onChange={(e) => setNewLanguage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addLanguage();
                          }
                        }}
                        placeholder="e.g. English, Spanish, French"
                      />
                      <button type="button" className="btn-add-small" onClick={addLanguage}>Add</button>
                    </div>
                  </div>
                  <div className="languages-list">
                    {languages.map((lang, idx) => (
                      <div key={idx} className="language-item">
                        {lang}
                        <button onClick={() => removeLanguage(idx)} className="remove">×</button>
                      </div>
                    ))}
                  </div>
                  <div className="form-actions">
                    <button className="btn-save" onClick={handleSaveResume} disabled={loading}>
                      {loading ? "Saving..." : "Save"}
                    </button>
                    <button className="btn-cancel" onClick={() => setEditMode(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="card-content">
                  {languages.length > 0 ? (
                    <div className="languages-list">
                      {languages.map((lang, idx) => (
                        <div key={idx} className="language-item">{lang}</div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">No languages added yet. Add languages you speak.</p>
                  )}
                </div>
              )}
            </div>

            {/* Personal Info Section */}
            <div className="content-card">
              <div className="card-header">
                <h3>👤 Personal Information</h3>
                <button className="edit-btn" onClick={() => setEditMode("personal")}>Edit</button>
              </div>
              {editMode === "personal" ? (
                <div className="edit-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Professional Headline</label>
                      <input
                        type="text"
                        value={profileData.headline}
                        onChange={(e) => setProfileData({...profileData, headline: e.target.value})}
                        placeholder="e.g. Senior Software Engineer | React Specialist"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        placeholder="your@email.com"
                        disabled
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div className="form-group">
                      <label>Gender</label>
                      <select
                        value={profileData.gender}
                        onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        value={profileData.dateOfBirth}
                        onChange={(e) => setProfileData({...profileData, dateOfBirth: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        value={profileData.city}
                        onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                        placeholder="City"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                      placeholder="Full address"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Portfolio Website <span style={{ fontWeight: 400, color: "#64748b" }}>(optional)</span></label>
                      <input
                        type="url"
                        value={profileData.portfolioWebsite}
                        onChange={(e) => setProfileData({...profileData, portfolioWebsite: e.target.value})}
                        placeholder="https://yourportfolio.com"
                      />
                    </div>
                    <div className="form-group">
                      <label>LinkedIn Profile <span style={{ fontWeight: 400, color: "#64748b" }}>(optional)</span></label>
                      <input
                        type="url"
                        value={profileData.linkedinProfile}
                        onChange={(e) => setProfileData({...profileData, linkedinProfile: e.target.value})}
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>GitHub Profile <span style={{ fontWeight: 400, color: "#64748b" }}>(optional)</span></label>
                    <input
                      type="url"
                      value={profileData.githubProfile}
                      onChange={(e) => setProfileData({...profileData, githubProfile: e.target.value})}
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                  <div className="form-actions">
                    <button className="btn-save" onClick={handleSaveProfile} disabled={loading}>
                      {loading ? "Saving..." : "Save"}
                    </button>
                    <button className="btn-cancel" onClick={() => setEditMode(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="card-content">
                  <div className="info-row">
                    <label>Name:</label>
                    <span>{profileData.name || "Not set"}</span>
                  </div>
                  <div className="info-row">
                    <label>Email:</label>
                    <span>{profileData.email || "Not set"}</span>
                  </div>
                  <div className="info-row">
                    <label>Phone:</label>
                    <span>{profileData.phone || "Not set"}</span>
                  </div>
                  <div className="info-row">
                    <label>Gender:</label>
                    <span>{profileData.gender || "Not set"}</span>
                  </div>
                  <div className="info-row">
                    <label>Date of Birth:</label>
                    <span>{profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString() : "Not set"}</span>
                  </div>
                  <div className="info-row">
                    <label>City:</label>
                    <span>{profileData.city || "Not set"}</span>
                  </div>
                  <div className="info-row">
                    <label>Address:</label>
                    <span>{profileData.address || "Not set"}</span>
                  </div>
                  {profileData.portfolioWebsite && (
                    <div className="info-row">
                      <label>Portfolio:</label>
                      <span><a href={profileData.portfolioWebsite} target="_blank" rel="noopener noreferrer">{profileData.portfolioWebsite}</a></span>
                    </div>
                  )}
                  {profileData.linkedinProfile && (
                    <div className="info-row">
                      <label>LinkedIn:</label>
                      <span><a href={profileData.linkedinProfile} target="_blank" rel="noopener noreferrer">{profileData.linkedinProfile}</a></span>
                    </div>
                  )}
                  {profileData.githubProfile && (
                    <div className="info-row">
                      <label>GitHub:</label>
                      <span><a href={profileData.githubProfile} target="_blank" rel="noopener noreferrer">{profileData.githubProfile}</a></span>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
