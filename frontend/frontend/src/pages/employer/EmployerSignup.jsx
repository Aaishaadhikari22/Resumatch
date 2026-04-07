import { useState } from "react";
import API from "../../api/axios";
import "../auth.css";
import { useNavigate } from "react-router-dom";

export default function EmployerSignup() {
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/employer/register", {
        name, companyName, email, password
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
      
      // Show status message if pending
      if (res.data.employer.status === "pending") {
        alert("Account created! Your account is pending admin approval. You'll receive an email once approved.");
        window.location.href = "/employer/login";
      } else {
        window.location.href = "/employer/dashboard";
      }
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.msg || "Signup failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <img src="/login.png" alt="employer signup" className="auth-image" />
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h2>Employer Sign Up</h2>
          <p>Start hiring top talent with ResuMatch AI</p>
          <form onSubmit={handleSignup}>
            <input type="text" placeholder="Your Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <input type="text" placeholder="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Create Account</button>
          </form>
          <p className="auth-link">
            Already have an employer account?
            <a href="/employer/login"> Login</a>
          </p>
        </div>
      </div>
    </div>
  );
}
