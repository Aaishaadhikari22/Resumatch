import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import "./EmployerProfileCompletion.css";

export default function EmployerProfileCompletion({ employerId, onComplete, showWarnings = true }) {
  const [profile, setProfile] = useState(null);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState("registrationCertificate");

  const fetchProfileData = async () => {
    try {
      const res = await API.get("/employer/profile");
      setProfile(res.data);
      validateProfile(res.data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [employerId]);

  const validateProfile = (employerData) => {
    const requiredFields = {
      companyName: { completed: !!employerData.companyName, label: "Company Name" },
      companyDescription: { completed: !!employerData.companyDescription && employerData.companyDescription.length > 50, label: "Company Description" },
      phone: { completed: !!employerData.phone, label: "Contact Phone" },
      website: { completed: !!employerData.website, label: "Website" },
      logo: { completed: !!employerData.logo, label: "Company Logo" },
      registrationNumber: { completed: !!employerData.registrationNumber, label: "Registration Number" },
      documents: { 
        completed: employerData.documents && employerData.documents.length > 0, 
        label: "Official Documents" 
      }
    };

    const incomplete = Object.entries(requiredFields)
      .filter(([, req]) => !req.completed)
      .map(([key, req]) => ({ field: key, label: req.label }));

    const completionPercentage = Math.round(
      ((Object.keys(requiredFields).length - incomplete.length) / Object.keys(requiredFields).length) * 100
    );

    setValidation({
      completionPercentage,
      missingFields: incomplete,
      isComplete: incomplete.length === 0
    });

    if (onComplete && incomplete.length === 0) {
      onComplete(true);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("document", selectedFile);
    formData.append("documentType", documentType);

    try {
      await API.post("/employer/upload-document", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("✓ Document uploaded successfully!");
      setSelectedFile(null);
      fetchProfileData();
    } catch (err) {
      alert("❌ " + (err.response?.data?.msg || "Failed to upload document"));
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="employer-profile-loading">Loading profile...</div>;

  if (!profile) return <div className="employer-profile-error">Unable to load profile</div>;

  return (
    <div className="employer-profile-completion-container">
      <div className="profile-header">
        <h2>🏢 Company Profile Completion</h2>
        <p>Complete your company profile to accept job applications</p>
      </div>

      {/* Progress Bar */}
      <div className="completion-progress">
        <div className="progress-bar-bg">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${validation?.completionPercentage || 0}%` }}
          ></div>
        </div>
        <div className="progress-percentage">
          {validation?.completionPercentage || 0}% Complete
        </div>
      </div>

      {/* Missing Fields Warnings */}
      {showWarnings && validation?.missingFields.length > 0 && (
        <div className="warnings-section">
          <h3>⚠️ Missing Information</h3>
          <div className="missing-fields-list">
            {validation.missingFields.map((field, idx) => (
              <div key={idx} className="missing-field-item">
                <span className="warning-icon">❌</span>
                <span className="warning-text">{field.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Upload Section */}
      <div className="document-upload-section">
        <h3>📄 Official Business Documents</h3>
        <p>Upload official documents to verify your company and accept applications</p>

        <div className="upload-form">
          <div className="form-group">
            <label>Document Type *</label>
            <select 
              value={documentType} 
              onChange={(e) => setDocumentType(e.target.value)}
              className="form-control"
            >
              <option value="registrationCertificate">Registration Certificate</option>
              <option value="taxId">Tax ID Document</option>
              <option value="businessLicense">Business License</option>
              <option value="verificationDoc">Verification Document</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Select File *</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="file-input"
              disabled={uploading}
            />
            <small>Accepted formats: PDF, JPG, PNG, DOC (Max 5MB)</small>
          </div>

          <button
            className="upload-btn"
            onClick={handleFileUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? "⏳ Uploading..." : "📤 Upload Document"}
          </button>
        </div>

        {/* Uploaded Documents List */}
        {profile.documents && profile.documents.length > 0 && (
          <div className="uploaded-documents">
            <h4>Uploaded Documents ({profile.documents.length})</h4>
            {profile.documents.map((doc, idx) => (
              <div key={idx} className="document-item">
                <div className="doc-info">
                  <span className="doc-type">{doc.documentType.toUpperCase()}</span>
                  <span className="doc-name">{doc.fileName}</span>
                  <span className="doc-date">
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="doc-status">
                  {doc.isVerified ? (
                    <span className="verified-badge">✓ Verified</span>
                  ) : (
                    <span className="pending-badge">⏳ Pending Admin Review</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Completion Status */}
      {validation?.isComplete && (
        <div className="completion-success">
          <div className="success-icon">✓</div>
          <div className="success-message">
            <h3>🎉 Profile Complete!</h3>
            <p>You're all set! You can now accept job applications.</p>
          </div>
        </div>
      )}

      {!validation?.isComplete && validation?.completionPercentage >= 70 && (
        <div className="completion-warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-message">
            <h3>Almost There!</h3>
            <p>Complete the missing fields above to fully activate your profile.</p>
          </div>
        </div>
      )}
    </div>
  );
}
