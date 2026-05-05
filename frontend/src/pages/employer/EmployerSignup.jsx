import { useState } from "react";
import API from "../../api/axios";
import "../auth.css";
import { useNavigate } from "react-router-dom";

const PASSWORD_HINT = "Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.";
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

export default function EmployerSignup() {
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [employerId, setEmployerId] = useState(null);
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (value) => {
    if (!value) return PASSWORD_HINT;
    return PASSWORD_REGEX.test(value) ? "" : PASSWORD_HINT;
  };

  const handleSignup = async (e) => {
    if (e) e.preventDefault();
    const error = validatePassword(password);
    if (error) {
      setPasswordError(error);
      return;
    }
    setIsLoading(true);
    try {
      const res = await API.post("/auth/employer/register", {
        name, companyName, email, password
      });
      if (res.data.requireOTP) {
        setOtpSent(true);
        setEmployerId(res.data.employerId);
        if (e) alert("Verification code sent to your email!");
      }
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.msg || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      await API.post("/auth/employer/register", { name, companyName, email, password });
      alert("A new verification code has been sent!");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.msg || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await API.post("/auth/employer/verify-otp", {
        employerId, otp
      });
      alert(res.data.msg || "Email verified! You can now log in.");
      navigate("/employer/login");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.msg || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <img src="/login.png" alt="employer signup" className="auth-image" />
      </div>
      <div className="auth-right">
        <div className="auth-card">
          {!otpSent ? (
            <>
              <h2>Employer Sign Up</h2>
              <p>Start hiring top talent with ResuMatch AI</p>
              <form onSubmit={handleSignup}>
                <input type="text" placeholder="Your Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
                <input type="text" placeholder="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(validatePassword(e.target.value));
                  }}
                  required
                />
                {passwordError && <div className="auth-error">{passwordError}</div>}
                <button type="submit" disabled={isLoading}>
                  {isLoading ? "Sending OTP..." : "Create Account"}
                </button>
              </form>
              <p className="auth-link">
                Already have an employer account?
                <a href="/employer/login"> Login</a>
              </p>
            </>
          ) : (
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
                  style={{ textAlign: "center", fontSize: "24px", letterSpacing: "5px" }}
                />
                <button type="submit" disabled={isLoading}>
                  {isLoading ? "Verifying..." : "Verify & Login"}
                </button>
              </form>
              <p className="auth-link">
                Didn't receive the code? 
                <button type="button" onClick={handleResendOTP} disabled={isLoading} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline', padding: 0, marginLeft: '5px' }}>
                  Resend OTP
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
