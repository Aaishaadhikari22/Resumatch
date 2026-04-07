import { useState } from "react";
import API from "../../api/axios";
import "../auth.css";
import { useNavigate } from "react-router-dom";

export default function UserSignup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/user/register", {
        name, email, password
      });
      // Store token with correct key
      localStorage.setItem("userToken", res.data.token);
      localStorage.setItem("token", res.data.token); // Fallback for compatibility
      
      // Store user info
      const userInfo = {
        _id: res.data.user._id,
        name: res.data.user.name,
        email: res.data.user.email,
        role: res.data.user.role
      };
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
      
      alert("Account created successfully! Welcome to ResuMatch.");
      window.location.href = "/user/dashboard";
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.msg || "Signup failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <img src="/signup.png" alt="user signup" className="auth-image" />
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h2>Create Job Seeker Account</h2>
          <p>Kickstart your career with ResuMatch</p>
          <form onSubmit={handleSignup}>
            <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Sign Up</button>
          </form>
          <p className="auth-link">
            Already have an account?
            <a href="/user/login"> Login</a>
          </p>
        </div>
      </div>
    </div>
  );
}
