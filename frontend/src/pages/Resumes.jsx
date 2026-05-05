import { useEffect, useState } from "react";
import API from "../api/axios";

export default function Resumes() {
  const [resumes, setResumes] = useState([]);
  const [search, setSearch] = useState("");
  const [experience, setExperience] = useState("");
  const [skillSearch, setSkillSearch] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchResumes = async () => {
    try {
      const res = await API.get("/resume/all");
      setResumes(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const loadResumes = async () => {
      await fetchResumes();
    };

    loadResumes();
  }, []);

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

  const totalResumes = resumes.length;

  return (
    <div className="resume-page" style={{ padding: "20px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h2>All Resumes</h2>
        <p style={{ color: "#555" }}>Manage candidate resumes and view their matching scores</p>
      </div>

      {/* STATS */}
      <div className="resume-stats" style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <div className="stat-card" style={{ background: "#f8f9fa", padding: "20px", borderRadius: "10px", flex: 1, border: "1px solid #e0e0e0", textAlign: "center" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#555" }}>Total Resumes</h4>
          <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0 }}>{totalResumes}</p>
        </div>
        <div className="stat-card" style={{ background: "#f8f9fa", padding: "20px", borderRadius: "10px", flex: 1, border: "1px solid #e0e0e0", textAlign: "center" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#555" }}>Highest Match</h4>
          <p style={{ fontSize: "2rem", fontWeight: "bold", margin: 0, color: "#2e7d32" }}>
            {resumes.length > 0 ? Math.max(...resumes.map(r => r.matchScore || 0)) : 0}%
          </p>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="resume-filters" style={{ display: "flex", gap: "15px", flexWrap: "wrap", marginBottom: "30px", background: "#f8f9fa", padding: "15px", borderRadius: "10px", border: "1px solid #e0e0e0" }}>
        
        <input
          placeholder="🔍 Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc", flex: 1, minWidth: "180px" }}
        />

        <input
          placeholder="🛠️ Filter by skill (e.g. React)"
          value={skillSearch}
          onChange={(e) => setSkillSearch(e.target.value)}
          style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc", flex: 1, minWidth: "180px" }}
        />

        <select
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
          style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
        >
          <option value="">All Experience</option>
          <option value="1">1+ Years (Junior)</option>
          <option value="3">3+ Years (Mid)</option>
          <option value="6">6+ Years (Senior)</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
        >
          <option value="latest">📅 Sort by Latest</option>
          <option value="match">🔥 Sort by Match %</option>
          <option value="experience">💼 Sort by Experience</option>
        </select>

      </div>

      {/* TABLE */}
      <div style={{ overflowX: "auto", background: "#fff", borderRadius: "10px", border: "1px solid #e0e0e0" }}>
        <table className="resume-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead style={{ background: "#f1f3f5", borderBottom: "1px solid #e0e0e0" }}>
            <tr>
              <th style={{ padding: "15px" }}>Candidate</th>
              <th style={{ padding: "15px" }}>Skills</th>
              <th style={{ padding: "15px" }}>Experience</th>
              <th style={{ padding: "15px", textAlign: "center" }}>Match %</th>
              <th style={{ padding: "15px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data" style={{ padding: "40px", textAlign: "center", color: "#777" }}>
                  📋 No resumes found matching your criteria.
                </td>
              </tr>
            ) : (
              filtered.map(resume => (
                <tr key={resume._id} style={{ borderBottom: "1px solid #eee", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = '#fafafa'} onMouseOut={(e) => e.currentTarget.style.background = '#fff'}>
                  
                  <td style={{ padding: "15px" }}>
                    <div style={{ fontWeight: "bold", color: "#333" }}>{resume.user?.name || "Unknown Candidate"}</div>
                    <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "4px" }}>{resume.user?.email || "No email"}</div>
                  </td>
                  
                  <td style={{ padding: "15px", maxWidth: "250px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                      {resume.skills && resume.skills.length > 0 ? (
                        <>
                          {resume.skills.slice(0, 3).map((skill, i) => (
                            <span key={i} style={{ background: "#e0e0e0", color: "#333", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                              {skill}
                            </span>
                          ))}
                          {resume.skills.length > 3 && (
                            <span style={{ background: "#f0f0f0", color: "#666", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                              +{resume.skills.length - 3} more
                            </span>
                          )}
                        </>
                      ) : (
                        <span style={{ color: "#999", fontStyle: "italic" }}>No skills listed</span>
                      )}
                    </div>
                  </td>
                  
                  <td style={{ padding: "15px" }}>
                    {getExperienceBadge(resume.experience || 0)}
                  </td>

                  <td style={{ padding: "15px", textAlign: "center" }}>
                    <div style={{ display: "inline-block", background: (resume.matchScore || 0) >= 70 ? "#e8f5e9" : (resume.matchScore || 0) >= 40 ? "#fff3e0" : "#ffebee", color: (resume.matchScore || 0) >= 70 ? "#2e7d32" : (resume.matchScore || 0) >= 40 ? "#e65100" : "#c62828", padding: "6px 12px", borderRadius: "15px", fontWeight: "bold", fontSize: "0.9rem" }}>
                      🔥 {resume.matchScore || 0}%
                    </div>
                  </td>

                  <td style={{ padding: "15px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(`http://localhost:5000${resume.resumeUrl}`, "_blank"); }}
                        style={{ padding: "8px 12px", background: "#f0f0f0", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", transition: "background 0.2s" }}
                        onMouseOver={(e) => e.target.style.background = '#e0e0e0'}
                        onMouseOut={(e) => e.target.style.background = '#f0f0f0'}
                      >
                        👁️ View Resume
                      </button>

                      {deleteConfirmId === resume._id ? (
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", color: "#92400e", fontWeight: "600" }}>Delete?</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteResume(resume._id); }}
                            style={{ padding: "6px 10px", background: "#dc2626", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}
                          >
                            Yes
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                            style={{ padding: "6px 10px", background: "#e2e8f0", color: "#475569", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", fontSize: "12px" }}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(resume._id); }}
                          style={{ padding: "8px 12px", background: "#ffebee", color: "#c62828", border: "1px solid #ffcdd2", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", transition: "background 0.2s" }}
                          onMouseOver={(e) => e.target.style.background = '#ffcdd2'}
                          onMouseOut={(e) => e.target.style.background = '#ffebee'}
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
    </div>
  );
}