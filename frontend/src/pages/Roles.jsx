import { useEffect, useState } from "react";
import API from "../api/axios";

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState("");

  const fetchRoles = async () => {
    try {
      const res = await API.get("/role/all");
      setRoles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createRole = async () => {
    try {
      await API.post("/role", {
        name,
        permissions: permissions.split(",")
      });
      fetchRoles();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadRoles = async () => {
      await fetchRoles();
    };

    loadRoles();
  }, []);

  return (
    <div>
      <h2>Role Management</h2>

      <input
        placeholder="Role Name"
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Permissions (comma separated)"
        onChange={(e) => setPermissions(e.target.value)}
      />

      <button onClick={createRole}>Create</button>

      <ul>
        {roles.map((role) => (
          <li key={role._id}>
            {role.name} - {role.permissions.join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
}