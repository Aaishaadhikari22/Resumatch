import { useEffect, useState, useCallback } from "react";
import API from "../api/axios";
import { useSocket } from "../hooks/useSocket.jsx";
import "./admin.css";

export default function Resumes() {
  const [resumes, setResumes] = useState([]);
  const [search, setSearch] = useState("");
  const [experience, setExperience] = useState("");
  const [skillSearch, setSkillSearch] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const socket = useSocket();

  const ITEMS_PER_PAGE = 10;

  const fetchResumes = useCallback(async () => {
    try {
      const res = await API.get("/resume/all");
      setResumes(res.data);
    } catch (err) {
      console.log(err);
    }
  }, []);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  // Listen for real-time updates from socket
  useEffect(() => {
    if (!socket) return;
    socket.on("dashboard:refresh", fetchResumes);
    return () => {
      socket.off("dashboard:refresh", fetchResumes);
    };
  }, [socket, fetchResumes]);

  const deleteResume = async (id) => {
    try {
      await API.delete(`/resume/delete/${id}`);
      setDeleteConfirmId(null);
      fetchResumes();
    } catch (err) {
      console.error(err);
      setDeleteConfirmId(null);
    }
  };

  // Helper for experience badges
  const getExperienceBadge = (years) => {
    if (years < 2) return <span style={{ background: "#e8f5e9", color: "#2e7d32", padding: "4px 8px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "bold" }}>🟢 Junior ({years}y)</span>;
    if (years <= 5) return <span style={{ background: "#fff3e0", color: "#e65100", padding: "4px 8px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "bold" }}>🟡 Mid ({years}y)</span>;
    return <span style={{ background: "#e3f2fd", color: "#1565c0", padding: "4px 8px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "bold" }}>🔵 Senior ({years}y)</span>;
  };

  const filtered = resumes
    .filter(resume => {
      const matchSearch = resume.user?.name?.toLowerCase().includes(search.toLowerCase());
      
      const matchExperience = experience ? resume.experience >= parseInt(experience) : true;
      
      const matchSkill = skillSearch 
        ? resume.skills?.some(s => s.toLowerCase().includes(skillSearch.toLowerCase())) 
        : true;

      return matchSearch && matchExperience && matchSkill;
    })
    .sort((a, b) => {
      if (sortBy === "match") return (b.matchScore || 0) - (a.matchScore || 0);
      if (sortBy === "experience") return (b.experience || 0) - (a.experience || 0);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedResumes = filtered.slice(startIdx, endIdx);

  const totalResumes = resumes.length;

  return (
    <div className="resume-page">
      <div className="page-header">
        <h2>All Resumes</h2>
        <p>Manage candidate resumes and view matching scores in a consistent review flow.</p>
      </div>

      {/* STATS */}
      <div className="reports-grid" style={{ marginBottom: "30px" }}>
        <div className="stat-card card-panel" style={{ textAlign: "center" }}>
          <h4 style={{ color: "#64748b", marginBottom: "10px" }}>Total Resumes</h4>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: "700" }}>{totalResumes}</p>
        </div>
        <div className="stat-card card-panel" style={{ textAlign: "center" }}>
          <h4 style={{ color: "#64748b", marginBottom: "10px" }}>Highest Match</h4>
          <p style={{ margin: 0, fontSize: "2rem", fontWeight: "700", color: "#047857" }}>
            {resumes.length > 0 ? Math.max(...resumes.map(r => r.matchScore || 0)) : 0}%
          </p>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="filter-row card-panel">
        <input
          autoComplete="off"
          placeholder="🔍 Search by name"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="search-input"
        />

        <input
          autoComplete="off"
          placeholder="🛠️ Filter by skill (e.g. React)"
          value={skillSearch}
          onChange={(e) => { setSkillSearch(e.target.value); setCurrentPage(1); }}
          className="search-input"
        />

        <select
          value={experience}
          onChange={(e) => { setExperience(e.target.value); setCurrentPage(1); }}
        >
          <option value="">All Experience</option>
          <option value="1">1+ Years (Junior)</option>
          <option value="3">3+ Years (Mid)</option>
          <option value="6">6+ Years (Senior)</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
        >
          <option value="latest">📅 Sort by Latest</option>
          <option value="match">🔥 Sort by Match %</option>
          <option value="experience">💼 Sort by Experience</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="resume-table admin-table">
          <thead>
            <tr>
              <th style={{ padding: "15px" }}>Candidate</th>
              <th style={{ padding: "15px" }}>Skills</th>
              <th style={{ padding: "15px" }}>Experience</th>
              <th style={{ padding: "15px", textAlign: "center" }}>Match %</th>
              <th style={{ padding: "15px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedResumes.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">
                  📋 No resumes found matching your criteria.
                </td>
              </tr>
            ) : (
              paginatedResumes.map(resume => (
                <tr key={resume._id}>
                  
                  <td style={{ padding: "15px", verticalAlign: "middle", overflow: "hidden" }}>
                    <div style={{ fontWeight: "bold", color: "#333", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{resume.user?.name || "Unknown Candidate"}</div>
                    <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{resume.user?.email || "No email"}</div>
                  </td>
                  
                  <td style={{ padding: "15px", overflow: "hidden" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", overflow: "hidden" }}>
                      {resume.skills && resume.skills.length > 0 ? (
                        <>
                          {resume.skills.slice(0, 3).map((skill, i) => (
                            <span key={i} style={{ background: "#e0e0e0", color: "#333", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", whiteSpace: "nowrap", flexShrink: 0 }}>
                              {skill}
                            </span>
                          ))}
                          {resume.skills.length > 3 && (
                            <span style={{ background: "#f0f0f0", color: "#666", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", whiteSpace: "nowrap", flexShrink: 0 }}>
                              +{resume.skills.length - 3} more
                            </span>
                          )}
                        </>
                      ) : (
                        <span style={{ color: "#999", fontStyle: "italic" }}>No skills listed</span>
                      )}
                    </div>
                  </td>
                  
                  <td style={{ padding: "15px", textAlign: "center", verticalAlign: "middle" }}>
                    {getExperienceBadge(resume.experience || 0)}
                  </td>

                  <td style={{ padding: "15px", textAlign: "center", verticalAlign: "middle" }}>
                    <div style={{ display: "inline-block", background: (resume.matchScore || 0) >= 70 ? "#e8f5e9" : (resume.matchScore || 0) >= 40 ? "#fff3e0" : "#ffebee", color: (resume.matchScore || 0) >= 70 ? "#2e7d32" : (resume.matchScore || 0) >= 40 ? "#e65100" : "#c62828", padding: "6px 12px", borderRadius: "15px", fontWeight: "bold", fontSize: "0.9rem", whiteSpace: "nowrap" }}>
                      🔥 {resume.matchScore || 0}%
                    </div>
                  </td>

                  <td style={{ padding: "15px", textAlign: "center", verticalAlign: "middle", overflow: "visible" }}>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                      <button
                        className="btn btn-secondary"
                        onClick={(e) => { e.stopPropagation(); window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${resume.resumeUrl}`, "_blank"); }}
                      >
                        👁️ View Resume
                      </button>

                      {deleteConfirmId === resume._id ? (
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", color: "#92400e", fontWeight: "600" }}>Delete?</span>
                          <button
                            className="btn btn-danger"
                            style={{ padding: "8px 14px", fontSize: "12px" }}
                            onClick={(e) => { e.stopPropagation(); deleteResume(resume._id); }}
                          >
                            Yes
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "8px 14px", fontSize: "12px" }}
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-danger"
                          style={{ padding: "8px 14px", fontSize: "12px" }}
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(resume._id); }}
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <button 
            className="pagination-btn secondary"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          
          <div style={{ display: "flex", gap: "5px", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button 
                key={page}
                className={`pagination-btn ${currentPage === page ? "primary" : "secondary"}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button 
            className="pagination-btn secondary"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>

          <span className="pagination-summary">
            Page {currentPage} of {totalPages} • Showing {Math.min(startIdx + 1, filtered.length)}-{Math.min(endIdx, filtered.length)} of {filtered.length}
          </span>
        </div>
      )}
    </div>
  );
}