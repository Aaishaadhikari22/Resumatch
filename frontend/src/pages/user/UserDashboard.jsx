import { useCallback, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/axios";
import { useSocket } from "../../hooks/useSocket.jsx";
import "./userDashboard.css";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

export default function UserDashboard() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  const socket = useSocket();

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return navigate("/user/login");

      const [dashRes, profileRes] = await Promise.all([
        API.get("/user/dashboard"),
        API.get("/user/profile")
      ]);

      setStats(dashRes.data);

      // Check verification status
      // Profile data loaded but not used in UI
    } catch (err) {
      console.log(err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/user/login");
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

  if (!stats) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#64748b" }}>
        <h3>Loading your personalized dashboard...</h3>
      </div>
    );
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  const firstName = stats.user?.name?.split(" ")[0] || "User";

  return (
    <div className="user-dashboard-container">
      
      {/* 1. LinkedIn-style Header Banner */}
      <div className="profile-banner-card">
        <div className="banner-bg"></div>
        <div className="banner-content">
          <div className="profile-img-container">
            <div className="profile-avatar">{firstName[0]}</div>
          </div>
          <div className="profile-basic-info">
            <h1>{stats.user?.name}</h1>
            <p>{stats.user?.email} • {stats.resumeExists ? "Resume Professional" : "New Candidate"}</p>
          </div>
          <div className="banner-stats">
            <Link to="/user/applications" className="b-stat" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <span>{stats.applicationsCount}</span>
              <p>Applications</p>
            </Link>
            <Link to="/user/recommendations" className="b-stat" style={{ textDecoration: 'none', cursor: 'pointer' }}>
              <span>{stats.matchedJobsCount}</span>
              <p>AI Matches</p>
            </Link>
          </div>
        </div>
      </div>

      <div className="dashboard-main-grid">
        
        {/* Left Column: Analytics & Quick Actions */}
        <div className="dashboard-column-left">
          
          {/* Charts Row */}
          <div className="charts-row">
            <div className="chart-card">
              <h3 className="section-title">Application Status</h3>
              <div style={{ height: "250px", width: "100%" }}>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats.statusChart && stats.statusChart.length > 0 ? stats.statusChart : [{name: "No Data", value: 1}]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.statusChart?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      )) || <Cell fill="#e2e8f0" />}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-legend">
                  {stats.statusChart?.map((s, i) => (
                      <div key={i} className="legend-item">
                          <span style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                          {s.name}
                      </div>
                  ))}
              </div>
            </div>

            <div className="chart-card">
              <h3 className="section-title">Match Insights</h3>
              <div style={{ height: "250px", width: "100%" }}>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[
                      { name: "Matched", value: stats.matchedJobsCount },
                      { name: "Saved", value: stats.savedJobsCount },
                      { name: "Applied", value: stats.applicationsCount }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p style={{fontSize: "12px", color: "#64748b", textAlign: "center", marginTop: "10px"}}>Your engagement across the platform</p>
            </div>
          </div>

          <div className="dashboard-section-white">
            <h3 className="section-title">⚡ Quick Shortcuts</h3>
            <div className="shortcuts-grid">
                <Link to="/user/profile" className="shortcut-item">
                    <div className="s-icon purple">👤</div>
                    <span>My Profile</span>
                </Link>
                <Link to="/user/recommendations" className="shortcut-item">
                    <div className="s-icon green">🎯</div>
                    <span>Find Jobs</span>
                </Link>
                <Link to="/user/applications" className="shortcut-item">
                    <div className="s-icon blue">📄</div>
                    <span>Applications</span>
                </Link>
                <Link to="/user/settings" className="shortcut-item">
                    <div className="s-icon orange">⚙️</div>
                    <span>Settings</span>
                </Link>
            </div>
          </div>

        </div>

        {/* Right Column: Recommendations & Activity */}
        <div className="dashboard-column-right">
          
          <div className="dashboard-section-white">
            <div className="header-with-link">
                <h3 className="section-title">Recent Activity</h3>
                <Link to="/user/applications">View All</Link>
            </div>
            <div className="mini-activity-list">
                {!stats.resumeExists ? (
                    <Link to="/user/resume" className="mini-activity-item warning" style={{ textDecoration: 'none', display: 'flex', cursor: 'pointer' }}>
                        <div className="a-dot">!</div>
                        <div className="a-text">
                            <strong>Complete Profile</strong>
                            <p>Upload resume for AI matching →</p>
                        </div>
                    </Link>
                ) : (
                    <Link to="/user/resume" className="mini-activity-item success" style={{ textDecoration: 'none', display: 'flex', cursor: 'pointer' }}>
                        <div className="a-dot">✓</div>
                        <div className="a-text">
                            <strong>Resume Active</strong>
                            <p>AI is matching you to jobs →</p>
                        </div>
                    </Link>
                )}
                <Link to="/user/recommendations" className="mini-activity-item info" style={{ textDecoration: 'none', display: 'flex', cursor: 'pointer' }}>
                    <div className="a-dot">✨</div>
                    <div className="a-text">
                        <strong>New Matches</strong>
                        <p>{stats.matchedJobsCount} jobs found for you →</p>
                    </div>
                </Link>
            </div>
          </div>

          <div className="dashboard-section-white" style={{ marginTop: "24px" }}>
            <h3 className="section-title">💡 Career Tips</h3>
            <div className="tips-list">
                <p>• Keep your skills updated to get better matches.</p>
                <p>• Apply to jobs within 48 hours for better visibility.</p>
                <p>• Ensure your resume is in ATS-friendly PDF format.</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
