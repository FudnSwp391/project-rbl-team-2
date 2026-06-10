import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import { Building, Shield, FileText, Upload, Globe, Phone, Mail, FileCheck, Landmark } from 'lucide-react';
import '../Auth/Auth.css'; // Reuse profile/auth styling

const CompanyProfile = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('company_info'); // company_info, document, security

  // Company Profile States
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [status, setStatus] = useState('');

  // Logo & Document Upload States
  const [newLogoFile, setNewLogoFile] = useState(null);
  const [newDocFile, setNewDocFile] = useState(null);

  // Security States
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Messages & Loading
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [docMessage, setDocMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      fetchCompanyData();
    }
  }, [user]);

  const fetchCompanyData = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('recruiter_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching company profile:', error);
      }

      if (data) {
        setCompanyName(data.company_name || '');
        setEmail(data.email || user.email || '');
        setPhone(data.phone || '');
        setTaxId(data.tax_id || '');
        setWebsite(data.website || '');
        setAddress(data.address || '');
        setDescription(data.description || '');
        setLogoUrl(data.logo_url || '');
        setDocumentUrl(data.document_url || '');
        setStatus(data.status || 'pending');
      } else {
        // Fallback or self-healing
        setEmail(user.email || '');
        setCompanyName(user.user_metadata?.full_name || '');
      }
    } catch (err) {
      console.error('Failed to load company data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });
    setLoading(true);

    try {
      // Check if company record already exists
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .eq('recruiter_id', user.id)
        .maybeSingle();

      let dbError;
      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('companies')
          .update({
            company_name: companyName,
            email: email,
            phone: phone,
            tax_id: taxId,
            website: website,
            address: address,
            description: description,
            updated_at: new Date().toISOString()
          })
          .eq('recruiter_id', user.id);
        dbError = error;
      } else {
        // Insert new record (fallback)
        const { error } = await supabase
          .from('companies')
          .insert({
            recruiter_id: user.id,
            company_name: companyName,
            email: email,
            phone: phone,
            tax_id: taxId,
            website: website,
            address: address,
            description: description,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        dbError = error;
      }

      if (dbError) throw dbError;

      // Update profiles full_name and user metadata
      await supabase
        .from('profiles')
        .update({ full_name: companyName, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      await updateProfile({
        full_name: companyName,
        phone: phone
      });

      setProfileMessage({ type: 'success', text: 'Cập nhật thông tin doanh nghiệp thành công!' });
      fetchCompanyData();
    } catch (err) {
      console.error(err);
      setProfileMessage({ type: 'error', text: err.message || 'Lỗi khi cập nhật thông tin.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLogoUploading(true);
    setProfileMessage({ type: '', text: '' });

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${user.id}-${Date.now()}.${fileExt}`;

      const { data: fileData, error: uploadError } = await supabase.storage
        .from('company-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('company-documents')
        .getPublicUrl(fileName);

      const publicLogoUrl = urlData.publicUrl;

      // Update in companies table
      const { error: dbError } = await supabase
        .from('companies')
        .update({
          logo_url: publicLogoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('recruiter_id', user.id);

      if (dbError) throw dbError;

      setLogoUrl(publicLogoUrl);
      setProfileMessage({ type: 'success', text: 'Cập nhật Logo doanh nghiệp thành công!' });
    } catch (err) {
      console.error(err);
      setProfileMessage({ type: 'error', text: err.message || 'Lỗi khi tải logo lên.' });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleDocChange = (e) => {
    setNewDocFile(e.target.files[0]);
    setDocMessage({ type: '', text: '' });
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!newDocFile) {
      setDocMessage({ type: 'error', text: 'Vui lòng chọn một file trước khi tải lên.' });
      return;
    }

    setUploadProgress(true);
    setDocMessage({ type: '', text: '' });

    try {
      const fileExt = newDocFile.name.split('.').pop();
      const fileName = `license-${user.id}-${Date.now()}.${fileExt}`;

      const { data: fileData, error: uploadError } = await supabase.storage
        .from('company-documents')
        .upload(fileName, newDocFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('company-documents')
        .getPublicUrl(fileName);

      const publicDocUrl = urlData.publicUrl;

      // Update in database
      const { error: dbError } = await supabase
        .from('companies')
        .update({
          document_url: publicDocUrl,
          updated_at: new Date().toISOString()
        })
        .eq('recruiter_id', user.id);

      if (dbError) throw dbError;

      setDocumentUrl(publicDocUrl);
      setNewDocFile(null);
      setDocMessage({ type: 'success', text: 'Tải lên giấy phép kinh doanh/hồ sơ năng lực thành công!' });
    } catch (err) {
      console.error(err);
      setDocMessage({ type: 'error', text: err.message || 'Lỗi khi tải tài liệu lên.' });
    } finally {
      setUploadProgress(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (password !== confirmPassword) {
      return setPasswordMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
    }
    if (password.length < 8) {
      return setPasswordMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 8 ký tự.' });
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(password);
      if (error) throw error;
      setPasswordMessage({ type: 'success', text: 'Cập nhật mật khẩu thành công!' });
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message || 'Lỗi khi đổi mật khẩu.' });
    } finally {
      setLoading(false);
    }
  };

  const renderCompanyInfoTab = () => (
    <div className="animate-fade">
      <form onSubmit={handleUpdateProfile} className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <Building size={22} color="var(--color-earth)" />
          Thông Tin Doanh Nghiệp
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Logo Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Company Logo"
                  style={{ width: '90px', height: '90px', borderRadius: '16px', objectFit: 'cover', border: '2px solid var(--border-color)' }}
                />
              ) : (
                <div style={{ width: '90px', height: '90px', borderRadius: '16px', background: 'rgba(139,115,85,0.1)', color: 'var(--color-earth)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: '2px dashed var(--border-color)' }}>
                  🏢
                </div>
              )}
              {logoUploading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                  Tải lên...
                </div>
              )}
            </div>
            <div>
              <label htmlFor="logoUpload" className="btn btn--outline" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', cursor: 'pointer', display: 'inline-block' }}>
                Thay Đổi Logo
              </label>
              <input
                type="file"
                id="logoUpload"
                accept="image/*"
                onChange={handleLogoChange}
                style={{ display: 'none' }}
                disabled={logoUploading}
              />
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Định dạng JPG, PNG. Dung lượng tối đa 2MB.
              </p>
            </div>
          </div>

          {/* Company Name & Tax ID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="auth-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="companyName">Tên Doanh Nghiệp *</label>
              <input
                type="text"
                id="companyName"
                className="auth-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
            <div className="auth-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="taxId" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Landmark size={14} /> Mã Số Thuế *
              </label>
              <input
                type="text"
                id="taxId"
                className="auth-input"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="auth-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="email" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Mail size={14} /> Email Doanh Nghiệp *
              </label>
              <input
                type="email"
                id="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="auth-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="phone" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Phone size={14} /> Số Điện Thoại *
              </label>
              <input
                type="tel"
                id="phone"
                className="auth-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Website & Address */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="auth-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="website" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Globe size={14} /> Website Doanh Nghiệp
              </label>
              <input
                type="url"
                id="website"
                className="auth-input"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="auth-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="address">Địa Chỉ Trụ Sở *</label>
              <input
                type="text"
                id="address"
                className="auth-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="auth-form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="description">Giới Thiệu Doanh Nghiệp *</label>
            <textarea
              id="description"
              className="auth-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ minHeight: '120px', resize: 'vertical', lineHeight: '1.6' }}
              placeholder="Quy mô, lĩnh vực hoạt động, văn hóa công ty..."
              required
            />
          </div>

          {profileMessage.text && (
            <div className={profileMessage.type === 'error' ? 'auth-error-msg' : 'auth-success-msg'}>
              {profileMessage.text}
            </div>
          )}

          <button
            type="submit"
            className="btn btn--primary btn--pill"
            style={{ width: '100%', marginTop: '0.5rem', padding: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderDocumentTab = () => (
    <div className="animate-fade">
      <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <FileText size={22} color="var(--color-earth)" />
          Hồ Sơ Năng Lực & Giấy Phép
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Status Badge */}
          <div>
            <h4 style={{ fontSize: '1rem', color: 'var(--color-charcoal)', marginBottom: '0.5rem' }}>Trạng thái tài khoản tuyển dụng:</h4>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: status === 'approved' ? '#059669' : (status === 'rejected' ? '#e11d48' : '#d97706'),
              fontWeight: '600',
              fontSize: '0.95rem',
              padding: '0.4rem 1rem',
              borderRadius: '9999px',
              background: status === 'approved' ? 'rgba(16,185,129,0.1)' : (status === 'rejected' ? 'rgba(225,29,72,0.1)' : 'rgba(217,119,6,0.1)'),
              textTransform: 'capitalize'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: status === 'approved' ? '#10b981' : (status === 'rejected' ? '#f43f5e' : '#f59e0b') }} />
              {status === 'approved' ? 'Đã phê duyệt' : (status === 'rejected' ? 'Bị từ chối' : 'Chờ phê duyệt')}
            </span>
          </div>

          {/* Current Document View */}
          <div>
            <h4 style={{ fontSize: '1rem', color: 'var(--color-charcoal)', marginBottom: '0.75rem' }}>Tài liệu đính kèm doanh nghiệp</h4>
            {documentUrl ? (
              <div style={{
                padding: '1.25rem',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(107,127,92,0.1)', color: 'var(--color-moss)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                    <FileCheck size={20} />
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--color-charcoal)' }}>Giấy phép kinh doanh / Profile</span>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Tài liệu chứng minh tính hợp pháp của doanh nghiệp</p>
                  </div>
                </div>
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--outline"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', textDecoration: 'none' }}
                >
                  Xem Tài Liệu
                </a>
              </div>
            ) : (
              <div style={{
                padding: '2rem',
                border: '1px dashed var(--border-color)',
                borderRadius: '12px',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
                background: 'rgba(0,0,0,0.01)'
              }}>
                Chưa có giấy phép hoặc hồ sơ doanh nghiệp được tải lên.
              </div>
            )}
          </div>

          {/* Upload New Document */}
          <form onSubmit={handleUploadDocument} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--color-charcoal)', marginBottom: '0.75rem' }}>Tải lên tài liệu năng lực / giấy phép kinh doanh mới</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                position: 'relative',
                border: '2px dashed var(--border-color)',
                borderRadius: '12px',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }} onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-earth)'} onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                <input
                  type="file"
                  id="newDocFile"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleDocChange}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={32} color="var(--color-text-muted)" />
                  <span style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--color-charcoal)' }}>
                    {newDocFile ? newDocFile.name : 'Chọn file tài liệu mới hoặc kéo thả tại đây'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Hỗ trợ định dạng PDF, Word, Ảnh (Tối đa 5MB)
                  </span>
                </div>
              </div>

              {docMessage.text && (
                <div className={docMessage.type === 'error' ? 'auth-error-msg' : 'auth-success-msg'}>
                  {docMessage.text}
                </div>
              )}

              <button
                type="submit"
                className="btn btn--primary btn--pill"
                style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                disabled={uploadProgress || !newDocFile}
              >
                {uploadProgress ? 'Đang Tải Lên...' : 'Tải Tài Liệu Lên'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="animate-fade">
      <form onSubmit={handleUpdatePassword} className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <Shield size={22} color="var(--color-earth)" />
          Đổi Mật Khẩu Tài Khoản
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="auth-form-group">
            <label htmlFor="newPassword">Mật khẩu mới *</label>
            <input
              type="password"
              id="newPassword"
              className="auth-input"
              placeholder="Nhập mật khẩu mới (Tối thiểu 8 ký tự)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="confirmNewPassword">Xác nhận mật khẩu mới *</label>
            <input
              type="password"
              id="confirmNewPassword"
              className="auth-input"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {passwordMessage.text && (
            <div className={passwordMessage.type === 'error' ? 'auth-error-msg' : 'auth-success-msg'}>
              {passwordMessage.text}
            </div>
          )}

          <button
            type="submit"
            className="btn btn--outline"
            style={{ width: '100%', marginTop: '0.5rem', padding: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Đang cập nhật...' : 'Đổi Mật Khẩu'}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="auth-page animate-fade" style={{ alignItems: 'flex-start', paddingTop: 'var(--spacing-3xl)', background: 'var(--color-cream)', minHeight: '100vh' }}>
      <div className="container" style={{ maxWidth: '1000px', width: '100%' }}>
        {/* Header */}
        <div className="auth-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', textAlign: 'left', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="label" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>Recruiter Profile</span>
            <h1>Thông tin doanh nghiệp</h1>
            <p>Quản lý và cập nhật thông tin giới thiệu, địa chỉ doanh nghiệp hiển thị trên trang tin tuyển dụng.</p>
          </div>
          {status === 'approved' && (
            <button
              onClick={() => navigate(`/company/${user.id}`)}
              className="btn btn--outline"
              style={{ background: 'white', padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
            >
              Xem Trang Công Ty Công Khai
            </button>
          )}
        </div>

        {loadingData ? (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>Đang tải dữ liệu hồ sơ Doanh nghiệp...</p>
          </div>
        ) : (
          <div className="profile-layout">
            {/* Sidebar */}
            <div className="profile-sidebar">
              <button
                className={`profile-tab-btn ${activeTab === 'company_info' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('company_info');
                  setProfileMessage({ type: '', text: '' });
                }}
              >
                <span>🏢</span> Thông tin chung
              </button>
              <button
                className={`profile-tab-btn ${activeTab === 'document' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('document');
                  setDocMessage({ type: '', text: '' });
                }}
              >
                <span>📄</span> Giấy phép & Hồ sơ
              </button>
              <button
                className={`profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('security');
                  setPasswordMessage({ type: '', text: '' });
                }}
              >
                <span>🔒</span> Bảo mật tài khoản
              </button>
              <button
                className="profile-tab-btn"
                onClick={() => navigate('/recruiter')}
                style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', borderRadius: 0 }}
              >
                <span>🚪</span> Quay lại Portal
              </button>
            </div>

            {/* Content Area */}
            <div className="profile-content">
              {activeTab === 'company_info' && renderCompanyInfoTab()}
              {activeTab === 'document' && renderDocumentTab()}
              {activeTab === 'security' && renderSecurityTab()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyProfile;
