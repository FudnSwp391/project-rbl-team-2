import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CompanyProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: 'TechCorp Solutions',
    website: 'https://techcorp.example.com',
    industry: 'Information Technology',
    size: '50-200 employees',
    description: 'TechCorp is a leading provider of innovative software solutions...',
    address: '123 Tech Boulevard, Innovation City'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate save
    alert('Company profile updated successfully!');
  };

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container container--narrow">
        <div className="reveal is-visible" style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="label">Recruiter Portal</span>
            <h1 style={{ marginTop: 'var(--spacing-sm)' }}>Company Profile</h1>
          </div>
          <button onClick={() => navigate('/company/1')} className="btn btn--outline" style={{ background: 'white' }}>
            View Public Page
          </button>
        </div>

        <form onSubmit={handleSubmit} className="glass-card reveal is-visible">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: '1px solid var(--border-color)' }}>
                🏢
              </div>
              <button type="button" className="btn btn--outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Change Logo</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Company Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={inputStyle} 
                  required 
                />
              </div>
              <div>
                <label style={labelStyle}>Website</label>
                <input 
                  type="url" 
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  style={inputStyle} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Industry</label>
                <input 
                  type="text" 
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  style={inputStyle} 
                />
              </div>
              <div>
                <label style={labelStyle}>Company Size</label>
                <select name="size" value={formData.size} onChange={handleChange} style={inputStyle}>
                  <option>1-10 employees</option>
                  <option>11-50 employees</option>
                  <option>50-200 employees</option>
                  <option>201-500 employees</option>
                  <option>500+ employees</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Headquarters Address</label>
              <input 
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleChange}
                style={inputStyle} 
              />
            </div>

            <div>
              <label style={labelStyle}>About the Company</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: '150px', resize: 'vertical' }} 
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" className="btn btn--primary btn--pill">Save Settings</button>
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

export default CompanyProfile;
