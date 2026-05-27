import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import "./sidebar.css";
import { useState, useEffect } from "react";
import { clearAuthStorage } from "../utils/auth";

const UserSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("darkMode", "true");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("darkMode", "false");
    return (
      <div className="sidebar">
        <div className="header">
          <div className="brand">
            <div className="avatar" style={{ backgroundColor: "#10b981" }}>U</div>
            <div>
              <div className="title">ResuMatch</div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>Job Seeker</div>
            </div>
          </div>
          <NotificationBell />
        </div>

        <div className="menu">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`menu-link ${location.pathname === item.path ? "active" : ""}`}
            >
              <span style={{ marginRight: "12px", fontSize: "16px" }}>{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>

        <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid var(--bg-card)" }}>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="theme-btn" title={isDarkMode ? "Switch to light theme" : "Switch to dark theme"} aria-pressed={isDarkMode}>
            <span style={{ marginRight: "12px" }}>{isDarkMode ? "☀️" : "🌙"}</span> {isDarkMode ? "Light Mode" : "Dark Mode"}
          </button>

          <button onClick={handleLogout} className="logout-btn">
            <span style={{ marginRight: "12px" }}>🚪</span> Logout
          </button>
        </div>
      </div>
    );
            alignItems: "center",
            width: "100%",
            padding: "12px 16px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#7f1d1d",
            color: "#fca5a5",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "15px",
            transition: "all 0.2s ease"
          }}
        >
          <span style={{ marginRight: "12px" }}>🚪</span> Logout
        </button>
      </div>
    </div>
  );
};

export default UserSidebar;
