import React from "react";
import "./JobRequirements.css";

const JobRequirements = ({ job }) => {
  if (!job) return null;

  const hasRequirements = job.experienceLevel || job.minExperienceYears || job.educationLevel;

  if (!hasRequirements) return null;

  return (
    <div className="job-requirements-container">
      <h4 className="requirements-title">📋 Requirements</h4>
      <div className="requirements-grid">
        {job.experienceLevel && (
          <div className="requirement-item">
            <span className="requirement-icon">💼</span>
            <div className="requirement-content">
              <span className="requirement-label">Experience Level</span>
              <span className="requirement-value">{job.experienceLevel}</span>
            </div>
          </div>
        )}

        {job.minExperienceYears > 0 && (
          <div className="requirement-item">
            <span className="requirement-icon">📅</span>
            <div className="requirement-content">
              <span className="requirement-label">Minimum Experience</span>
              <span className="requirement-value">{job.minExperienceYears} year{job.minExperienceYears !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}

        {job.educationLevel && job.educationLevel !== "Any" && (
          <div className="requirement-item">
            <span className="requirement-icon">🎓</span>
            <div className="requirement-content">
              <span className="requirement-label">Education Level</span>
              <span className="requirement-value">{job.educationLevel}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobRequirements;
