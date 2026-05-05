import React from "react";
import { Link } from "react-router-dom";
import "./VerificationBanner.css";

export default function VerificationBanner({ 
  userType = "user", // "user", "employer", "admin"
  verificationStatus = "complete", // "required", "pending", "incomplete", "complete"
  completionPercentage = 0,
  dismissible = true,
  onDismiss = null 
}) {
  const [isDismissed, setIsDismissed] = React.useState(false);

  if (isDismissed) return null;
  if (verificationStatus === "complete") return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) onDismiss();
  };

  // Determine banner content based on status and user type
  const getBannerContent = () => {
    if (userType === "user") {
      if (verificationStatus === "required") {
        return {
          icon: "⚠️",
          bgColor: "#fee2e2",
          borderColor: "#fca5a5",
          textColor: "#991b1b",
          title: "Profile Verification Required",
          message: "Complete your profile verification to unlock all features and apply for jobs",
          ctaText: "Complete Verification",
          ctaLink: "/user/settings?tab=verification"
        };
      } else if (verificationStatus === "incomplete") {
        return {
          icon: "📋",
          bgColor: "#fef3c7",
          borderColor: "#fde68a",
          textColor: "#78350f",
          title: "Profile Incomplete",
          message: `Your profile is ${completionPercentage}% complete. Upload documents to complete verification`,
          ctaText: "Continue Setup",
          ctaLink: "/user/settings?tab=verification"
        };
      } else if (verificationStatus === "pending") {
        return {
          icon: "⏳",
          bgColor: "#f0f9ff",
          borderColor: "#bfdbfe",
          textColor: "#1e40af",
          title: "Verification in Progress",
          message: "Your documents are being reviewed. We'll notify you once verification is complete",
          ctaText: "View Details",
          ctaLink: "/user/settings?tab=verification"
        };
      }
    } else if (userType === "employer") {
      if (verificationStatus === "required") {
        return {
          icon: "⚠️",
          bgColor: "#fee2e2",
          borderColor: "#fca5a5",
          textColor: "#991b1b",
          title: "Company Verification Required",
          message: "Complete your company verification to post jobs and hire candidates",
          ctaText: "Complete Verification",
          ctaLink: "/employer/settings?tab=verification"
        };
      } else if (verificationStatus === "incomplete") {
        return {
          icon: "📋",
          bgColor: "#fef3c7",
          borderColor: "#fde68a",
          textColor: "#78350f",
          title: "Company Profile Incomplete",
          message: `Your company profile is ${completionPercentage}% complete. Add missing information to enable job posting`,
          ctaText: "Complete Profile",
          ctaLink: "/employer/settings?tab=verification"
        };
      } else if (verificationStatus === "pending") {
        return {
          icon: "⏳",
          bgColor: "#f0f9ff",
          borderColor: "#bfdbfe",
          textColor: "#1e40af",
          title: "Company Verification Pending",
          message: "Your company is under review. Job postings will be visible after approval",
          ctaText: "View Progress",
          ctaLink: "/employer/settings?tab=verification"
        };
      }
    } else if (userType === "admin") {
      if (verificationStatus === "required") {
        return {
          icon: "🔍",
          bgColor: "#f0f9ff",
          borderColor: "#bfdbfe",
          textColor: "#1e40af",
          title: "Pending Verifications",
          message: "You have pending user and employer verifications to review",
          ctaText: "Review Now",
          ctaLink: "/verification"
        };
      }
    }

    return null;
  };

  const content = getBannerContent();
  if (!content) return null;

  return (
    <div 
      className="verification-banner"
      style={{
        backgroundColor: content.bgColor,
        borderLeftColor: content.borderColor,
        color: content.textColor
      }}
    >
      <div className="verification-banner-content">
        <div className="verification-banner-icon">{content.icon}</div>
        
        <div className="verification-banner-text">
          <h3 className="verification-banner-title">{content.title}</h3>
          <p className="verification-banner-message">{content.message}</p>
          
          {completionPercentage > 0 && verificationStatus === "incomplete" && (
            <div className="verification-progress-bar">
              <div 
                className="verification-progress-fill" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          )}
        </div>

        <div className="verification-banner-action">
          <Link to={content.ctaLink} className="verification-banner-cta">
            {content.ctaText}
          </Link>
          {dismissible && (
            <button 
              className="verification-banner-dismiss"
              onClick={handleDismiss}
              title="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
