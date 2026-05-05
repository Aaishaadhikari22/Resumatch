import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import NotificationBell from "./NotificationBell";
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
    { name: "Dashboard", path: "/dashboard", icon: "🏠" },
    { name: "Admins", path: "/admins", icon: "🛡️" },
    { name: "Users", path: "/users", icon: "👥" },
    { name: "Employers", path: "/employers", icon: "🏢" },
    { name: "Jobs", path: "/jobs", icon: "💼" },
    { name: "Applications", path: "/applications", icon: "📄" },
    { name: "Resumes", path: "/resumes", icon: "📋" },
    { name: "Categories", path: "/categories", icon: "📂" },
    { name: "Reports", path: "/reports", icon: "📊" },
    { name: "Verification", path: "/verification", icon: "✅" },
    { name: "Settings", path: "/settings", icon: "⚙️" },
  ];

  const sectorAdminMenuItems = [
    { name: "Dashboard", path: "/dashboard", icon: "🏠" },
    { name: "Employers", path: "/employers", icon: "🏢" },
    { name: "Jobs", path: "/jobs", icon: "💼" },
    { name: "Applications", path: "/applications", icon: "📄" },
    { name: "Reports", path: "/reports", icon: "📊" },
    { name: "Verification", path: "/verification", icon: "✅" },
    { name: "Settings", path: "/sector-admin-settings", icon: "⚙️" },
  ];

  const menuItems = isSectorAdmin ? sectorAdminMenuItems : superAdminMenuItems;

  const handleLogout = () => {
    clearAuthStorage();
    navigate("/admin/login");
  };

  return (
    <div
      style={{
        width: "250px",
        backgroundColor: "#1e293b",
        height: "100vh",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #334155",
        boxSizing: "border-box"
      }}
    >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "40px", padding: "0 10px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: isSectorAdmin ? "#8b5cf6" : "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "12px", color: "white", fontWeight: "bold" }}>
              R
            </div>
            <div>
              <h2 style={{ color: "#ffffff", margin: 0, fontSize: "20px", fontWeight: "600" }}>ResuMatch</h2>
              {isSectorAdmin && (
                <span style={{ fontSize: "10px", color: "#a78bfa", fontWeight: 600, letterSpacing: "0.5px" }}>SECTOR ADMIN</span>
              )}
            </div>
          </div>
          <NotificationBell />
        </div>

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 16px",
              marginBottom: "8px",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: "500",
              fontSize: "15px",
              backgroundColor: location.pathname === item.path ? (isSectorAdmin ? "#7c3aed" : "#3b82f6") : "transparent",
              color: location.pathname === item.path ? "#ffffff" : "#94a3b8",
              transition: "all 0.2s ease"
            }}
          >
            <span style={{ marginRight: "12px", fontSize: "16px" }}>{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </div>

      <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid #334155" }}>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? "Switch to light theme" : "Switch to dark theme"}
          aria-pressed={isDarkMode}
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            padding: "12px 16px",
            marginBottom: "10px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#334155",
            color: "#e2e8f0",
            cursor: "pointer",
            fontWeight: "500",
            fontSize: "15px",
            transition: "all 0.2s ease"
          }}
        >
          <span style={{ marginRight: "12px" }}>{isDarkMode ? "☀️" : "🌙"}</span> {isDarkMode ? "Light Mode" : "Dark Mode"}
        </button>

        <button
          onClick={handleLogout}
          style={{
            display: "flex",
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

export default Sidebar;
