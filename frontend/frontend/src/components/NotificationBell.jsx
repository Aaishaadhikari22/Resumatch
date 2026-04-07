import { useState, useEffect, useRef } from "react";
import API from "../api/axios";
import "./NotificationBell.css";
import LoadingSpinner from "./common/LoadingSpinner";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => n && !n.isRead).length : 0;

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Determine user type from localStorage
      const userToken = localStorage.getItem("userToken");
      const employerToken = localStorage.getItem("employerToken");
      const adminToken = localStorage.getItem("adminToken");

      let res = null;
      
      // Try to fetch appropriate notifications based on user type
      if (userToken) {
        try {
          res = await API.get("/user/notifications");
        } catch (err) {
          if (err.response?.status !== 404 && err.response?.status !== 403) {
            console.error("Failed to fetch user notifications", err);
          }
          res = { data: [] };
        }
      } else if (employerToken) {
        try {
          res = await API.get("/employer/notifications");
        } catch (err) {
          if (err.response?.status !== 404 && err.response?.status !== 403) {
            console.error("Failed to fetch employer notifications", err);
          }
          res = { data: [] };
        }
      } else if (adminToken) {
        // Admin doesn't have notifications endpoint - return empty
        res = { data: [] };
      } else {
        res = { data: [] };
      }

      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/read/${id}`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put("/notifications/read-all");
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <div className="bell-icon" onClick={() => setShowDropdown(!showDropdown)}>
        🔔
        {unreadCount > 0 && (
          <span className="bell-badge">
            {unreadCount}
          </span>
        )}
      </div>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
                <button 
                    onClick={markAllAsRead}
                    className="mark-all-btn"
                >
                    Mark all read
                </button>
            )}
          </div>
          
          <div className="notification-list">
            {loading ? (
                <div style={{ padding: "20px", display: "flex", justifyContent: "center" }}>
                    <LoadingSpinner size="small" />
                </div>
            ) : !Array.isArray(notifications) || notifications.length === 0 ? (
              <div className="no-notifications">No notifications yet</div>
            ) : (
              notifications.map(n => (
                n && n._id ? (
                  <div 
                      key={n._id} 
                      onClick={() => !n.isRead && markAsRead(n._id)}
                      className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                  >
                    <div className="notification-title">{n.title || "Notification"}</div>
                    <div className="notification-message">{n.message || ""}</div>
                    <div className="notification-time">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}</div>
                  </div>
                ) : null
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
