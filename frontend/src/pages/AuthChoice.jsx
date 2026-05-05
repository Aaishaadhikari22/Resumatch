import { useNavigate } from "react-router-dom";
import "./home.css";

export default function AuthChoice() {
  const navigate = useNavigate();

  return (
    <div className="landing-page auth-choice-page">
      <nav className="navbar">
        <div className="nav-logo">
          <span className="logo-icon">✨</span>
          <span className="logo-text">ResuMatch</span>
        </div>
        <div className="nav-actions">
          <button className="nav-login" onClick={() => navigate("/")}>Home</button>
          <button className="nav-login" onClick={() => navigate("/auth")}>Auth Center</button>
          <button className="nav-signup" onClick={() => navigate("/auth")}>Login / Sign Up</button>
        </div>
      </nav>

      <section className="auth-choice-hero">
        <div className="hero-content">
          <div className="badge">🔐 Authentication Center</div>
          <h1 className="hero-title">Login or Sign Up for ResuMatch</h1>
          <p className="hero-subtitle">
            Choose the action that fits you best, then pick the portal that matches your role.
          </p>
        </div>

        <div className="auth-choice-grid">
          <div className="auth-choice-card login-card">
            <h3>Login</h3>
            <p>Already have a ResuMatch account? Sign in to access the admin portal.</p>
            <button className="card-btn primary-btn" onClick={() => navigate("/admin/login")}>Login</button>
          </div>

          <div className="auth-choice-card signup-card">
            <h3>Sign Up</h3>
            <p>Create an admin account and access the main dashboard.</p>
            <button className="card-btn primary-btn" onClick={() => navigate("/admin/signup")}>Sign Up</button>
          </div>
        </div>
      </section>
    </div>
  );
}
