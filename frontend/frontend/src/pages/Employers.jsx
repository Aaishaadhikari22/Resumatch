import { useEffect, useState } from "react";
import API from "../api/axios";
import "./admin.css";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Alert from "../components/common/Alert";
import ConfirmationModal from "../components/common/ConfirmationModal";

export default function Employers() {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [selectedEmployer, setSelectedEmployer] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, title: "", text: "", type: "danger" });

  const [formData, setFormData] = useState({
    name: "Manager",
    companyName: "",
    email: "",
    password: "",
    phone: ""
  });

  const fetchEmployers = async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/employers");
      setEmployers(res.data || []);
    } catch (error) {
      console.error(error);
      setMessage({ text: "Failed to load employers", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployer = async (e) => {
    e.preventDefault();
    setProcessingId("creating");
    try {
      const res = await API.post("/admin/create-employer", formData);
      setMessage({ text: res.data.message || "Employer created successfully", type: "success" });
      setFormData({ name: "Manager", companyName: "", email: "", password: "", phone: "" });
      fetchEmployers();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Error creating employer", type: "error" });
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    }
  };

  const attemptStatusUpdate = (emp, newStatus) => {
    const isApproving = newStatus === "approved";
    setConfirmDialog({
      isOpen: true,
      title: isApproving ? "Verify Employer" : "Reject Employer",
      text: isApproving 
        ? `Are you sure you want to verify ${emp.companyName}? They will be able to post jobs instantly.` 
        : `Are you sure you want to reject ${emp.companyName}? This will prevent them from posting jobs.`,
      type: isApproving ? "primary" : "warning",
      action: () => executeStatusUpdate(emp._id, newStatus)
    });
  };

  const executeStatusUpdate = async (id, status) => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    setProcessingId(id);
    try {
      await API.put(`/admin/employer/${id}`, { status });
      const successMessage = status === "approved" 
        ? "Employer Verified successfully! They can now post jobs." 
        : status === "rejected"
        ? "Employer rejected successfully. They have been notified."
        : `Employer ${status} successfully`;
      setMessage({ text: successMessage, type: "success" });
      
      if (selectedEmployer && selectedEmployer._id === id) {
        setSelectedEmployer({ ...selectedEmployer, status });
      }

      fetchEmployers();
    } catch (error) {
      console.error(error);
      setMessage({ text: error.response?.data?.message || "Failed to update status", type: "error" });
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    }
  };

  const attemptDelete = (emp) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Employer",
      text: `Are you absolutely sure you want to delete ${emp.companyName}? This action will permanently erase the employer and ALL their associated jobs.`,
      type: "danger",
      action: () => executeDelete(emp._id)
    });
  };

  const executeDelete = async (id) => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    setProcessingId(id);
    try {
      await API.delete(`/admin/employer/${id}`);
      setMessage({ text: "Employer deleted successfully", type: "success" });
      if (selectedEmployer && selectedEmployer._id === id) setSelectedEmployer(null);
      fetchEmployers();
    } catch(err) { 
      console.error(err); 
      setMessage({ text: "Failed to delete employer", type: "error" });
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    }
  };

  useEffect(() => {
    fetchEmployers();
  }, []);

  const filteredEmployers = employers.filter((emp) =>
    emp.companyName?.toLowerCase().includes(search.toLowerCase()) || 
    emp.email?.toLowerCase().includes(search.toLowerCase())
  );

  const approvedCount = employers.filter(e => e.status === "approved").length;
  const pendingCount = employers.filter(e => e.status === "pending").length;
  const rejectedCount = employers.filter(e => e.status === "rejected").length;

  return (
    <div className="admin-page" style={{ padding: "20px" }}>
      <h2>Employer Verification & Management</h2>
      
      <ConfirmationModal 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.text}
        type={confirmDialog.type}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      {message.text && (
        <Alert 
          type={message.type} 
          message={message.text} 
          onClose={() => setMessage({ text: "", type: "" })} 
        />
      )}

      {/* Stats Cards */}
      <div className="reports-grid" style={{ marginBottom: "30px" }}>
        <div className="stat-card">
          <h4>Total Employers</h4>
          <p>{employers.length}</p>
        </div>
        <div className="stat-card">
          <h4>Verified (Approved)</h4>
          <p style={{ color: "#22c55e" }}>{approvedCount}</p>
        </div>
        <div className="stat-card">
          <h4>Pending Verification</h4>
          <p style={{ color: "#facc15" }}>{pendingCount}</p>
        </div>
        <div className="stat-card">
          <h4>Rejected</h4>
          <p style={{ color: "#ef4444" }}>{rejectedCount}</p>
        </div>
      </div>

      {/* Create Employer Form */}
      <div className="admin-card" style={{ marginBottom: "30px" }}>
        <h3>Add New Employer</h3>
        <form className="admin-form" onSubmit={handleCreateEmployer}>
          <input placeholder="Company Name" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} required disabled={processingId === "creating"} />
          <input placeholder="Contact Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required disabled={processingId === "creating"} />
          <input placeholder="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={processingId === "creating"} />
          <input placeholder="Password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required disabled={processingId === "creating"} />
          <input placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} disabled={processingId === "creating"} />
          <button type="submit" className="create-btn" disabled={processingId === "creating"}>
            {processingId === "creating" ? "Creating..." : "Create Employer"}
          </button>
        </form>
      </div>

      <div className="admin-card">
        <h3>Employer Database</h3>
        
        {/* VIVA REQUIREMENT: SEARCH */}
        <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="🔍 Search Employer by company name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc", width: "100%", maxWidth: "400px" }}
          />
        </div>

        {loading ? (
            <div style={{ padding: "40px", display: "flex", justifyContent: "center" }}>
                <LoadingSpinner />
            </div>
        ) : (
            <table className="admin-table">
            <thead>
                <tr>
                <th>Company</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {filteredEmployers.length === 0 ? (
                <tr>
                    <td colSpan="4" className="no-data" style={{ textAlign: "center", padding: "20px" }}>No employers found</td>
                </tr>
                ) : (
                filteredEmployers.map((emp) => (
                    <tr key={emp._id}>
                    <td><strong>{emp.companyName}</strong></td>
                    <td>{emp.email}</td>
                    <td>
                        <span className={`status-badge ${emp.status === "approved" ? "active" : emp.status === "rejected" ? "rejected" : "pending"}`}>
                          {emp.status === "approved" ? "Verified" : emp.status}
                        </span>
                    </td>
                    <td>
                        {/* VIVA REQUIREMENT: View */}
                        <button 
                            style={{ background: "#f0f0f0", color: "#333", border: "none", padding: "6px 12px", borderRadius: "4px", marginRight: "5px", cursor: "pointer", fontWeight: "bold" }}
                            onClick={() => setSelectedEmployer(emp)}
                            disabled={processingId === emp._id}
                        >
                            👁️ View
                        </button>

                        {/* VIVA REQUIREMENT: Verify Employer */}
                        {emp.status !== "approved" && (
                          <button
                            className="action-btn accept-btn"
                            style={{ marginRight: "5px", background: "#4caf50", color: "white" }}
                            onClick={() => attemptStatusUpdate(emp, "approved")}
                            disabled={processingId === emp._id}
                          >
                            {processingId === emp._id ? "..." : "Verify Employer"}
                          </button>
                        )}
                        
                        {/* VIVA REQUIREMENT: Reject Employer */}
                        {emp.status !== "rejected" && (
                          <button
                            className="action-btn danger"
                            style={{ marginRight: "5px", background: "#f44336", color: "white" }}
                            onClick={() => attemptStatusUpdate(emp, "rejected")}
                            disabled={processingId === emp._id}
                          >
                            {processingId === emp._id ? "..." : "Reject Employer"}
                          </button>
                        )}

                        <button
                         className="action-btn"
                         onClick={() => attemptDelete(emp)}
                         disabled={processingId === emp._id}
                         style={{ background: "#000", border: "none", color: "#fff", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
                        >
                         {processingId === emp._id ? "..." : "🗑️ Delete"}
                        </button>
                    </td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
        )}
      </div>

      {/* EMPLOYER VIEW MODAL */}
      {selectedEmployer && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "30px", borderRadius: "10px", maxWidth: "500px", width: "90%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2>Employer Details</h2>
              <button onClick={() => setSelectedEmployer(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>&times;</button>
            </div>
            
            <div style={{ marginBottom: "15px" }}><strong>Company Name:</strong> {selectedEmployer.companyName}</div>
            <div style={{ marginBottom: "15px" }}><strong>Contact Person:</strong> {selectedEmployer.name}</div>
            <div style={{ marginBottom: "15px" }}><strong>Email:</strong> {selectedEmployer.email}</div>
            <div style={{ marginBottom: "15px" }}><strong>Phone:</strong> {selectedEmployer.phone || "N/A"}</div>
            
            <div style={{ marginBottom: "15px", padding: "10px", background: "#f8f9fa", borderRadius: "5px", borderLeft: selectedEmployer.status === "approved" ? "4px solid #4caf50" : selectedEmployer.status === "rejected" ? "4px solid #f44336" : "4px solid #ffeb3b" }}>
              <strong>Status:</strong> 
              <span className={`status-badge ${selectedEmployer.status === "approved" ? "active" : selectedEmployer.status === "rejected" ? "rejected" : "pending"}`} style={{ marginLeft: "10px" }}>
                {selectedEmployer.status === "approved" ? "Verified" : selectedEmployer.status}
              </span>
            </div>

            <div style={{ marginBottom: "25px" }}><strong>Registration Date:</strong> {selectedEmployer.createdAt ? new Date(selectedEmployer.createdAt).toLocaleString() : "Unknown"}</div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              {selectedEmployer.status !== "approved" && (
                 <button onClick={() => attemptStatusUpdate(selectedEmployer, "approved")} style={{ padding: "10px 20px", background: "#4caf50", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Verify Employer</button>
              )}
              {selectedEmployer.status !== "rejected" && (
                 <button onClick={() => attemptStatusUpdate(selectedEmployer, "rejected")} style={{ padding: "10px 20px", background: "#f44336", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Reject Employer</button>
              )}
              <button onClick={() => setSelectedEmployer(null)} style={{ padding: "10px 20px", background: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
