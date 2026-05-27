import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import NotificationBell from "./NotificationBell";
import "./sidebar.css";
import { clearAuthStorage } from "../utils/auth";

const Sidebar = () => {
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
    }
  }, [isDarkMode]);

  const adminRole = (() => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
      if (!token) return "";
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.role || "";
    } catch (e) {
      console.log("Could not decode token", e);
      return "";
    }
  })();

  const isSectorAdmin = adminRole === "sector_admin";

  const superAdminMenuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: "🏠" },
    { name: "Admins", path: "/admin/admins", icon: "🛡️" },
    { name: "Users", path: "/admin/users", icon: "👥" },
    { name: "Employers", path: "/admin/employers", icon: "🏢" },
    { name: "Jobs", path: "/admin/jobs", icon: "💼" },
    { name: "Applications", path: "/admin/applications", icon: "📄" },
    { name: "Resumes", path: "/admin/resumes", icon: "📋" },
    { name: "Categories", path: "/admin/categories", icon: "📂" },
    { name: "Reports", path: "/admin/reports", icon: "📊" },
    { name: "Settings", path: "/admin/settings", icon: "⚙️" },
  ];

  const sectorAdminMenuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: "🏠" },
    { name: "Employers", path: "/admin/employers", icon: "🏢" },
    { name: "Jobs", path: "/admin/jobs", icon: "💼" },
    { name: "Applications", path: "/admin/applications", icon: "📄" },
    { name: "Reports", path: "/admin/reports", icon: "📊" },
    { name: "Verification", path: "/admin/verification", icon: "✅" },
    { name: "Settings", path: "/admin/sector-admin-settings", icon: "⚙️" },
  ];

  const menuItems = isSectorAdmin ? sectorAdminMenuItems : superAdminMenuItems;

  const handleLogout = () => {
    clearAuthStorage();
    navigate("/admin/login");
  return (
    <div className="sidebar">
      <div className="header">
        <div className="brand">
          <div
            className="avatar"
            style={{ backgroundColor: isSectorAdmin ? "#8b5cf6" : "#3b82f6" }}
          >
            R
          </div>
          <div>
            <div className="title">ResuMatch</div>
            {isSectorAdmin && (
              <div style={{ fontSize: "10px", color: "#a78bfa", fontWeight: 600, letterSpacing: "0.5px" }}>SECTOR ADMIN</div>
            )}
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
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? "Switch to light theme" : "Switch to dark theme"}
          aria-pressed={isDarkMode}
          className="theme-btn"
        >
          <span style={{ marginRight: "12px" }}>{isDarkMode ? "☀️" : "🌙"}</span> {isDarkMode ? "Light Mode" : "Dark Mode"}
        </button>

        <button onClick={handleLogout} className="logout-btn">
          <span style={{ marginRight: "12px" }}>🚪</span> Logout
        </button>
      </div>
    </div>
  );
    </div>
  );
};

export default Sidebar;
