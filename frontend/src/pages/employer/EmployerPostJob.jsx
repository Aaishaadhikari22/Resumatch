import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import "./postJob.css";
import Alert from "../../components/common/Alert";
import { FaCloudUploadAlt } from "react-icons/fa";

export default function EmployerPostJob() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [imagePreview, setImagePreview] = useState(null);
  const [activeTab, setActiveTab] = useState("basic");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skillsRequired: [],
    sector: "",
    salary: { min: 0, max: 0, currency: "USD" },
    location: "",
    city: "",
    employmentType: "Full-time",
    experienceLevel: "Mid-level",
    minExperienceYears: 0,
    educationLevel: "Any",
    deadline: "",
    jobImage: null
  });

  const [skillInput, setSkillInput] = useState("");

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ text: "❌ Only JPEG, PNG, and WebP images allowed", type: "error" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: "❌ Image must be less than 5MB", type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);

    setUploadingImage(true);
    const formDataForUpload = new FormData();
    formDataForUpload.append("jobImage", file);

    try {
      const response = await API.post("/employer/jobs/upload-image", formDataForUpload, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setFormData(prev => ({
        ...prev,
        jobImage: {
          fileName: response.data.fileName,
          filePath: response.data.filePath
        }
      }));

      setMessage({ text: "✅ Image uploaded successfully", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ text: "❌ " + (err.response?.data?.error || "Image upload failed"), type: "error" });
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, jobImage: null }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("salary.")) {
      const key = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        salary: {
          ...prev.salary,
          [key]: key === "currency" ? value : parseFloat(value) || 0
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skillsRequired.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skillsRequired: [...prev.skillsRequired, skillInput.trim()]
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skillsRequired: prev.skillsRequired.filter(s => s !== skill)
    }));
  };

  const handleSkillKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      setMessage({ text: "❌ Job title and description are required", type: "error" });
      return;
    }

    if (formData.skillsRequired.length === 0) {
      setMessage({ text: "❌ Please add at least one required skill", type: "error" });
      return;
    }

    setLoading(true);
    try {
      await API.post("/employer/jobs", {
        ...formData,
        skillsRequired: formData.skillsRequired
      });

      setMessage({ text: "✅ Job posted successfully! Awaiting admin approval...", type: "success" });
      setTimeout(() => {
        navigate("/employer/my-jobs");
      }, 2000);
    } catch (err) {
      console.error(err);
      setMessage({
        text: "❌ " + (err.response?.data?.msg || err.message),
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const tabsConfig = [
    { id: "basic", label: "📝 Basic Info", icon: "ℹ️" },
    { id: "details", label: "💼 Job Details", icon: "⚙️" },
    { id: "salary", label: "💰 Salary", icon: "$" },
    { id: "skills", label: "🎯 Skills", icon: "⭐" },
    { id: "image", label: "🖼️ Image", icon: "🖼️" }
  ];

  return (
    <div className="post-job-wrapper">
      <div className="post-job-container">
        {/* Header */}
        <div className="post-job-header">
          <h1>Post a New Job Opening</h1>
          <p>Create a professional job posting to attract top talent</p>
        </div>

        {message.text && <Alert message={message.text} type={message.type} />}

        {/* Tab Navigation */}
        <div className="tabs-navigation">
          {tabsConfig.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="job-form">
          {/* Basic Information */}
          {activeTab === "basic" && (
            <div className="tab-content active">
              <div className="form-section">
                <h2 className="section-title">Basic Information</h2>
                <p className="section-hint">Enter core details about the job position</p>

                <div className="form-group">
                  <label htmlFor="title">Job Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Senior React Developer"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Job Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the role, responsibilities, and requirements..."
                    rows={8}
                    className="form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sector">Sector / Industry</label>
                  <input
                    type="text"
                    id="sector"
                    name="sector"
                    value={formData.sector}
                    onChange={handleChange}
                    placeholder="e.g., Technology, Finance, Healthcare"
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Job Details */}
          {activeTab === "details" && (
            <div className="tab-content active">
              <div className="form-section">
                <h2 className="section-title">Job Details</h2>
                <p className="section-hint">Specify job type, level, and location</p>

                <div className="form-grid-3">
                  <div className="form-group">
                    <label htmlFor="employmentType">Employment Type</label>
                    <select
                      id="employmentType"
                      name="employmentType"
                      value={formData.employmentType}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Temporary">Temporary</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="experienceLevel">Experience Level</label>
                    <select
                      id="experienceLevel"
                      name="experienceLevel"
                      value={formData.experienceLevel}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="Entry Level">Entry Level</option>
                      <option value="Junior">Junior</option>
                      <option value="Mid-level">Mid-level</option>
                      <option value="Senior">Senior</option>
                      <option value="Lead">Lead</option>
                      <option value="Executive">Executive</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="minExperienceYears">Min. Experience (years)</label>
                    <input
                      type="number"
                      id="minExperienceYears"
                      name="minExperienceYears"
                      value={formData.minExperienceYears}
                      onChange={handleChange}
                      min="0"
                      max="100"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-grid-3">
                  <div className="form-group">
                    <label htmlFor="educationLevel">Education Level</label>
                    <select
                      id="educationLevel"
                      name="educationLevel"
                      value={formData.educationLevel}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="Any">Any</option>
                      <option value="High School">High School</option>
                      <option value="Associate">Associate Degree</option>
                      <option value="Bachelor's">Bachelor's Degree</option>
                      <option value="Master's">Master's Degree</option>
                      <option value="Ph.D.">Ph.D.</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="deadline">Application Deadline</label>
                    <input
                      type="date"
                      id="deadline"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="location">Location / Address</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g., 123 Tech Street, Building A"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g., San Francisco"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Salary Information */}
          {activeTab === "salary" && (
            <div className="tab-content active">
              <div className="form-section">
                <h2 className="section-title">Salary & Compensation</h2>
                <p className="section-hint">Specify salary range to attract qualified candidates</p>

                <div className="form-grid-3">
                  <div className="form-group">
                    <label htmlFor="salary-min">Minimum Salary</label>
                    <input
                      type="number"
                      id="salary-min"
                      name="salary.min"
                      value={formData.salary.min}
                      onChange={handleChange}
                      placeholder="0"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="salary-max">Maximum Salary</label>
                    <input
                      type="number"
                      id="salary-max"
                      name="salary.max"
                      value={formData.salary.max}
                      onChange={handleChange}
                      placeholder="0"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="salary-currency">Currency</label>
                    <select
                      id="salary-currency"
                      name="salary.currency"
                      value={formData.salary.currency}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD ($)</option>
                      <option value="AUD">AUD ($)</option>
                      <option value="NPR">NPR (Rs.)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Required Skills */}
          {activeTab === "skills" && (
            <div className="tab-content active">
              <div className="form-section">
                <h2 className="section-title">Required Skills</h2>
                <p className="section-hint">Add skills needed for this position (at least 1 required)</p>

                <div className="skill-input-group">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={handleSkillKeyPress}
                    placeholder="Type skill and press Enter"
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="add-skill-btn"
                  >
                    ➕ Add
                  </button>
                </div>

                <div className="skills-list">
                  {formData.skillsRequired.length > 0 ? (
                    formData.skillsRequired.map(skill => (
                      <div key={skill} className="skill-badge">
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="remove-skill-btn"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="hint-text">No skills added yet. Add at least one required skill.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Job Image */}
          {activeTab === "image" && (
            <div className="tab-content active">
              <div className="form-section">
                <h2 className="section-title">Job Banner Image (Optional)</h2>
                <p className="section-hint">Upload a professional image to make your job posting stand out</p>

                {imagePreview ? (
                  <div className="image-preview-container">
                    <img src={imagePreview} alt="Job preview" className="preview-image" />
                    <div className="image-actions">
                      <label htmlFor="image-input" className="change-image-btn">
                        📷 Change Image
                      </label>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="remove-image-btn"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="image-upload-area">
                    <label htmlFor="image-input" className="upload-label">
                      <FaCloudUploadAlt className="upload-icon" />
                      <h3>Drag and drop your image here</h3>
                      <p>or click to browse (JPEG, PNG, WebP - Max 5MB)</p>
                    </label>
                    <input
                      type="file"
                      id="image-input"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageSelect}
                      disabled={uploadingImage}
                      style={{ display: "none" }}
                    />
                  </div>
                )}

                {uploadingImage && (
                  <p className="uploading-text">⏳ Uploading image...</p>
                )}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || uploadingImage}
            >
              {loading ? "⏳ Posting Job..." : "🚀 Post This Job"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/employer/my-jobs")}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
