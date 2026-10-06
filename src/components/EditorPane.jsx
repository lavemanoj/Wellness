import React, { useState } from 'react';
import { 
  User, Briefcase, GraduationCap, Code, FolderGit2, Award, 
  Plus, Trash2, ChevronDown, ChevronUp, Link as LinkIcon, HelpCircle
} from 'lucide-react';

const ACTION_VERBS = [
  "Architected", "Analyzed", "Built", "Collaborated", "Created", 
  "Designed", "Developed", "Engineered", "Enhanced", "Formulated", 
  "Implemented", "Improved", "Increased", "Launched", "Led", 
  "Managed", "Optimized", "Redesigned", "Reduced", "Spearheaded"
];

export default function EditorPane({ data, onChange }) {
  const [activeSection, setActiveSection] = useState('personal');
  const [showVerbHelper, setShowVerbHelper] = useState(false);

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? '' : section);
  };

  const handlePersonalChange = (field, value) => {
    onChange({
      ...data,
      personalInfo: {
        ...data.personalInfo,
        [field]: value
      }
    });
  };

  const handleSummaryChange = (value) => {
    onChange({
      ...data,
      summary: value
    });
  };

  // Experience Managers
  const handleExperienceChange = (index, field, value) => {
    const newExperience = [...data.experience];
    newExperience[index] = {
      ...newExperience[index],
      [field]: value
    };
    onChange({ ...data, experience: newExperience });
  };

  const addExperience = () => {
    onChange({
      ...data,
      experience: [
        ...data.experience,
        { company: '', role: '', location: '', startDate: '', endDate: '', description: [''] }
      ]
    });
  };

  const removeExperience = (index) => {
    const newExperience = data.experience.filter((_, i) => i !== index);
    onChange({ ...data, experience: newExperience });
  };

  const handleExpBulletChange = (expIndex, bulletIndex, value) => {
    const newExperience = [...data.experience];
    const newBullets = [...newExperience[expIndex].description];
    newBullets[bulletIndex] = value;
    newExperience[expIndex] = {
      ...newExperience[expIndex],
      description: newBullets
    };
    onChange({ ...data, experience: newExperience });
  };

  const addExpBullet = (expIndex) => {
    const newExperience = [...data.experience];
    newExperience[expIndex] = {
      ...newExperience[expIndex],
      description: [...newExperience[expIndex].description, '']
    };
    onChange({ ...data, experience: newExperience });
  };

  const removeExpBullet = (expIndex, bulletIndex) => {
    const newExperience = [...data.experience];
    const newBullets = newExperience[expIndex].description.filter((_, i) => i !== bulletIndex);
    newExperience[expIndex] = {
      ...newExperience[expIndex],
      description: newBullets.length > 0 ? newBullets : ['']
    };
    onChange({ ...data, experience: newExperience });
  };

  // Projects Managers
  const handleProjectChange = (index, field, value) => {
    const newProjects = [...data.projects];
    newProjects[index] = {
      ...newProjects[index],
      [field]: value
    };
    onChange({ ...data, projects: newProjects });
  };

  const addProject = () => {
    onChange({
      ...data,
      projects: [
        ...data.projects,
        { name: '', technologies: '', link: '', startDate: '', endDate: '', description: [''] }
      ]
    });
  };

  const removeProject = (index) => {
    const newProjects = data.projects.filter((_, i) => i !== index);
    onChange({ ...data, projects: newProjects });
  };

  const handleProjBulletChange = (projIndex, bulletIndex, value) => {
    const newProjects = [...data.projects];
    const newBullets = [...newProjects[projIndex].description];
    newBullets[bulletIndex] = value;
    newProjects[projIndex] = {
      ...newProjects[projIndex],
      description: newBullets
    };
    onChange({ ...data, projects: newProjects });
  };

  const addProjBullet = (projIndex) => {
    const newProjects = [...data.projects];
    newProjects[projIndex] = {
      ...newProjects[projIndex],
      description: [...newProjects[projIndex].description, '']
    };
    onChange({ ...data, projects: newProjects });
  };

  const removeProjBullet = (projIndex, bulletIndex) => {
    const newProjects = [...data.projects];
    const newBullets = newProjects[projIndex].description.filter((_, i) => i !== bulletIndex);
    newProjects[projIndex] = {
      ...newProjects[projIndex],
      description: newBullets.length > 0 ? newBullets : ['']
    };
    onChange({ ...data, projects: newProjects });
  };

  // Education Managers
  const handleEducationChange = (index, field, value) => {
    const newEducation = [...data.education];
    newEducation[index] = {
      ...newEducation[index],
      [field]: value
    };
    onChange({ ...data, education: newEducation });
  };

  const addEducation = () => {
    onChange({
      ...data,
      education: [
        ...data.education,
        { institution: '', degree: '', location: '', startDate: '', endDate: '', details: '' }
      ]
    });
  };

  const removeEducation = (index) => {
    const newEducation = data.education.filter((_, i) => i !== index);
    onChange({ ...data, education: newEducation });
  };

  // Skills Managers
  const handleSkillChange = (index, field, value) => {
    const newSkills = [...data.skills];
    newSkills[index] = {
      ...newSkills[index],
      [field]: value
    };
    onChange({ ...data, skills: newSkills });
  };

  const addSkillGroup = () => {
    onChange({
      ...data,
      skills: [
        ...data.skills,
        { category: '', items: '' }
      ]
    });
  };

  const removeSkillGroup = (index) => {
    const newSkills = data.skills.filter((_, i) => i !== index);
    onChange({ ...data, skills: newSkills });
  };

  // Certifications Managers
  const handleCertChange = (index, field, value) => {
    const newCerts = [...data.certifications];
    newCerts[index] = {
      ...newCerts[index],
      [field]: value
    };
    onChange({ ...data, certifications: newCerts });
  };

  const addCert = () => {
    onChange({
      ...data,
      certifications: [
        ...data.certifications,
        { name: '', issuer: '', date: '' }
      ]
    });
  };

  const removeCert = (index) => {
    const newCerts = data.certifications.filter((_, i) => i !== index);
    onChange({ ...data, certifications: newCerts });
  };

  const insertActionVerb = (expIndex, bulletIndex, verb) => {
    const exp = data.experience[expIndex];
    if (!exp) return;
    const currentText = exp.description[bulletIndex] || '';
    const newText = currentText ? `${verb} ${currentText.charAt(0).toLowerCase() + currentText.slice(1)}` : `${verb} `;
    handleExpBulletChange(expIndex, bulletIndex, newText);
  };

  return (
    <div className="editor-pane">
      <div className="editor-title-container">
        <h2>Resume Details</h2>
        <p className="editor-subtitle">Fill in the fields below. The live preview updates instantly.</p>
      </div>

      {/* PERSONAL INFO SECTION */}
      <div className={`editor-section ${activeSection === 'personal' ? 'open' : ''}`}>
        <button className="section-header" onClick={() => toggleSection('personal')}>
          <div className="header-title">
            <User size={20} className="section-icon" />
            <span>Personal Information</span>
          </div>
          {activeSection === 'personal' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        
        {activeSection === 'personal' && (
          <div className="section-content">
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={data.personalInfo.fullName || ''} 
                  onChange={(e) => handlePersonalChange('fullName', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div className="form-group">
                <label>Job Title</label>
                <input 
                  type="text" 
                  value={data.personalInfo.title || ''} 
                  onChange={(e) => handlePersonalChange('title', e.target.value)}
                  placeholder="Software Engineer"
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={data.personalInfo.email || ''} 
                  onChange={(e) => handlePersonalChange('email', e.target.value)}
                  placeholder="john.doe@example.com"
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  value={data.personalInfo.phone || ''} 
                  onChange={(e) => handlePersonalChange('phone', e.target.value)}
                  placeholder="(123) 456-7890"
                />
              </div>
              <div className="form-group">
                <label>Location (City, State)</label>
                <input 
                  type="text" 
                  value={data.personalInfo.location || ''} 
                  onChange={(e) => handlePersonalChange('location', e.target.value)}
                  placeholder="San Francisco, CA"
                />
              </div>
              <div className="form-group">
                <label>Portfolio / Website</label>
                <input 
                  type="url" 
                  value={data.personalInfo.website || ''} 
                  onChange={(e) => handlePersonalChange('website', e.target.value)}
                  placeholder="https://johndoe.dev"
                />
              </div>
              <div className="form-group">
                <label>LinkedIn URL</label>
                <input 
                  type="url" 
                  value={data.personalInfo.linkedin || ''} 
                  onChange={(e) => handlePersonalChange('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/in/johndoe"
                />
              </div>
              <div className="form-group full-width">
                <label>GitHub URL</label>
                <input 
                  type="url" 
                  value={data.personalInfo.github || ''} 
                  onChange={(e) => handlePersonalChange('github', e.target.value)}
                  placeholder="https://github.com/johndoe"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PROFESSIONAL SUMMARY */}
      <div className={`editor-section ${activeSection === 'summary' ? 'open' : ''}`}>
        <button className="section-header" onClick={() => toggleSection('summary')}>
          <div className="header-title">
            <LinkIcon size={20} className="section-icon" />
            <span>Professional Summary</span>
          </div>
          {activeSection === 'summary' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {activeSection === 'summary' && (
          <div className="section-content">
            <div className="form-group full-width">
              <label>Summary Statement</label>
              <textarea 
                rows="4"
                value={data.summary || ''} 
                onChange={(e) => handleSummaryChange(e.target.value)}
                placeholder="Results-oriented Software Engineer with 3+ years of experience building scalable web applications. Proven track record of optimizing database performance and leading cross-functional teams..."
              />
              <span className="input-helper">Keep it concise (3-4 sentences). Highlight key skills and career achievements.</span>
            </div>
          </div>
        )}
      </div>

      {/* WORK EXPERIENCE */}
      <div className={`editor-section ${activeSection === 'experience' ? 'open' : ''}`}>
        <button className="section-header" onClick={() => toggleSection('experience')}>
          <div className="header-title">
            <Briefcase size={20} className="section-icon" />
            <span>Work Experience</span>
          </div>
          {activeSection === 'experience' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {activeSection === 'experience' && (
          <div className="section-content">
            {data.experience.map((exp, expIndex) => (
              <div key={expIndex} className="nested-item">
                <div className="nested-item-header">
                  <h4>Position #{expIndex + 1}</h4>
                  <button onClick={() => removeExperience(expIndex)} className="remove-item-btn" title="Remove Experience">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Company / Organization</label>
                    <input 
                      type="text" 
                      value={exp.company} 
                      onChange={(e) => handleExperienceChange(expIndex, 'company', e.target.value)}
                      placeholder="Google"
                    />
                  </div>
                  <div className="form-group">
                    <label>Job Title / Role</label>
                    <input 
                      type="text" 
                      value={exp.role} 
                      onChange={(e) => handleExperienceChange(expIndex, 'role', e.target.value)}
                      placeholder="Software Engineer"
                    />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input 
                      type="text" 
                      value={exp.location} 
                      onChange={(e) => handleExperienceChange(expIndex, 'location', e.target.value)}
                      placeholder="Mountain View, CA"
                    />
                  </div>
                  <div className="form-group">
                    <div className="split-inputs">
                      <div>
                        <label>Start Date</label>
                        <input 
                          type="text" 
                          value={exp.startDate} 
                          onChange={(e) => handleExperienceChange(expIndex, 'startDate', e.target.value)}
                          placeholder="June 2021"
                        />
                      </div>
                      <div>
                        <label>End Date</label>
                        <input 
                          type="text" 
                          value={exp.endDate} 
                          onChange={(e) => handleExperienceChange(expIndex, 'endDate', e.target.value)}
                          placeholder="Present"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <div className="bullet-header">
                      <label>Key Accomplishments & Responsibilities</label>
                      <button 
                        type="button" 
                        onClick={() => setShowVerbHelper(!showVerbHelper)} 
                        className="verb-helper-toggle-btn"
                      >
                        <HelpCircle size={14} /> Action Verbs
                      </button>
                    </div>

                    {showVerbHelper && (
                      <div className="verb-suggestions-box">
                        <p>Click an action verb to insert it at the start of active bullet points:</p>
                        <div className="verb-buttons">
                          {ACTION_VERBS.map(verb => (
                            <button 
                              key={verb} 
                              type="button"
                              onClick={() => insertActionVerb(expIndex, exp.description.length - 1, verb)}
                              className="verb-tag"
                            >
                              {verb}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {exp.description.map((bullet, bulletIndex) => (
                      <div key={bulletIndex} className="bullet-input-wrapper">
                        <span className="bullet-dot">•</span>
                        <input 
                          type="text"
                          value={bullet}
                          onChange={(e) => handleExpBulletChange(expIndex, bulletIndex, e.target.value)}
                          placeholder="Led development of a high-throughput microservice, reducing API latency by 20%."
                        />
                        <button 
                          onClick={() => removeExpBullet(expIndex, bulletIndex)} 
                          className="remove-bullet-btn"
                          disabled={exp.description.length === 1 && bullet === ''}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}

                    <button onClick={() => addExpBullet(expIndex)} className="add-bullet-btn">
                      <Plus size={14} /> Add Bullet Point
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addExperience} className="add-item-btn">
              <Plus size={16} /> Add Work Position
            </button>
          </div>
        )}
      </div>

      {/* PROJECTS SECTION */}
      <div className={`editor-section ${activeSection === 'projects' ? 'open' : ''}`}>
        <button className="section-header" onClick={() => toggleSection('projects')}>
          <div className="header-title">
            <FolderGit2 size={20} className="section-icon" />
            <span>Projects</span>
          </div>
          {activeSection === 'projects' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {activeSection === 'projects' && (
          <div className="section-content">
            {data.projects.map((proj, projIndex) => (
              <div key={projIndex} className="nested-item">
                <div className="nested-item-header">
                  <h4>Project #{projIndex + 1}</h4>
                  <button onClick={() => removeProject(projIndex)} className="remove-item-btn">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Project Name</label>
                    <input 
                      type="text" 
                      value={proj.name} 
                      onChange={(e) => handleProjectChange(projIndex, 'name', e.target.value)}
                      placeholder="E-commerce Analytics Dashboard"
                    />
                  </div>
                  <div className="form-group">
                    <label>Technologies Used</label>
                    <input 
                      type="text" 
                      value={proj.technologies} 
                      onChange={(e) => handleProjectChange(projIndex, 'technologies', e.target.value)}
                      placeholder="React, Node.js, D3.js, AWS"
                    />
                  </div>
                  <div className="form-group">
                    <label>Project Link / Repository</label>
                    <input 
                      type="text" 
                      value={proj.link} 
                      onChange={(e) => handleProjectChange(projIndex, 'link', e.target.value)}
                      placeholder="github.com/username/project"
                    />
                  </div>
                  <div className="form-group">
                    <div className="split-inputs">
                      <div>
                        <label>Start Date</label>
                        <input 
                          type="text" 
                          value={proj.startDate} 
                          onChange={(e) => handleProjectChange(projIndex, 'startDate', e.target.value)}
                          placeholder="Jan 2023"
                        />
                      </div>
                      <div>
                        <label>End Date</label>
                        <input 
                          type="text" 
                          value={proj.endDate} 
                          onChange={(e) => handleProjectChange(projIndex, 'endDate', e.target.value)}
                          placeholder="Mar 2023"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Project Description / Details</label>
                    {proj.description.map((bullet, bulletIndex) => (
                      <div key={bulletIndex} className="bullet-input-wrapper">
                        <span className="bullet-dot">•</span>
                        <input 
                          type="text"
                          value={bullet}
                          onChange={(e) => handleProjBulletChange(projIndex, bulletIndex, e.target.value)}
                          placeholder="Designed a responsive user interface that boosted user engagement by 15%."
                        />
                        <button 
                          onClick={() => removeProjBullet(projIndex, bulletIndex)} 
                          className="remove-bullet-btn"
                          disabled={proj.description.length === 1 && bullet === ''}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}

                    <button onClick={() => addProjBullet(projIndex)} className="add-bullet-btn">
                      <Plus size={14} /> Add Bullet Point
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addProject} className="add-item-btn">
              <Plus size={16} /> Add Project
            </button>
          </div>
        )}
      </div>

      {/* EDUCATION SECTION */}
      <div className={`editor-section ${activeSection === 'education' ? 'open' : ''}`}>
        <button className="section-header" onClick={() => toggleSection('education')}>
          <div className="header-title">
            <GraduationCap size={20} className="section-icon" />
            <span>Education</span>
          </div>
          {activeSection === 'education' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {activeSection === 'education' && (
          <div className="section-content">
            {data.education.map((edu, eduIndex) => (
              <div key={eduIndex} className="nested-item">
                <div className="nested-item-header">
                  <h4>Education #{eduIndex + 1}</h4>
                  <button onClick={() => removeEducation(eduIndex)} className="remove-item-btn">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Institution / School</label>
                    <input 
                      type="text" 
                      value={edu.institution} 
                      onChange={(e) => handleEducationChange(eduIndex, 'institution', e.target.value)}
                      placeholder="University of California, Berkeley"
                    />
                  </div>
                  <div className="form-group">
                    <label>Degree & Major</label>
                    <input 
                      type="text" 
                      value={edu.degree} 
                      onChange={(e) => handleEducationChange(eduIndex, 'degree', e.target.value)}
                      placeholder="B.S. in Computer Science"
                    />
                  </div>
                  <div className="form-group">
                    <label>Location (City, State)</label>
                    <input 
                      type="text" 
                      value={edu.location} 
                      onChange={(e) => handleEducationChange(eduIndex, 'location', e.target.value)}
                      placeholder="Berkeley, CA"
                    />
                  </div>
                  <div className="form-group">
                    <div className="split-inputs">
                      <div>
                        <label>Start Date</label>
                        <input 
                          type="text" 
                          value={edu.startDate} 
                          onChange={(e) => handleEducationChange(eduIndex, 'startDate', e.target.value)}
                          placeholder="Sep 2018"
                        />
                      </div>
                      <div>
                        <label>End Date</label>
                        <input 
                          type="text" 
                          value={edu.endDate} 
                          onChange={(e) => handleEducationChange(eduIndex, 'endDate', e.target.value)}
                          placeholder="May 2022"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="form-group full-width">
                    <label>Additional Details (GPA, Minor, Honors, Coursework)</label>
                    <input 
                      type="text" 
                      value={edu.details} 
                      onChange={(e) => handleEducationChange(eduIndex, 'details', e.target.value)}
                      placeholder="GPA: 3.8/4.0 | Minor in Mathematics | Relevant Coursework: Data Structures, Algorithms"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addEducation} className="add-item-btn">
              <Plus size={16} /> Add Education Record
            </button>
          </div>
        )}
      </div>

      {/* TECHNICAL SKILLS */}
      <div className={`editor-section ${activeSection === 'skills' ? 'open' : ''}`}>
        <button className="section-header" onClick={() => toggleSection('skills')}>
          <div className="header-title">
            <Code size={20} className="section-icon" />
            <span>Technical Skills</span>
          </div>
          {activeSection === 'skills' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {activeSection === 'skills' && (
          <div className="section-content">
            <p className="skills-hint">Group your skills by category for better readability.</p>
            {data.skills.map((skill, index) => (
              <div key={index} className="nested-item skill-group-item">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Skill Category</label>
                    <input 
                      type="text" 
                      value={skill.category} 
                      onChange={(e) => handleSkillChange(index, 'category', e.target.value)}
                      placeholder="Languages, Frameworks, Developer Tools"
                    />
                  </div>
                  <div className="form-group">
                    <div className="bullet-header">
                      <label>Skills (comma separated)</label>
                      <button onClick={() => removeSkillGroup(index)} className="remove-skill-btn" title="Delete Category">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <input 
                      type="text" 
                      value={skill.items} 
                      onChange={(e) => handleSkillChange(index, 'items', e.target.value)}
                      placeholder="JavaScript, Python, C++, Java"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addSkillGroup} className="add-item-btn">
              <Plus size={16} /> Add Skill Category
            </button>
          </div>
        )}
      </div>

      {/* CERTIFICATIONS & AWARDS */}
      <div className={`editor-section ${activeSection === 'certifications' ? 'open' : ''}`}>
        <button className="section-header" onClick={() => toggleSection('certifications')}>
          <div className="header-title">
            <Award size={20} className="section-icon" />
            <span>Certifications & Honors</span>
          </div>
          {activeSection === 'certifications' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {activeSection === 'certifications' && (
          <div className="section-content">
            {data.certifications.map((cert, index) => (
              <div key={index} className="nested-item">
                <div className="nested-item-header">
                  <h4>Certification #{index + 1}</h4>
                  <button onClick={() => removeCert(index)} className="remove-item-btn">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Certification / Award Name</label>
                    <input 
                      type="text" 
                      value={cert.name} 
                      onChange={(e) => handleCertChange(index, 'name', e.target.value)}
                      placeholder="AWS Certified Solutions Architect"
                    />
                  </div>
                  <div className="form-group">
                    <label>Issuing Organization</label>
                    <input 
                      type="text" 
                      value={cert.issuer} 
                      onChange={(e) => handleCertChange(index, 'issuer', e.target.value)}
                      placeholder="Amazon Web Services (AWS)"
                    />
                  </div>
                  <div className="form-group">
                    <label>Date Issued</label>
                    <input 
                      type="text" 
                      value={cert.date} 
                      onChange={(e) => handleCertChange(index, 'date', e.target.value)}
                      placeholder="Nov 2023"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addCert} className="add-item-btn">
              <Plus size={16} /> Add Certification / Honor
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
