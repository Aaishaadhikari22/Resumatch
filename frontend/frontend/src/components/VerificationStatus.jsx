import React from "react";
import "./VerificationStatus.css";

const VerificationStatus = ({ employer }) => {
  if (!employer) return null;

  const completionFields = [
    { label: "Company Name", value: !!employer.companyName, key: "companyName" },
    { label: "Company Description", value: !!employer.companyDescription, key: "companyDescription" },
    { label: "Email", value: !!employer.email, key: "email" },
    { label: "Phone", value: !!employer.phone, key: "phone" },
    { label: "Website", value: !!employer.website, key: "website" },
    { label: "Logo", value: !!employer.logo, key: "logo" },
    { label: "Documents Uploaded", value: employer.documents && employer.documents.length > 0, key: "documents" },
    { label: "Registration Verified", value: employer.documents && employer.documents.some(d => d.isVerified), key: "verified" }
  ];

  const completedFields = completionFields.filter(f => f.value).length;
  const completionPercentage = Math.round((completedFields / completionFields.length) * 100);

  const getStatusClass = () => {
    if (employer.status === "approved") return "verified";
    if (employer.status === "pending") return "pending";
    if (employer.status === "rejected") return "rejected";
    return "unverified";
  };

  const getStatusInfo = () => {
    switch (employer.status) {
      case "approved":
        return {
          title: "✓ Verified Employer",
          description: "Your company has been verified and approved.",
          color: "#059669"
        };
      case "pending":
        return {
          title: "⏳ Pending Verification",
          description: "Your company profile is under review.",
          color: "#d97706"
        };
      case "rejected":
        return {
          title: "✕ Verification Rejected",
          description: "Your company profile was rejected. Please contact support.",
          color: "#dc2626"
        };
      default:
        return {
          title: "Unverified",
          description: "Complete your profile to get verified.",
          color: "#64748b"
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="verification-status-container">
      <div className={`verification-status-card ${getStatusClass()}`}>
        <div className="verification-header">
          <h3 className="verification-title">{statusInfo.title}</h3>
          <span className="verification-status-badge" style={{ borderColor: statusInfo.color, color: statusInfo.color }}>
            {employer.status || "unverified"}
          </span>
        </div>
        <p className="verification-description">{statusInfo.description}</p>

        {/* Completion Progress */}
        <div className="verification-progress-section">
          <div className="progress-header">
            <span className="progress-label">Profile Completion</span>
            <span className="progress-percentage">{completionPercentage}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${completionPercentage}%` }}></div>
          </div>
        </div>

        {/* Required Fields Checklist */}
        <div className="verification-checklist">
          <h4 className="checklist-title">Required Information</h4>
          <div className="checklist-items">
            {completionFields.map(field => (
              <div key={field.key} className={`checklist-item ${field.value ? 'completed' : 'incomplete'}`}>
                <span className="checklist-icon">
                  {field.value ? '✓' : '✗'}
                </span>
                <span className="checklist-label">{field.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Missing Fields Alert */}
        {completedFields < completionFields.length && (
          <div className="completion-alert">
            <span className="alert-icon">⚠️</span>
            <div className="alert-content">
              <p className="alert-title">Complete Your Profile</p>
              <p className="alert-message">
                You need to complete {completionFields.length - completedFields} more field{completionFields.length - completedFields !== 1 ? 's' : ''} to get verified.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationStatus;
