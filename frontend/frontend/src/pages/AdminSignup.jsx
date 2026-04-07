import { useState } from "react";
import API from "../api/axios";
import "./auth.css";
import { useNavigate } from "react-router-dom";

export default function AdminSignup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [qualification, setQualification] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/admin/register", {
        name,
        email,
        password,
        gender,
        qualification,
        phone,
        role
      });

      console.log(res.data);
      // Store token with correct key for axios interceptor
      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("token", res.data.token); // Fallback for compatibility
      
      // Store admin info for permission system
      const adminInfo = {
        _id: res.data.admin._id,
        name: res.data.admin.name,
        email: res.data.admin.email,
        role: res.data.admin.role,
        permissions: res.data.admin.permissions || []
      };
      localStorage.setItem("adminInfo", JSON.stringify(adminInfo));
      
      alert("Admin created successfully! Logging you in...");
      navigate("/dashboard");
    } catch (error) {
      console.log("Signup error:", error);
      if (error.response) {
        alert(error.response.data.msg);
      } else {
        alert("Server not responding");
      }
    }
  };

  return (

    <div className="auth-container">

      <div className="auth-left">
        <img src="/signup.png" alt="signup" className="auth-image" />
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2>Create Admin Account</h2>
          <p>Sign up to manage ResuMatch</p>

        <form onSubmit={handleSignup}>

          <input
            placeholder="Full Name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />

          <select
            value={gender}
            onChange={(e)=>setGender(e.target.value)}
            required
          >
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>

          <input
            placeholder="Qualification"
            value={qualification}
            onChange={(e)=>setQualification(e.target.value)}
          />

          <input
            placeholder="Phone Number"
            value={phone}
            onChange={(e)=>setPhone(e.target.value)}
          />

          <select
          value={role}
          onChange={(e)=>setRole(e.target.value)}
          required
          >
         <option value="">Select Role</option>
         <option value="super_admin">Super Admin</option>
         <option value="employer_manager">Employer Manager</option>
         <option value="moderator">Content Moderator</option>
         <option value="support">Support Executive</option>
         </select>

          <button type="submit">Create Admin</button>

        </form>

        <p className="auth-link">
          Already have an account?
          <a href="/admin/login"> Login</a>
        </p>

        </div>
      </div>

    </div>

  );
}