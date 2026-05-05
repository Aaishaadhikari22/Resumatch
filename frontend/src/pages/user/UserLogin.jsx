import { useState } from "react";
import API from "../../api/axios";
import "../auth.css";
import { saveAuth } from "../../utils/auth";

export default function UserLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [requireOTP, setRequireOTP] = useState(false);
  const [userId, setUserId] = useState(null);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/user/login", { 
        email, password 
      });
      const userInfo = {
        _id: res.data.user._id,
        name: res.data.user.name,
        email: res.data.user.email,
        role: res.data.user.role
      };
      saveAuth("user", res.data.token, userInfo);
      
      window.location.href = "/user/dashboard";
    } catch (error) {
      if (error.response?.data?.requireOTP) {
         setRequireOTP(true);
         setUserId(error.response.data.userId);
         alert(error.response.data.msg || "Email not verified. A new OTP has been sent.");
         return;
      }
      console.log(error);
      alert(error.response?.data?.msg || "Login failed");
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/auth/user/verify-otp", {
        userId, otp
      });
      alert(res.data.msg || "Email verified! You can now log in.");
      setRequireOTP(false);
      setOtp("");
      // Now attempt login again automatically or manually
      handleLogin({ preventDefault: () => {} });
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.msg || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resp = await API.post("/auth/user/forgot-password", { email: forgotEmail });
      if (resp.data) {
        setOtpSent(true);
        setTimeout(() => alert("Password reset OTP sent to your email!"), 100);
      }
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
      await API.post("/auth/user/reset-password", { email: forgotEmail, otp, newPassword });
      setOtpSent(false);
      setIsForgotPassword(false);
      setOtp("");
      setNewPassword("");
      setEmail(forgotEmail);
      setTimeout(() => alert("Password reset successfully! You can now login."), 100);
    } catch (error) {
       console.log(error);
       alert(error.response?.data?.msg || "Failed to reset password");
    } finally {
       setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <img src="/login.png" alt="user login" className="auth-image" />
      </div>
      <div className="auth-right">
        <div className="auth-card">
          {requireOTP ? (
            <>
              <h2>Verify Your Email</h2>
              <p>Enter the 6-digit code sent to {email}</p>
              <form onSubmit={handleVerifyOTP}>
                <input 
                  type="text" 
                  placeholder="6-digit OTP" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  maxLength={6}
                  required 
                  style={{ textAlign: "center", fontSize: "24px", letterSpacing: "5px", marginBottom: "20px", display: "block", width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                />
                <button type="submit" disabled={loading}>
                  {loading ? "Verifying..." : "Verify & Login"}
                </button>
              </form>
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <span 
                  onClick={() => setRequireOTP(false)} 
                  style={{ color: "#64748b", fontSize: "14px", cursor: "pointer", fontWeight: "600" }}
                >
                  ← Back to Login
                </span>
              </div>
            </>
          ) : !isForgotPassword ? (
            <>
              <h2>Job Seeker Login</h2>
              <p>Find your next dream job on ResuMatch</p>
              <form onSubmit={handleLogin}>
                <input id="email" name="email" type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input id="password" name="password" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                
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
                Don't have a job seeker account?
                <a href="/user/signup"> Sign Up</a>
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
