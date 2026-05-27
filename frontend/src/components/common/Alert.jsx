import React from "react";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from "react-icons/fa";
import "./Alert.css";

const Alert = ({ type = "info", message, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case "success": return <FaCheckCircle />;
      case "error": return <FaExclamationCircle />;
      case "warning": return <FaExclamationCircle />;
      default: return <FaInfoCircle />;
    }
  };

  return (
    <div className={`admin-alert ${type}`}>
      <div className="admin-alert-content">
        <span className="icon">{getIcon()}</span>
        <span>{message}</span>
      </div>
      {onClose && (
        <button onClick={onClose}>
          <FaTimes />
        </button>
      )}
    </div>
  );
};

export default Alert;
