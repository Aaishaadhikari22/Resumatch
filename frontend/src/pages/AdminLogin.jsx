import { useState } from "react";
import API from "../api/axios";
import "./auth.css";
import { useNavigate } from "react-router-dom";
import { saveAuth } from "../utils/auth";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/admin/login", {
        email,
        password
      });

      const adminInfo = {
        _id: res.data.admin._id,
        name: res.data.admin.name,
        email: res.data.admin.email,
        role: res.data.admin.role,
        permissions: res.data.admin.permissions || []
      };
      saveAuth("admin", res.data.token, adminInfo);
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

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/auth/admin/forgot-password", { email: forgotEmail });
      setOtpSent(true);
      alert("Password reset OTP sent to your email!");
    } catch (error) {
       console.log(error);
       alert(error.response?.data?.msg || "Failed to send OTP");
    } finally {
       setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/auth/admin/reset-password", { email: forgotEmail, otp, newPassword });
      alert("Password reset successfully! You can now login.");
      setIsForgotPassword(false);
      setOtpSent(false);
      setOtp("");
      setNewPassword("");
      setEmail(forgotEmail);
    } catch (error) {
       console.log(error);
       alert(error.response?.data?.msg || "Failed to reset password");
    } finally {
       setLoading(false);
    }
  };

return(

<div className="auth-container">

<div className="auth-left">
<img src="/login.png" alt="login" className="auth-image"/>
</div>

<div className="auth-right">

<div className="auth-card">

{!isForgotPassword ? (
  <>
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
  
  <div style={{ textAlign: "right", marginTop: "-10px", marginBottom: "15px" }}>
    <span 
      onClick={() => setIsForgotPassword(true)} 
      style={{ color: "#3b82f6", fontSize: "14px", cursor: "pointer", fontWeight: "600" }}
    >
      Forgot Password?
    </span>
  </div>

  <button type="submit">Login</button>

  </form>

  <p className="auth-link">
  Don't have an account?
  <a href="/admin/signup"> Sign Up</a>
  </p>
  </>
) : (
  <>
    <h2>Reset Password</h2>
    <p>{otpSent ? "Enter the OTP sent to your email and your new password." : "Enter your email to receive a password reset OTP."}</p>
    
    {!otpSent ? (
      <form onSubmit={handleSendOTP}>
        <input type="email" placeholder="Email Address" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? "Sending..." : "Send Reset OTP"}</button>
      </form>
    ) : (
      <form onSubmit={handleResetPassword}>
        <input type="text" placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength="6" />
        <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength="6" />
        <button type="submit" disabled={loading}>{loading ? "Resetting..." : "Reset Password"}</button>
      </form>
    )}
    
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <span 
        onClick={() => setIsForgotPassword(false)} 
        style={{ color: "#64748b", fontSize: "14px", cursor: "pointer", fontWeight: "600" }}
      >
        ← Back to Login
      </span>
    </div>
  </>
)}

</div>

</div>

</div>

);

}