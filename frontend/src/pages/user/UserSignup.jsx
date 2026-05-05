import { useState } from "react";
import API from "../../api/axios";
import "../auth.css";
import { useNavigate } from "react-router-dom";

const PASSWORD_HINT = "Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.";
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

export default function UserSignup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState(null);
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
      const res = await API.post("/auth/user/register", {
        name, email, password
      });
      if (res.data.requireOTP) {
        setOtpSent(true);
        setUserId(res.data.userId);
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
      await API.post("/auth/user/register", { name, email, password });
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
      const res = await API.post("/auth/user/verify-otp", {
        userId, otp
      });
      alert(res.data.msg || "Email verified! You can now log in.");
      navigate("/user/login");
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
        <img src="/signup.png" alt="user signup" className="auth-image" />
      </div>
      <div className="auth-right">
        <div className="auth-card">
          {!otpSent ? (
            <>
              <h2>Create Job Seeker Account</h2>
              <p>Kickstart your career with ResuMatch</p>
              <form onSubmit={handleSignup}>
                <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
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
                  {isLoading ? "Sending OTP..." : "Sign Up"}
                </button>
              </form>
              <p className="auth-link">
                Already have an account?
                <a href="/user/login"> Login</a>
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
