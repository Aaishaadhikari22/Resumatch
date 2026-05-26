import { useEffect, useState } from "react";
import API from "../api/axios";

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const fetchRoles = async () => {
    try {
      const res = await API.get("/role/public/all");
      setRoles(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage({ text: "Failed to load roles", type: "error" });
    }
  };

  const createRole = async () => {
    if (!name.trim()) {
      setMessage({ text: "Role name is required", type: "error" });
      return;
    }
    if (!permissions.trim()) {
      setMessage({ text: "Permissions are required", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const permissionsArray = permissions.split(",").map(p => p.trim()).filter(Boolean);
      await API.post("/role/admin/create", {
        name,
        permissions: permissionsArray
      });
      setMessage({ text: "Role created successfully", type: "success" });
      setName("");
      setPermissions("");
      fetchRoles();
    } catch (err) {
      console.error(err);
      setMessage({ text: err.response?.data?.msg || "Failed to create role", type: "error" });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 4000);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Role Management</h2>

      {message.text && (
        <div style={{ padding: "12px", margin: "12px 0", borderRadius: "6px", background: message.type === "error" ? "#fee2e2" : "#dcfce7", color: message.type === "error" ? "#991b1b" : "#15803d" }}>
          {message.text}
        </div>
      )}

      <div style={{ background: "white", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Role Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ display: "block", width: "100%", padding: "10px", marginBottom: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
        />

        <input
          type="text"
          placeholder="Permissions (comma separated)"
          value={permissions}
          onChange={(e) => setPermissions(e.target.value)}
          style={{ display: "block", width: "100%", padding: "10px", marginBottom: "10px", border: "1px solid #ddd", borderRadius: "4px" }}
        />

        <button onClick={createRole} disabled={loading} style={{ padding: "10px 20px", background: "#3b82f6", color: "white", border: "none", borderRadius: "4px", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Creating..." : "Create Role"}
        </button>
      </div>

      <div style={{ background: "white", padding: "20px", borderRadius: "8px" }}>
        <h3>Available Roles</h3>
        {roles.length === 0 ? (
          <p style={{ color: "#666" }}>No roles found</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {roles.map((role) => (
              <li key={role._id} style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                <strong>{role.name}</strong> - {(role.permissions || []).join(", ")}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}