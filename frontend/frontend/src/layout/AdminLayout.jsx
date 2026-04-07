import { Outlet, useNavigate } from "react-router-dom";
import { FaTachometerAlt, FaUsers, FaBriefcase, FaBuilding, FaFileAlt } from "react-icons/fa";
import "./adminLayout.css";

export default function AdminLayout() {

  const navigate = useNavigate();

  const logout = ()=>{
  localStorage.removeItem("token");
  navigate("/admin/login");
  };

  return (
    <div className="admin-layout">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <h2 className="logo">ResuMatch</h2>

        <nav className="menu">

          <div onClick={() => navigate("/admin/dashboard")}>
            <FaTachometerAlt /> Dashboard
          </div>

          <div onClick={() => navigate("/admin/users")}>
            <FaUsers /> Users
          </div>

          <div onClick={() => navigate("/admin/employers")}>
            <FaBuilding /> Employers
          </div>

          <div onClick={() => navigate("/admin/jobs")}>
            <FaBriefcase /> Jobs
          </div>

          <div onClick={() => navigate("/admin/resumes")}>
            <FaFileAlt /> Resumes
          </div>

        </nav>

      </aside>

      {/* MAIN AREA */}
      <div className="main-area">

        <header className="topbar">

  <h3>Admin Panel</h3>

  <div className="topbar-right">

    <div className="profile">
      <img
        src="https://i.pravatar.cc/40"
        alt="admin"
        className="avatar"
      />
      <span>Admin</span>
    </div>

    <button className="logout-btn" onClick={logout}>
      Logout
    </button>

  </div>

</header>

        <div className="content">
          <Outlet />
        </div>

      </div>

    </div>
  );

}