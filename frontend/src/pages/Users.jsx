import { useEffect, useState, useCallback } from "react";
import API from "../api/axios";
import { useSocket } from "../hooks/useSocket.jsx";
import "./admin.css";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Alert from "../components/common/Alert";
import ConfirmationModal from "../components/common/ConfirmationModal";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const socket = useSocket();
  
  const ITEMS_PER_PAGE = 10;
  
  // Custom Confirmation Modal state
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, title: "", text: "", type: "danger" });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Error loading users", err);
      setMessage({ text: "Failed to load users. Please refresh.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Listen for real-time updates from socket
  useEffect(() => {
    if (!socket) return;
    socket.on("dashboard:refresh", loadUsers);
    return () => {
      socket.off("dashboard:refresh", loadUsers);
    };
  }, [socket, loadUsers]);

  const attemptStatusUpdate = (u, newStatus) => {
    const isBlocking = newStatus === "blocked";
    setConfirmDialog({
      isOpen: true,
      title: isBlocking ? "Block User" : "Activate User",
      text: isBlocking ? `Are you sure you want to block ${u.name}? They will lose access to the platform.` : `Are you sure you want to reactivate ${u.name}?`,
      type: isBlocking ? "warning" : "primary",
      action: () => executeStatusUpdate(u._id, newStatus)
    });
  };

  const executeStatusUpdate = async (id, status) => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    setProcessingId(id);
    try {
      await API.put(`/admin/user/${id}/status`, { status });
      const msg = status === "active" 
        ? "User activated successfully!" 
        : status === "blocked"
        ? "User blocked successfully. They have been notified."
        : `User status updated to ${status}`;
      setMessage({ text: msg, type: "success" });
      
      if (selectedUser && selectedUser._id === id) {
        setSelectedUser({ ...selectedUser, status });
      }
      loadUsers();
    } catch (err) {
      console.error(err);
      setMessage({ text: err.response?.data?.message || "Failed to update user status", type: "error" });
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    }
  };

  const attemptDelete = (u) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete User",
      text: `Are you absolutely sure you want to delete ${u.name}? This action cannot be undone and will erase their history.`,
      type: "danger",
      action: () => executeDelete(u._id)
    });
  };

  const executeDelete = async (id) => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    setProcessingId(id);
    try {
      await API.delete(`/admin/user/${id}`);
      setMessage({ text: "User deleted successfully", type: "success" });
      if (selectedUser && selectedUser._id === id) setSelectedUser(null);
      loadUsers();
    } catch(err) { 
      console.error(err); 
      setMessage({ text: "Failed to delete user", type: "error" });
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    }
  };

  const filteredUsers = users.filter((u) => 
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIdx, endIdx);

  return (
    <div className="admin-page" style={{ padding: "20px" }}>
      <h2>Users Management</h2>
      
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

      <div className="admin-card">
        <h3>Existing Users</h3>
        
        {/* VIEW REQUIREMENT: SEARCH USER */}
        <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
          <input
            type="text"
            autoComplete="off"
            placeholder="🔍 Search User by name or email..."
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
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((u) => (
                    <tr key={u._id} onClick={() => setSelectedUser(u)} style={{ cursor: 'pointer' }}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>
                        <span className={`status-badge ${u.status === "blocked" || u.status === "suspended" || u.status === "banned" ? "rejected" : "active"}`}>
                          {u.status || "active"}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button 
                            style={{ background: "#f0f0f0", color: "#333", border: "none", padding: "6px 12px", borderRadius: "4px", marginRight: "5px", cursor: "pointer", fontWeight: "bold" }}
                            onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }}
                            disabled={processingId === u._id}
                        >
                            👁️ View
                        </button>
                        
                        {u.status !== "active" ? (
                            <button 
                                className="action-btn primary" 
                                onClick={(e) => { e.stopPropagation(); attemptStatusUpdate(u, "active"); }}
                                disabled={processingId === u._id}
                                style={{ marginRight: "5px" }}
                            >
                                {processingId === u._id ? "..." : "Activate"}
                            </button>
                        ) : (
                            <button 
                                className="action-btn warning" 
                                onClick={(e) => { e.stopPropagation(); attemptStatusUpdate(u, "blocked"); }}
                                disabled={processingId === u._id}
                                style={{ marginRight: "5px" }}
                            >
                                {processingId === u._id ? "..." : "Block"}
                            </button>
                        )}
                        
                        <button 
                         className="action-btn danger" 
                         onClick={(e) => { e.stopPropagation(); attemptDelete(u); }}
                         disabled={processingId === u._id}
                        >
                         {processingId === u._id ? "..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-data" style={{textAlign:"center", padding:"20px"}}>No users found</td>
                  </tr>
                )}
              </tbody>
            </table>

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
                  Page {currentPage} of {totalPages} • Showing {Math.min(startIdx + 1, filteredUsers.length)}-{Math.min(endIdx, filteredUsers.length)} of {filteredUsers.length}
                </span>
              </div>
            )}
            </>
          )}
      </div>

      {/* USER VIEW MODAL */}
      {selectedUser && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "30px", borderRadius: "10px", maxWidth: "500px", width: "90%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2>User Details</h2>
              <button onClick={() => setSelectedUser(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>&times;</button>
            </div>
            
            <div style={{ marginBottom: "15px" }}><strong>Name:</strong> {selectedUser.name}</div>
            <div style={{ marginBottom: "15px" }}><strong>Email:</strong> {selectedUser.email}</div>
            <div style={{ marginBottom: "15px" }}><strong>Phone:</strong> {selectedUser.phone || "N/A"}</div>
            <div style={{ marginBottom: "15px" }}><strong>Role:</strong> {selectedUser.role}</div>
            <div style={{ marginBottom: "15px" }}>
              <strong>Status:</strong> 
              <span className={`status-badge ${selectedUser.status === "blocked" ? "rejected" : "active"}`} style={{ marginLeft: "10px" }}>
                {selectedUser.status || "active"}
              </span>
            </div>
            <div style={{ marginBottom: "25px" }}><strong>Registration Date:</strong> {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : "Unknown"}</div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              {selectedUser.status === "active" && (
                 <button onClick={() => attemptStatusUpdate(selectedUser, "blocked")} style={{ padding: "10px 20px", background: "#ff9800", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Block User</button>
              )}
              {selectedUser.status === "blocked" && (
                 <button onClick={() => attemptStatusUpdate(selectedUser, "active")} style={{ padding: "10px 20px", background: "#4caf50", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Unblock User</button>
              )}
              <button onClick={() => setSelectedUser(null)} style={{ padding: "10px 20px", background: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
