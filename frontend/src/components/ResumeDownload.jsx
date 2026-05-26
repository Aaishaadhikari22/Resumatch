import React, { useState, useEffect } from "react";
import API from "../api/axios";
import "./ResumeDownload.css";

/**
 * Resume Download Component
 * Allows users to preview and download resumes in multiple country formats
 */
const ResumeDownload = () => {
  const [formats, setFormats] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState("US");
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch available formats
  useEffect(() => {
    fetchFormats();
  }, []);

  const fetchFormats = async () => {
    try {
      const response = await API.get("/resume/formats/available");
      setFormats(response.data.formats);
      if (response.data.formats.length > 0) {
        setSelectedFormat(response.data.formats[0].code);
      }
    } catch (err) {
      setError("Failed to load resume formats");
      console.error(err);
    }
  };

  const handlePreview = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await API.get(`/resume/preview/${selectedFormat}`);
      setPreviewContent(response.data);
      setPreviewMode(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to preview resume");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await API.get(`/resume/download/${selectedFormat}`, {
        responseType: 'blob'
      });

      // Create download link for PDF
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Resume_${selectedFormat}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess(`Resume downloaded in ${selectedFormat} format!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download resume");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    // Redirect to main download since it now generates PDF
    await handleDownload();
  };

  const closePreview = () => {
    setPreviewMode(false);
    setPreviewContent("");
  };

  if (!formats.length) {
    return (
      <div className="resume-download-container">
        <p>Loading resume formats...</p>
      </div>
    );
  }

  return (
    <div className="resume-download-container">
      <div className="resume-download-card">
        <h2>Download Your Resume</h2>
        <p className="subtitle">
          Select your preferred country format and download your resume
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Format Selection */}
        <div className="format-section">
          <h3>Select Resume Format</h3>
          <div className="formats-grid">
            {formats.map((format) => (
              <div
                key={format.code}
                className={`format-card ${selectedFormat === format.code ? "active" : ""}`}
                onClick={() => setSelectedFormat(format.code)}
              >
                <div className="format-icon">
                  {format.code === "US" && "🇺🇸"}
                  {format.code === "UK" && "🇬🇧"}
                  {format.code === "INDIA" && "🇮🇳"}
                  {format.code === "CANADA" && "🇨🇦"}
                  {format.code === "AUSTRALIA" && "🇦🇺"}
                </div>
                <div className="format-name">{format.name}</div>
                <div className="format-country">{format.country}</div>
                <div className="format-desc">{format.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Format Details */}
        {formats.find(f => f.code === selectedFormat) && (
          <div className="format-details">
            <h4>Format Details</h4>
            <p>
              <strong>Name:</strong> {formats.find(f => f.code === selectedFormat).name}
            </p>
            <p>
              <strong>Country:</strong> {formats.find(f => f.code === selectedFormat).country}
            </p>
            <p>
              <strong>Description:</strong> {formats.find(f => f.code === selectedFormat).description}
            </p>
            <p>
              <strong>Sections:</strong> {formats.find(f => f.code === selectedFormat).sections.join(", ")}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="btn btn-preview"
            onClick={handlePreview}
            disabled={loading}
          >
            {loading ? "Loading..." : "👁️ Preview Resume"}
          </button>
          <button
            className="btn btn-download"
            onClick={handleDownload}
            disabled={loading}
          >
            {loading ? "Downloading..." : "📄 Download PDF"}
          </button>
        </div>

        {/* Format Comparison */}
        <div className="format-comparison">
          <h4>Quick Comparison</h4>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Format</th>
                <th>Best For</th>
                <th>Style</th>
                <th>Focus</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>🇺🇸 US</td>
                <td>US Job Market</td>
                <td>Modern, Compact</td>
                <td>Skills & Achievements</td>
              </tr>
              <tr>
                <td>🇬🇧 UK/Europe</td>
                <td>European Jobs</td>
                <td>Formal, Detailed</td>
                <td>Experience & Education</td>
              </tr>
              <tr>
                <td>🇮🇳 India</td>
                <td>Indian Market</td>
                <td>Formal, Comprehensive</td>
                <td>Experience & Objectives</td>
              </tr>
              <tr>
                <td>🇨🇦 Canada</td>
                <td>Canadian Jobs</td>
                <td>Modern, ATS-friendly</td>
                <td>Accomplishments</td>
              </tr>
              <tr>
                <td>🇦🇺 Australia</td>
                <td>Australian Market</td>
                <td>Modern, Professional</td>
                <td>Key Competencies</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tips Section */}
        <div className="tips-section">
          <h4>💡 Tips</h4>
          <ul>
            <li>Different formats highlight different aspects of your profile</li>
            <li>US & Canada formats are ATS-friendly for automated screening</li>
            <li>UK/Europe format is ideal for European job applications</li>
            <li>Indian format includes career objectives commonly used in India</li>
            <li>Australian format emphasizes key competencies and metrics</li>
            <li>Always check job posting requirements before applying</li>
          </ul>
        </div>
      </div>

      {/* Preview Modal */}
      {previewMode && (
        <div className="preview-modal">
          <div className="preview-container">
            <div className="preview-header">
              <h3>Preview - {selectedFormat} Format</h3>
              <button className="close-btn" onClick={closePreview}>✕</button>
            </div>
            <div
              className="preview-content"
              dangerouslySetInnerHTML={{ __html: previewContent }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeDownload;
