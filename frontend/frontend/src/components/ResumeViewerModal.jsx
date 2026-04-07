import React, { useState } from "react";
import { FaTimes, FaDownload, FaPhone, FaEnvelope, FaCalendar, FaBriefcase } from "react-icons/fa";
import "./ResumeViewerModal.css";

const ResumeViewerModal = ({ resume, user, onClose }) => {
  if (!resume || !user) return null;

  const handleDownload = () => {
    if (resume.resumeUrl) {
      const link = document.createElement("a");
      link.href = resume.resumeUrl;
      link.download = `${user.name}-resume.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="resume-viewer-overlay">
      <div className="resume-viewer-modal">
        <div className="resume-viewer-header">
          <div className="resume-viewer-title">
            <h2>📄 Resume Preview</h2>
            <p className="resume-title">{resume.title}</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="resume-viewer-content">
          {/* User Basic Info */}
          <div className="resume-section basic-info">
            <h3>👤 Basic Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Name:</span>
                <span className="info-value">{user.name || "N/A"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">
                  <FaEnvelope /> {user.email || "N/A"}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone:</span>
                <span className="info-value">
                  <FaPhone /> {user.phone || "N/A"}
                </span>
              </div>
              {user.location && (
                <div className="info-item">
                  <span className="info-label">Location:</span>
                  <span className="info-value">{user.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Resume Title & Experience */}
          <div className="resume-section resume-info">
            <h3>💼 Professional Summary</h3>
            <div className="resume-title-display">{resume.title}</div>
            {resume.experience > 0 && (
              <div className="experience-display">
                <FaBriefcase /> {resume.experience} Year{resume.experience !== 1 ? "s" : ""} of
                Experience
              </div>
            )}
          </div>

          {/* Skills */}
          {resume.skills && resume.skills.length > 0 && (
            <div className="resume-section skills-section">
              <h3>🎯 Skills</h3>
              <div className="skills-grid">
                {resume.skills.map((skill, index) => (
                  <div key={index} className="skill-tag">
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resume URL */}
          {resume.resumeUrl && (
            <div className="resume-section resume-file">
              <h3>📋 Full Resume</h3>
              <p className="file-info">A complete resume document is available for download.</p>
              <div className="resume-actions">
                <button className="download-btn" onClick={handleDownload}>
                  <FaDownload /> Download Resume (PDF)
                </button>
                <a
                  href={resume.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-btn"
                >
                  🔗 Open in New Tab
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="resume-viewer-footer">
          <button className="close-footer-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeViewerModal;
