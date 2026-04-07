import React from "react";
import "./AcceptanceValidationModal.css";

export default function AcceptanceValidationModal({ 
  validation, 
  onConfirm, 
  onCancel, 
  isLoading = false,
  applicantName = "Applicant"
}) {
  const { blockers = [], warnings = [], completionPercentage = 0 } = validation || {};

  if (!validation) return null;

  const canProceed = blockers.length === 0;

  return (
    <div className="acceptance-modal-overlay">
      <div className="acceptance-modal">
        <div className="modal-header">
          <h2>
            {canProceed ? "✓ Ready to Accept" : "⚠️ Complete Company Profile"}
          </h2>
          <p className="applicant-name">Application from <strong>{applicantName}</strong></p>
        </div>

        {/* Profile Completion Status */}
        <div className="completion-status-box">
          <div className="status-label">Company Profile Complete</div>
          <div className="completion-bar">
            <div 
              className={`completion-fill ${canProceed ? 'complete' : 'incomplete'}`}
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <p className="completion-text">{completionPercentage}% Complete</p>
        </div>

        {/* Blockers (Critical Issues) */}
        {blockers.length > 0 && (
          <div className="validation-section blockers-section">
            <h3>❌ Required from Company</h3>
            <div className="issues-list">
              {blockers.map((blocker, idx) => (
                <div key={idx} className="issue-item blocker-item">
                  <div className="issue-icon">❌</div>
                  <div className="issue-content">
                    <div className="issue-title">{blocker.field}</div>
                    <p className="issue-message">{blocker.message}</p>
                    <p className="issue-suggestion">👉 {blocker.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings (Optional Improvements) */}
        {warnings.length > 0 && (
          <div className="validation-section warnings-section">
            <h3>⚠️ Recommendations</h3>
            <div className="issues-list">
              {warnings.map((warning, idx) => (
                <div key={idx} className="issue-item warning-item">
                  <div className="issue-icon">💡</div>
                  <div className="issue-content">
                    <div className="issue-title">{warning.field}</div>
                    <p className="issue-message">{warning.message}</p>
                    <p className="issue-suggestion">{warning.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="modal-actions">
          <button
            className="btn btn-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          {canProceed && (
            <button
              className="btn btn-confirm"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "⏳ Accepting..." : "✓ Accept Application"}
            </button>
          )}
          {!canProceed && (
            <button
              className="btn btn-update"
              onClick={onCancel}
            >
              Update Profile
            </button>
          )}
        </div>

        {/* Info Message */}
        {canProceed && (
          <div className="info-message">
            <span>✓</span>
            <p>Your profile is complete. Click "Accept Application" to proceed.</p>
          </div>
        )}
        {!canProceed && (
          <div className="error-message">
            <span>❌</span>
            <p>Please complete your company profile before accepting applications.</p>
          </div>
        )}
      </div>
    </div>
  );
}
