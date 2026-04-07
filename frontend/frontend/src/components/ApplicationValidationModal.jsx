import React, { useState } from "react";
import "./ApplicationValidationModal.css";

export default function ApplicationValidationModal({ 
  validation, 
  onConfirm, 
  onCancel, 
  isLoading = false 
}) {
  const { blockers = [], warnings = [], completionPercentage = 0 } = validation || {};

  if (!validation) return null;

  const canProceed = blockers.length === 0;

  return (
    <div className="validation-modal-overlay">
      <div className="validation-modal">
        <div className="modal-header">
          <h2>
            {canProceed ? "✓ Ready to Apply!" : "⚠️ Complete Your Profile"}
          </h2>
        </div>

        {/* Profile Completion Status */}
        <div className="completion-status-box">
          <div className="completion-bar">
            <div 
              className={`completion-fill ${canProceed ? 'complete' : 'incomplete'}`}
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <p className="completion-text">{completionPercentage}% Profile Complete</p>
        </div>

        {/* Blockers (Critical Issues) */}
        {blockers.length > 0 && (
          <div className="validation-section blockers-section">
            <h3>❌ Required Information Missing</h3>
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
                  <div className="issue-icon">⚡</div>
                  <div className="issue-content">
                    <div className="issue-title">{warning.field}</div>
                    <p className="issue-message">{warning.message}</p>
                    <p className="issue-suggestion">💡 {warning.suggestion}</p>
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
              {isLoading ? "⏳ Applying..." : "✓ Apply Now"}
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
            <p>Your profile is complete. Click "Apply Now" to submit your application.</p>
          </div>
        )}
        {!canProceed && (
          <div className="error-message">
            <span>❌</span>
            <p>Please complete the required fields in your profile before applying.</p>
          </div>
        )}
      </div>
    </div>
  );
}
