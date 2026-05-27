import React, { useState, useEffect } from "react";
import API from "../api/axios";
import "./ResumeDownload.css";

/**
 * Resume Download Component
 * Allows users to preview and download resumes in multiple country formats
 */
const ResumeDownload = ({ profileData, resumeData }) => {
  const [formats, setFormats] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState("US");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const user = profileData || {};
  const resume = resumeData || {
    skills: [],
    workExperiences: [],
    educationHistory: [],
    languages: []
  };

  const formatDate = (date, locale = 'en-US', options = { year: 'numeric', month: 'short' }) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString(locale, options);
    } catch {
      return '';
    }
  };

  const buildSection = (title, content) => {
    if (!content) return '';
    return `<div class="section"><div class="section-title">${title}</div>${content}</div>`;
  };

  const generateClientResumeHTML = (formatCode) => {
    const fullName = user.name || 'Your Name';
    const contact = [user.phone, user.email, user.city].filter(Boolean).join(' • ');
    const headline = user.headline || user.bio || '';
    const bio = user.bio || '';
    const skillsHtml = resume.skills.length ? `<div class="skills">${resume.skills.map(skill => `<span class="skill-pill">${skill}</span>`).join('')}</div>` : '';
    const languagesHtml = resume.languages.length ? `<div class="skills">${resume.languages.join(', ')}</div>` : '';
    const experiencesHtml = resume.workExperiences.length ? resume.workExperiences.map(exp => `
      <div class="item">
        <div class="item-header"><div class="item-title">${exp.position || ''}</div><div class="item-date">${formatDate(exp.startDate)} - ${exp.endDate ? formatDate(exp.endDate) : 'Present'}</div></div>
        <div class="item-subtitle">${exp.company || ''}</div>
        ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
      </div>
    `).join('') : '';
    const educationHtml = resume.educationHistory.length ? resume.educationHistory.map(edu => `
      <div class="item">
        <div class="item-header"><div class="item-title">${edu.degree || ''}</div><div class="item-date">${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}</div></div>
        <div class="item-subtitle">${edu.institution || ''}${edu.fieldOfStudy ? ` • ${edu.fieldOfStudy}` : ''}</div>
      </div>
    `).join('') : '';

    let sections = '';
    let title = 'Resume';
    let subtitle = 'Modern resume format';
    let extraStyle = '';

    switch (formatCode) {
      case 'UK':
        title = 'UK / Europass CV';
        subtitle = 'Formal European-style curriculum vitae';
        sections += buildSection('Personal Statement', bio);
        sections += buildSection('Work Experience', experiencesHtml);
        sections += buildSection('Education & Qualifications', educationHtml);
        sections += buildSection('Key Skills', skillsHtml);
        sections += buildSection('Languages', languagesHtml);
        extraStyle = '.header { border-color: #003366; } .section-title { background: #003366; color: #fff; }';
        break;
      case 'INDIA':
        title = 'Indian Resume';
        subtitle = 'Comprehensive Indian resume format';
        sections += buildSection('Career Objective', headline);
        sections += buildSection('Professional Summary', bio);
        sections += buildSection('Professional Experience', experiencesHtml);
        sections += buildSection('Education', educationHtml);
        sections += buildSection('Technical Skills', skillsHtml);
        sections += buildSection('Languages', languagesHtml);
        extraStyle = '.header { border-color: #000080; } .section-title { color: #000080; border-bottom: 1px solid #000080; }';
        break;
      case 'CANADA':
        title = 'Canadian Resume';
        subtitle = 'ATS-friendly Canadian resume';
        sections += buildSection('Profile', bio || headline);
        sections += buildSection('Professional Experience', experiencesHtml);
        sections += buildSection('Education', educationHtml);
        sections += buildSection('Skills', skillsHtml);
        sections += buildSection('Languages', languagesHtml);
        extraStyle = '.header { border-color: #4a90e2; } .section-title { background: #e8e8e8; }';
        break;
      case 'AUSTRALIA':
        title = 'Australian Resume';
        subtitle = 'Professional Australian format';
        sections += buildSection('Executive Summary', headline || bio);
        sections += buildSection('Employment History', experiencesHtml);
        sections += buildSection('Qualifications', educationHtml);
        sections += buildSection('Key Competencies', skillsHtml);
        sections += buildSection('Languages', languagesHtml);
        extraStyle = '.header { border-color: #003d7a; } .section-title { color: #003d7a; border-bottom: 1px solid #003d7a; }';
        break;
      default:
        title = 'US Resume';
        subtitle = 'ATS-friendly US resume';
        sections += buildSection('Professional Summary', bio);
        sections += buildSection('Experience', experiencesHtml);
        sections += buildSection('Education', educationHtml);
        sections += buildSection('Skills', skillsHtml);
        sections += buildSection('Languages', languagesHtml);
        extraStyle = '.header { border-color: #000; } .section-title { border-bottom: 1px solid #000; }';
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${fullName} - ${title}</title>
        <style>
          body { font-family: Arial, sans-serif; background: #ffffff; color: #222; margin: 0; padding: 20px; }
          .container { max-width: 900px; margin: 0 auto; }
          .header { padding-bottom: 16px; margin-bottom: 16px; border-bottom: 2px solid #000; }
          .header-title { font-size: 24px; font-weight: bold; margin-bottom: 6px; }
          .header-subtitle { color: #555; font-size: 14px; margin-bottom: 8px; }
          .header-contact { color: #555; font-size: 12px; }
          .section { margin-bottom: 18px; }
          .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; }
          .item { margin-bottom: 12px; }
          .item-header { display: flex; justify-content: space-between; flex-wrap: wrap; }
          .item-title { font-weight: bold; font-size: 13px; }
          .item-subtitle { font-size: 12px; color: #444; }
          .item-date { font-size: 12px; color: #666; }
          .item-description { margin-top: 6px; font-size: 12px; color: #333; line-height: 1.4; }
          .skills { display: flex; flex-wrap: wrap; gap: 8px; }
          .skill-pill { background: #eef2ff; color: #1e40af; padding: 6px 10px; border-radius: 999px; font-size: 11px; }
          ${extraStyle}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-title">${fullName}</div>
            <div class="header-subtitle">${title} • ${subtitle}</div>
            <div class="header-contact">${contact}</div>
          </div>
          ${sections}
        </div>
      </body>
      </html>
    `;
  };

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
      setPreviewLoading(true);
      setError("");
      const html = generateClientResumeHTML(selectedFormat);
      setPreviewContent(html);
      setPreviewMode(true);
    } catch (err) {
      setError("Failed to preview resume");
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const downloadHtmlToPdf = async (htmlString, fileName) => {
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.top = "-9999px";
    wrapper.style.left = "-9999px";
    wrapper.style.width = "800px";
    wrapper.style.padding = "20px";
    wrapper.innerHTML = htmlString;
    document.body.appendChild(wrapper);

    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).jsPDF;

    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff"
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= 297;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }

    document.body.removeChild(wrapper);
    pdf.save(fileName);
  };

  const handleDownload = async () => {
    try {
      setDownloadLoading(true);
      setError("");

      const html = generateClientResumeHTML(selectedFormat);
      await downloadHtmlToPdf(html, `Resume_${selectedFormat}.pdf`);

      setSuccess(`Resume downloaded in ${selectedFormat} format!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to download resume");
      console.error(err);
    } finally {
      setDownloadLoading(false);
    }
  };

  const downloadPDF = async () => {
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
            disabled={previewLoading}
          >
            {previewLoading ? "Loading..." : "👁️ Preview Resume"}
          </button>
          <button
            className="btn btn-download"
            onClick={handleDownload}
            disabled={downloadLoading}
          >
            {downloadLoading ? "Downloading..." : "📄 Download PDF"}
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
