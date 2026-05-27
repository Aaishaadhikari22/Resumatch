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
      <div className="dashboard-tooltip" style={{ borderColor: color }}>
        <p className="dashboard-tooltip-label">{label}</p>
        <p className="dashboard-tooltip-value" style={{ color: color }}>
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
            <Link to="/employer/my-jobs" className="emp-stat-tile">
              <p>Active Jobs</p>
              <h3>{stats.activeJobs}</h3>
              <span className="emp-stat-note">View Jobs →</span>
            </Link>
            <Link to="/employer/applicants" className="emp-stat-tile">
              <p>Total Applicants</p>
              <h3>{stats.totalApplicants}</h3>
              <span className="emp-stat-note">View All →</span>
            </Link>
            <Link to="/employer/applicants" className="emp-stat-tile">
              <p>Hired</p>
              <h3>{stats.acceptedCount}</h3>
              <span className="emp-stat-note">View Hired →</span>
            </Link>
          </div>

          <div className="emp-chart-section">
            <h3 className="emp-section-title">Hiring Pipeline Progress</h3>
            <div className="bar-legend-row">
              {stats.statusChart?.map((item, index) => (
                <div
                  key={index}
                  onClick={() => handleBarLegendClick(index)}
                  className={`bar-legend-pill ${visibleBars[index] ? '' : 'inactive'}`}
                  style={{
                    backgroundColor: visibleBars[index] ? `${COLORS[index % COLORS.length]}20` : '#f1f5f9',
                    border: visibleBars[index] ? `2px solid ${COLORS[index % COLORS.length]}` : '1px solid #cbd5e1'
                  }}
                >
                  <span className="legend-dot" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  {item.name}
                </div>
              ))}
            </div>
            <div className="emp-chart-wrapper">
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
                  >
                    <div className="item-avatar">{app.user?.name?.[0]}</div>
                    <div className="item-info">
                        <strong>{app.user?.name}</strong>
                        <p>{app.job?.title}</p>
                    </div>
                    {app.similarityScore !== undefined && (
                      <div className={`emp-score-circle ${getScoreClass(app.similarityScore)}`}>
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

          <div className="emp-card-white emp-section-spaced">
             <h3 className="emp-section-title">🔍 Talent Insights</h3>
             <div className="emp-insights-list">
                <Link to="/employer/applicants" className="insight-box">
                    <strong>Growth</strong>
                    <p>Applications are up 12% this week. View all →</p>
                </Link>
                <Link to="/employer/my-jobs" className="insight-box">
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
