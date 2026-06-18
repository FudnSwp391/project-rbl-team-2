import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

const JobView = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();
        
      if (jobError) throw jobError;
      
      let companyInfo = { company_name: 'Unknown', email: '' };
      
      if (jobData) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('id, company_name, email, logo_url')
          .eq('recruiter_id', jobData.recruiter_id)
          .single();
          
        if (companyData) companyInfo = companyData;

        setJob({
          id: jobData.id,
          title: jobData.title,
          companyId: companyInfo.id,
          company: companyInfo.company_name,
          companyLogo: companyInfo.logo_url,
          contactEmail: companyInfo.email,
          type: jobData.job_type,
          location: jobData.location,
          salary: jobData.salary_range,
          posted: new Date(jobData.created_at).toLocaleDateString(),
          description: jobData.description,
          requirements: jobData.requirements,
          status: jobData.status
        });
      }
    } catch (err) {
      console.error(err);
      setError('Could not find this job posting.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem' }}>Loading...</div>;
  if (error || !job) return <div style={{ textAlign: 'center', padding: '5rem', color: '#d9534f' }}>{error || 'Job not found'}</div>;

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: '100vh' }}>
      <div className="container container--narrow">
        
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/jobs" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ← Quay về trang Việc làm
          </Link>
        </div>

        <div className="glass-card reveal is-visible" style={{ padding: '3rem', position: 'relative' }}>
          {job.status === 'closed' && (
            <div style={{ background: '#ffebee', color: '#c62828', padding: '0.5rem 1rem', borderRadius: '4px', display: 'inline-block', marginBottom: '1rem', fontWeight: 'bold' }}>
              ĐÃ NGỪNG TUYỂN DỤNG
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{job.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '1rem', flexWrap: 'wrap' }}>
                <Link to={`/company/${job.companyId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--color-charcoal)', fontWeight: '500', transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--color-moss)'} onMouseOut={(e) => e.target.style.color = 'var(--color-charcoal)'}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    {job.companyLogo ? <img src={job.companyLogo} alt={job.company} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏢'}
                  </div>
                  {job.company}
                </Link>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>📍 {job.location || 'N/A'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>⏱️ {job.posted}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem', padding: '1.5rem', background: 'rgba(255,255,255,0.4)', borderRadius: '12px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Employment Type</span>
              <strong style={{ color: 'var(--color-charcoal)' }}>{job.type || 'N/A'}</strong>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Salary Range</span>
              <strong style={{ color: 'var(--color-charcoal)' }}>{job.salary || 'Negotiable'}</strong>
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

          <div style={{ marginTop: '3rem', padding: '2rem', borderTop: '1px solid var(--border-color)', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Cách thức ứng tuyển</h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)' }}>
              Để ứng tuyển cho vị trí này, vui lòng gửi trực tiếp CV và Portfolio (nếu có) của bạn về email của doanh nghiệp.
            </p>
            {job.contactEmail ? (
              <a href={`mailto:${job.contactEmail}?subject=Ứng tuyển vị trí ${job.title}`} className="btn btn--primary btn--pill" style={{ display: 'inline-block', textDecoration: 'none' }}>
                Gửi Email Ứng Tuyển: {job.contactEmail}
              </a>
            ) : (
              <span style={{ color: '#d9534f' }}>Doanh nghiệp chưa cung cấp email liên hệ.</span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default JobView;
