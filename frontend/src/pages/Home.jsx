import { useNavigate } from "react-router-dom";
import "./home.css";

export default function Home() {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const dummyJobs = [
    {
      title: "AI Product Manager",
      company: "Nimbus Labs",
      location: "Kathmandu, Nepal",
      salary: "Rs. 120,000 - 160,000 NPR",
      employmentType: "Full-time",
      description: "Lead product strategy for intelligent hiring tools, define roadmap, and translate user needs into AI-driven features.",
      match: "98% Match",
    },
    {
      title: "Senior Frontend Engineer",
      company: "Talinuze",
      location: "Remote",
      salary: "Rs. 85,000 - 110,000 NPR",
      employmentType: "Contract",
      description: "Build polished React interfaces, optimize performance, and collaborate with designers to deliver seamless candidate experiences.",
      match: "92% Match",
    },
    {
      title: "Recruitment Operations Lead",
      company: "BridgeWork",
      location: "Lalitpur, Nepal",
      salary: "Rs. 75,000 - 95,000 NPR",
      employmentType: "Part-time",
      description: "Manage hiring workflows, improve screening efficiency, and support hiring teams with AI-powered candidate matching.",
      match: "89% Match",
    },
    {
      title: "Talent Acquisition Specialist",
      company: "Horizon Talent",
      location: "Pokhara, Nepal",
      salary: "Rs. 90,000 - 120,000 NPR",
      employmentType: "Full-time",
      description: "Source and screen top candidates, streamline recruitment processes, and partner with hiring managers for fast results.",
      match: "94% Match",
    },
    {
      title: "UX Researcher",
      company: "BluePeak",
      location: "Bhaktapur, Nepal",
      salary: "Rs. 70,000 - 90,000 NPR",
      employmentType: "Freelance",
      description: "Conduct user research, validate candidate experience flows, and turn hiring insights into stronger product design.",
      match: "87% Match",
    },
    {
      title: "Data Engineer",
      company: "Vertex AI",
      location: "Kathmandu, Nepal",
      salary: "Rs. 110,000 - 145,000 NPR",
      employmentType: "Full-time",
      description: "Build data pipelines for hiring analytics, maintain candidate matching datasets, and support AI model performance.",
      match: "96% Match",
    },
  ];

  return (
    <div className="landing-page">
      {/* =============== NAVBAR =============== */}
      <nav className="navbar">
        <div className="nav-logo">
          <span className="logo-icon">✨</span>
          <span className="logo-text">ResuMatch</span>
        </div>
        <div className="nav-actions">
          <button className="nav-login" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Home</button>
          <button className="nav-login" onClick={() => scrollToSection("features")}>Features</button>
          <button className="nav-login" onClick={() => scrollToSection("jobs")}>Jobs</button>
          <div className="nav-dropdown">
            <button className="nav-login nav-dropdown-toggle">Login ▾</button>
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={() => navigate("/jobseeker/login")}>Job Seeker Login</button>
              <button className="dropdown-item" onClick={() => navigate("/employer/login")}>Employer Login</button>
            </div>
          </div>
          <button className="nav-signup" onClick={() => navigate("/jobseeker/signup")}>Sign Up</button>
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
            <button className="btn-primary" onClick={() => navigate("/jobseeker/signup") }>
              Find Your Dream Job
            </button>
            <button className="btn-secondary" onClick={() => navigate("/employer/signup") }>
              Post a Job / Hire
            </button>
            <button className="btn-secondary" onClick={() => navigate("/jobseeker/login")}
              style={{ minWidth: 180 }}
            >
              Job Seeker Login
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
      <section id="features" className="features-section">
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
      <section className="get-started-section" style={{ paddingBottom: 0 }}>
        <h2 className="section-title" style={{ marginBottom: "20px" }}>Get Started Today 🚀</h2>
        <p style={{ color: "#475569", fontSize: "17px", maxWidth: "760px", margin: "0 auto 40px", textAlign: "center" }}>
          Create your profile and discover jobs tailored to your skills.
        </p>
        <div className="get-started-grid">
          {/* Job Seeker Card */}
          <div className="get-started-card job-seeker-card">
            <div className="card-icon">👨‍💼</div>
            <h3>Job Seeker</h3>
            <p>Find your perfect job match powered by AI</p>
            <div className="button-group">
              <button 
                className="card-btn primary-btn"
                onClick={() => navigate("/jobseeker/signup")}
              >
                Sign Up Now
              </button>
              <button 
                className="card-btn secondary-btn"
                onClick={() => navigate("/jobseeker/login")}
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

      {/* =============== JOBS SECTION =============== */}
      <section id="jobs" className="jobs-preview-section" style={{ padding: "100px 5%", background: "#ffffff" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px", marginBottom: "40px" }}>
            <div>
              <p style={{ margin: 0, color: "#2563eb", fontWeight: 700, fontSize: "14px", letterSpacing: "0.15em" }}>
                Live job previews
              </p>
              <h2 style={{ margin: "10px 0", fontSize: "36px", color: "#0f172a", fontWeight: 800 }}>
                Jobs you can discover on ResuMatch
              </h2>
              <p style={{ color: "#475569", fontSize: "16px", maxWidth: "640px", lineHeight: 1.8 }}>
                These sample listings show how opportunities appear on the platform, including match score, salary, location, and company details.
              </p>
            </div>
            <button
              onClick={() => navigate("/jobseeker/signup")}
              style={{ padding: "14px 26px", background: "#2563eb", color: "white", borderRadius: "14px", border: "none", cursor: "pointer", fontWeight: 700 }}
            >
              Create your profile
            </button>
          </div>

          <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
            {dummyJobs.map((job, index) => (
              <div key={index} style={{ background: "#f8fafc", borderRadius: "24px", padding: "28px", border: "1px solid #e2e8f0", boxShadow: "0 18px 40px rgba(15, 23, 42, 0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                  <div>
                    <p style={{ margin: 0, color: "#334155", fontWeight: 700, fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                      {job.employmentType}
                    </p>
                    <h3 style={{ margin: "10px 0 8px", fontSize: "24px", color: "#0f172a" }}>{job.title}</h3>
                    <p style={{ margin: 0, color: "#475569", fontSize: "15px" }}>{job.company}</p>
                  </div>
                  <span style={{ background: "#dcfce7", color: "#166534", padding: "10px 16px", borderRadius: "999px", fontWeight: 700, fontSize: "13px" }}>
                    {job.match}
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", margin: "18px 0" }}>
                  <span style={{ color: "#475569", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    📍 {job.location}
                  </span>
                  <span style={{ color: "#475569", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    💰 {job.salary}
                  </span>
                </div>
                <p style={{ margin: 0, color: "#64748b", lineHeight: 1.8, fontSize: "15px" }}>
                  {job.description}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginTop: "24px" }}>
                  <button
                    onClick={() => navigate("/jobseeker/login")}
                    style={{ padding: "12px 18px", background: "#2563eb", color: "white", border: "none", borderRadius: "14px", cursor: "pointer", fontWeight: 700 }}
                  >
                    Login to apply
                  </button>
                  <span style={{ color: "#94a3b8", fontSize: "13px" }}>Posted 2 days ago</span>
                </div>
              </div>
            ))}
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