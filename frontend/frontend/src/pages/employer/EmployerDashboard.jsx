import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/axios";
import "./employerDashboard.css";
import VerificationBanner from "../../components/VerificationBanner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

export default function EmployerDashboard() {
  const [stats, setStats] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState("complete");
  const [completionPercentage, setCompletionPercentage] = useState(100);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("employerToken");
        if (!token) return navigate("/employer/login");

        const [dashRes, profileRes] = await Promise.all([
          API.get("/employer/dashboard"),
          API.get("/employer/profile")
        ]);

        setStats(dashRes.data);

        // Check verification status
        const profile = profileRes.data;
        if (profile.status === "pending") {
          setVerificationStatus("pending");
        } else if (profile.status === "rejected") {
          setVerificationStatus("required");
        } else {
          const requiredFields = {
            companyName: !!profile.companyName,
            registrationNumber: !!profile.registrationNumber,
            industry: !!profile.industry,
            address: !!profile.address,
            city: !!profile.city,
            documents: profile.documents && profile.documents.length > 0
          };

          const completed = Object.values(requiredFields).filter(Boolean).length;
          const percentage = Math.round((completed / Object.keys(requiredFields).length) * 100);
          setCompletionPercentage(percentage);

          if (percentage === 100) {
            setVerificationStatus("complete");
          } else if (percentage >= 60) {
            setVerificationStatus("incomplete");
          } else {
            setVerificationStatus("required");
          }
        }
      } catch (err) {
        console.log(err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate("/employer/login");
        }
      }
    };
    fetchData();
  }, [navigate]);

  if (!stats) {
    return (
      <div className="emp-loading">
        <h3>Loading your enterprise dashboard...</h3>
      </div>
    );
  }

  const COLORS = ["#0d9488", "#0ea5e9", "#f59e0b", "#ef4444", "#8b5cf6"];
  const companyInitial = stats.employer?.companyName?.[0] || "E";

  return (
    <div className="employer-dashboard-container">
      
      {/* 1. LinkedIn-style Company Banner */}
      <div className="emp-profile-banner">
        <div className="emp-banner-bg"></div>
        <div className="emp-banner-content">
          <div className="emp-logo-container">
            <div className="emp-logo-avatar">{companyInitial}</div>
          </div>
          <div className="emp-company-info">
            <h1>{stats.employer?.companyName}</h1>
            <p>{stats.employer?.industry || "Technology"} • {stats.employer?.location || "Global Headquarters"}</p>
          </div>
          <div className="emp-header-actions">
             <Link to="/employer/post-job" className="emp-primary-btn">Post a New Job</Link>
          </div>
        </div>
      </div>

      {stats.employer?.status === "pending" && (
        <div className="emp-verification-alert">
           <span className="v-icon">⏳</span>
           <div className="v-text">
             <h4>Verification Pending</h4>
             <p>Our team is reviewing your company profile. Jobs will be visible after approval.</p>
           </div>
        </div>
      )}

      {/* Verification Status Banner */}
      <VerificationBanner 
        userType="employer"
        verificationStatus={verificationStatus}
        completionPercentage={completionPercentage}
        dismissible={true}
      />

      <div className="emp-main-grid">
        
        {/* Left Column: Hiring Analytics */}
        <div className="emp-column-left">
          
          <div className="emp-stats-card-grid">
            <Link to="/employer/my-jobs" className="emp-stat-tile" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <p>Active Jobs</p>
              <h3>{stats.activeJobs}</h3>
              <span style={{ fontSize: '12px', color: '#0d9488', fontWeight: '600', marginTop: '4px', display: 'block' }}>View Jobs →</span>
            </Link>
            <Link to="/employer/applicants" className="emp-stat-tile" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <p>Total Applicants</p>
              <h3>{stats.totalApplicants}</h3>
              <span style={{ fontSize: '12px', color: '#0d9488', fontWeight: '600', marginTop: '4px', display: 'block' }}>View All →</span>
            </Link>
            <Link to="/employer/applicants" className="emp-stat-tile" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <p>Hired</p>
              <h3>{stats.acceptedCount}</h3>
              <span style={{ fontSize: '12px', color: '#0d9488', fontWeight: '600', marginTop: '4px', display: 'block' }}>View Hired →</span>
            </Link>
          </div>

          <div className="emp-chart-section">
            <h3 className="emp-section-title">Hiring Pipeline Progress</h3>
            <div style={{ width: "100%", height: "300px", marginTop: "20px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.statusChart && stats.statusChart.length > 0 ? stats.statusChart : [{name: "No Data", value: 0}]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f0fdfa'}} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={50}>
                    {stats.statusChart?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="emp-chart-hint">Distribution of applicants across different stages of your funnel.</p>
          </div>

          <div className="emp-actions-section">
             <h3 className="emp-section-title">⚡ Quick Management</h3>
             <div className="emp-shortcuts">
                <Link to="/employer/my-jobs" className="emp-s-item">
                    <span className="s-emoji">💼</span>
                    <strong>My Jobs</strong>
                </Link>
                <Link to="/employer/applicants" className="emp-s-item">
                    <span className="s-emoji">👥</span>
                    <strong>Applicants</strong>
                </Link>
                <Link to="/employer/settings" className="emp-s-item">
                    <span className="s-emoji">⚙️</span>
                    <strong>Settings</strong>
                </Link>
                <Link to="/employer/profile" className="emp-s-item">
                    <span className="s-emoji">🏢</span>
                    <strong>Company</strong>
                </Link>
             </div>
          </div>

        </div>

        {/* Right Column: Recent Applicants & Insights */}
        <div className="emp-column-right">
          
          <div className="emp-card-white">
            <div className="emp-card-header">
                <h3 className="emp-section-title">Recent Applicants</h3>
                <Link to="/employer/applicants">View All</Link>
            </div>
            <div className="emp-mini-list">
              {stats.recentApplications?.length > 0 ? (
                stats.recentApplications.map((app) => (
                  <Link
                    key={app._id}
                    to={`/employer/applicants?job=${app.job?._id || ''}`}
                    className="emp-list-item"
                    style={{ textDecoration: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                  >
                    <div className="item-avatar">{app.user?.name?.[0]}</div>
                    <div className="item-info">
                        <strong>{app.user?.name}</strong>
                        <p>{app.job?.title}</p>
                    </div>
                    <span className={`status-pill ${app.status}`}>{app.status[0]}</span>
                  </Link>
                ))
              ) : (
                <p className="empty-msg">No recent applications found.</p>
              )}
            </div>
          </div>

          <div className="emp-card-white" style={{ marginTop: "24px" }}>
             <h3 className="emp-section-title">🔍 Talent Insights</h3>
             <div className="emp-insights-list">
                <Link to="/employer/applicants" className="insight-box" style={{ textDecoration: 'none', cursor: 'pointer', display: 'block' }}>
                    <strong>Growth</strong>
                    <p>Applications are up 12% this week. View all →</p>
                </Link>
                <Link to="/employer/my-jobs" className="insight-box" style={{ textDecoration: 'none', cursor: 'pointer', display: 'block' }}>
                    <strong>Matches</strong>
                    <p>AI found high-potential matches for your roles. View jobs →</p>
                </Link>
             </div>
          </div>

        </div>

      </div>

    </div>
  );
}
