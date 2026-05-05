import { useEffect } from "react";
import "./ConfirmationModal.css";

export default function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "danger" // options: 'danger', 'warning', 'primary'
}) {
  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="confirmation-modal-overlay">
      <div className="confirmation-modal-box">
        <div className={`modal-icon ${type}`}>
          {type === 'danger' && "⚠️"}
          {type === 'warning' && "⚠️"}
          {type === 'primary' && "ℹ️"}
        </div>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        
        <div className="modal-actions">
          <button className="modal-btn cancel-btn" onClick={onCancel}>
            {cancelText}
          </button>
          <button className={`modal-btn confirm-btn ${type}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
