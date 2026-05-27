import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const mockJobs = [
  { id: 1, title: 'Senior Frontend Developer', status: 'Active', applicants: 12, posted: '2 days ago' },
  { id: 2, title: 'UX Designer', status: 'Closed', applicants: 45, posted: '2 weeks ago' },
];

const JobManagement = () => {
  const [jobs, setJobs] = useState(mockJobs);

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container">
        <div className="reveal is-visible" style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="label">Recruiter Portal</span>
            <h1 style={{ marginTop: 'var(--spacing-sm)' }}>Job Management</h1>
          </div>
          <Link to="/recruiter/jobs/new" className="btn btn--primary btn--pill">
            + Post New Job
          </Link>
        </div>

        <div className="glass-card reveal is-visible" style={{ padding: '0' }}>
          <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Your Postings</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--color-warm-white)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem', fontWeight: '500', color: 'var(--color-text-secondary)' }}>Job Title</th>
                  <th style={{ padding: '1rem', fontWeight: '500', color: 'var(--color-text-secondary)' }}>Status</th>
                  <th style={{ padding: '1rem', fontWeight: '500', color: 'var(--color-text-secondary)' }}>Applicants</th>
                  <th style={{ padding: '1rem', fontWeight: '500', color: 'var(--color-text-secondary)' }}>Posted</th>
                  <th style={{ padding: '1rem', fontWeight: '500', color: 'var(--color-text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.3s' }} className="job-row">
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{job.title}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '50px',
                        fontSize: '0.8rem',
                        background: job.status === 'Active' ? 'var(--color-moss-light)' : 'var(--color-stone)',
                        color: 'white'
                      }}>
                        {job.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>{job.applicants}</td>
                    <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>{job.posted}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link to={`/recruiter/jobs/edit/${job.id}`} className="btn btn--outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Edit</Link>
                        {job.status === 'Active' && (
                          <button className="btn btn--outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: '#d9534f', borderColor: '#d9534f' }}>Close</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                      No jobs posted yet. Create one to get started!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <style>{`
        .job-row:hover {
          background: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </div>
  );
};

export default JobManagement;
