import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch approved companies
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, recruiter_id, company_name, logo_url')
        .eq('status', 'approved');
        
      // 2. Fetch open jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, job_type, location, created_at, recruiter_id')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;
      
      const formattedJobs = (jobsData || []).map(job => {
        const companyData = (companiesData || []).find(c => c.recruiter_id === job.recruiter_id);
        return {
          id: job.id,
          title: job.title,
          type: job.job_type || 'N/A',
          location: job.location || 'N/A',
          posted: new Date(job.created_at).toLocaleDateString(),
          company: companyData?.company_name || 'Unknown Company',
          companyId: companyData?.id || null,
          logo_url: companyData?.logo_url || null
        };
      });
      
      setJobs(formattedJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: '100vh' }}>
      <div className="container">
        
        <div className="reveal is-visible" style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
          <span className="label" style={{ marginBottom: '1rem' }}>Cơ Hội Nghề Nghiệp</span>
          <h1 style={{ marginBottom: '1rem' }}>Tìm Việc Làm</h1>
          <p style={{ maxWidth: '600px', margin: '0 auto' }}>Khám phá các vị trí tuyển dụng từ những công ty công nghệ hàng đầu và tìm kiếm bước tiến tiếp theo trong sự nghiệp của bạn.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Đang tải danh sách việc làm...</div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            Hiện tại chưa có công việc nào đang mở.
          </div>
        ) : (
          <div className="grid-auto">
            {jobs.map((job, index) => (
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
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', overflow: 'hidden' }}>
                    {job.logo_url ? <img src={job.logo_url} alt={job.company} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏢'}
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
        )}

      </div>
    </div>
  );
};

export default JobList;
