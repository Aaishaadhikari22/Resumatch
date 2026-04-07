import { useState } from "react";
import API from "../../api/axios";
import "../auth.css";
import { useNavigate } from "react-router-dom";

export default function EmployerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/employer/login", {
        email, password
      });
      
      // Store token with correct key
      localStorage.setItem("employerToken", res.data.token);
      localStorage.setItem("token", res.data.token); // Fallback for compatibility
      
      // Store employer info
      const employerInfo = {
        _id: res.data.employer._id,
        name: res.data.employer.name,
        companyName: res.data.employer.companyName,
        email: res.data.employer.email,
        role: res.data.employer.role,
        status: res.data.employer.status
      };
      localStorage.setItem("employerInfo", JSON.stringify(employerInfo));
      
      // Check if account is pending
      if (res.data.employer.status === "pending") {
        alert("Your account is pending admin approval. You'll be able to access the dashboard once approved.");
        window.location.href = "/employer/login";
      } else if (res.data.employer.status === "rejected") {
        alert("Your account has been rejected. Please contact support for more information.");
      } else {
        window.location.href = "/employer/dashboard";
      }
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.msg || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <img src="/login.png" alt="employer login" className="auth-image" />
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h2>Employer Login</h2>
          <p>Manage your jobs and find top talent on ResuMatch</p>
          <form onSubmit={handleLogin}>
            <input id="email" name="email" type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input id="password" name="password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Login</button>
          </form>
          <p className="auth-link">
            Don't have an employer account?
            <a href="/employer/signup"> Sign Up</a>
          </p>
        </div>
      </div>
    </div>
  );
}
