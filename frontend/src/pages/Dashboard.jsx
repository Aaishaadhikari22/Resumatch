import { useCallback, useEffect, useState } from "react";
import API from "../api/axios";
import { useSocket } from "../hooks/useSocketHook";
import "./dashboard.css";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Alert from "../components/common/Alert";
import {
  FaUsers,
  FaBuilding,
  FaBriefcase,
  FaClock,
  FaFileAlt
} from "react-icons/fa";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";

const GrowthIndicator = ({ value }) => {
  const positive = value >= 0;
  return (
    <span className={positive ? "growth positive" : "growth negative"}>
      {positive ? "▲" : "▼"} {Math.abs(value)}%
    </span>
  );
};

// Custom Tooltip for Platform Growth Chart
function GrowthTooltip({ active, payload, label, activeSeries }) {
  if (active && payload && payload.length > 0) {
    let displayData = null;
    
    if (activeSeries === 'jobs') {
      displayData = payload.find(p => p.dataKey === 'jobs');
    } else if (activeSeries === 'users') {
      displayData = payload.find(p => p.dataKey === 'users');
    }
    
    if (!displayData) {
      displayData = payload[0];
    }
    
    if (!displayData) return null;
    
    return (
      <div className="growth-tooltip" data-color={displayData.stroke || displayData.color}>
        <p className="growth-tooltip-label">{label}</p>
        <p className="growth-tooltip-value">{displayData.name}: {displayData.value}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEmployers: 0,
    totalJobs: 0,
    pendingJobs: 0,
    totalResumes: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [growth, setGrowth] = useState({
    users: 0,
    employers: 0,
    jobs: 0,
    resumes: 0
  });
  
  const [chartData, setChartData] = useState([]);
  const [visibleLines, setVisibleLines] = useState({ users: true, jobs: true });
  const [activeGrowthSeries, setActiveGrowthSeries] = useState(null);
  const socket = useSocket();

  const fetchStats = useCallback(async () => {
    try {
      const res = await API.get("/admin/dashboard");
      setStats(res.data);
      if (res.data.growth) setGrowth(res.data.growth);
      if (res.data.chartData) setChartData(res.data.chartData);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard statistics.");
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await API.get("/admin/logs");
      setLogs((res.data || []).slice(0, 5)); // Only show top 5 on dashboard
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchLogs()]);
    setLoading(false);
  }, [fetchStats, fetchLogs]);

  const handleLegendClick = (dataKey) => {
    setVisibleLines(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey]
    }));
  };

  useEffect(() => {
    const loadDashboard = async () => {
      await fetchData();
    };
    loadDashboard();
  }, [fetchData]);

  useEffect(() => {
    if (!socket) return;
    socket.on("dashboard:refresh", fetchData);
    return () => {
      socket.off("dashboard:refresh", fetchData);
    };
  }, [socket, fetchData]);

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <div className="dashboard-header">
        <div className="header-text">
          <h2>ResuMatch Admin Dashboard</h2>
          <p className="subtitle">Platform overview & analytics</p>
        </div>

        <div className="header-actions" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <NotificationBell />
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Verification features removed per super admin request */}

      {loading ? (
        <div style={{ minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <LoadingSpinner size="large" />
        </div>
      ) : (
        <>
          {/* KPI CARDS */}
          <div className="stats-grid">
            <div className="stat-box clickable" onClick={() => navigate("/users")}>
              <div className="stat-header">
                <FaUsers className="stat-icon blue" />
                <h4>Total Users</h4>
              </div>
              <p>{stats.totalUsers}</p>
              <GrowthIndicator value={growth.users} />
              <div className="stat-footer-link">View Details →</div>
            </div>

            <div className="stat-box clickable" onClick={() => navigate("/employers")}>
              <div className="stat-header">
                <FaBuilding className="stat-icon green" />
                <h4>Total Employers</h4>
              </div>
              <p>{stats.totalEmployers}</p>
              <GrowthIndicator value={growth.employers} />
              <div className="stat-footer-link">View Details →</div>
            </div>

            <div className="stat-box clickable" onClick={() => navigate("/jobs")}>
              <div className="stat-header">
                <FaBriefcase className="stat-icon purple" />
                <h4>Total Jobs</h4>
              </div>
              <p>{stats.totalJobs}</p>
              <GrowthIndicator value={growth.jobs} />
              <div className="stat-footer-link">View Details →</div>
            </div>

            <div className="stat-box clickable" onClick={() => navigate("/jobs?status=pending")}>
              <div className="stat-header">
                <FaClock className="stat-icon orange" />
                <h4>Pending Jobs</h4>
              </div>
              <p>{stats.pendingJobs}</p>
              <div className="stat-footer-link">Review Now →</div>
            </div>

            <div className="stat-box clickable" onClick={() => navigate("/resumes")}>
              <div className="stat-header">
                <FaFileAlt className="stat-icon red" />
                <h4>Total Resumes</h4>
              </div>
              <p>{stats.totalResumes}</p>
              <GrowthIndicator value={growth.resumes} />
              <div className="stat-footer-link">View Details →</div>
            </div>
          </div>

          {/* QUICK ACTIONS BAR */}
          <div className="quick-actions-container">
            <h3 className="section-title">Quick Actions</h3>
            <div className="quick-actions-grid">
              <button className="quick-action-btn primary" onClick={() => navigate("/admins")}>
                <FaUsers className="action-icon" />
                <span>Add New Admin</span>
              </button>
              
              <button className="quick-action-btn danger" onClick={() => navigate("/jobs?status=pending")}>
                <FaBriefcase className="action-icon" />
                <span>Review Pending Jobs</span>
              </button>
            </div>
          </div>

          <div className="dashboard-main-flex">
            <div className="chart-card flex-2">
              <h3 className="chart-title">Platform Growth Overview</h3>
              <div className="legend-row">
                <div className={`legend-item users ${visibleLines.users ? 'active' : ''}`} onClick={() => handleLegendClick("users")}>
                  <span className="legend-color users" />
                  <span className="legend-label">Users</span>
                </div>
                <div className={`legend-item jobs ${visibleLines.jobs ? 'active' : ''}`} onClick={() => handleLegendClick("jobs")}>
                  <span className="legend-color jobs" />
                  <span className="legend-label">Jobs</span>
                </div>
              </div>
              <p className="legend-note">💡 Click legend items to show/hide specific data lines</p>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    content={(props) => <GrowthTooltip {...props} activeSeries={activeGrowthSeries} />}
                    cursor={{ fill: '#f1f5f9', radius: 8 }}
                  />
                  {visibleLines.users && (
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#2563eb" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorUsers)"
                      onMouseEnter={() => setActiveGrowthSeries('users')}
                      onMouseLeave={() => setActiveGrowthSeries(null)}
                    />
                  )}
                  {visibleLines.jobs && (
                    <Area 
                      type="monotone" 
                      dataKey="jobs" 
                      stroke="#7c3aed" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorJobs)"
                      onMouseEnter={() => setActiveGrowthSeries('jobs')}
                      onMouseLeave={() => setActiveGrowthSeries(null)}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="side-panel flex-1">
              <div className="action-required-card">
                <h3 className="urgent-title">Action Required</h3>
                <div className="urgent-item" onClick={() => navigate("/jobs?status=pending")}>
                   <span className="urgent-label">Pending Jobs</span>
                   <span className="urgent-badge warning-bg">{stats.pendingJobs || 0}</span>
                </div>
              </div>

              <div className="activity-container modern-activity">
                <h3 style={{ marginBottom: "20px" }}>Recent Activity</h3>
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length === 0 ? (
                        <tr><td colSpan="2" className="no-activity">No recent activity</td></tr>
                      ) : (
                        logs.map((log) => (
                          <tr key={log._id}>
                            <td>
                              <div className="log-action">{log.action}</div>
                              <div className="log-details">{log.details}</div>
                            </td>
                            <td className="log-time">
                              {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}