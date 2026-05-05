import React, { useState, useEffect } from "react";
import API from "../api/axios";
import "./ProfileCompletion.css";

export default function ProfileCompletion({ userId, onComplete, onEditProfile, showWarnings = true }) {
  const [profile, setProfile] = useState(null);
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState("id");
  const [dragActive, setDragActive] = useState(false);

  const fetchProfileData = async () => {
    try {
      const res = await API.get("/user/profile");
      setProfile(res.data);
      // Calculate validation
      validateProfile(res.data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const validateProfile = (userData) => {
    const requiredFields = {
      name: { completed: !!userData.name, label: "Full Name" },
      email: { completed: !!userData.email, label: "Email" },
      phone: { completed: !!userData.phone, label: "Phone Number" },
      address: { completed: !!userData.address, label: "Address" },
      city: { completed: !!userData.city, label: "City" },
      profilePhoto: { completed: !!userData.profilePhoto, label: "Profile Photo" },
      documents: { 
        completed: userData.documents && userData.documents.length > 0, 
        label: "Official Documents" 
      }
    };

    const incomplete = Object.entries(requiredFields)
      .filter(([, req]) => !req.completed)
      .map(([key, req]) => ({ field: key, label: req.label }));

    const completionPercentage = Math.round(
      ((Object.keys(requiredFields).length - incomplete.length) / Object.keys(requiredFields).length) * 100
    );

    const uploaded = userData.documents ? userData.documents.filter(d => d.status === 'uploaded').length : 0;
    const pending = userData.documents ? userData.documents.filter(d => d.status === 'pending').length : 0;
    const approved = userData.documents ? userData.documents.filter(d => d.status === 'approved').length : 0;
    const notVerified = userData.documents ? userData.documents.filter(d => d.status === 'not_verified').length : 0;

    setValidation({
      completionPercentage,
      missingFields: incomplete,
      isComplete: incomplete.length === 0,
      documentStats: {
        uploaded,
        pending,
        approved,
        notVerified
      }
    });

    if (onComplete && incomplete.length === 0) {
      onComplete(true);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a file");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("document", selectedFile);
    formData.append("documentType", documentType);

    try {
      await API.post("/user/upload-document", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("✓ Document uploaded successfully!");
      setSelectedFile(null);
      setDocumentType("id");
      fetchProfileData();
    } catch (err) {
      alert("❌ " + (err.response?.data?.msg || "Failed to upload document"));
    } finally {
      setUploading(false);
    }
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;

  if (!profile) return <div className="profile-error">Unable to load profile</div>;

  return (
    <div className="profile-completion-container">
      {/* Profile Card Section */}
      <div className="profile-card-section">
        <div className="profile-card">
          <div className="profile-avatar">
            {profile.profilePhoto ? (
              <img src={profile.profilePhoto} alt={profile.name} />
            ) : (
              <div className="avatar-placeholder">
                <span>{profile.name?.charAt(0)?.toUpperCase() || "U"}</span>
              </div>
            )}
          </div>
          
          <div className="profile-card-info">
            <h2 className="profile-name">{profile.name || "User"}</h2>
            <p className="profile-email">{profile.email || "No email"}</p>
            <div className="profile-status-indicator">
              {validation?.isComplete ? (
                <>
                  <span className="status-badge complete">✓ Profile Complete</span>
                </>
              ) : (
                <>
                  <span className="status-badge incomplete">⚠ Verification Required</span>
                </>
              )}
            </div>
          </div>

          <button className="edit-profile-btn" onClick={() => typeof onEditProfile === 'function' && onEditProfile()}>✎ Edit</button>
        </div>

        {/* Profile Information */}
        <div className="profile-info-box">
          <h3 className="box-title">Profile Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Full Name</label>
              <p>{profile.name || "Not provided"}</p>
            </div>
            <div className="info-item">
              <label>Email Address</label>
              <p>{profile.email || "Not provided"}</p>
            </div>
            <div className="info-item">
              <label>Phone Number</label>
              <p>{profile.phone || "Not provided"}</p>
            </div>
            <div className="info-item">
              <label>Gender</label>
              <p>{profile.gender || "Not provided"}</p>
            </div>
            <div className="info-item">
              <label>Address</label>
              <p>{profile.address || "Not provided"}</p>
            </div>
            <div className="info-item">
              <label>City</label>
              <p>{profile.city || "Not provided"}</p>
            </div>
            <div className="info-item" style={{ gridColumn: "span 2" }}>
              <label>Date of Birth</label>
              <p>{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : "Not provided"}</p>
            </div>
            <div className="info-item" style={{ gridColumn: "span 2" }}>
              <label>Professional Bio</label>
              <p style={{ whiteSpace: "pre-line", lineHeight: "1.5" }}>{profile.bio || "No professional bio provided yet."}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Status Section */}
      <div className="verification-status-section">
        <h3 className="section-title">Verification Status</h3>
        <div className="status-grid">
          <div className="status-card uploaded">
            <div className="status-icon">📤</div>
            <div className="status-count">{validation?.documentStats?.uploaded || 0}</div>
            <div className="status-label">Uploaded</div>
          </div>
          <div className="status-card pending">
            <div className="status-icon">⏳</div>
            <div className="status-count">{validation?.documentStats?.pending || 0}</div>
            <div className="status-label">Pending</div>
          </div>
          <div className="status-card approved">
            <div className="status-icon">✓</div>
            <div className="status-count">{validation?.documentStats?.approved || 0}</div>
            <div className="status-label">Approved</div>
          </div>
          <div className="status-card not-verified">
            <div className="status-icon">✗</div>
            <div className="status-count">{validation?.documentStats?.notVerified || 0}</div>
            <div className="status-label">Not Verified</div>
          </div>
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
      <div className="document-section">
        <h3 className="section-title">Upload Verification Document</h3>
        <p className="section-description">Upload your documents (ID, Passport or company registration documents)</p>

        <div className="upload-form-container">
          <div className="form-group">
            <label>Document Type *</label>
            <select 
              value={documentType} 
              onChange={(e) => setDocumentType(e.target.value)}
              className="form-control"
            >
              <option value="">Select document type</option>
              <option value="id">Government ID</option>
              <option value="passport">Passport</option>
              <option value="license">Driver's License</option>
              <option value="certificate">Certificate/Degree</option>
              <option value="registration">Company Registration</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Document File *</label>
            <div 
              className={`file-upload-zone ${dragActive ? 'active' : ''} ${selectedFile ? 'has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="file-input-hidden"
                disabled={uploading}
                id="file-input"
              />
              <label htmlFor="file-input" className="file-upload-label">
                <div className="upload-icon">📁</div>
                <p className="upload-title">Click to upload or drag and drop</p>
                <p className="upload-info">PDF, JPEG or PNG (Max 10MB)</p>
                {selectedFile && (
                  <p className="selected-file">Selected: {selectedFile.name}</p>
                )}
              </label>
            </div>
          </div>

          <button
            className="upload-btn"
            onClick={handleFileUpload}
            disabled={!selectedFile || uploading || !documentType}
          >
            {uploading ? "⏳ Uploading..." : "Upload Document"}
          </button>
        </div>

        {/* Uploaded Documents List */}
        {profile.documents && profile.documents.length > 0 && (
          <div className="uploaded-documents-section">
            <h4>Uploaded Documents</h4>
            <p className="uploaded-docs-description">Your uploaded documents and their verification status</p>
            {profile.documents.map((doc, idx) => (
              <div key={idx} className="document-item">
                <div className="doc-info">
                  <span className="doc-type">{doc.documentType.toUpperCase()}</span>
                  <div className="doc-details">
                    <span className="doc-name">{doc.fileName}</span>
                    <span className="doc-date">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="doc-status">
                  {doc.status === 'approved' && (
                    <span className="status-approved">✓ Approved</span>
                  )}
                  {doc.status === 'pending' && (
                    <span className="status-pending">⏳ Pending</span>
                  )}
                  {doc.status === 'not_verified' && (
                    <span className="status-rejected">✗ Not Verified</span>
                  )}
                  {doc.status === 'uploaded' && (
                    <span className="status-uploaded">📤 Uploaded</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completion Success */}
      {validation?.isComplete && (
        <div className="completion-success">
          <div className="success-icon">✓</div>
          <div className="success-message">
            <h3>🎉 Profile Complete!</h3>
            <p>Your profile is complete. You can now apply for jobs.</p>
          </div>
        </div>
      )}
    </div>
  );
}
