import { useEffect, useState } from "react";
import API from "../api/axios";
import "./admin.css";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Alert from "../components/common/Alert";
import ConfirmationModal from "../components/common/ConfirmationModal";

const categoryIcons = {
  "IT": "💻",
  "Healthcare": "🏥",
  "Finance": "💰",
  "Education": "🎓",
  "Engineering": "⚙️",
  "Marketing": "📈",
  "Sales": "🤝",
  "Customer Support": "🎧",
  "Design": "🎨",
  "Business Operations": "🏢",
  "default": "📁"
};

const getCategoryIcon = (name) => {
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return categoryIcons.default;
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [search, setSearch] = useState("");

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, title: "", text: "", type: "danger" });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active"
  });
  
  const [editingId, setEditingId] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await API.get("/category/all");
      setCategories(res.data || []);
    } catch (_error) {
      console.error(_error);
      setMessage({ text: "Failed to load categories", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    
    // VIVA REQUIREMENT: VALIDATION
    if (!formData.name.trim()) {
        setMessage({ text: "Category name is required", type: "error" });
        return;
    }

    const isDuplicate = categories.some(cat => cat.name.toLowerCase() === formData.name.toLowerCase() && cat._id !== editingId);
    if (isDuplicate) {
        setMessage({ text: `Category "${formData.name}" already exists`, type: "error" });
        return;
    }

    setProcessingId("saving");
    try {
      if (editingId) {
        await API.put(`/category/update/${editingId}`, formData);
        setMessage({ text: "Category updated successfully", type: "success" });
      } else {
        await API.post("/category/create", formData);
        setMessage({ text: "Category created successfully", type: "success" });
      }
      setFormData({ name: "", description: "", status: "active" });
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || "Error saving category", type: "error" });
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat._id);
    setFormData({ name: cat.name, description: cat.description, status: cat.status });
  };

  const attemptStatusToggle = (cat) => {
    const newStatus = cat.status === "active" ? "inactive" : "active";
    const isActivating = newStatus === "active";
    setConfirmDialog({
      isOpen: true,
      title: isActivating ? "Activate Category" : "Deactivate Category",
      text: isActivating 
        ? `Are you sure you want to activate the "${cat.name}" category? Jobs under this category will become visible.` 
        : `Are you sure you want to deactivate the "${cat.name}" category? Jobs under this category may be hidden.`,
      type: isActivating ? "primary" : "warning",
      action: () => toggleStatus(cat._id, cat.status)
    });
  };

  const toggleStatus = async (id, currentStatus) => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    setProcessingId(`status-${id}`);
    try {
      await API.put(`/category/update/${id}`, { status: newStatus });
      setMessage({ text: `Category marked as ${newStatus}`, type: "success" });
      fetchCategories();
    } catch {
      setMessage({ text: "Error updating status", type: "error" });
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    }
  };

  const attemptDelete = (cat) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Category",
      text: `Are you absolutely sure you want to delete the "${cat.name}" category? This action cannot be undone.`,
      type: "danger",
      action: () => deleteCategory(cat._id)
    });
  };

  const deleteCategory = async (id) => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
    setProcessingId(id);
    try {
      await API.delete(`/category/delete/${id}`);
      setMessage({ text: "Category deleted", type: "success" });
      fetchCategories();
    } catch (err) {
      console.error(err);
      setMessage({ text: "Error deleting category", type: "error" });
    } finally {
      setProcessingId(null);
      setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter((cat) =>
    cat.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-page" style={{ padding: "20px" }}>
      <h2>Industry Categories Center</h2>
      
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

      {/* KPI Cards */}
      <div className="reports-grid" style={{ marginBottom: "30px" }}>
        <div className="stat-card">
           <h4>Total Categories</h4>
           <p>{categories.length}</p>
        </div>
        <div className="stat-card">
           <h4>Active Sectors</h4>
           <p style={{ color: "#22c55e" }}>{categories.filter(c => c.status === "active").length}</p>
        </div>
        <div className="stat-card">
           <h4>Inactive Sectors</h4>
           <p style={{ color: "#ef4444" }}>{categories.filter(c => c.status === "inactive").length}</p>
        </div>
      </div>

      {/* ADD CATEGORY FORM */}
      <div className="admin-card" style={{ marginBottom: "30px" }}>
        <h3>{editingId ? "Edit Category" : "Create New Category"}</h3>
        <form className="admin-form" onSubmit={handleCreateOrUpdate}>
          <input
            placeholder="Category Name (e.g. IT, Finance)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={processingId === "saving"}
            style={{ fontWeight: "bold" }}
          />
          <input
            placeholder="Short Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            disabled={processingId === "saving"}
            style={{ flex: 2 }}
          />
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            disabled={processingId === "saving"}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button 
            type="submit" 
            className="create-btn"
            disabled={processingId === "saving"}
          >
            {processingId === "saving" ? "Saving..." : editingId ? "Update Category" : "Add Category"}
          </button>
          
          {editingId && (
            <button 
                type="button" 
                className="action-btn cancel-btn" 
                onClick={() => { setEditingId(null); setFormData({ name: "", description: "", status: "active" }); }}
                style={{ height: "46px", marginLeft: "10px", marginTop: "2px" }}
            >
                Cancel Edit
            </button>
          )}
        </form>
      </div>

      <div className="admin-card">
        <h3>Categories Database</h3>

        {/* VIVA REQUIREMENT: SEARCH SECTORS */}
        <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="🔍 Search Sector by name..."
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
                <th>Category Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Jobs Count</th>
                <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {filteredCategories.length === 0 ? (
                <tr>
                    <td colSpan="5" className="no-data" style={{textAlign:"center", padding:"20px"}}>No categories found</td>
                </tr>
                ) : (
                filteredCategories.map((cat) => (
                    <tr key={cat._id}>
                    <td>
                        <span style={{ fontSize: "16px", marginRight: "8px" }}>{getCategoryIcon(cat.name)}</span>
                        <strong>{cat.name}</strong>
                    </td>
                    <td style={{ color: "#64748b" }}>{cat.description || "N/A"}</td>
                    <td>
                        {/* VIVA REQUIREMENT: STATUS TOGGLE */}
                        <span 
                            className={`status-badge ${cat.status === "active" ? "active" : "rejected"}`}
                            style={{ cursor: "pointer", border: "1px solid transparent", transition: "all 0.2s" }}
                            onClick={() => attemptStatusToggle(cat)}
                            title="Click to toggle status"
                        >
                          {processingId === `status-${cat._id}` ? "..." : cat.status}
                        </span>
                    </td>
                    <td>
                       <span style={{ background: "#e0f2fe", color: "#0284c7", padding: "4px 8px", borderRadius: "12px", fontWeight: "bold", fontSize: "12px" }}>
                            {cat.jobsCount} Jobs
                       </span>
                    </td>
                    <td>
                        <button
                          className="action-btn accept-btn"
                          style={{ marginRight: "5px", background: "#f8fafc", color: "#334155", border: "1px solid #e2e8f0" }}
                         onClick={() => startEdit(cat)}
                         disabled={processingId === cat._id}
                        >
                         ✏️ Edit
                        </button>
                        <button
                         className="action-btn danger"
                         onClick={() => attemptDelete(cat)}
                         disabled={processingId === cat._id}
                         style={{ background: "#fff1f2", color: "#e11d48", border: "1px solid #ffe4e6" }}
                        >
                         {processingId === cat._id ? "..." : "🗑️ Delete"}
                        </button>
                    </td>
                    </tr>
                ))
                )}
            </tbody>
            </table>
        )}
      </div>
    </div>
  );
}