import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Toast from "../../components/common/Toast";
import { useToast } from "../../hooks/useToast";
import { formatSalary } from "../../utils/formatSalary";
import "../admin.css";

export default function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ raw: null, error: null });
  const { showToast, toast, closeToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchJob = async () => {
      if (mounted) setLoading(true);
      try {
        const res = await API.get(`/user/jobs/${id}`);
        console.log('Job details response:', res.data);
        if (mounted) {
          setJob(res.data.job || null);
          setDebugInfo({ raw: res.data, error: null });
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          const msg = err.response?.data?.msg || err.message || "Failed to load job details";
          try { showToast(msg, "error"); } catch(e){}
          setJob(null);
          setDebugInfo({ raw: err.response?.data || null, error: msg });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchJob();
    return () => { mounted = false; };
    // run only on mount/id change
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!job) return (
    <div className="admin-page">
      <div className="admin-card">
        <h3>Job not found</h3>
        {debugInfo.error && <div className="job-debug-error">{debugInfo.error}</div>}
        <pre className="job-debug-box">{JSON.stringify(debugInfo.raw || {}, null, 2)}</pre>
        <div className="job-back-container">
          <button onClick={() => navigate('/user/recommendations')}>Back to jobs</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-page">
      <Toast message={toast?.message} type={toast?.type} onClose={closeToast} />

      <div className="admin-card">
        <div className="job-details-row">
          <div>
            <h1 className="job-title">{job.title}</h1>
            <div className="job-subtitle">{job.employer?.companyName || 'Unknown Company'}</div>
          </div>
          <div className="job-score">
            <div className="job-score-value">{job.similarityScore}%</div>
            <div className="job-score-label">Match Score</div>
          </div>
        </div>

        <div className="job-details-row-responsive">
          <div className="job-details-column">
            <h3 className="job-section-title">Job Description</h3>
            <p className="job-description-text">{job.description}</p>

            {job.skillsRequired && job.skillsRequired.length > 0 && (
              <div className="job-section">
                <h4>Skills Required</h4>
                <div className="job-skills-wrap">
                  {job.skillsRequired.map((s, i) => (
                    <span key={i} className="job-skill-pill">{s}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="job-section">
              <h4>Match Breakdown</h4>
              <pre className="job-debug-box">
                {JSON.stringify(job.matchDetails || job.matchBreakdown || {}, null, 2)}
              </pre>
            </div>
            <div className="job-actions">
              <button
                onClick={async () => {
                  if (applying) return;
                  setApplying(true);
                  try {
                    await API.post('/user/apply', { jobId: job._id, employerId: job.employer?._id });
                    showToast('✓ Successfully applied for this job!', 'success');
                  } catch (err) {
                    showToast(err.response?.data?.msg || 'Failed to apply', 'error');
                  } finally {
                    setApplying(false);
                  }
                }}
                disabled={applying}
                className="job-primary-btn"
              >
                {applying ? 'Applying...' : 'Apply Now'}
              </button>

              <button
                onClick={async () => {
                  if (saving) return;
                  setSaving(true);
                  try {
                    await API.post('/user/jobs/save', { jobId: job._id });
                    setSaved(true);
                    showToast('✓ Job saved', 'success');
                  } catch (err) {
                    showToast(err.response?.data?.msg || 'Failed to save job', 'error');
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving || saved}
                className="job-secondary-btn"
              >
                {saving ? 'Saving...' : saved ? 'Saved' : 'Save Job'}
              </button>
            </div>
          </div>

          <div className="job-details-aside">
            <div className="job-info-card">
              <div className="job-info-title">Details</div>
              <div className="job-info-item">📍 {job.location || job.city || 'Remote'}</div>
              {job.salary && <div className="job-info-item">💰 {formatSalary(job.salary)}</div>}
              <div className="job-info-item">{job.employmentType || 'Full-time'}</div>
              <div className="job-info-item">Posted: {new Date(job.createdAt).toLocaleDateString()}</div>

              <div className="job-action-row">
                <button onClick={() => navigate('/user/recommendations')} className="job-back-btn">Back</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
