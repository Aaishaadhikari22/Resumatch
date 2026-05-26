/**
 * Resume Generator Service
 * Generates formatted resumes in different country formats
 * Converts to PDF for download
 */

import { resumeFormats } from "./resumeFormats.js";

/**
 * Generate formatted resume HTML based on country format
 */
export const generateResumeHTML = (userData, resumeData, formatCode) => {
  const format = resumeFormats[formatCode];
  if (!format) {
    throw new Error(`Invalid format: ${formatCode}`);
  }

  switch (formatCode) {
    case 'US':
      return generateUSFormat(userData, resumeData);
    case 'UK':
      return generateUKFormat(userData, resumeData);
    case 'INDIA':
      return generateIndianFormat(userData, resumeData);
    case 'CANADA':
      return generateCanadianFormat(userData, resumeData);
    case 'AUSTRALIA':
      return generateAustralianFormat(userData, resumeData);
    default:
      return generateUSFormat(userData, resumeData);
  }
};

/**
 * US Format: Clean, ATS-friendly resume
 */
const generateUSFormat = (user, resume) => {
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${user.name} - Resume</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; line-height: 1.3; color: #333; }
        .container { max-width: 8.5in; margin: 0 auto; padding: 0.4in; }
        .header { text-align: center; margin-bottom: 0.15in; border-bottom: 2px solid #000; padding-bottom: 0.08in; }
        .name { font-size: 16pt; font-weight: bold; }
        .contact { font-size: 8.5pt; margin-top: 0.03in; }
        .section { margin-top: 0.1in; page-break-inside: avoid; }
        .section-title { font-size: 10pt; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 0.03in; margin-bottom: 0.06in; }
        .item { margin-bottom: 0.1in; page-break-inside: avoid; }
        .item-header { display: flex; justify-content: space-between; }
        .item-title { font-weight: bold; font-size: 9.5pt; }
        .item-subtitle { font-style: italic; font-size: 8.5pt; color: #555; }
        .item-date { font-size: 8.5pt; color: #666; }
        .item-description { font-size: 8.5pt; margin-top: 0.03in; }
        .skills { font-size: 8.5pt; }
        .skills-list { display: inline; }
        ul { margin-left: 0.15in; font-size: 8.5pt; }
        li { margin-bottom: 0.02in; }
        .two-column { display: flex; gap: 0.2in; }
        .column { flex: 1; }
        @media print {
          body { margin: 0; padding: 0; }
          .container { max-width: 100%; padding: 0.3in; }
          .section { page-break-inside: avoid; }
          .item { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="name">${user.name || 'Your Name'}</div>
          <div class="contact">
            ${user.phone ? `${user.phone} • ` : ''}
            ${user.email || ''} 
            ${user.city ? `• ${user.city}` : ''}
          </div>
        </div>

        <!-- Professional Summary -->
        ${user.bio ? `
        <div class="section">
          <div class="section-title">Professional Summary</div>
          <div class="item-description">${user.bio}</div>
        </div>
        ` : ''}

        <!-- Work Experience -->
        ${resume.workExperiences && resume.workExperiences.length > 0 ? `
        <div class="section">
          <div class="section-title">Experience</div>
          ${resume.workExperiences.map(exp => `
            <div class="item">
              <div class="item-header">
                <div><span class="item-title">${exp.position || ''}</span> <span class="item-subtitle">at ${exp.company || ''}</span></div>
                <span class="item-date">${formatDate(exp.startDate)} - ${exp.endDate ? formatDate(exp.endDate) : 'Present'}</span>
              </div>
              ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Education -->
        ${resume.educationHistory && resume.educationHistory.length > 0 ? `
        <div class="section">
          <div class="section-title">Education</div>
          ${resume.educationHistory.map(edu => `
            <div class="item">
              <div class="item-header">
                <div><span class="item-title">${edu.degree || ''}</span> <span class="item-subtitle">in ${edu.fieldOfStudy || ''}</span></div>
                <span class="item-date">${formatDate(edu.startDate)} - ${formatDate(edu.endDate)}</span>
              </div>
              <div class="item-subtitle">${edu.institution || ''}</div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Skills -->
        ${resume.skills && resume.skills.length > 0 ? `
        <div class="section">
          <div class="section-title">Skills</div>
          <div class="skills">
            <div class="skills-list">${resume.skills.join(' • ')}</div>
          </div>
        </div>
        ` : ''}

        <!-- Languages -->
        ${resume.languages && resume.languages.length > 0 ? `
        <div class="section">
          <div class="section-title">Languages</div>
          <div class="skills-list">${resume.languages.join(', ')}</div>
        </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
};

/**
 * UK/Europass Format: Detailed CV with personal statement
 */
const generateUKFormat = (user, resume) => {
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${user.name} - CV</title>
      <style>
        * { margin: 0; padding: 0; }
        body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; line-height: 1.3; color: #000; background: #fff; }
        .container { max-width: 8.5in; margin: 0 auto; padding: 0.4in; }
        .header { margin-bottom: 0.2in; }
        .name { font-size: 18pt; font-weight: bold; margin-bottom: 0.03in; }
        .contact { font-size: 8.5pt; color: #333; }
        .section { margin-top: 0.12in; page-break-inside: avoid; }
        .section-title { 
          font-size: 10.5pt; 
          font-weight: bold; 
          background: #003366; 
          color: white; 
          padding: 0.05in 0.08in; 
          margin-bottom: 0.08in;
        }
        .item { margin-bottom: 0.12in; page-break-inside: avoid; }
        .item-title { font-weight: bold; font-size: 9.5pt; }
        .item-meta { font-size: 8.5pt; color: #333; }
        .item-description { font-size: 8.5pt; margin-top: 0.05in; text-align: justify; }
        .skills-list { font-size: 8.5pt; }
        ul { margin-left: 0.15in; font-size: 8.5pt; }
        li { margin-bottom: 0.04in; }
        @media print {
          body { margin: 0; padding: 0; }
          .container { max-width: 100%; padding: 0.3in; }
          .section { page-break-inside: avoid; }
          .item { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="name">${user.name || 'Your Name'}</div>
          <div class="contact">
            ${user.phone ? `${user.phone} | ` : ''}
            ${user.email || ''} 
            ${user.city ? `| ${user.city}` : ''}
          </div>
        </div>

        <!-- Personal Statement -->
        ${user.bio ? `
        <div class="section">
          <div class="section-title">Personal Statement</div>
          <div class="item-description">${user.bio}</div>
        </div>
        ` : ''}

        <!-- Work Experience -->
        ${resume.workExperiences && resume.workExperiences.length > 0 ? `
        <div class="section">
          <div class="section-title">Work Experience</div>
          ${resume.workExperiences.map(exp => `
            <div class="item">
              <div class="item-title">${exp.position || 'Position'}</div>
              <div class="item-meta">${exp.company || 'Company'} | ${formatDate(exp.startDate)} – ${exp.endDate ? formatDate(exp.endDate) : 'Present'}</div>
              ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Education -->
        ${resume.educationHistory && resume.educationHistory.length > 0 ? `
        <div class="section">
          <div class="section-title">Education and Qualifications</div>
          ${resume.educationHistory.map(edu => `
            <div class="item">
              <div class="item-title">${edu.degree || 'Degree'} in ${edu.fieldOfStudy || 'Field'}</div>
              <div class="item-meta">${edu.institution || 'Institution'} | ${formatDate(edu.startDate)} – ${formatDate(edu.endDate)}</div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Skills -->
        ${resume.skills && resume.skills.length > 0 ? `
        <div class="section">
          <div class="section-title">Key Skills</div>
          <div class="skills-list">
            <ul>
              ${resume.skills.map(skill => `<li>${skill}</li>`).join('')}
            </ul>
          </div>
        </div>
        ` : ''}

        <!-- Languages -->
        ${resume.languages && resume.languages.length > 0 ? `
        <div class="section">
          <div class="section-title">Languages</div>
          <div class="skills-list">
            <ul>
              ${resume.languages.map(lang => `<li>${lang}</li>`).join('')}
            </ul>
          </div>
        </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
};

/**
 * Indian Format: Comprehensive resume with objectives and achievements
 */
const generateIndianFormat = (user, resume) => {
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${user.name} - Resume</title>
      <style>
        * { margin: 0; padding: 0; }
        body { font-family: 'Arial', sans-serif; line-height: 1.3; color: #1a1a1a; }
        .container { max-width: 8.5in; margin: 0 auto; padding: 0.4in; }
        .header { 
          text-align: center; 
          margin-bottom: 0.15in; 
          border-bottom: 2px solid #000080; 
          padding-bottom: 0.08in;
        }
        .name { font-size: 15pt; font-weight: bold; }
        .contact { font-size: 8pt; margin-top: 0.03in; }
        .section { margin-top: 0.1in; page-break-inside: avoid; }
        .section-title { 
          font-size: 10pt; 
          font-weight: bold; 
          text-transform: uppercase; 
          color: #000080;
          border-bottom: 1.5px solid #000080; 
          padding-bottom: 0.03in;
          margin-bottom: 0.06in;
        }
        .item { margin-bottom: 0.1in; page-break-inside: avoid; }
        .item-header { display: flex; justify-content: space-between; margin-bottom: 0.03in; }
        .item-title { font-weight: bold; font-size: 9.5pt; }
        .item-subtitle { font-size: 8.5pt; color: #333; }
        .item-date { font-size: 8.5pt; color: #555; text-align: right; }
        .item-description { font-size: 8.5pt; margin-top: 0.03in; line-height: 1.3; }
        .skills { font-size: 8.5pt; }
        ul { margin-left: 0.15in; font-size: 8.5pt; }
        li { margin-bottom: 0.04in; }
        .personal-details { font-size: 8pt; margin-top: 0.06in; }
        @media print {
          body { margin: 0; padding: 0; }
          .container { max-width: 100%; padding: 0.3in; }
          .section { page-break-inside: avoid; }
          .item { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="name">${user.name || 'YOUR NAME'}</div>
          <div class="contact">
            ${user.phone ? `Phone: ${user.phone} | ` : ''}
            Email: ${user.email || 'email@example.com'} 
            ${user.city ? `| Location: ${user.city}` : ''}
          </div>
        </div>

        <!-- Career Objective -->
        ${user.headline ? `
        <div class="section">
          <div class="section-title">Career Objective</div>
          <div class="item-description">${user.headline}</div>
        </div>
        ` : ''}

        <!-- Professional Summary -->
        ${user.bio ? `
        <div class="section">
          <div class="section-title">Professional Summary</div>
          <div class="item-description">${user.bio}</div>
        </div>
        ` : ''}

        <!-- Work Experience -->
        ${resume.workExperiences && resume.workExperiences.length > 0 ? `
        <div class="section">
          <div class="section-title">Professional Experience</div>
          ${resume.workExperiences.map(exp => `
            <div class="item">
              <div class="item-header">
                <div>
                  <div class="item-title">${exp.position || 'Position'}</div>
                  <div class="item-subtitle">${exp.company || 'Company Name'}</div>
                </div>
                <div class="item-date">${formatDate(exp.startDate)} - ${exp.endDate ? formatDate(exp.endDate) : 'Present'}</div>
              </div>
              ${exp.description ? `<div class="item-description">• ${exp.description}</div>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Education -->
        ${resume.educationHistory && resume.educationHistory.length > 0 ? `
        <div class="section">
          <div class="section-title">Education</div>
          ${resume.educationHistory.map(edu => `
            <div class="item">
              <div class="item-header">
                <div>
                  <div class="item-title">${edu.degree || 'Qualification'}</div>
                  <div class="item-subtitle">${edu.institution || 'Institution'}</div>
                </div>
                <div class="item-date">${formatDate(edu.endDate)}</div>
              </div>
              <div class="item-subtitle">Field: ${edu.fieldOfStudy || 'N/A'}</div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Technical Skills -->
        ${resume.skills && resume.skills.length > 0 ? `
        <div class="section">
          <div class="section-title">Technical Skills</div>
          <div class="skills">
            <ul>
              ${resume.skills.map(skill => `<li>${skill}</li>`).join('')}
            </ul>
          </div>
        </div>
        ` : ''}

        <!-- Languages -->
        ${resume.languages && resume.languages.length > 0 ? `
        <div class="section">
          <div class="section-title">Languages</div>
          <div class="skills">
            <ul>
              ${resume.languages.map(lang => `<li>${lang}</li>`).join('')}
            </ul>
          </div>
        </div>
        ` : ''}

        <!-- Personal Details -->
        <div class="section">
          <div class="section-title">Personal Details</div>
          <div class="personal-details">
            <div>Date of Birth: ${user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-IN') : 'N/A'}</div>
            <div>Gender: ${user.gender || 'N/A'}</div>
            <div>Nationality: Indian</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Canadian Format: ATS-friendly with accomplishments focus
 */
const generateCanadianFormat = (user, resume) => {
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-CA', { year: 'numeric', month: 'short' });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${user.name} - Resume</title>
      <style>
        * { margin: 0; padding: 0; }
        body { font-family: 'Arial', 'Helvetica', sans-serif; line-height: 1.3; color: #333; }
        .container { max-width: 8.5in; margin: 0 auto; padding: 0.4in; }
        .header { text-align: center; margin-bottom: 0.15in; }
        .name { font-size: 16pt; font-weight: bold; }
        .contact { font-size: 8.5pt; margin-top: 0.03in; }
        .section { margin-top: 0.1in; page-break-inside: avoid; }
        .section-title { 
          font-size: 10pt; 
          font-weight: bold; 
          text-transform: uppercase; 
          background: #e8e8e8;
          padding: 0.04in 0.06in;
          margin-bottom: 0.06in;
        }
        .item { margin-bottom: 0.1in; page-break-inside: avoid; }
        .item-header { display: flex; justify-content: space-between; }
        .item-title { font-weight: bold; font-size: 9.5pt; }
        .item-subtitle { font-style: italic; font-size: 8.5pt; color: #555; }
        .item-date { font-size: 8.5pt; color: #666; }
        .item-description { font-size: 8.5pt; margin-top: 0.03in; margin-left: 0.1in; }
        ul { margin-left: 0.15in; font-size: 8.5pt; }
        li { margin-bottom: 0.03in; }
        .skills-list { font-size: 8.5pt; }
        @media print {
          body { margin: 0; padding: 0; }
          .container { max-width: 100%; padding: 0.3in; }
          .section { page-break-inside: avoid; }
          .item { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="name">${user.name || 'Your Name'}</div>
          <div class="contact">
            ${user.phone ? `${user.phone} • ` : ''}
            ${user.email || ''} 
            ${user.city ? `• ${user.city}` : ''}
          </div>
        </div>

        <!-- Summary -->
        ${user.bio ? `
        <div class="section">
          <div class="section-title">Profile</div>
          <div class="item-description">${user.bio}</div>
        </div>
        ` : ''}

        <!-- Work Experience -->
        ${resume.workExperiences && resume.workExperiences.length > 0 ? `
        <div class="section">
          <div class="section-title">Professional Experience</div>
          ${resume.workExperiences.map(exp => `
            <div class="item">
              <div class="item-header">
                <div><span class="item-title">${exp.position || ''}</span></div>
                <span class="item-date">${formatDate(exp.startDate)} – ${exp.endDate ? formatDate(exp.endDate) : 'Present'}</span>
              </div>
              <div class="item-subtitle">${exp.company || ''}</div>
              ${exp.description ? `<ul><li>${exp.description}</li></ul>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Education -->
        ${resume.educationHistory && resume.educationHistory.length > 0 ? `
        <div class="section">
          <div class="section-title">Education</div>
          ${resume.educationHistory.map(edu => `
            <div class="item">
              <div class="item-header">
                <div><span class="item-title">${edu.degree || ''}</span></div>
                <span class="item-date">${formatDate(edu.endDate)}</span>
              </div>
              <div class="item-subtitle">${edu.institution || ''} – ${edu.fieldOfStudy || ''}</div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Skills -->
        ${resume.skills && resume.skills.length > 0 ? `
        <div class="section">
          <div class="section-title">Skills</div>
          <div class="skills-list">
            ${resume.skills.join(', ')}
          </div>
        </div>
        ` : ''}

        <!-- Languages -->
        ${resume.languages && resume.languages.length > 0 ? `
        <div class="section">
          <div class="section-title">Languages</div>
          <div class="skills-list">
            ${resume.languages.join(', ')}
          </div>
        </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
};

/**
 * Australian Format: Emphasizing accomplishments and metrics
 */
const generateAustralianFormat = (user, resume) => {
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-AU', { year: 'numeric', month: 'short' });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${user.name} - Resume</title>
      <style>
        * { margin: 0; padding: 0; }
        body { font-family: 'Arial', sans-serif; line-height: 1.3; color: #333; }
        .container { max-width: 8.5in; margin: 0 auto; padding: 0.4in; }
        .header { text-align: left; margin-bottom: 0.15in; }
        .name { font-size: 16pt; font-weight: bold; }
        .contact { font-size: 8.5pt; margin-top: 0.03in; }
        .section { margin-top: 0.1in; page-break-inside: avoid; }
        .section-title { 
          font-size: 10pt; 
          font-weight: bold; 
          color: #003d7a;
          border-bottom: 1.5px solid #003d7a;
          padding-bottom: 0.03in;
          margin-bottom: 0.06in;
        }
        .item { margin-bottom: 0.1in; page-break-inside: avoid; }
        .item-title { font-weight: bold; font-size: 9.5pt; }
        .item-subtitle { font-size: 8.5pt; color: #666; }
        .item-date { font-size: 8.5pt; color: #666; }
        .item-description { font-size: 8.5pt; margin-top: 0.05in; line-height: 1.3; }
        ul { margin-left: 0.15in; font-size: 8.5pt; }
        li { margin-bottom: 0.04in; }
        .skills-list { font-size: 8.5pt; }
        @media print {
          body { margin: 0; padding: 0; }
          .container { max-width: 100%; padding: 0.3in; }
          .section { page-break-inside: avoid; }
          .item { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="name">${user.name || 'Your Name'}</div>
          <div class="contact">
            ${user.phone ? `${user.phone} | ` : ''}
            ${user.email || ''} 
            ${user.city ? `| ${user.city}, Australia` : '| Australia'}
          </div>
        </div>

        <!-- Executive Summary -->
        ${user.bio || user.headline ? `
        <div class="section">
          <div class="section-title">Executive Summary</div>
          <div class="item-description">
            ${user.headline ? user.headline : ''}
            ${user.headline && user.bio ? ' • ' + user.bio : (user.bio || '')}
          </div>
        </div>
        ` : ''}

        <!-- Employment History -->
        ${resume.workExperiences && resume.workExperiences.length > 0 ? `
        <div class="section">
          <div class="section-title">Employment History</div>
          ${resume.workExperiences.map(exp => `
            <div class="item">
              <div class="item-title">${exp.position || 'Position'}</div>
              <div class="item-subtitle">${exp.company || 'Company'} | ${formatDate(exp.startDate)} – ${exp.endDate ? formatDate(exp.endDate) : 'Present'}</div>
              ${exp.description ? `<div class="item-description">${exp.description}</div>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Qualifications -->
        ${resume.educationHistory && resume.educationHistory.length > 0 ? `
        <div class="section">
          <div class="section-title">Qualifications</div>
          ${resume.educationHistory.map(edu => `
            <div class="item">
              <div class="item-title">${edu.degree || 'Qualification'} in ${edu.fieldOfStudy || ''}</div>
              <div class="item-subtitle">${edu.institution || ''} – Completed ${formatDate(edu.endDate)}</div>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Key Competencies -->
        ${resume.skills && resume.skills.length > 0 ? `
        <div class="section">
          <div class="section-title">Key Competencies</div>
          <div class="skills-list">
            <ul>
              ${resume.skills.map(skill => `<li>${skill}</li>`).join('')}
            </ul>
          </div>
        </div>
        ` : ''}

        <!-- Languages -->
        ${resume.languages && resume.languages.length > 0 ? `
        <div class="section">
          <div class="section-title">Languages</div>
          <div class="skills-list">
            ${resume.languages.join(', ')}
          </div>
        </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
};

export {
  generateUSFormat,
  generateUKFormat,
  generateIndianFormat,
  generateCanadianFormat,
  generateAustralianFormat
};
