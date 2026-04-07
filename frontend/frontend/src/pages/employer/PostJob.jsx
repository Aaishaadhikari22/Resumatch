import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import "./postJob.css";
import Alert from "../../components/common/Alert";
import { FaCloudUploadAlt, FaFileImage, FaTimes } from "react-icons/fa";

export default function PostJob() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skillsRequired: [],
    sector: "",
    salary: { min: 0, max: 0, currency: "USD" },
    location: "",
    city: "",
    employmentType: "Full-time",
    deadline: "",
    jobImage: null
  });

  const [skillInput, setSkillInput] = useState("");

  // Handle image file selection
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ text: "Only JPEG, PNG, and WebP images are allowed", type: "error" });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: "Image must be less than 5MB", type: "error" });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload image
    setUploadingImage(true);
    const formDataForUpload = new FormData();
    formDataForUpload.append("jobImage", file);

    try {
      const response = await API.post("/employer/jobs/upload-image", formDataForUpload, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      setFormData(prev => ({
        ...prev,
        jobImage: {
          fileName: response.data.fileName,
          filePath: response.data.filePath
        }
      }));

      setMessage({ text: "Image uploaded successfully", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ text: err.response?.data?.error || "Image upload failed", type: "error" });
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove image
  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      jobImage: null
    }));
  };

  // Handle regular input changes
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
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Add skill
  const addSkill = () => {
    if (skillInput.trim() && !formData.skillsRequired.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skillsRequired: [...prev.skillsRequired, skillInput.trim()]
      }));
      setSkillInput("");
    }
  };

  // Remove skill
  const removeSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skillsRequired: prev.skillsRequired.filter(s => s !== skill)
    }));
  };

  // Handle skill input key press
  const handleSkillKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      setMessage({ text: "Job title and description are required", type: "error" });
      return;
    }

    if (formData.skillsRequired.length === 0) {
      setMessage({ text: "Please add at least one required skill", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const response = await API.post("/employer/jobs", {
        ...formData,
        skillsRequired: formData.skillsRequired
      });

      setMessage({ text: "Job posted successfully! Awaiting admin approval...", type: "success" });
      setTimeout(() => {
        navigate("/employer/jobs");
      }, 2000);
    } catch (err) {
      console.error(err);
      setMessage({
        text: err.response?.data?.msg || err.message,
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-job-container">
      <div className="post-job-card">
        <h1 className="page-title">Post a New Job</h1>
        <p className="page-subtitle">
          Create a professional job posting that reaches qualified candidates
        </p>

        {message.text && (
          <Alert message={message.text} type={message.type} />
        )}

        <form onSubmit={handleSubmit} className="job-form">
          {/* Basic Information */}
          <div className="form-section">
            <h2 className="section-title">📝 Basic Information</h2>

            <div className="form-group">
              <label htmlFor="title">Job Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Senior React Developer"
                required
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
                rows={6}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="sector">Sector</label>
              <input
                type="text"
                id="sector"
                name="sector"
                value={formData.sector}
                onChange={handleChange}
                placeholder="e.g., Technology, Finance, Healthcare"
              />
            </div>
          </div>

          {/* Job Details */}
          <div className="form-section">
            <h2 className="section-title">💼 Job Details</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="employmentType">Employment Type</label>
                <select
                  id="employmentType"
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleChange}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Temporary">Temporary</option>
                  <option value="Freelance">Freelance</option>
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
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location">Location/Address</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., 123 Tech Street, Building A"
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
                />
              </div>
            </div>
          </div>

          {/* Salary Information */}
          <div className="form-section">
            <h2 className="section-title">💰 Salary Information</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="salary-min">Minimum Salary</label>
                <input
                  type="number"
                  id="salary-min"
                  name="salary.min"
                  value={formData.salary.min}
                  onChange={handleChange}
                  placeholder="0"
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
                />
              </div>

              <div className="form-group">
                <label htmlFor="salary-currency">Currency</label>
                <select
                  id="salary-currency"
                  name="salary.currency"
                  value={formData.salary.currency}
                  onChange={handleChange}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Required Skills */}
          <div className="form-section">
            <h2 className="section-title">🎯 Required Skills</h2>

            <div className="skill-input-group">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={handleSkillKeyPress}
                placeholder="Type a skill and press Enter or click Add"
              />
              <button
                type="button"
                onClick={addSkill}
                className="add-skill-btn"
              >
                Add Skill
              </button>
            </div>

            <div className="skills-list">
              {formData.skillsRequired.map(skill => (
                <div key={skill} className="skill-badge">
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="remove-skill-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {formData.skillsRequired.length === 0 && (
              <p className="hint-text">At least one skill is required</p>
            )}
          </div>

          {/* Job Image */}
          <div className="form-section">
            <h2 className="section-title">🖼️ Job Image (Optional)</h2>
            <p className="section-subtitle">
              Add a professional image to make your job posting stand out. Recommended: 1200x600px
            </p>

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
                    🗑️ Remove Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="image-upload-area">
                <label htmlFor="image-input" className="upload-label">
                  <FaCloudUploadAlt className="upload-icon" />
                  <h3>Drag image here or click to browse</h3>
                  <p>Supported formats: JPEG, PNG, WebP (Max 5MB)</p>
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

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || uploadingImage}
            >
              {loading ? (
                <>⏳ Posting Job...</>
              ) : (
                <>📮 Post Job</>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("/employer/jobs")}
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
