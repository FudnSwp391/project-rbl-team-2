import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

const PostJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: '',
    type: 'Full-time',
    location: '',
    salary: '',
    description: '',
    requirements: '',
    industry_id: ''
  });

  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkCompanyStatus();
    fetchIndustries();
    if (isEditing) {
      fetchJobDetails();
    }
  }, [id]);

  const checkCompanyStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('companies').select('status').eq('recruiter_id', session.user.id).single();
      if (data?.status !== 'approved') {
        alert('Bạn chưa được duyệt để đăng bài!');
        navigate('/recruiter');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchIndustries = async () => {
    try {
      const { data, error } = await supabase.from('industries').select('*');
      if (error) throw error;
      setIndustries(data || []);
      if (data && data.length > 0 && !isEditing) {
        setFormData(prev => ({ ...prev, industry_id: data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching industries:', err);
    }
  };

  const fetchJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (data) {
        setFormData({
          title: data.title || '',
          type: data.job_type || 'Full-time',
          location: data.location || '',
          salary: data.salary_range || '',
          description: data.description || '',
          requirements: data.requirements || '',
          industry_id: data.industry_id || ''
        });
      }
    } catch (err) {
      console.error('Error fetching job details:', err);
      setError('Could not load job details.');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('You must be logged in to post a job.');

      const recruiterId = session.user.id;

      const jobPayload = {
        recruiter_id: recruiterId,
        title: formData.title,
        job_type: formData.type,
        location: formData.location,
        salary_range: formData.salary,
        description: formData.description,
        requirements: formData.requirements,
        industry_id: formData.industry_id,
        status: 'open'
      };

      if (isEditing) {
        const { error: updateError } = await supabase
          .from('jobs')
          .update(jobPayload)
          .eq('id', id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('jobs')
          .insert([jobPayload]);
        if (insertError) throw insertError;
      }

      navigate('/recruiter/jobs');
    } catch (err) {
      console.error('Error saving job:', err);
      setError(err.message || 'An error occurred while saving the job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container container--narrow">
        <div className="reveal is-visible" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <span className="label">Recruiter Portal</span>
          <h1 style={{ marginTop: 'var(--spacing-sm)' }}>{isEditing ? 'Edit Job Posting' : 'Post New Job'}</h1>
        </div>

        {error && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-card reveal is-visible">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div>
              <label style={labelStyle}>Job Title</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                style={inputStyle} 
                placeholder="e.g. Senior Frontend Developer"
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Employment Type</label>
                <select name="type" value={formData.type} onChange={handleChange} style={inputStyle}>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Industry</label>
                <select name="industry_id" value={formData.industry_id} onChange={handleChange} style={inputStyle} required>
                  <option value="" disabled>Select an industry</option>
                  {industries.map(ind => (
                    <option key={ind.id} value={ind.id}>{ind.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Location</label>
                <input 
                  type="text" 
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  style={inputStyle} 
                  placeholder="e.g. Remote, New York..."
                />
              </div>
              <div>
                <label style={labelStyle}>Salary Range</label>
                <input 
                  type="text" 
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  style={inputStyle} 
                  placeholder="e.g. $80k - $100k or Negotiable"
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Job Description</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} 
                placeholder="Describe the role and responsibilities..."
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Requirements</label>
              <textarea 
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }} 
                placeholder="List skills, qualifications, and experience needed..."
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => navigate('/recruiter/jobs')} className="btn btn--outline" disabled={loading}>Cancel</button>
              <button type="submit" className="btn btn--primary btn--pill" disabled={loading}>
                {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Publish Job')}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  fontWeight: '500',
  color: 'var(--color-charcoal)',
  fontSize: '0.9rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  background: 'rgba(255, 255, 255, 0.8)',
  fontFamily: 'var(--font-sans)',
  fontSize: '1rem',
  color: 'var(--color-text)',
  transition: 'border-color 0.3s'
};

export default PostJob;
