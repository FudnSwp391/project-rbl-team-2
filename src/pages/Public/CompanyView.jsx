import React from 'react';
import { Link, useParams } from 'react-router-dom';

const mockCompany = {
  id: 1,
  name: 'TechCorp Solutions',
  industry: 'Information Technology',
  size: '50-200 employees',
  address: '123 Tech Boulevard, Innovation City',
  website: 'https://techcorp.example.com',
  description: 'TechCorp is a leading provider of innovative software solutions. We specialize in building scalable web applications and enterprise software that helps businesses grow and thrive in the digital age. Our team of passionate engineers works with cutting-edge technologies to solve complex problems.',
  jobs: [
    { id: 1, title: 'Senior Frontend Developer', type: 'Full-time', location: 'Ho Chi Minh City', posted: '2 days ago' },
    { id: 2, title: 'UX Designer', type: 'Full-time', location: 'Remote', posted: '2 weeks ago' }
  ]
};

const CompanyView = () => {
  const { id } = useParams();
  const company = mockCompany; // In real app, fetch by id

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: '100vh' }}>
      <div className="container">
        {/* Header Section */}
        <div className="glass-card reveal is-visible" style={{ padding: '3rem', marginBottom: 'var(--spacing-lg)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div className="foliage-shadow"></div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', margin: '0 auto 1.5rem', boxShadow: 'var(--shadow-md)' }}>
              🏢
            </div>
            <h1 style={{ marginBottom: '0.5rem' }}>{company.name}</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>{company.industry} • {company.size}</p>
            <a href={company.website} target="_blank" rel="noopener noreferrer" className="btn btn--outline" style={{ background: 'white' }}>Visit Website</a>
          </div>
        </div>

        <div className="grid-auto" style={{ gridTemplateColumns: '2fr 1fr' }}>
          {/* Main Content */}
          <div className="reveal is-visible reveal--delay-1">
            <div className="glass-card" style={{ marginBottom: 'var(--spacing-md)' }}>
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>About Us</h3>
              <p style={{ whiteSpace: 'pre-line' }}>{company.description}</p>
            </div>

            <div className="glass-card">
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Open Positions ({company.jobs.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {company.jobs.map(job => (
                  <Link to={`/company/${company.id}/job/${job.id}`} key={job.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ padding: '1.5rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.5)', transition: 'all 0.3s' }} className="job-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '1.1rem', color: 'var(--color-charcoal)' }}>{job.title}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{job.posted}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>📍 {job.location}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>⏱️ {job.type}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="reveal is-visible reveal--delay-2">
            <div className="glass-card">
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Contact Info</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span>📍</span>
                  <span>{company.address}</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🌐</span>
                  <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}>{company.website}</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .job-card:hover {
          background: white !important;
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default CompanyView;
