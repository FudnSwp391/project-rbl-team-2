import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const PostJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: isEditing ? 'Senior Frontend Developer' : '',
    type: isEditing ? 'Full-time' : 'Full-time',
    location: isEditing ? 'Ho Chi Minh City' : '',
    salary: isEditing ? 'Negotiable' : '',
    description: isEditing ? 'We are looking for an experienced developer...' : '',
    requirements: isEditing ? '- 3+ years experience with React\n- Solid understanding of CSS' : ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      navigate('/recruiter/jobs');
    }, 500);
  };

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container container--narrow">
        <div className="reveal is-visible" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <span className="label">Recruiter Portal</span>
          <h1 style={{ marginTop: 'var(--spacing-sm)' }}>{isEditing ? 'Edit Job Posting' : 'Post New Job'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="glass-card reveal is-visible">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div>
              <label style={labelStyle}>Job Title</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                style={inputStyle} 
                placeholder="e.g. Senior Frontend Developer"
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Employment Type</label>
                <select name="type" value={formData.type} onChange={handleChange} style={inputStyle}>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Location</label>
                <input 
                  type="text" 
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  style={inputStyle} 
                  placeholder="e.g. Remote, New York..."
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Salary Range</label>
              <input 
                type="text" 
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                style={inputStyle} 
                placeholder="e.g. $80k - $100k or Negotiable"
              />
            </div>

            <div>
              <label style={labelStyle}>Job Description</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} 
                placeholder="Describe the role and responsibilities..."
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Requirements</label>
              <textarea 
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} 
                placeholder="List skills, qualifications, and experience needed..."
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => navigate('/recruiter/jobs')} className="btn btn--outline">Cancel</button>
              <button type="submit" className="btn btn--primary btn--pill">{isEditing ? 'Save Changes' : 'Publish Job'}</button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  fontWeight: '500',
  color: 'var(--color-charcoal)',
  fontSize: '0.9rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  background: 'rgba(255, 255, 255, 0.8)',
  fontFamily: 'var(--font-sans)',
  fontSize: '1rem',
  color: 'var(--color-text)',
  transition: 'border-color 0.3s'
};

export default PostJob;
