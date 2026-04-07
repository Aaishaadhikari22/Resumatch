import { useEffect, useState } from "react";
import API from "../../api/axios";
import "../admin.css";
import { useNavigate } from "react-router-dom";

export default function UserApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [withdrawingId, setWithdrawingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await API.get("/user/applications");
      setApps(res.data);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const handleWithdraw = async (appId) => {
    try {
      await API.delete(`/user/applications/${appId}`);
      setWithdrawingId(null);
      fetchApplications();
    } catch (err) {
      console.log(err);
      setWithdrawingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "applied": return { bg: "#fef3c7", color: "#d97706", border: "#fde68a", icon: "🟡" };
      case "reviewed": return { bg: "#e0f2fe", color: "#0284c7", border: "#bae6fd", icon: "🔵" }; // Under review or interviewed
      case "accepted": return { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0", icon: "🟢" };
      case "rejected": return { bg: "#fee2e2", color: "#b91c1c", border: "#fecaca", icon: "🔴" };
      default: return { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0", icon: "⚪" };
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case "applied": return "Pending";
      case "reviewed": return "Under Review";
      case "accepted": return "Accepted";
      case "rejected": return "Rejected";
      default: return status;
    }
  };

  if (loading) return <div style={{ padding: "40px" }}>Loading Applications...</div>;

  // Filter and Sort Output
  const displayedApps = apps
    .filter(app => filterStatus === "all" || app.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === "latest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "match") return (b.similarityScore || 0) - (a.similarityScore || 0);
      return 0;
    });

  return (
    <div className="admin-page">
      <h2 style={{ fontSize: "32px", marginBottom: "8px", fontWeight: "700" }}>
        My Applications 📨
      </h2>
      <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "16px" }}>
        Track the status of all your submitted job applications.
      </p>

      {/* Filter and Sort Bar */}
      <div style={{ display: "flex", gap: "15px", marginBottom: "30px", background: "white", padding: "15px", borderRadius: "12px", border: "1px solid #e2e8f0", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b", display: "block", marginBottom: "5px" }}>Filter by Status</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          >
            <option value="all">All Statuses</option>
            <option value="applied">🟡 Pending</option>
            <option value="reviewed">🔵 Under Review</option>
            <option value="accepted">🟢 Accepted</option>
            <option value="rejected">🔴 Rejected</option>
          </select>
        </div>
        <div style={{ flex: 1, minWidth: "200px" }}>
          <label style={{ fontSize: "12px", fontWeight: "bold", color: "#64748b", display: "block", marginBottom: "5px" }}>Sort By</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
          >
            <option value="latest">Latest Applied</option>
            <option value="oldest">Oldest Applied</option>
            <option value="match">Highest Match %</option>
          </select>
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="admin-card" style={{ padding: "50px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: '64px', marginBottom: '15px' }}>🔍</div>
          <p style={{ fontSize: "18px", color: "#64748b", marginBottom: "10px", fontWeight: "bold" }}>
             You haven't applied to any jobs yet.
          </p>
          <button 
            onClick={() => navigate("/user/recommendations")}
            style={{ padding: "12px 24px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "15px", marginTop: "15px" }}
          >
            Explore Jobs
          </button>
        </div>
      ) : displayedApps.length === 0 ? (
        <div className="admin-card" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
          No applications match your filter.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
          {displayedApps.map(app => {
            const sColor = getStatusColor(app.status);
            return (
              <div key={app._id} className="admin-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px", transition: "all 0.2s" }} onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "20px", color: "#1e293b", fontWeight: "700" }}>{app.job?.title || "Unknown Job"}</h3>
                    <span style={{ background: sColor.bg, color: sColor.color, border: `1px solid ${sColor.border}`, padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>
                      {sColor.icon} {getStatusLabel(app.status)}
                    </span>
                  </div>
                  
                  <p style={{ margin: "0 0 10px 0", color: "#475569", fontWeight: "500", fontSize: "15px" }}>
                    🏢 {app.employer?.companyName || "Unknown Employer"}
                  </p>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "15px", flexWrap: "wrap", fontSize: "13px", color: "#64748b" }}>
                    <span>📅 Applied On: {new Date(app.createdAt).toLocaleDateString()}</span>
                    {(app.similarityScore || app.similarityScore === 0) && (
                      <span style={{ background: "#f8fafc", padding: "4px 8px", borderRadius: "6px", fontWeight: "bold", border: "1px solid #e2e8f0" }}>
                        🧠 Applied with {app.similarityScore}% match
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", flexDirection: "column", alignItems: "flex-end", minWidth: "160px" }}>
                  <button onClick={() => navigate("/user/recommendations")} style={{ width: "100%", padding: "10px", background: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "8px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={(e) => e.target.style.background = "#f1f5f9"} onMouseOut={(e) => e.target.style.background = "#f8fafc"}>
                    👁️ View Job
                  </button>
                  {app.status === "applied" && (
                    withdrawingId === app._id ? (
                      <div style={{ width: "100%", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                        <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#92400e", fontWeight: "600" }}>Withdraw?</p>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => handleWithdraw(app._id)} style={{ flex: 1, padding: "6px", background: "#dc2626", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer", fontSize: "12px" }}>Yes</button>
                          <button onClick={() => setWithdrawingId(null)} style={{ flex: 1, padding: "6px", background: "#e2e8f0", color: "#475569", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer", fontSize: "12px" }}>No</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setWithdrawingId(app._id)} style={{ width: "100%", padding: "10px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }} onMouseOver={(e) => e.target.style.background = "#fee2e2"} onMouseOut={(e) => e.target.style.background = "#fef2f2"}>
                        ❌ Withdraw
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
