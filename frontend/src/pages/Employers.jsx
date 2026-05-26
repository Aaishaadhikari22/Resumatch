import { useEffect, useState, useCallback } from "react";
import API from "../api/axios";
import { useSocket } from "../hooks/useSocket.jsx";
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
  const [currentPage, setCurrentPage] = useState(1);
  const socket = useSocket();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingEmployer, setCreatingEmployer] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    email: "",
    password: "",
    phone: ""
  });

  const ITEMS_PER_PAGE = 10;

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, title: "", text: "", type: "danger" });

  const fetchEmployers = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchEmployers();
  }, [fetchEmployers]);

  // Listen for real-time updates from socket
  useEffect(() => {
    if (!socket) return;
    socket.on("dashboard:refresh", fetchEmployers);
    return () => {
      socket.off("dashboard:refresh", fetchEmployers);
    };
  }, [socket, fetchEmployers]);

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

  const handleCreateEmployer = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.companyName || !formData.email || !formData.password || !formData.phone) {
      setMessage({ text: "All fields are required", type: "error" });
      return;
    }

    setCreatingEmployer(true);
    try {
      const res = await API.post("/admin/create-employer", formData);
      setMessage({ text: res.data.message || "Employer created successfully", type: "success" });
      
      // Reset form
      setFormData({
        name: "",
        companyName: "",
        email: "",
        password: "",
        phone: ""
      });
      
      setShowCreateForm(false);
      fetchEmployers();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Error creating employer";
      setMessage({ text: errorMsg, type: "error" });
    } finally {
      setCreatingEmployer(false);
    }
  };

  const filteredEmployers = employers.filter((emp) =>
    emp.companyName?.toLowerCase().includes(search.toLowerCase()) || 
    emp.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEmployers.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedEmployers = filteredEmployers.slice(startIdx, endIdx);

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

      <div className="admin-card">
        <h3>Employer Database</h3>
        
        {/* ADD EMPLOYER BUTTON */}
        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              background: "#007bff",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px"
            }}
          >
            ➕ Add Employer
          </button>
        </div>

        {/* CREATE EMPLOYER FORM MODAL */}
        {showCreateForm && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1001
          }}>
            <div style={{
              background: "#fff",
              padding: "30px",
              borderRadius: "10px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "90vh",
              overflowY: "auto"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2>Add New Employer</h2>
                <button 
                  onClick={() => setShowCreateForm(false)} 
                  style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}
                  disabled={creatingEmployer}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateEmployer} autoComplete="off">
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Contact Person Name *</label>
                  <input
                    type="text"
                    placeholder="Enter contact person name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "5px",
                      boxSizing: "border-box",
                      fontFamily: "inherit"
                    }}
                    disabled={creatingEmployer}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Company Name *</label>
                  <input
                    type="text"
                    placeholder="Enter company name"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "5px",
                      boxSizing: "border-box",
                      fontFamily: "inherit"
                    }}
                    disabled={creatingEmployer}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Email *</label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    autoComplete="off"
                    data-lpignore="true"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "5px",
                      boxSizing: "border-box",
                      fontFamily: "inherit"
                    }}
                    disabled={creatingEmployer}
                  />
                </div>

                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Password *</label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-form-type="other"
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "5px",
                      boxSizing: "border-box",
                      fontFamily: "inherit"
                    }}
                    disabled={creatingEmployer}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Phone *</label>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "5px",
                      boxSizing: "border-box",
                      fontFamily: "inherit"
                    }}
                    disabled={creatingEmployer}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    style={{
                      padding: "10px 20px",
                      background: "#f0f0f0",
                      color: "#333",
                      border: "1px solid #ccc",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontWeight: "bold"
                    }}
                    disabled={creatingEmployer}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "10px 20px",
                      background: "#007bff",
                      color: "#fff",
                      border: "none",
                      borderRadius: "5px",
                      cursor: creatingEmployer ? "not-allowed" : "pointer",
                      fontWeight: "bold",
                      opacity: creatingEmployer ? 0.6 : 1
                    }}
                    disabled={creatingEmployer}
                  >
                    {creatingEmployer ? "Creating..." : "Create Employer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* SEARCH */}
        <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
          <input
            type="text"
            autoComplete="off"
            placeholder="🔍 Search Employer by company name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc", width: "100%", maxWidth: "400px" }}
          />
        </div>

        {loading ? (
            <div style={{ padding: "40px", display: "flex", justifyContent: "center" }}>
                <LoadingSpinner />
            </div>
        ) : (
            <>
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
                {paginatedEmployers.length === 0 ? (
                <tr>
                    <td colSpan="4" className="no-data" style={{ textAlign: "center", padding: "20px" }}>No employers found</td>
                </tr>
                ) : (
                paginatedEmployers.map((emp) => (
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

                        {/* VIVA REQUIREMENT: Verify Employer (Removed per request) */}
                        
                        {/* VIVA REQUIREMENT: Reject Employer (Removed per request) */}

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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginTop: "20px", padding: "15px", background: "#f9f9f9", borderRadius: "5px" }}>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{ padding: "8px 12px", background: currentPage === 1 ? "#ccc" : "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
                >
                  ← Previous
                </button>
                
                <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button 
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{ padding: "8px 10px", background: currentPage === page ? "#007bff" : "#f0f0f0", color: currentPage === page ? "#fff" : "#333", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: currentPage === page ? "bold" : "normal" }}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{ padding: "8px 12px", background: currentPage === totalPages ? "#ccc" : "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
                >
                  Next →
                </button>

                <span style={{ marginLeft: "20px", color: "#666", fontWeight: "bold" }}>
                  Page {currentPage} of {totalPages} • Showing {Math.min(startIdx + 1, filteredEmployers.length)}-{Math.min(endIdx, filteredEmployers.length)} of {filteredEmployers.length}
                </span>
              </div>
            )}
            </>
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
              {/* Verify Button Removed */}
              {/* Reject Button Removed */}
              <button onClick={() => setSelectedEmployer(null)} style={{ padding: "10px 20px", background: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
