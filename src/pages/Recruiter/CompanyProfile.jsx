import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

const CompanyProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [companyId, setCompanyId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    website: '',
    address: '',
    description: '',
    logo_url: ''
  });

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .eq('recruiter_id', session.user.id)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setCompanyId(data.id);
        setFormData({
          name: data.company_name || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
          address: data.address || '',
          description: data.description || '',
          logo_url: data.logo_url || ''
        });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load company profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');

      const { error: updateError } = await supabase
        .from('companies')
        .update({
          company_name: formData.name,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          address: formData.address,
          description: formData.description,
          logo_url: formData.logo_url
        })
        .eq('recruiter_id', session.user.id);

      if (updateError) throw updateError;

      setSuccess('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      setError('Failed to save profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setSaving(true);
      setError('');
      
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('company-documents')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      setSuccess('Logo uploaded! Click "Save Settings" to apply.');
    } catch (err) {
      console.error(err);
      setError('Failed to upload logo: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem' }}>Loading company profile...</div>;
  }

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container container--narrow">
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/recruiter" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            ← Về trang Dashboard
          </Link>
        </div>

        <div className="reveal is-visible" style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="label">Recruiter Portal</span>
            <h1 style={{ marginTop: 'var(--spacing-sm)' }}>Company Profile</h1>
          </div>
          {companyId && (
            <button onClick={() => navigate(`/company/${companyId}`)} className="btn btn--outline" style={{ background: 'white' }}>
              View Public Page
            </button>
          )}
        </div>

        {error && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-card reveal is-visible">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                {formData.logo_url ? (
                  <img src={formData.logo_url} alt="Company Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  '🏢'
                )}
              </div>
              <div>
                <input 
                  type="file" 
                  id="logoUpload" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleLogoUpload} 
                />
                <button type="button" onClick={() => document.getElementById('logoUpload').click()} className="btn btn--outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Change Logo</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Company Name *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={inputStyle} 
                  required 
                />
              </div>
              <div>
                <label style={labelStyle}>Website</label>
                <input 
                  type="url" 
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  style={inputStyle} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Contact Email</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={inputStyle} 
                />
              </div>
              <div>
                <label style={labelStyle}>Contact Phone</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={inputStyle} 
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Headquarters Address</label>
              <input 
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleChange}
                style={inputStyle} 
              />
            </div>

            <div>
              <label style={labelStyle}>About the Company *</label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: '150px', resize: 'vertical' }} 
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="submit" disabled={saving} className="btn btn--primary btn--pill">
                {saving ? 'Saving...' : 'Save Settings'}
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

export default CompanyProfile;
