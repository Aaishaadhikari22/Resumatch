import { useEffect, useState } from "react";
import API from "../api/axios";
import { PermissionGuard, SuperAdminGuard } from "../components/PermissionGuard";
import "./admin.css";

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [accountType, setAccountType] = useState("admin");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    gender: "",
    qualification: "",
    phone: "",
    role: "",
  });

  const fetchAdmins = async () => {
    try {
      const res = await API.get("/admin/all");
      setAdmins(res.data);
    } catch (error) {
      console.error("Error fetching admins", error);
    }
  };

  useEffect(() => {
    const loadAdmins = async () => {
      await fetchAdmins();
    };

    loadAdmins();
  }, []);

  const handleCreate = async () => {
    try {
      let url = "";
      let data = { ...formData };

      if (accountType === "admin") {
        url = "/admin/create";
      } else if (accountType === "user") {
        url = "/admin/create-user";
      } else if (accountType === "employer") {
        url = "/admin/create-employer";
        // Map 'name' from form to 'companyName' and add a default contact name
        data.companyName = formData.name;
        data.name = "Manager"; // Default contact name if not provided
      }

      const res = await API.post(url, data);
      setMessage(res.data.message || accountType + " created successfully");

      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        gender: "",
        qualification: "",
        phone: "",
        role: "",
      });

      // Auto-refresh the visual table explicitly
      fetchAdmins();

      // Clear message after 3 seconds
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Error creating account");
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await API.put(`/admin/update/${id}`, { status: newStatus });
      fetchAdmins();
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  const deleteAdmin = async (id) => {
    if (window.confirm("Are you sure you want to delete this admin?")) {
      try {
        await API.delete(`/admin/delete/${id}`);
        fetchAdmins();
      } catch (error) {
        console.error("Error deleting admin", error);
      }
    }
  };

  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      (admin.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (admin.email || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter ? admin.status === statusFilter : true;
    const matchesRole = roleFilter ? admin.role === roleFilter : true;

    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="admin-page">
      <h2>Admin Management</h2>
      {message && <p className="success-message">{message}</p>}
      
      <PermissionGuard 
        permission="manage_admins"
        fallback={
          <div className="permission-denied">
            <p>You do not have permission to manage admins. Contact your super admin.</p>
          </div>
        }
      >
        <div className="admin-card">
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            className="create-dropdown"
          >
            <option value="admin">Create Admin</option>
            <SuperAdminGuard>
              <option value="user">Create User</option>
              <option value="employer">Create Employer</option>
            </SuperAdminGuard>
          </select>

          <div className="admin-form">
            <input
              placeholder={accountType === "employer" ? "Company Name" : "Name"}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <input
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />

            <input
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />

            {accountType === "admin" && (
              <>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
              >
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>

              <input
                placeholder="Qualification"
                value={formData.qualification}
                onChange={(e) =>
                  setFormData({ ...formData, qualification: e.target.value })
                }
              />

              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              >
                <option value="">Select Role</option>
                <option value="super_admin">Super Admin</option>
                <option value="sector_admin">Sector Admin</option>
                <option value="employer_manager">Employer Manager</option>
                <option value="moderator">Content Moderator</option>
                <option value="support">Support Executive</option>
              </select>
            </>
            )}

            <button className="create-btn" onClick={handleCreate}>
              Create {accountType.charAt(0).toUpperCase() + accountType.slice(1)}
            </button>
          </div>

          {/* SEARCH + FILTER */}
          <div className="search-filter-section">
            <input
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="sector_admin">Sector Admin</option>
              <option value="employer_manager">Employer Manager</option>
              <option value="moderator">Content Moderator</option>
              <option value="support">Support Executive</option>
            </select>
          </div>

          {/* ADMIN TABLE */}
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
<th>Admin Role</th>
<th>Status</th>
<th>Actions</th>
</tr>
</thead>

<tbody>

{filteredAdmins.map((admin)=>(

<tr key={admin._id}>

<td>{admin.name}</td>
<td>{admin.email}</td>
<td><span className={`role-badge ${admin.role}`}>{admin.role ? admin.role.replace('_', ' ') : 'N/A'}</span></td>

<td>
<span className={`status-badge ${admin.status}`}>
{admin.status}
</span>
</td>

<td>

{admin.status === "pending" && (

<>
<button
className="action-btn primary"
onClick={()=>updateStatus(admin._id,"active")}

>

Accept </button>

<button
className="action-btn danger"
onClick={()=>deleteAdmin(admin._id)}

>

Delete </button>
</>

)}

{admin.status === "active" && (

<>
<button
className="action-btn warning"
onClick={()=>updateStatus(admin._id,"inactive")}

>

Deactivate </button>

<button
className="action-btn danger"
onClick={()=>deleteAdmin(admin._id)}

>

Delete </button>
</>

)}

{admin.status === "inactive" && (

<>
<button
className="action-btn primary"
onClick={()=>updateStatus(admin._id,"active")}

>

Activate </button>

<button
className="action-btn danger"
onClick={()=>deleteAdmin(admin._id)}

>

Delete </button>
</>

)}

</td>

</tr>

))}

</tbody>

</table>
        </div>
      </PermissionGuard>
    </div>
  );
}
