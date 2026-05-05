import React from "react";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from "react-icons/fa";

const Alert = ({ type = "info", message, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case "success": return <FaCheckCircle />;
      case "error": return <FaExclamationCircle />;
      case "warning": return <FaExclamationCircle />;
      default: return <FaInfoCircle />;
    }
  };

  const alertStyles = {
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "14px",
    fontWeight: "500",
    animation: "slideIn 0.3s ease-out",
    backgroundColor: type === "success" ? "#dcfce7" : type === "error" ? "#fee2e2" : "#fef9c3",
    color: type === "success" ? "#166534" : type === "error" ? "#991b1b" : "#854d0e",
    border: `1px solid ${type === "success" ? "#bbf7d0" : type === "error" ? "#fecaca" : "#fef08a"}`
  };

  return (
    <div style={alertStyles} className={`admin-alert ${type}`}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "18px", display: "flex" }}>{getIcon()}</span>
        <span>{message}</span>
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          style={{ 
            background: "none", 
            border: "none", 
            color: "inherit", 
            cursor: "pointer",
            display: "flex",
            opacity: 0.7
          }}
        >
          <FaTimes />
        </button>
      )}
    </div>
  );
};

export default Alert;
