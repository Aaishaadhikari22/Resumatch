import { useState } from "react";
import API from "../api/axios";
import "./auth.css";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/admin/login", {
        email,
        password
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
      
      navigate("/dashboard");
    } catch (error) {
      console.log(error);
      if (error.response) {
        alert(error.response.data.msg);
      } else {
        alert("Login failed");
      }
    }
  };

return(

<div className="auth-container">

<div className="auth-left">
<img src="/login.png" alt="login" className="auth-image"/>
</div>

<div className="auth-right">

<div className="auth-card">

<h2>ResuMatch Admin</h2>
<p>Login to your dashboard</p>

<form onSubmit={handleLogin}>

<input
id="email"
name="email"
type="email"
placeholder="Email Address"
value={email}
onChange={(e)=>setEmail(e.target.value)}
required
/>

<input
id="password"
name="password"
type="password"
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
required
/>

<button type="submit">Login</button>

</form>

<p className="auth-link">
Don't have an account?
<a href="/admin/signup"> Sign Up</a>
</p>

</div>

</div>

</div>

);

}