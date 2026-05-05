import { useEffect, useState } from "react";
import API from "../api/axios";
import ResumeViewerModal from "../components/ResumeViewerModal";

export default function ApplicationsManagement() {
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedResume, setSelectedResume] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchApplications = async () => {
    try {
      const res = await API.get("/admin/applications");
      setApplications(res.data);
    } catch (_err) {
      console.log(_err);
    }
  };

  useEffect(() => {
    const loadApplications = async () => {
      await fetchApplications();
    };

    loadApplications();
  }, []);

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


const total = applications.length;
const pending = applications.filter(a=>a.status==="pending").length;
const accepted = applications.filter(a=>a.status==="accepted").length;
const rejected = applications.filter(a=>a.status==="rejected").length;

const isProcessed = (status) => status === "accepted" || status === "rejected";

return(

<div className="applications-page">

<h2>Applications Management</h2>


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

<div className="applications-filter">

<input
placeholder="Search Applicant"
value={search}
onChange={(e)=>setSearch(e.target.value)}
/>

<select
value={statusFilter}
onChange={(e)=>setStatusFilter(e.target.value)}
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

{filteredApplications.length === 0 ? (

<tr>
<td colSpan="5" className="no-data">
No Applications Found
</td>
</tr>

):(filteredApplications.map(app=>(

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