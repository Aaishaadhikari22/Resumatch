import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Employers from "./pages/Employers";
import Home from "./pages/Home";
import Jobs from "./pages/Jobs";
import Applications from "./pages/Applications";
import Resumes from "./pages/Resumes";
import Categories from "./pages/Categories";
import Reports from "./pages/Reports";
import Verification from "./pages/Verification";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import SectorAdminSettings from "./pages/SectorAdminSettings";
import Roles from "./pages/Roles";
import AdminManagement from "./pages/AdminManagement";

import AdminLogin from "./pages/AdminLogin";
import AdminSignup from "./pages/AdminSignup";

// --- USER COMPONENT IMPORTS ---
import UserSidebar from "./components/UserSidebar";
import UserProtectedRoute from "./components/UserProtectedRoute";

import UserDashboard from "./pages/user/UserDashboard";
import UploadResume from "./pages/user/UploadResume";
import JobRecommendations from "./pages/user/JobRecommendations";
import UserApplications from "./pages/user/UserApplications";
import SavedJobs from "./pages/user/SavedJobs";
import UserSettings from "./pages/user/UserSettings";
import UserProfile from "./pages/user/UserProfile";

import UserLogin from "./pages/user/UserLogin";
import UserSignup from "./pages/user/UserSignup";

// --- EMPLOYER COMPONENT IMPORTS ---
import EmployerSidebar from "./components/EmployerSidebar";
import EmployerProtectedRoute from "./components/EmployerProtectedRoute";

import EmployerDashboard from "./pages/employer/EmployerDashboard";
import EmployerPostJob from "./pages/employer/EmployerPostJob";
import EmployerMyJobs from "./pages/employer/EmployerMyJobs";
import EmployerApplicants from "./pages/employer/EmployerApplicants";
import EmployerSettings from "./pages/employer/EmployerSettings";

import EmployerLogin from "./pages/employer/EmployerLogin";
import EmployerSignup from "./pages/employer/EmployerSignup";

function App() {
  return (
    <Router>
      <Routes>

        {/* PUBLIC LANDING PAGE */}
        <Route path="/" element={<Home />} />

        {/* ADMIN LOGIN & SIGNUP (NO SIDEBAR) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<AdminSignup />} />

        {/* USER LOGIN & SIGNUP (NO SIDEBAR) */}
        <Route path="/user/login" element={<UserLogin />} />
        <Route path="/user/signup" element={<UserSignup />} />

        {/* EMPLOYER LOGIN & SIGNUP (NO SIDEBAR) */}
        <Route path="/employer/login" element={<EmployerLogin />} />
        <Route path="/employer/signup" element={<EmployerSignup />} />

        {/* USER DASHBOARD SYSTEM */}
        <Route
          path="/user/*"
          element={
            <UserProtectedRoute>
              <div
                style={{
                  display: "flex",
                  height: "100vh",
                  width: "100vw",
                  overflow: "hidden",
                }}
              >
                {/* User Sidebar */}
                <UserSidebar />

                {/* User Main Content */}
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#f4f6f9",
                    color: "#0f172a",
                    padding: "0",
                    overflowY: "auto",
                  }}
                >
                  <Routes>
                    <Route path="dashboard" element={<UserDashboard />} />
                    <Route path="resume" element={<UploadResume />} />
                    <Route path="recommendations" element={<JobRecommendations />} />
                    <Route path="applications" element={<UserApplications />} />
                    <Route path="saved-jobs" element={<SavedJobs />} />
                    <Route path="settings" element={<UserSettings />} />
                    <Route path="profile" element={<UserProfile />} />
                  </Routes>
                </div>
              </div>
            </UserProtectedRoute>
          }
        />

        {/* EMPLOYER DASHBOARD SYSTEM */}
        <Route
          path="/employer/*"
          element={
            <EmployerProtectedRoute>
              <div
                style={{
                  display: "flex",
                  height: "100vh",
                  width: "100vw",
                  overflow: "hidden",
                }}
              >
                {/* Employer Sidebar */}
                <EmployerSidebar />

                {/* Employer Main Content */}
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#f4f6f9",
                    color: "#0f172a",
                    padding: "0",
                    overflowY: "auto",
                  }}
                >
                  <Routes>
                    <Route path="dashboard" element={<EmployerDashboard />} />
                    <Route path="post-job" element={<EmployerPostJob />} />
                    <Route path="my-jobs" element={<EmployerMyJobs />} />
                    <Route path="applicants" element={<EmployerApplicants />} />
                    <Route path="settings" element={<EmployerSettings />} />
                  </Routes>
                </div>
              </div>
            </EmployerProtectedRoute>
          }
        />

        {/* ADMIN DASHBOARD SYSTEM */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div
                style={{
                  display: "flex",
                  height: "100vh",
                  width: "100vw",
                  overflow: "hidden",
                }}
              >
                {/* Admin Sidebar */}
                <Sidebar />

                {/* Admin Main Content */}
                <div
                  style={{
                    flex: 1,
                    backgroundColor: "#f4f6f9",
                    color: "#0f172a",
                    padding: "0",
                    overflowY: "auto",
                  }}
                >
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="employers" element={<Employers />} />
                    <Route path="jobs" element={<Jobs />} />
                    <Route path="applications" element={<Applications />} />
                    <Route path="resumes" element={<Resumes />} />
                    <Route path="categories" element={<Categories />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="verification" element={<Verification />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="roles" element={<Roles />} />
                    <Route path="admins" element={<AdminManagement />} />
                    <Route path="users" element={<Users />} />
                    <Route path="sector-admin-settings" element={<SectorAdminSettings />} />
                  </Routes>
                </div>
              </div>
            </ProtectedRoute>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;