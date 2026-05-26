import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatSalary } from "../utils/formatSalary";

export default function PublicJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await API.get("/jobs");
        setJobs(res.data || []);
      } catch (err) {
        console.error("Failed to load jobs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const normalizedLocation = locationFilter.trim().toLowerCase();
    const matchesSearch = !normalizedSearch || [
      job.title,
      job.description,
      job.sector,
      job.employer?.companyName,
    ]
      .filter(Boolean)
      .some((field) => field.toLowerCase().includes(normalizedSearch));

    const matchesLocation = !normalizedLocation || (job.location || "")
      .toLowerCase()
      .includes(normalizedLocation);

    return matchesSearch && matchesLocation;
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "36px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginBottom: "32px" }}>
          <div>
            <p style={{ color: "#2563eb", fontWeight: 700, margin: 0 }}>Browse Jobs</p>
            <h1 style={{ fontSize: "42px", margin: "10px 0", color: "#0f172a", lineHeight: 1.05 }}>
              Explore the latest opportunities on ResuMatch
            </h1>
            <p style={{ color: "#475569", fontSize: "17px", maxWidth: "760px" }}>
              Discover approved job listings from top employers. Search by role, company, or location, then sign in to apply.
            </p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
            <button
              onClick={() => navigate("/jobseeker/login")}
              style={{ padding: "14px 22px", background: "#2563eb", color: "white", border: "none", borderRadius: "14px", cursor: "pointer", fontWeight: 700 }}
            >
              Job Seeker Login
            </button>
            <button
              onClick={() => navigate("/jobseeker/signup")}
              style={{ padding: "14px 22px", background: "transparent", color: "#2563eb", border: "1px solid #2563eb", borderRadius: "14px", cursor: "pointer", fontWeight: 700 }}
            >
              Sign Up to Apply
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", marginBottom: "30px" }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by job title, company, or skill"
            style={{ width: "100%", padding: "14px 18px", borderRadius: "16px", border: "1px solid #cbd5e1", outline: "none", fontSize: "15px", background: "white" }}
          />
          <input
            type="text"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            placeholder="Filter by location"
            style={{ width: "100%", padding: "14px 18px", borderRadius: "16px", border: "1px solid #cbd5e1", outline: "none", fontSize: "15px", background: "white" }}
          />
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <LoadingSpinner size="large" color="#2563eb" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ padding: "60px 24px", background: "white", borderRadius: "24px", textAlign: "center", border: "1px solid #e2e8f0" }}>
            <h2 style={{ margin: 0, fontSize: "26px", color: "#0f172a" }}>No jobs found</h2>
            <p style={{ margin: "14px 0 0", color: "#64748b" }}>
              Try adjusting your search or explore again later.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "24px" }}>
            {filteredJobs.map((job) => (
              <div
                key={job._id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                  padding: "28px",
                  borderRadius: "24px",
                  background: "white",
                  boxShadow: "0 18px 60px rgba(15, 23, 42, 0.06)",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "14px", color: "#2563eb", fontWeight: 700, letterSpacing: "0.08em" }}>
                      {job.sector || "General"}
                    </p>
                    <h2 style={{ margin: "10px 0 6px", fontSize: "24px", color: "#0f172a", lineHeight: 1.1 }}>
                      {job.title}
                    </h2>
                    <p style={{ margin: 0, color: "#475569", fontSize: "15px" }}>
                      {job.employer?.companyName || "Trusted Company"}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", minWidth: "150px" }}>
                    <p style={{ margin: 0, color: "#475569", fontSize: "14px" }}>
                      {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                    <span style={{ marginTop: "10px", display: "inline-flex", padding: "8px 12px", background: "#f8fafc", color: "#0f172a", borderRadius: "999px", fontSize: "13px", fontWeight: 700 }}>
                      {job.employmentType || "Full-time"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  <span style={{ color: "#64748b", fontSize: "14px" }}>📍 {job.location || "Remote"}</span>
                  {job.salary && (
                    <span style={{ color: "#64748b", fontSize: "14px" }}>
                      💰 {formatSalary(job.salary)}
                    </span>
                  )}
                </div>

                {job.skillsRequired?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {job.skillsRequired.slice(0, 6).map((skill, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "999px",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                <p style={{ margin: 0, color: "#64748b", lineHeight: 1.8, fontSize: "15px", maxWidth: "100%", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {job.description || "No job description provided."}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  <button
                    onClick={() => navigate("/jobseeker/login")}
                    style={{ padding: "14px 20px", background: "#2563eb", color: "white", border: "none", borderRadius: "14px", cursor: "pointer", fontWeight: 700 }}
                  >
                    Login to Apply
                  </button>
                  <button
                    onClick={() => navigate("/jobseeker/signup")}
                    style={{ padding: "14px 20px", background: "transparent", color: "#2563eb", border: "1px solid #cbd5e1", borderRadius: "14px", cursor: "pointer", fontWeight: 700 }}
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
