import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import NotificationBell from "./NotificationBell";
import "./sidebar.css";
import { clearAuthStorage } from "../utils/auth";

const EmployerSidebar = () => {
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

  const menuItems = [
    { name: "Dashboard", path: "/employer/dashboard", icon: "🏠" },
    { name: "Post Job", path: "/employer/post-job", icon: "➕" },
    { name: "My Jobs", path: "/employer/my-jobs", icon: "💼" },
    { name: "Applicants", path: "/employer/applicants", icon: "👥" },
    { name: "Settings", path: "/employer/settings", icon: "⚙️" },
  ];

  const handleLogout = () => {
    clearAuthStorage();
    navigate("/employer/login");
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
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "12px", color: "white", fontWeight: "bold" }}>
            E
            </div>
            <h2 style={{ color: "#ffffff", margin: 0, fontSize: "18px", fontWeight: "600" }}>ResuMatch<br/><span style={{fontSize: "12px", color: "#94a3b8"}}>Employer Portal</span></h2>
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
              backgroundColor: location.pathname === item.path ? "#0d9488" : "transparent",
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

export default EmployerSidebar;
