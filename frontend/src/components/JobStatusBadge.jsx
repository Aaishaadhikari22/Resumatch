import React from "react";
import "./JobStatusBadge.css";

const JobStatusBadge = ({ jobStatus, isActive, closedAt }) => {
  if (!jobStatus) return null;

  const getStatusInfo = (status, isActive, closedAt) => {
    if (!isActive || closedAt) {
      return {
        label: "Closed",
        className: "closed",
        icon: "🔒",
        tooltip: "This job posting is closed"
      };
    }

    switch (status) {
      case "pending":
        return {
          label: "Pending Review",
          className: "pending",
          icon: "⏳",
          tooltip: "Awaiting admin approval"
        };
      case "approved":
        return {
          label: "Active",
          className: "approved",
          icon: "✓",
          tooltip: "Job is live and accepting applications"
        };
      case "rejected":
        return {
          label: "Rejected",
          className: "rejected",
          icon: "✕",
          tooltip: "Job posting was rejected"
        };
      case "flagged":
        return {
          label: "Flagged",
          className: "flagged",
          icon: "⚠️",
          tooltip: "Job posting has been flagged for review"
        };
      default:
        return {
          label: status,
          className: "default",
          icon: "•",
          tooltip: ""
        };
    }
  };

  const info = getStatusInfo(jobStatus, isActive, closedAt);

  return (
    <div className="job-status-badge" title={info.tooltip}>
      <span className={`badge ${info.className}`}>
        {info.icon} {info.label}
      </span>
    </div>
  );
};

export default JobStatusBadge;
