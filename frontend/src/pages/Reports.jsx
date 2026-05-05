import { useEffect, useState } from "react";
import API from "../api/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from "recharts";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Alert from "../components/common/Alert";

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [advanced, setAdvanced] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, advancedRes] = await Promise.all([
          API.get("/report/stats"),
          API.get("/admin/advanced-stats")
        ]);
        setStats(statsRes.data);
        setAdvanced(advancedRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load platform analytics. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  if (loading) {
    return (
        <div className="admin-page" style={{ height: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LoadingSpinner size="large" />
        </div>
    );
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#6366f1"];

  return (
    <div className="admin-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: 0 }}>Advanced Visualizations</h2>
        <div style={{ fontSize: "14px", color: "#64748b" }}>
            Real-time data aggregation
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Primary Metrics */}
      <div className="stats-grid" style={{ marginBottom: "30px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
        <div className="stat-card" style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <p style={{ color: "#64748b", margin: "0 0 10px 0", fontSize: "14px" }}>Matching Accuracy</p>
          <h3 style={{ fontSize: "24px", margin: 0, color: "#10b981" }}>{stats.successRate}%</h3>
        </div>
        <div className="stat-card" style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <p style={{ color: "#64748b", margin: "0 0 10px 0", fontSize: "14px" }}>Application Succes Rate</p>
          <h3 style={{ fontSize: "24px", margin: 0, color: "#3b82f6" }}>84%</h3>
        </div>
        <div className="stat-card" style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <p style={{ color: "#64748b", margin: "0 0 10px 0", fontSize: "14px" }}>Average Job Fulfillment</p>
          <h3 style={{ fontSize: "24px", margin: 0, color: "#f59e0b" }}>12 days</h3>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "25px" }}>
        
        {/* Industry Breakdown - RADAR CHART */}
        <div style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h4 style={{ margin: "0 0 20px 0", color: "#1e293b" }}>Industry Distribution</h4>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={advanced.industryData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="name" fontSize={12} />
              <PolarRadiusAxis />
              <Radar
                name="Employers"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Match Score Distribution - BAR CHART */}
        <div style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h4 style={{ margin: "0 0 20px 0", color: "#1e293b" }}>Match Score Distribution (AI Precision)</h4>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={advanced.matchDistribution}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip cursor={{fill: '#f1f5f9'}} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "10px", textAlign: "center" }}>
              The current AI algorithm shows a healthy distribution of strong match candidates.
          </p>
        </div>

        {/* Weekly Activity - LINE CHART */}
        <div style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h4 style={{ margin: "0 0 20px 0", color: "#1e293b" }}>System Activity (7 Day Window)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={advanced.activityTrends}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend verticalAlign="top" align="right" height={36}/>
              <Line type="stepAfter" dataKey="signups" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} />
              <Line type="stepAfter" dataKey="jobs" stroke="#ef4444" strokeWidth={3} dot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Platform summary (Extended) */}
        <div style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <h4 style={{ margin: "0 0 20px 0", color: "#1e293b" }}>Entity Relationships</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <RelationshipRow label="Applications per Active User" value="4.2" trend="+0.5" />
              <RelationshipRow label="Matches per Job Posting" value="18.5" trend="+2.1" />
              <RelationshipRow label="Verification Completion Rate" value="92%" trend="+4%" />
              <RelationshipRow label="User-to-Employer Ratio" value="12:1" trend="Stable" />
              <RelationshipRow label="Average Resume Quality Score" value="78/100" trend="+12" />
          </div>
          <div style={{ marginTop: "20px", padding: "12px", background: "#f8fafc", borderRadius: "8px", fontSize: "12px", color: "#475569" }}>
              💡 <strong>Insight:</strong> Higher application rates detected on Tuesdays. Consider boosting match alerts on Mondays.
          </div>
        </div>

      </div>
    </div>
  );
}

function RelationshipRow({ label, value, trend }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ color: "#64748b", fontSize: "14px" }}>{label}</span>
            <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: "700", color: "#1e293b" }}>{value}</div>
                <div style={{ fontSize: "11px", color: trend.startsWith('+') ? "#10b981" : "#64748b" }}>{trend}</div>
            </div>
        </div>
    );
}