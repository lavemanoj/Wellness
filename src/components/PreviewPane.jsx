import React from 'react';
import { Download, Type, Sparkles, Sliders } from 'lucide-react';

export default function PreviewPane({ 
  data, 
  fontFamily, 
  setFontFamily, 
  fontSize, 
  setFontSize, 
  marginSize, 
  setMarginSize, 
  spacingSize, 
  setSpacingSize 
}) {
  
  const handlePrint = () => {
    window.print();
  };

  // Font style map
  const fontStyles = {
    'Arial': { fontFamily: 'Arial, sans-serif' },
    'Times New Roman': { fontFamily: '"Times New Roman", Times, serif' },
    'Georgia': { fontFamily: 'Georgia, serif' },
    'Calibri': { fontFamily: 'Calibri, Candara, Segoe, sans-serif' },
    'Garamond': { fontFamily: '"Adobe Garamond Pro", Garamond, Baskerville, serif' }
  };

  // Margin sizes
  const marginStyles = {
    'compact': '0.4in',
    'normal': '0.6in',
    'wide': '0.8in'
  };

  // Font size settings
  const sizeStyles = {
    'small': { name: '14px', body: '10.5pt', title: '18pt', section: '11.5pt' },
    'medium': { name: '16px', body: '11.5pt', title: '20pt', section: '13pt' },
    'large': { name: '18px', body: '12.5pt', title: '22pt', section: '14.5pt' }
  };

  // Spacing sizes
  const spacingStyles = {
    'compact': { sectionGap: '12px', itemGap: '6px', lineGap: '1.15' },
    'normal': { sectionGap: '18px', itemGap: '10px', lineGap: '1.25' },
    'spacious': { sectionGap: '24px', itemGap: '14px', lineGap: '1.4' }
  };

  const currentStyles = {
    ...fontStyles[fontFamily],
    padding: marginStyles[marginSize],
    lineHeight: spacingStyles[spacingSize].lineGap,
    fontSize: sizeStyles[fontSize].body
  };

  const formatUrl = (url) => {
    if (!url) return '';
    return url.replace(/https?:\/\/(www\.)?/, '');
  };

  // Check if sections have content to render
  const hasExperience = data.experience && data.experience.some(exp => exp.company || exp.role);
  const hasEducation = data.education && data.education.some(edu => edu.institution || edu.degree);
  const hasProjects = data.projects && data.projects.some(proj => proj.name);
  const hasSkills = data.skills && data.skills.some(skill => skill.category && skill.items);
  const hasCerts = data.certifications && data.certifications.some(cert => cert.name);

  return (
    <div className="preview-pane-container">
      {/* Control Bar */}
      <div className="preview-control-bar">
        <div className="control-group">
          <label title="Font Family"><Type size={16} /> Font</label>
          <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
            <option value="Arial">Arial (Sans-Serif)</option>
            <option value="Calibri">Calibri (Sans-Serif)</option>
            <option value="Times New Roman">Times New Roman (Serif)</option>
            <option value="Georgia">Georgia (Serif)</option>
            <option value="Garamond">Garamond (Serif)</option>
          </select>
        </div>

        <div className="control-group">
          <label title="Font Size"><Sliders size={16} /> Size</label>
          <select value={fontSize} onChange={(e) => setFontSize(e.target.value)}>
            <option value="small">Small (10.5pt)</option>
            <option value="medium">Medium (11.5pt)</option>
            <option value="large">Large (12.5pt)</option>
          </select>
        </div>

        <div className="control-group">
          <label title="Margin Size">Margins</label>
          <select value={marginSize} onChange={(e) => setMarginSize(e.target.value)}>
            <option value="compact">Compact (0.4")</option>
            <option value="normal">Normal (0.6")</option>
            <option value="wide">Wide (0.8")</option>
          </select>
        </div>

        <div className="control-group">
          <label title="Line Spacing">Spacing</label>
          <select value={spacingSize} onChange={(e) => setSpacingSize(e.target.value)}>
            <option value="compact">Compact</option>
            <option value="normal">Normal</option>
            <option value="spacious">Spacious</option>
          </select>
        </div>

        <button onClick={handlePrint} className="download-pdf-btn">
          <Download size={18} />
          <span>Save PDF / Print</span>
        </button>
      </div>

      {/* Virtual Paper Preview */}
      <div className="paper-scroll-container">
        <div 
          id="resume-print-area" 
          className="resume-paper" 
          style={currentStyles}
        >
          {/* Header */}
          <header className="resume-header" style={{ marginBottom: spacingStyles[spacingSize].itemGap }}>
            <h1 
              className="resume-name" 
              style={{ fontSize: sizeStyles[fontSize].title, fontFamily: 'inherit' }}
            >
              {data.personalInfo.fullName || 'YOUR NAME'}
            </h1>
            
            {data.personalInfo.title && (
              <div className="resume-title-sub">{data.personalInfo.title}</div>
            )}
            
            <div className="resume-contact-info">
              {data.personalInfo.phone && <span>{data.personalInfo.phone}</span>}
              {data.personalInfo.phone && data.personalInfo.email && <span className="contact-divider">|</span>}
              
              {data.personalInfo.email && (
                <a href={`mailto:${data.personalInfo.email}`}>{data.personalInfo.email}</a>
              )}
              
              {(data.personalInfo.email || data.personalInfo.phone) && data.personalInfo.location && (
                <span className="contact-divider">|</span>
              )}
              
              {data.personalInfo.location && <span>{data.personalInfo.location}</span>}
            </div>

            <div className="resume-links-info">
              {data.personalInfo.website && (
                <a href={data.personalInfo.website} target="_blank" rel="noopener noreferrer">
                  {formatUrl(data.personalInfo.website)}
                </a>
              )}
              
              {data.personalInfo.website && data.personalInfo.linkedin && <span className="contact-divider">|</span>}
              
              {data.personalInfo.linkedin && (
                <a href={data.personalInfo.linkedin} target="_blank" rel="noopener noreferrer">
                  {formatUrl(data.personalInfo.linkedin)}
                </a>
              )}
              
              {(data.personalInfo.linkedin || data.personalInfo.website) && data.personalInfo.github && (
                <span className="contact-divider">|</span>
              )}
              
              {data.personalInfo.github && (
                <a href={data.personalInfo.github} target="_blank" rel="noopener noreferrer">
                  {formatUrl(data.personalInfo.github)}
                </a>
              )}
            </div>
          </header>

          {/* Professional Summary */}
          {data.summary && (
            <section className="resume-section" style={{ marginBottom: spacingStyles[spacingSize].sectionGap }}>
              <h2 
                className="resume-section-title"
                style={{ fontSize: sizeStyles[fontSize].section, fontFamily: 'inherit' }}
              >
                SUMMARY
              </h2>
              <div className="resume-section-divider"></div>
              <p className="resume-summary-text">{data.summary}</p>
            </section>
          )}

          {/* Work Experience */}
          {hasExperience && (
            <section className="resume-section" style={{ marginBottom: spacingStyles[spacingSize].sectionGap }}>
              <h2 
                className="resume-section-title"
                style={{ fontSize: sizeStyles[fontSize].section, fontFamily: 'inherit' }}
              >
                EXPERIENCE
              </h2>
              <div className="resume-section-divider"></div>
              <div className="resume-items-list" style={{ gap: spacingStyles[spacingSize].itemGap }}>
                {data.experience.map((exp, index) => {
                  if (!exp.company && !exp.role) return null;
                  return (
                    <div key={index} className="resume-section-item">
                      <div className="item-row-header">
                        <div className="item-title-org">
                          <strong>{exp.role || 'Job Title'}</strong>
                          {exp.company && <span>, {exp.company}</span>}
                        </div>
                        <div className="item-dates-loc">
                          <span>{exp.startDate || 'Start Date'} – {exp.endDate || 'Present'}</span>
                        </div>
                      </div>
                      
                      {exp.location && (
                        <div className="item-row-sub">
                          <span className="item-location">{exp.location}</span>
                        </div>
                      )}
                      
                      {exp.description && exp.description.length > 0 && (
                        <ul className="item-bullets-list">
                          {exp.description.map((bullet, bIndex) => {
                            if (!bullet) return null;
                            return <li key={bIndex}>{bullet}</li>;
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Projects */}
          {hasProjects && (
            <section className="resume-section" style={{ marginBottom: spacingStyles[spacingSize].sectionGap }}>
              <h2 
                className="resume-section-title"
                style={{ fontSize: sizeStyles[fontSize].section, fontFamily: 'inherit' }}
              >
                PROJECTS
              </h2>
              <div className="resume-section-divider"></div>
              <div className="resume-items-list" style={{ gap: spacingStyles[spacingSize].itemGap }}>
                {data.projects.map((proj, index) => {
                  if (!proj.name) return null;
                  return (
                    <div key={index} className="resume-section-item">
                      <div className="item-row-header">
                        <div className="item-title-org">
                          <strong>{proj.name}</strong>
                          {proj.technologies && <span className="item-tech-tags"> | <em>{proj.technologies}</em></span>}
                        </div>
                        <div className="item-dates-loc">
                          <span>{proj.startDate || 'Start Date'} – {proj.endDate || 'Present'}</span>
                        </div>
                      </div>

                      {proj.link && (
                        <div className="item-row-sub">
                          <a href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`} target="_blank" rel="noopener noreferrer" className="item-link">
                            {formatUrl(proj.link)}
                          </a>
                        </div>
                      )}

                      {proj.description && proj.description.length > 0 && (
                        <ul className="item-bullets-list">
                          {proj.description.map((bullet, bIndex) => {
                            if (!bullet) return null;
                            return <li key={bIndex}>{bullet}</li>;
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Education */}
          {hasEducation && (
            <section className="resume-section" style={{ marginBottom: spacingStyles[spacingSize].sectionGap }}>
              <h2 
                className="resume-section-title"
                style={{ fontSize: sizeStyles[fontSize].section, fontFamily: 'inherit' }}
              >
                EDUCATION
              </h2>
              <div className="resume-section-divider"></div>
              <div className="resume-items-list" style={{ gap: spacingStyles[spacingSize].itemGap }}>
                {data.education.map((edu, index) => {
                  if (!edu.institution && !edu.degree) return null;
                  return (
                    <div key={index} className="resume-section-item">
                      <div className="item-row-header">
                        <div className="item-title-org">
                          <strong>{edu.institution || 'Institution'}</strong>
                        </div>
                        <div className="item-dates-loc">
                          <span>{edu.startDate || 'Start'} – {edu.endDate || 'Graduation'}</span>
                        </div>
                      </div>
                      
                      <div className="item-row-sub">
                        <span className="item-degree-major">{edu.degree || 'Degree'}</span>
                        {edu.location && <span className="item-location-school">, {edu.location}</span>}
                      </div>

                      {edu.details && (
                        <div className="item-education-details">
                          {edu.details}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Skills */}
          {hasSkills && (
            <section className="resume-section" style={{ marginBottom: spacingStyles[spacingSize].sectionGap }}>
              <h2 
                className="resume-section-title"
                style={{ fontSize: sizeStyles[fontSize].section, fontFamily: 'inherit' }}
              >
                TECHNICAL SKILLS
              </h2>
              <div className="resume-section-divider"></div>
              <div className="resume-skills-list" style={{ gap: '4px' }}>
                {data.skills.map((skill, index) => {
                  if (!skill.category && !skill.items) return null;
                  return (
                    <div key={index} className="resume-skill-item">
                      <strong>{skill.category}:</strong> <span>{skill.items}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Certifications */}
          {hasCerts && (
            <section className="resume-section" style={{ marginBottom: spacingStyles[spacingSize].sectionGap }}>
              <h2 
                className="resume-section-title"
                style={{ fontSize: sizeStyles[fontSize].section, fontFamily: 'inherit' }}
              >
                CERTIFICATIONS & HONORS
              </h2>
              <div className="resume-section-divider"></div>
              <div className="resume-skills-list" style={{ gap: '4px' }}>
                {data.certifications.map((cert, index) => {
                  if (!cert.name) return null;
                  return (
                    <div key={index} className="resume-cert-item">
                      <strong>{cert.name}</strong> – {cert.issuer} {cert.date && <span>({cert.date})</span>}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
