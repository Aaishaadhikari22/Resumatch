import { useNavigate, useLocation } from "react-router-dom";
import "../components/sidebar.css";
import { FaHome, FaFileAlt, FaBriefcase, FaPaperPlane, FaSignOutAlt } from "react-rotate"; // Assuming react-icons is used, let's use the ones seen previously or standard HTML. Wait, the admin uses react-icons/fa.

// Fallback to div / standard icons if react-icons is used.
export default function UserSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    window.location.href = "/user/login";
  };

  const navItems = [
    { name: "Dashboard", path: "/user/dashboard", icon: "🏠" },
    { name: "Upload Resume", path: "/user/resume", icon: "📄" },
    { name: "Recommended Jobs", path: "/user/recommendations", icon: "✨" },
    { name: "My Applications", path: "/user/applications", icon: "📨" }
  ];

  return (
    <div className="sidebar" style={{ width: "260px", background: "#1e293b", color: "white", display: "flex", flexDirection: "column", height: "100vh" }}>
      <div className="sidebar-logo" style={{ padding: "30px 20px", fontSize: "24px", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ background: "#3b82f6", color: "white", padding: "4px 10px", borderRadius: "8px" }}>R</span>
        Job Seeker
      </div>

      <div className="sidebar-nav" style={{ flex: 1, padding: "0 15px" }}>
        {navItems.map((item) => (
          <div
            key={item.name}
            onClick={() => navigate(item.path)}
            style={{
              padding: "14px 20px",
              marginBottom: "8px",
              borderRadius: "12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              transition: "all 0.2s",
              background: location.pathname === item.path ? "#3b82f6" : "transparent",
              fontWeight: location.pathname === item.path ? "600" : "500",
            }}
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: "20px" }}>
        <button
          onClick={handleLogout}
          style={{ width: "100%", padding: "14px", background: "#ef4444", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "600", fontSize: "15px" }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
