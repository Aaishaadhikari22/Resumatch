import { useEffect, useState, useCallback } from "react";
import API from "../api/axios";
import { useSocket } from "../hooks/useSocket.jsx";
import ResumeViewerModal from "../components/ResumeViewerModal";
import "./admin.css";

export default function ApplicationsManagement() {
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedResume, setSelectedResume] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const socket = useSocket();

  const ITEMS_PER_PAGE = 10;

  const fetchApplications = useCallback(async () => {
    try {
      const res = await API.get("/admin/applications");
      setApplications(res.data);
    } catch (_err) {
      console.log(_err);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Listen for real-time updates from socket
  useEffect(() => {
    if (!socket) return;
    socket.on("dashboard:refresh", fetchApplications);
    return () => {
      socket.off("dashboard:refresh", fetchApplications);
    };
  }, [socket, fetchApplications]);

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/admin/application/${id}`, { status });
      fetchApplications();
    } catch (err) {
      console.log(err);
    }
  };

  const handleViewResume = async (app) => {
    try {
      // Try to fetch the user's resume from backend
      const res = await API.get(`/admin/resumes`);
      const userResume = res.data.find(r => r.user?._id === app.user?._id || r.user === app.user?._id);
      if (userResume) {
        setSelectedResume(userResume);
        setSelectedUser(app.user);
      } else {
        // Fallback: show minimal info from application data
        setSelectedResume({ title: "Resume on file", skills: [], experience: 0 });
        setSelectedUser(app.user);
      }
    } catch {
      // Fallback: show user info only
      setSelectedResume({ title: "Resume on file", skills: [], experience: 0 });
      setSelectedUser(app.user);
    }
  };

const filteredApplications = applications.filter(app=>{

const matchSearch =
app.user?.name?.toLowerCase().includes(search.toLowerCase());

const matchStatus =
statusFilter ? app.status === statusFilter : true;

return matchSearch && matchStatus;

});

const totalPages = Math.ceil(filteredApplications.length / ITEMS_PER_PAGE);
const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
const endIdx = startIdx + ITEMS_PER_PAGE;
const paginatedApplications = filteredApplications.slice(startIdx, endIdx);

const total = applications.length;
const pending = applications.filter(a=>a.status==="pending").length;
const accepted = applications.filter(a=>a.status==="accepted").length;
const rejected = applications.filter(a=>a.status==="rejected").length;

const isProcessed = (status) => status === "accepted" || status === "rejected";

return(

<div className="applications-page">

<div className="page-header">
  <h2>Applications Management</h2>
  <p>Review and manage incoming applications with clear actions and pagination.</p>
</div>

{/* STATS CARDS */}

<div className="applications-stats">

<div className="stat-card">
<h4>Total Applications</h4>
<p>{total}</p>
</div>

<div className="stat-card pending">
<h4>Pending</h4>
<p>{pending}</p>
</div>

<div className="stat-card accepted">
<h4>Accepted</h4>
<p>{accepted}</p>
</div>

<div className="stat-card rejected">
<h4>Rejected</h4>
<p>{rejected}</p>
</div>

</div>


{/* SEARCH + FILTER */}

<div className="filter-row">
  <input
    type="text"
    autoComplete="off"
    placeholder="Search Applicant"
    value={search}
    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
    className="search-input"
  />

  <select
    value={statusFilter}
    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
  >
    <option value="">All Status</option>
    <option value="pending">Pending</option>
    <option value="accepted">Accepted</option>
    <option value="rejected">Rejected</option>
  </select>
</div>


{/* TABLE */}

<table className="applications-table">

<thead>

<tr>
<th>Applicant</th>
<th>Job Title</th>
<th>Status</th>
<th>Date Applied</th>
<th>Actions</th>
</tr>

</thead>

<tbody>

{paginatedApplications.length === 0 ? (

<tr>
<td colSpan="5" className="no-data">
No Applications Found
</td>
</tr>

):(paginatedApplications.map(app=>(

<tr key={app._id}>

<td>{app.user?.name}</td>

<td>{app.job?.title || "—"}</td>

<td>

<span className={`status ${app.status}`}>
{app.status}
</span>

</td>

<td>
{new Date(app.createdAt).toLocaleDateString()}
</td>

<td>

<button
className="view-btn"
onClick={() => handleViewResume(app)}
>
View Resume
</button>

{!isProcessed(app.status) && (
<button
className="accept-btn"
onClick={()=>updateStatus(app._id,"accepted")}
>
Accept
</button>
)}

{!isProcessed(app.status) && (
<button
className="reject-btn"
onClick={()=>updateStatus(app._id,"rejected")}
>
Reject
</button>
)}

</td>

</tr>

)))}

</tbody>

</table>

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

    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
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
      Page {currentPage} of {totalPages} • Showing {Math.min(startIdx + 1, filteredApplications.length)}-{Math.min(endIdx, filteredApplications.length)} of {filteredApplications.length}
    </span>
  </div>
)}

{/* Resume Viewer Modal */}
{selectedResume && selectedUser && (
  <ResumeViewerModal
    resume={selectedResume}
    user={selectedUser}
    onClose={() => { setSelectedResume(null); setSelectedUser(null); }}
  />
)}

</div>

);

}