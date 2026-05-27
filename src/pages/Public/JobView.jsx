import React from 'react';
import { Link, useParams } from 'react-router-dom';

const mockJob = {
  id: 1,
  title: 'Senior Frontend Developer',
  company: 'TechCorp Solutions',
  companyId: 1,
  type: 'Full-time',
  location: 'Ho Chi Minh City',
  salary: 'Negotiable',
  posted: '2 days ago',
  description: `We are looking for an experienced Senior Frontend Developer to join our core product team. You will be responsible for building complex web applications that serve millions of users.

Responsibilities:
- Architect and develop scalable frontend applications using React
- Collaborate with designers and backend engineers
- Optimize applications for maximum speed and scalability
- Mentor junior developers`,
  requirements: `- 4+ years of professional experience with React and modern JavaScript
- Strong understanding of web performance optimization
- Experience with state management (Redux, Zustand, etc.)
- Familiarity with CI/CD pipelines
- Excellent problem-solving skills and attention to detail`
};

const JobView = () => {
  const { jobId } = useParams();
  const job = mockJob; // Real app: fetch by jobId

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: '100vh' }}>
      <div className="container container--narrow">
        
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to={`/company/${job.companyId}`} style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ← Back to {job.company}
          </Link>
        </div>

        <div className="glass-card reveal is-visible" style={{ padding: '3rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{job.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-text-secondary)', fontSize: '1rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>🏢 {job.company}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>📍 {job.location}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>⏱️ {job.posted}</span>
              </div>
            </div>
            <button className="btn btn--primary btn--pill" style={{ padding: '1rem 2.5rem', fontSize: '1rem' }}>Apply Now</button>
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem', padding: '1.5rem', background: 'rgba(255,255,255,0.4)', borderRadius: '12px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Employment Type</span>
              <strong style={{ color: 'var(--color-charcoal)' }}>{job.type}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Salary Range</span>
              <strong style={{ color: 'var(--color-charcoal)' }}>{job.salary}</strong>
            </div>
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.4rem' }}>Job Description</h3>
            <div style={{ whiteSpace: 'pre-line', color: 'var(--color-text)', lineHeight: '1.8' }}>
              {job.description}
            </div>
          </div>

          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.4rem' }}>Requirements</h3>
            <div style={{ whiteSpace: 'pre-line', color: 'var(--color-text)', lineHeight: '1.8' }}>
              {job.requirements}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', textAlign: 'center' }}>
            <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)' }}>Interested in this position?</p>
            <button className="btn btn--primary btn--pill" style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}>Apply for this job</button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default JobView;
