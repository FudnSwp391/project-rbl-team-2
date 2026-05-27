import React from 'react';
import { Link } from 'react-router-dom';

const mockJobs = [
  { id: 1, title: 'Senior Frontend Developer', company: 'TechCorp Solutions', companyId: 1, type: 'Full-time', location: 'Ho Chi Minh City', posted: '2 days ago' },
  { id: 2, title: 'UX Designer', company: 'TechCorp Solutions', companyId: 1, type: 'Full-time', location: 'Remote', posted: '2 weeks ago' },
  { id: 3, title: 'Backend Engineer (Node.js)', company: 'Global Innovations', companyId: 2, type: 'Contract', location: 'Hanoi', posted: '1 day ago' },
];

const JobList = () => {
  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: '100vh' }}>
      <div className="container">
        
        <div className="reveal is-visible" style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
          <span className="label" style={{ marginBottom: '1rem' }}>Cơ Hội Nghề Nghiệp</span>
          <h1 style={{ marginBottom: '1rem' }}>Tìm Việc Làm</h1>
          <p style={{ maxWidth: '600px', margin: '0 auto' }}>Khám phá các vị trí tuyển dụng từ những công ty công nghệ hàng đầu và tìm kiếm bước tiến tiếp theo trong sự nghiệp của bạn.</p>
        </div>

        <div className="grid-auto">
          {mockJobs.map((job, index) => (
            <Link to={`/company/${job.companyId}/job/${job.id}`} key={job.id} className={`glass-card reveal is-visible reveal--delay-${(index % 4) + 1}`} style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', transition: 'transform 0.4s var(--ease-out-expo), box-shadow 0.4s var(--ease-out-expo)' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em', 
                  fontWeight: '600',
                  color: 'var(--color-earth)',
                  background: 'rgba(255,255,255,0.7)',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '50px'
                }}>
                  {job.type}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{job.posted}</span>
              </div>

              <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', lineHeight: '1.3', color: 'var(--color-charcoal)' }}>
                {job.title}
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', flex: 1 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                  🏢
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-charcoal)' }}>{job.company}</span>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>📍 {job.location}</span>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', textAlign: 'center' }}>
                <span className="btn btn--outline" style={{ display: 'inline-block', width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}>Xem chi tiết</span>
              </div>

            </Link>
          ))}
        </div>

      </div>
    </div>
  );
};

export default JobList;
