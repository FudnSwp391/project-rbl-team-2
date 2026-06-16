import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

const CompanyView = () => {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompanyAndJobs();
  }, [id]);

  const fetchCompanyAndJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch company details
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();
        
      if (companyError) throw companyError;
      
      // Fetch open jobs for this company
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, job_type, location, created_at')
        .eq('recruiter_id', companyData.recruiter_id)
        .eq('status', 'open')
        .order('created_at', { ascending: false });
        
      if (jobsError) throw jobsError;
      
      setCompany({
        id: companyData.id,
        name: companyData.company_name || 'Unknown Company',
        email: companyData.email,
        phone: companyData.phone,
        website: companyData.website || '#',
        address: companyData.address || 'Chưa cập nhật địa chỉ',
        description: companyData.description || 'Chưa có thông tin giới thiệu.',
        logo_url: companyData.logo_url,
        industry: 'Information Technology', // Default or fetch if industry table exists
        size: '50-200 employees', // Default
        jobs: (jobsData || []).map(job => ({
          id: job.id,
          title: job.title,
          type: job.job_type || 'N/A',
          location: job.location || 'N/A',
          posted: new Date(job.created_at).toLocaleDateString()
        }))
      });
    } catch (err) {
      console.error('Error fetching company:', err);
      setError('Could not load company profile.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem' }}>Đang tải thông tin doanh nghiệp...</div>;
  }

  if (error || !company) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: '#d9534f' }}>{error || 'Không tìm thấy doanh nghiệp.'}</div>;
  }

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: '100vh' }}>
      <div className="container">
        
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/jobs" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            ← Quay về Danh sách Việc làm
          </Link>
        </div>

        {/* Header Section */}
        <div className="glass-card reveal is-visible" style={{ padding: '3rem', marginBottom: 'var(--spacing-lg)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div className="foliage-shadow"></div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', margin: '0 auto 1.5rem', boxShadow: 'var(--shadow-md)', overflow: 'hidden', border: '2px solid var(--border-color)' }}>
              {company.logo_url ? (
                <img src={company.logo_url} alt={company.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                '🏢'
              )}
            </div>
            <h1 style={{ marginBottom: '0.5rem' }}>{company.name}</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>{company.industry} • {company.size}</p>
            {company.website !== '#' && (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="btn btn--outline" style={{ background: 'white' }}>Visit Website</a>
            )}
          </div>
        </div>

        <div className="grid-auto" style={{ gridTemplateColumns: '2fr 1fr' }}>
          {/* Main Content */}
          <div className="reveal is-visible reveal--delay-1">
            <div className="glass-card" style={{ marginBottom: 'var(--spacing-md)' }}>
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Giới thiệu công ty</h3>
              <p style={{ whiteSpace: 'pre-line', lineHeight: '1.8', color: 'var(--color-charcoal)' }}>{company.description}</p>
            </div>

            <div className="glass-card">
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Việc làm đang tuyển dụng ({company.jobs.length})</h3>
              {company.jobs.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem 0' }}>Hiện tại công ty không có việc làm nào đang mở.</p>
              ) : (
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
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="reveal is-visible reveal--delay-2">
            <div className="glass-card">
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Thông tin liên hệ</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span>📍</span>
                  <span>{company.address}</span>
                </li>
                {company.website !== '#' && (
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🌐</span>
                    <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'underline', wordBreak: 'break-all' }}>{company.website}</a>
                  </li>
                )}
                {company.email && (
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>✉️</span>
                    <a href={`mailto:${company.email}`} style={{ color: 'var(--color-accent)', textDecoration: 'underline', wordBreak: 'break-all' }}>{company.email}</a>
                  </li>
                )}
                {company.phone && (
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>📞</span>
                    <span>{company.phone}</span>
                  </li>
                )}
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
