import { useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/axios";
import { useSocket } from "../../hooks/useSocketHook";
import "./employerDashboard.css";
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

// Custom Tooltip for Status Chart
function StatusChartTooltip({ active, payload, label, activeBarIndex, colors }) {
  if (active && payload && payload.length > 0) {
    const data = payload[0];
    const color = colors[activeBarIndex % colors.length];
    return (
      <div style={{
        background: "white",
        padding: "10px 14px",
        border: `3px solid ${color}`,
        borderRadius: "6px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
      }}>
        <p style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
          {label}
        </p>
        <p style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: color }}>
          {data.name}: {data.value}
        </p>
      </div>
    );
  }
  return null;
}

export default function EmployerDashboard() {
  const [stats, setStats] = useState(null);
  const [visibleBars, setVisibleBars] = useState({});
  const [activeBarIndex, setActiveBarIndex] = useState(null);
  const navigate = useNavigate();
  const socket = useSocket();

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("employerToken");
      if (!token) return navigate("/employer/login");

      const dashRes = await API.get("/employer/dashboard");

      setStats(dashRes.data);

      // Verification status check removed - not used in UI
    } catch (err) {
      console.log(err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/employer/login");
      }
    }
  }, [navigate]);

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };
    loadData();
  }, [fetchData]);

  useEffect(() => {
    if (!socket) return;
    socket.on("dashboard:refresh", fetchData);
    return () => socket.off("dashboard:refresh", fetchData);
  }, [socket, fetchData]);

  // Initialize visibleBars when stats change
  useEffect(() => {
    if (stats?.statusChart && Object.keys(visibleBars).length === 0) {
      const initialVisibility = {};
      stats.statusChart.forEach((item, index) => {
        initialVisibility[index] = true;
      });
      setVisibleBars(initialVisibility);
    }
  }, [stats]);

  const handleBarLegendClick = (index) => {
    setVisibleBars(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (!stats) {
    return (
      <div className="emp-loading">
        <h3>Loading your enterprise dashboard...</h3>
      </div>
    );
  }

  const COLORS = ["#0d9488", "#0ea5e9", "#f59e0b", "#ef4444", "#8b5cf6"];
  const companyInitial = stats.employer?.companyName?.[0] || "E";

  const getScoreClass = (score) => {
    if (score >= 70) return "high";
    if (score >= 40) return "medium";
    return "low";
  };

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
            <div style={{ display: "flex", gap: "12px", marginBottom: "15px", flexWrap: "wrap" }}>
              {stats.statusChart?.map((item, index) => (
                <div
                  key={index}
                  onClick={() => handleBarLegendClick(index)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "pointer",
                    padding: "6px 10px",
                    borderRadius: "5px",
                    backgroundColor: visibleBars[index] ? `${COLORS[index % COLORS.length]}20` : "#f1f5f9",
                    border: visibleBars[index] ? `2px solid ${COLORS[index % COLORS.length]}` : "1px solid #cbd5e1",
                    opacity: visibleBars[index] ? 1 : 0.5,
                    transition: "all 0.2s",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#1e293b"
                  }}
                >
                  <span style={{ display: "inline-block", width: "10px", height: "10px", backgroundColor: COLORS[index % COLORS.length], borderRadius: "2px" }}></span>
                  {item.name}
                </div>
              ))}
            </div>
            <div style={{ width: "100%", height: "300px", marginTop: "20px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.statusChart && stats.statusChart.length > 0 ? stats.statusChart : [{name: "No Data", value: 0}]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    content={(props) => <StatusChartTooltip {...props} activeBarIndex={activeBarIndex} colors={COLORS} />}
                    cursor={{fill: '#f0fdfa'}}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[4, 4, 0, 0]} 
                    barSize={50}
                    onMouseEnter={(data, index) => setActiveBarIndex(index)}
                    onMouseLeave={() => setActiveBarIndex(null)}
                  >
                    {stats.statusChart?.map((entry, index) => (
                      visibleBars[index] && <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="emp-chart-hint">Click legend items to show/hide. Distribution of applicants across different stages of your funnel.</p>
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
                    <div className="item-info" style={{ flex: 1 }}>
                        <strong>{app.user?.name}</strong>
                        <p>{app.job?.title}</p>
                    </div>
                    {app.similarityScore !== undefined && (
                      <div className={`emp-score-circle ${getScoreClass(app.similarityScore)}`} style={{ transform: 'scale(0.8)', margin: 0 }}>
                        {app.similarityScore}%
                      </div>
                    )}
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
