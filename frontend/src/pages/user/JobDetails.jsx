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
      <div className="admin-card" style={{ padding: 40 }}>
        <h3>Job not found</h3>
        {debugInfo.error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{debugInfo.error}</div>}
        <pre style={{ background: '#f8fafc', padding: 12, borderRadius: 8, maxHeight: 300, overflow: 'auto' }}>{JSON.stringify(debugInfo.raw || {}, null, 2)}</pre>
        <div style={{ marginTop: 12 }}>
          <button onClick={() => navigate('/user/recommendations')}>Back to jobs</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-page">
      <Toast message={toast?.message} type={toast?.type} onClose={closeToast} />

      <div className="admin-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0 }}>{job.title}</h1>
            <div style={{ color: '#64748b', marginTop: 6 }}>{job.employer?.companyName || 'Unknown Company'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 800, fontSize: 20 }}>{job.similarityScore}%</div>
            <div style={{ color: '#94a3b8' }}>Match Score</div>
          </div>
        </div>

            <div style={{ marginTop: 20, display: 'flex', gap: 20 }}>
          <div style={{ flex: 2 }}>
            <h3 style={{ marginTop: 0 }}>Job Description</h3>
            <p style={{ color: '#475569', lineHeight: 1.6 }}>{job.description}</p>

            {job.skillsRequired && job.skillsRequired.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h4>Skills Required</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {job.skillsRequired.map((s, i) => (
                    <span key={i} style={{ background: '#f1f5f9', padding: '6px 10px', borderRadius: 8 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 20 }}>
              <h4>Match Breakdown</h4>
              <pre style={{ whiteSpace: 'pre-wrap', background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                {JSON.stringify(job.matchDetails || job.matchBreakdown || {}, null, 2)}
              </pre>
            </div>
            <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
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
                style={{ padding: '10px 16px', background: applying ? '#cbd5e1' : '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: applying ? 'not-allowed' : 'pointer' }}
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
                style={{ padding: '10px 16px', background: saved ? '#f1f5f9' : '#f8fafc', color: saved ? '#64748b' : '#475569', border: '1px solid #e2e8f0', borderRadius: 8, cursor: saving || saved ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Saving...' : saved ? 'Saved' : 'Save Job'}
              </button>
            </div>
          </div>

          <div style={{ width: 280 }}>
            <div style={{ background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Details</div>
              <div style={{ color: '#64748b', fontSize: 14 }}>📍 {job.location || job.city || 'Remote'}</div>
              {job.salary && <div style={{ color: '#059669', marginTop: 8 }}>💰 {formatSalary(job.salary)}</div>}
              <div style={{ marginTop: 8, color: '#64748b' }}>{job.employmentType || 'Full-time'}</div>
              <div style={{ marginTop: 8, color: '#64748b' }}>Posted: {new Date(job.createdAt).toLocaleDateString()}</div>

              <div style={{ marginTop: 16 }}>
                <button onClick={() => navigate('/user/recommendations')} style={{ width: '100%', padding: 12, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8 }}>Back</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
