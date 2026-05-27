import React from 'react';
import { Link } from 'react-router-dom';

const RecruiterDashboard = () => {
  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container">
        <div className="reveal is-visible" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <span className="label">Recruiter Portal</span>
          <h1 style={{ marginTop: 'var(--spacing-sm)' }}>Dashboard</h1>
          <p>Manage your company profile, job postings, and share knowledge through blogs.</p>
        </div>

        <div className="grid-auto">
          {/* Company Profile Settings */}
          <Link to="/recruiter/company" className="glass-card reveal is-visible" style={{ display: 'block', textDecoration: 'none' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏢</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Company Profile</h3>
            <p style={{ fontSize: '0.9rem' }}>Update your company details, logo, and information visible to candidates.</p>
          </Link>

          {/* Job Management */}
          <Link to="/recruiter/jobs" className="glass-card reveal is-visible reveal--delay-1" style={{ display: 'block', textDecoration: 'none' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💼</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Job Management</h3>
            <p style={{ fontSize: '0.9rem' }}>Post new job openings, manage existing ones, and track applicants.</p>
          </Link>

          {/* Blog Management */}
          <Link to="/recruiter/blogs" className="glass-card reveal is-visible reveal--delay-2" style={{ display: 'block', textDecoration: 'none' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Blog Management</h3>
            <p style={{ fontSize: '0.9rem' }}>Share interview tips, company culture, and news through articles and videos.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
