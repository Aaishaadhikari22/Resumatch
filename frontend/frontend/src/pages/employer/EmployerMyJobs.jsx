import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import JobStatusBadge from "../../components/JobStatusBadge";
import "./employerDashboard.css";

export default function EmployerMyJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Filters & Sorting & Searching
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // pending, approved, rejected
  const [sortBy, setSortBy] = useState("date"); // date, applicants, match

  // Modals
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobToDelete, setJobToDelete] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, [navigate]);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem("employerToken");
      if (!token) return navigate("/employer/login");

      const res = await API.get("/employer/jobs?limit=1000"); // fetch all for local filtering
      setJobs(Array.isArray(res.data) ? res.data : res.data.jobs || []);
    } catch (err) {
      console.log(err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/employer/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!jobToDelete) return;
    try {
      await API.delete(`/employer/jobs/${jobToDelete._id}`);
      setJobs(jobs.filter(j => j._id !== jobToDelete._id));
      setJobToDelete(null);
    } catch (err) {
      console.error("Failed to delete job", err);
      alert("Failed to delete job");
    }
  };

  // Filter and Sort Logic
  const filteredAndSortedJobs = jobs
    .filter((job) => {
      const matchesSearch = job.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = locationFilter ? job.location?.toLowerCase().includes(locationFilter.toLowerCase()) || job.city?.toLowerCase().includes(locationFilter.toLowerCase()) : true;
      const jobStatus = job.jobStatus || job.status;
      const matchesStatus = statusFilter ? jobStatus === statusFilter : true;
      return matchesSearch && matchesLocation && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "applicants") {
        return (b.applicantCount || 0) - (a.applicantCount || 0);
      }
      if (sortBy === "match") {
        return (b.avgMatch || 0) - (a.avgMatch || 0);
      }
      // default: date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  // Extract unique locations for the filter
  const uniqueLocations = [...new Set(jobs.map(j => j.location || j.city).filter(Boolean))];

  if (loading) {
    return <div className="emp-loading"><h3>Loading your jobs...</h3></div>;
  }

  return (
    <div className="emp-my-jobs-container">
      <div className="emp-page-header" style={{ marginBottom: "20px" }}>
        <h1>💼 My Jobs</h1>
        <p>Manage your job postings and view applicants</p>
      </div>

      {/* FILTER & SORT CONTROLS */}
      {jobs.length > 0 && (
        <div className="emp-filters" style={{ display: "flex", gap: "15px", flexWrap: "wrap", marginBottom: "30px", background: "#f8f9fa", padding: "15px", borderRadius: "10px" }}>
          
          <input 
            type="text" 
            placeholder="🔍 Search by job title..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc", flex: 1, minWidth: "200px" }}
          />

          <select 
            value={locationFilter} 
            onChange={(e) => setLocationFilter(e.target.value)}
            style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
          >
            <option value="">📍 All Locations</option>
            {uniqueLocations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
          >
            <option value="">📊 All Statuses</option>
            <option value="pending">🟡 Pending</option>
            <option value="approved">🟢 Approved</option>
            <option value="rejected">🔴 Rejected</option>
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
          >
            <option value="date">📅 Sort by Date</option>
            <option value="applicants">👥 Sort by Applicants</option>
            <option value="match">🔥 Sort by Match %</option>
          </select>

        </div>
      )}

      {jobs.length === 0 ? (
        <div className="emp-empty-state">
          <div className="emp-empty-icon">📋</div>
          <h3>No jobs posted yet</h3>
          <p>Create your first job listing to start receiving applications</p>
          <Link to="/employer/post-job" className="emp-view-applicants-btn" style={{ display: "inline-block", marginTop: "20px", textDecoration: "none" }}>
            ➕ Post Your First Job
          </Link>
        </div>
      ) : filteredAndSortedJobs.length === 0 ? (
          <div className="emp-empty-state">
             <h3>No jobs match your filters.</h3>
             <button onClick={() => {setSearchTerm(""); setLocationFilter(""); setStatusFilter("");}} style={{ padding: "10px", marginTop: "10px", cursor: "pointer"}}>Clear Filters</button>
          </div>
      ) : (
        <div className="emp-jobs-grid">
          {filteredAndSortedJobs.map((job) => (
            <div key={job._id} className="emp-job-card">
              {/* Job Image Cover */}
              {job.jobImage && job.jobImage.filePath ? (
                <div className="emp-job-image-container">
                  <img 
                    src={`http://localhost:5000${job.jobImage.filePath}`} 
                    alt={job.title}
                    className="emp-job-cover-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="emp-job-image-placeholder">
                  <span>🏢</span>
                </div>
              )}

              <div className="emp-job-info">
                <h3>{job.title}</h3>
                <p>{job.description?.substring(0, 100)}{job.description?.length > 100 ? "..." : ""}</p>
                
                {/* Job Meta Information */}
                {(job.location || job.city || job.salary?.min) && (
                  <div className="emp-job-meta-info" style={{ marginTop: "10px", fontSize: "0.9rem", color: "#555" }}>
                    {job.location && <span style={{marginRight: "10px"}}>📍 {job.location}</span>}
                    {job.salary?.min && <span style={{marginRight: "10px"}}>💰 ${job.salary.min.toLocaleString()}/{job.salary.currency}</span>}
                  </div>
                )}

                {/* Match & Applicants - New Layout */}
                <div style={{ display: "flex", gap: "15px", marginTop: "15px", flexWrap: "wrap" }}>
                  <div style={{ background: "#e8f5e9", color: "#2e7d32", padding: "5px 10px", borderRadius: "15px", fontSize: "0.85rem", fontWeight: "bold" }}>
                    🔥 Avg Match: {job.avgMatch || 0}%
                  </div>
                  <div style={{ background: "#e3f2fd", color: "#1565c0", padding: "5px 10px", borderRadius: "15px", fontSize: "0.85rem", fontWeight: "bold" }}>
                    👥 {job.applicantCount || 0} Applicants
                  </div>
                </div>

              </div>

              <div className="emp-job-meta" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <JobStatusBadge jobStatus={job.jobStatus || job.status} isActive={job.isActive} closedAt={job.closedAt} />
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <Link
                    to={`/employer/applicants?job=${job._id}`}
                    className="emp-view-applicants-btn"
                    style={{ flex: 1, textAlign: 'center' }}
                  >
                    Applicants →
                  </Link>

                  <button
                    onClick={() => setSelectedJob(job)}
                    style={{ flex: 1, padding: "8px", background: "#f0f0f0", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                  >
                    👁️ View
                  </button>

                  <button
                    onClick={() => navigate(`/employer/post-job?edit=${job._id}`)}
                    style={{ flex: 1, padding: "8px", background: "#e8f5e9", color: "#2e7d32", border: "1px solid #a5d6a7", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                  >
                    ✏️ Edit
                  </button>

                  <button
                    onClick={() => setJobToDelete(job)}
                    style={{ width: "100%", padding: "8px", background: "#ffebee", color: "#c62828", border: "1px solid #ffcdd2", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                  >
                    🗑️ Delete Job
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* JOB DETAILS MODAL */}
      {selectedJob && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "30px", borderRadius: "10px", maxWidth: "600px", width: "90%", maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2>{selectedJob.title}</h2>
              <button onClick={() => setSelectedJob(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>&times;</button>
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              <strong>Status:</strong> <JobStatusBadge jobStatus={selectedJob.jobStatus || selectedJob.status} isActive={selectedJob.isActive} />
            </div>
            
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
              {selectedJob.location && <span><strong>📍 Location:</strong> {selectedJob.location}</span>}
              {selectedJob.salary?.min && <span><strong>💰 Salary:</strong> ${selectedJob.salary.min.toLocaleString()} - ${selectedJob.salary.max?.toLocaleString()} {selectedJob.salary.currency}</span>}
              {selectedJob.employmentType && <span><strong>💼 Type:</strong> {selectedJob.employmentType}</span>}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <strong>📝 Full Description:</strong>
              <p style={{ whiteSpace: "pre-wrap", marginTop: "10px", lineHeight: "1.5" }}>{selectedJob.description}</p>
            </div>

            {selectedJob.skillsRequired?.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <strong>🛠️ Skills Required:</strong>
                <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                  {selectedJob.skillsRequired.map((skill, i) => (
                    <span key={i} style={{ background: "#e0e0e0", padding: "5px 10px", borderRadius: "15px", fontSize: "0.9rem" }}>{skill}</span>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setSelectedJob(null)} style={{ padding: "10px 20px", background: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION BEFORE DELETE MODAL */}
      {jobToDelete && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "30px", borderRadius: "10px", maxWidth: "400px", width: "90%", textAlign: "center" }}>
            <h2>⚠️ Confirm Delete</h2>
            <p style={{ margin: "20px 0" }}>Are you sure you want to delete <strong>{jobToDelete.title}</strong>?</p>
            <p style={{ color: "#d32f2f", marginBottom: "20px", fontSize: "0.9rem" }}>This action cannot be undone and will delete all related applications.</p>
            <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
              <button onClick={() => setJobToDelete(null)} style={{ padding: "10px 20px", background: "#e0e0e0", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Cancel</button>
              <button onClick={handleDelete} style={{ padding: "10px 20px", background: "#d32f2f", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Yes, Delete Job</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

