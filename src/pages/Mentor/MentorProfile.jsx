import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import { User, Shield, FileText, Upload, Link as LinkIcon, Phone, Mail, Award, BookOpen, Clock } from 'lucide-react';
import '../Auth/Auth.css'; // Reuse profile/auth styling

const MentorProfile = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('personal'); // personal, certificate, security

  // Personal Info & Professional States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [bio, setBio] = useState('');
  const [expertise, setExpertise] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  
  // Document State
  const [documentUrl, setDocumentUrl] = useState(null);
  const [newFile, setNewFile] = useState(null);
  
  // Security States
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Messages & Loading
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [certMessage, setCertMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Parse major and yearsOfExperience from combined expertise string
  const parseExpertise = (expStr) => {
    if (!expStr) return { expertise: '', yearsOfExperience: '' };
    const regex = /^(.*?)\s*\((\d+)\s*năm kinh nghiệm\)$/;
    const match = expStr.match(regex);
    if (match) {
      return {
        expertise: match[1].trim(),
        yearsOfExperience: match[2].trim()
      };
    }
    // If it doesn't match standard template, try to find a number
    const numRegex = /(\d+)/;
    const numMatch = expStr.match(numRegex);
    return {
      expertise: expStr.replace(/\(\d+.*?\)/, '').trim(),
      yearsOfExperience: numMatch ? numMatch[1] : ''
    };
  };

  useEffect(() => {
    if (user) {
      fetchMentorData();
    }
  }, [user]);

  const fetchMentorData = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from('mentors')
        .select('*')
        .eq('mentor_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching mentor profile:', error);
      }

      if (data) {
        setFullName(data.full_name || '');
        setEmail(data.email || user.email || '');
        setPhone(data.phone || '');
        setLinkedinUrl(data.linkedin_url || '');
        setBio(data.bio || '');
        setDocumentUrl(data.document_url || null);
        
        const parsed = parseExpertise(data.expertise);
        setExpertise(parsed.expertise);
        setYearsOfExperience(parsed.yearsOfExperience);
      } else {
        // Fallback to user metadata if mentor record not found
        setFullName(user.user_metadata?.full_name || '');
        setEmail(user.email || '');
        setPhone(user.user_metadata?.phone || '');
      }
    } catch (err) {
      console.error('Failed to load mentor data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const combinedExpertise = `${expertise} (${yearsOfExperience} năm kinh nghiệm)`;

      // 1. Update mentors table
      const { error: mentorError } = await supabase
        .from('mentors')
        .update({
          full_name: fullName,
          phone: phone,
          expertise: combinedExpertise,
          linkedin_url: linkedinUrl,
          bio: bio,
          updated_at: new Date().toISOString()
        })
        .eq('mentor_id', user.id);

      if (mentorError) throw mentorError;

      // 2. Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. Update Auth Metadata
      const { error: authError } = await updateProfile({
        full_name: fullName,
        phone: phone
      });

      if (authError) throw authError;

      setProfileMessage({ type: 'success', text: 'Cập nhật thông tin Mentor thành công!' });
      
      // Refresh local state
      fetchMentorData();
    } catch (err) {
      console.error(err);
      setProfileMessage({ type: 'error', text: err.message || 'Lỗi khi cập nhật thông tin.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setNewFile(e.target.files[0]);
    setCertMessage({ type: '', text: '' });
  };

  const handleUploadCertificate = async (e) => {
    e.preventDefault();
    if (!newFile) {
      setCertMessage({ type: 'error', text: 'Vui lòng chọn một file trước khi tải lên.' });
      return;
    }

    setUploadProgress(true);
    setCertMessage({ type: '', text: '' });

    try {
      const fileExt = newFile.name.split('.').pop();
      const fileName = `mentor-${user.id}-${Date.now()}.${fileExt}`;
      let uploadedUrl = null;

      // Upload to mentor-documents bucket
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('mentor-documents')
        .upload(fileName, newFile);

      if (uploadError) {
        console.warn("Lỗi upload bucket mentor-documents, thử fallback...", uploadError);
        // Fallback to company-documents
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from('company-documents')
          .upload(fileName, newFile);

        if (fallbackError) throw fallbackError;

        if (fallbackData) {
          const { data: urlData } = supabase.storage
            .from('company-documents')
            .getPublicUrl(fileName);
          uploadedUrl = urlData.publicUrl;
        }
      } else if (fileData) {
        const { data: urlData } = supabase.storage
          .from('mentor-documents')
          .getPublicUrl(fileName);
        uploadedUrl = urlData.publicUrl;
      }

      if (!uploadedUrl) throw new Error("Không lấy được public URL của file.");

      // Update in database
      const { error: dbError } = await supabase
        .from('mentors')
        .update({
          document_url: uploadedUrl,
          updated_at: new Date().toISOString()
        })
        .eq('mentor_id', user.id);

      if (dbError) throw dbError;

      setDocumentUrl(uploadedUrl);
      setNewFile(null);
      setCertMessage({ type: 'success', text: 'Tải lên chứng chỉ/CV mới thành công!' });
    } catch (err) {
      console.error(err);
      setCertMessage({ type: 'error', text: err.message || 'Lỗi khi tải lên file.' });
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

  const renderPersonalInfoTab = () => (
    <div className="animate-fade">
      <form onSubmit={handleUpdateProfile} className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <User size={22} color="var(--color-earth)" />
          Thông Tin Cá Nhân & Chuyên Môn
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Full Name & Email */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="auth-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="fullName">Họ và tên *</label>
              <input
                type="text"
                id="fullName"
                className="auth-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="auth-form-group" style={{ marginBottom: 0 }}>
              <label>Email liên hệ (Không thể thay đổi)</label>
              <input
                type="email"
                className="auth-input"
                value={email}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed', background: 'rgba(0,0,0,0.05)' }}
              />
            </div>
          </div>

          {/* Phone & LinkedIn */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="auth-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="phone" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Phone size={14} /> Số điện thoại *
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
            <div className="auth-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="linkedinUrl" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <LinkIcon size={14} /> LinkedIn Profile URL
              </label>
              <input
                type="url"
                id="linkedinUrl"
                className="auth-input"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
          </div>

          {/* Expertise & Experience */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="auth-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="expertise" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <BookOpen size={14} /> Lĩnh vực chuyên môn (Major) *
              </label>
              <select
                id="expertise"
                className="auth-input"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                required
                style={{ appearance: 'auto' }}
              >
                <option value="">Chọn lĩnh vực...</option>
                <option value="Frontend Development">Frontend Development</option>
                <option value="Backend Development">Backend Development</option>
                <option value="Fullstack Development">Fullstack Development</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="Data Science / AI">Data Science / AI</option>
                <option value="DevOps / Cloud">DevOps / Cloud</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Project Management">Project Management</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
            <div className="auth-form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="yearsOfExperience" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={14} /> Số năm kinh nghiệm *
              </label>
              <select
                id="yearsOfExperience"
                className="auth-input"
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(e.target.value)}
                required
                style={{ appearance: 'auto' }}
              >
                <option value="">Chọn số năm...</option>
                <option value="1">1 - 2 năm</option>
                <option value="3">3 - 5 năm</option>
                <option value="5">5 - 10 năm</option>
                <option value="10">Trên 10 năm</option>
              </select>
            </div>
          </div>

          {/* Bio */}
          <div className="auth-form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="bio">Giới thiệu bản thân & Động lực hướng dẫn *</label>
            <textarea
              id="bio"
              className="auth-input"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              style={{ minHeight: '120px', resize: 'vertical', lineHeight: '1.6' }}
              placeholder="Giới thiệu bản thân..."
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

  const renderCertificateTab = () => (
    <div className="animate-fade">
      <div className="glass-card" style={{ padding: 'var(--spacing-xl)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <FileText size={22} color="var(--color-earth)" />
          Hồ Sơ & Chứng Chỉ Đính Kèm
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Current Document View */}
          <div>
            <h4 style={{ fontSize: '1rem', color: 'var(--color-charcoal)', marginBottom: '0.75rem' }}>Tài liệu hiện tại</h4>
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
                    <Award size={20} />
                  </div>
                  <div>
                    <span style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--color-charcoal)' }}>Chứng chỉ / CV của bạn</span>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Đã được tải lên và xác minh</p>
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
                Chưa có tài liệu/chứng chỉ đính kèm.
              </div>
            )}
          </div>

          {/* Upload New Document */}
          <form onSubmit={handleUploadCertificate} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--color-charcoal)', marginBottom: '0.75rem' }}>Tải lên tài liệu mới</h4>
            
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
                  id="newFile"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
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
                    {newFile ? newFile.name : 'Chọn file mới hoặc kéo thả tại đây'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Hỗ trợ định dạng PDF, Word, Ảnh (Tối đa 5MB)
                  </span>
                </div>
              </div>

              {certMessage.text && (
                <div className={certMessage.type === 'error' ? 'auth-error-msg' : 'auth-success-msg'}>
                  {certMessage.text}
                </div>
              )}

              <button
                type="submit"
                className="btn btn--primary btn--pill"
                style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                disabled={uploadProgress || !newFile}
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
          Đổi Mật Khẩu
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
    <div className="auth-page animate-fade" style={{ alignItems: 'flex-start', paddingTop: 'var(--spacing-3xl)' }}>
      <div className="container" style={{ maxWidth: '1000px', width: '100%' }}>
        {/* Header */}
        <div className="auth-header" style={{ textAlign: 'left', marginBottom: 'var(--spacing-lg)' }}>
          <span className="label" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>Mentor Profile</span>
          <h1>Hồ sơ Mentor</h1>
          <p>Cập nhật thông tin chuyên môn, kinh nghiệm và chứng chỉ của bạn để hiển thị cho ứng viên.</p>
        </div>

        {loadingData ? (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>Đang tải dữ liệu hồ sơ Mentor...</p>
          </div>
        ) : (
          <div className="profile-layout">
            {/* Sidebar */}
            <div className="profile-sidebar">
              <button
                className={`profile-tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('personal');
                  setProfileMessage({ type: '', text: '' });
                }}
              >
                <span>👤</span> Thông tin chuyên môn
              </button>
              <button
                className={`profile-tab-btn ${activeTab === 'certificate' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('certificate');
                  setCertMessage({ type: '', text: '' });
                }}
              >
                <span>📄</span> Chứng chỉ & Hồ sơ
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
                onClick={() => navigate('/mentor')}
                style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', borderRadius: 0 }}
              >
                <span>🚪</span> Quay lại Portal
              </button>
            </div>

            {/* Content Area */}
            <div className="profile-content">
              {activeTab === 'personal' && renderPersonalInfoTab()}
              {activeTab === 'certificate' && renderCertificateTab()}
              {activeTab === 'security' && renderSecurityTab()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorProfile;
