import React, { useEffect, useState } from 'react';
import './Toast.css';

/**
 * Toast Component - Professional notification system
 * Replaces alert() with modern toast notifications
 * Shows success, error, warning, or info messages
 */
export const Toast = ({ 
  message, 
  type = 'info', // 'success', 'error', 'warning', 'info'
  duration = 3000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose && onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message || !isVisible) return null;

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
    </div>
  );
};

/**
 * useToast Hook - Easy toast management
 * Usage: const { showToast, toast } = useToast();
 *        showToast('Success!', 'success');
 */
export const useToast = () => {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ message, type, duration });
  };

  const closeToast = () => {
    setToast(null);
  };

  return { showToast, closeToast, toast };
};

export default Toast;
