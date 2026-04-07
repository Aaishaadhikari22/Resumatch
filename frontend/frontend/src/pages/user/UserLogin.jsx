import { useState } from "react";
import API from "../../api/axios";
import "../auth.css";
import { useNavigate } from "react-router-dom";

export default function UserLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/user/login", { 
        email, password 
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
      
      window.location.href = "/user/dashboard";
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.msg || "Login failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <img src="/login.png" alt="user login" className="auth-image" />
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h2>Job Seeker Login</h2>
          <p>Find your next dream job on ResuMatch</p>
          <form onSubmit={handleLogin}>
            <input id="email" name="email" type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input id="password" name="password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Login</button>
          </form>
          <p className="auth-link">
            Don't have a job seeker account?
            <a href="/user/signup"> Sign Up</a>
          </p>
        </div>
      </div>
    </div>
  );
}
