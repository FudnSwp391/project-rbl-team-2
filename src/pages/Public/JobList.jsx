import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { motion } from 'framer-motion';

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  return (
    <motion.div 
      className="section" 
      style={{ background: 'var(--color-cream)', minHeight: '100vh', paddingTop: '120px' }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container">
        
        <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
          <span style={{ marginBottom: '1rem', background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.1), rgba(194, 65, 12, 0.1))', color: '#EA580C', padding: '0.5rem 1.25rem', borderRadius: '50px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', fontSize: '0.85rem' }}>
            Cơ Hội Nghề Nghiệp
          </span>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-charcoal)', letterSpacing: '-1px', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
            Tìm Việc Làm
          </h1>
          <p style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--color-text-secondary)', fontSize: '1.15rem', fontWeight: 500, lineHeight: 1.6 }}>
            Khám phá các vị trí tuyển dụng từ những công ty công nghệ hàng đầu và tìm kiếm bước tiến tiếp theo trong sự nghiệp của bạn.
          </p>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Đang tải danh sách việc làm...</div>
        ) : jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            Hiện tại chưa có công việc nào đang mở.
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2.5rem' }}>
            {jobs.map((job, index) => (
              <motion.div key={job.id} variants={itemVariants} style={{ flex: '1 1 320px', maxWidth: '400px' }}>
                <Link to={`/company/${job.companyId}/job/${job.id}`} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  textDecoration: 'none', 
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 
                  height: '100%', 
                  background: '#ffffff',
                  borderRadius: '16px', 
                  padding: '1.5rem', 
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '6px 6px 0px #e0e7ff',
                  position: 'relative'
                }} 
                onMouseOver={(e) => { 
                  e.currentTarget.style.transform = 'translate(-4px, -4px)'; 
                  e.currentTarget.style.boxShadow = '10px 10px 0px #e0e7ff'; 
                  const btn = e.currentTarget.querySelector('.job-btn');
                  if(btn) {
                    btn.style.background = '#EA580C';
                    btn.style.color = '#ffffff';
                  }
                }} 
                onMouseOut={(e) => { 
                  e.currentTarget.style.transform = 'translate(0, 0)'; 
                  e.currentTarget.style.boxShadow = '6px 6px 0px #e0e7ff'; 
                  const btn = e.currentTarget.querySelector('.job-btn');
                  if(btn) {
                    btn.style.background = 'transparent';
                    btn.style.color = '#EA580C';
                  }
                }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em', 
                      fontWeight: '700',
                      color: 'var(--color-charcoal)',
                      background: '#ffffff',
                      border: '1px solid rgba(0,0,0,0.1)',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '50px'
                    }}>
                      {job.type}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{job.posted}</span>
                  </div>

                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1.25rem', lineHeight: '1.35', color: 'var(--color-charcoal)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>
                    {job.title}
                  </h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flex: 1 }}>
                    <div style={{ 
                      width: '42px', 
                      height: '42px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, var(--color-accent-vivid), var(--color-accent))', 
                      color: 'white',
                      overflow: 'hidden',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)',
                      flexShrink: 0
                    }}>
                      {job.logo_url ? <img src={job.logo_url} alt={job.company} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (job.company || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-charcoal)' }}>{job.company}</span>
                      <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '2px', fontWeight: 500 }}>📍 {job.location}</span>
                    </div>
                  </div>
                  
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', textAlign: 'center', marginTop: 'auto' }}>
                    <span className="job-btn" style={{ 
                      display: 'inline-block', 
                      width: '100%', 
                      padding: '0.6rem', 
                      fontSize: '0.9rem', 
                      fontWeight: 700,
                      color: '#EA580C',
                      border: '2px solid #EA580C',
                      borderRadius: '50px',
                      transition: 'all 0.3s ease'
                    }}>
                      Xem chi tiết
                    </span>
                  </div>

                </Link>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default JobList;
