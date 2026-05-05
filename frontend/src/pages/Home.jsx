import { useNavigate } from "react-router-dom";
import "./home.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* =============== NAVBAR =============== */}
      <nav className="navbar">
        <div className="nav-logo">
          <span className="logo-icon">✨</span>
          <span className="logo-text">ResuMatch</span>
        </div>
        <div className="nav-actions">
          <button className="nav-signup" style={{ marginRight: '10px' }} onClick={() => navigate("/auth")}>Sign Up</button>
          <button className="nav-login" style={{ marginRight: '10px' }} onClick={() => navigate("/auth")}>Login</button>
          <button className="nav-login" style={{ marginRight: '10px' }} onClick={() => navigate("/user/login")}>Job Seeker Login</button>
          <button className="nav-login" style={{ marginRight: '10px' }} onClick={() => navigate("/employer/login")}>Employer Login</button>
        </div>
      </nav>

      {/* =============== HERO SECTION =============== */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="badge">🚀 The Future of Recruitment</div>
          <h1 className="hero-title">
            Hire Smarter with <span className="highlight">AI Matching</span>
          </h1>
          <p className="hero-subtitle">
            Say goodbye to manual resume screening. ResuMatch uses advanced AI algorithms 
            to automatically parse, rank, and match the perfect candidates to your open roles 
            in milliseconds.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate("/user/signup")}>
              Find Your Dream Job
            </button>
            <button className="btn-secondary" onClick={() => navigate("/employer/signup")}>
              Post a Job / Hire
            </button>
            <button className="btn-secondary" onClick={() => navigate("/auth")}
              style={{ minWidth: 180 }}
            >
              Login / Signup
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="glass-panel">
            <div className="mock-header">
              <div className="dots">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
              </div>
            </div>
            <div className="mock-body">
              <div className="mock-card">
                <div className="avatar placeholder"></div>
                <div className="mock-info">
                  <div className="mock-line wide"></div>
                  <div className="mock-line short"></div>
                </div>
                <div className="match-score">98% Match</div>
              </div>
              <div className="mock-card thin">
                <div className="avatar placeholder"></div>
                <div className="mock-info">
                  <div className="mock-line wide"></div>
                  <div className="mock-line short"></div>
                </div>
                <div className="match-score okay">85% Match</div>
              </div>
              <div className="mock-card thin">
                <div className="avatar placeholder"></div>
                <div className="mock-info">
                  <div className="mock-line wide"></div>
                  <div className="mock-line short"></div>
                </div>
                <div className="match-score low">62% Match</div>
              </div>
            </div>
          </div>
          {/* Decorative floating blur elements */}
          <div className="glow-orb blue"></div>
          <div className="glow-orb purple"></div>
        </div>
      </section>

      {/* =============== FEATURES SECTION =============== */}
      <section className="features-section">
        <h2 className="section-title">Why Choose ResuMatch?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>AI-Driven Accuracy</h3>
            <p>Our machine learning models deeply understand context, skills, and experience beyond just keyword matching.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Lightning Fast</h3>
            <p>Process thousands of resumes in seconds. Slash your time-to-hire by 80% and never miss top talent.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Deep Analytics</h3>
            <p>Get comprehensive overviews of your hiring pipeline, candidate demographics, and job performance.</p>
          </div>
        </div>
      </section>

      {/* =============== GET STARTED SECTION =============== */}
      <section className="get-started-section">
        <h2 className="section-title" style={{ marginBottom: "50px" }}>Get Started Today 🚀</h2>
        <div className="get-started-grid">
          {/* Job Seeker Card */}
          <div className="get-started-card job-seeker-card">
            <div className="card-icon">👨‍💼</div>
            <h3>Job Seeker</h3>
            <p>Find your perfect job match powered by AI</p>
            <div className="button-group">
              <button 
                className="card-btn primary-btn"
                onClick={() => navigate("/user/signup")}
              >
                Sign Up Now
              </button>
              <button 
                className="card-btn secondary-btn"
                onClick={() => navigate("/user/login")}
              >
                Already have an account? Login
              </button>
            </div>
          </div>

          {/* Employer Card */}
          <div className="get-started-card employer-card">
            <div className="card-icon">🏢</div>
            <h3>Employer</h3>
            <p>Find top talent instantly with AI matching</p>
            <div className="button-group">
              <button 
                className="card-btn primary-btn"
                onClick={() => navigate("/employer/signup")}
              >
                Sign Up Now
              </button>
              <button 
                className="card-btn secondary-btn"
                onClick={() => navigate("/employer/login")}
              >
                Already have an account? Login
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =============== FOOTER =============== */}
      <footer className="footer">
        <div className="footer-content">
          <p>© 2026 ResuMatch Inc. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}