import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

const JobManagement = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in.');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select('*')
        .eq('recruiter_id', session.user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setJobs(data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to close this job?')) return;
    
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'closed' })
        .eq('id', jobId);
        
      if (error) throw error;
      fetchJobs(); // refresh list
    } catch (err) {
      console.error('Error closing job:', err);
      alert('Failed to close job.');
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to completely delete this job? This action cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);
        
      if (error) throw error;
      fetchJobs(); // refresh list
    } catch (err) {
      console.error('Error deleting job:', err);
      alert('Failed to delete job.');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container">
        
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/recruiter" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            ← Về trang Dashboard
          </Link>
        </div>

        <div className="reveal is-visible" style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="label">Recruiter Portal</span>
            <h1 style={{ marginTop: 'var(--spacing-sm)' }}>Job Management</h1>
          </div>
          <Link to="/recruiter/jobs/new" className="btn btn--primary btn--pill">
            + Post New Job
          </Link>
        </div>

        {error && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div className="glass-card reveal is-visible" style={{ padding: '0' }}>
          <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Your Postings</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--color-warm-white)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem', fontWeight: '500', color: 'var(--color-text-secondary)' }}>Job Title</th>
                    <th style={{ padding: '1rem', fontWeight: '500', color: 'var(--color-text-secondary)' }}>Status</th>
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
                          background: job.status === 'open' ? 'var(--color-moss-light)' : 
                                      job.status === 'closed' ? 'var(--color-stone)' : '#f0ad4e',
                          color: 'white',
                          textTransform: 'capitalize'
                        }}>
                          {job.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>{formatDate(job.created_at)}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link to={`/recruiter/jobs/edit/${job.id}`} className="btn btn--outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Edit</Link>
                          {job.status === 'open' && (
                            <button onClick={() => handleCloseJob(job.id)} className="btn btn--outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: '#f0ad4e', borderColor: '#f0ad4e' }}>Close</button>
                          )}
                          <button onClick={() => handleDeleteJob(job.id)} className="btn btn--outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: '#d9534f', borderColor: '#d9534f' }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {jobs.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        No jobs posted yet. Create one to get started!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
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
