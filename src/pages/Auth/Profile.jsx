import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import './Auth.css';

const Profile = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('personal'); // personal, cv, history

  // Personal Info States
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Security States
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // Dynamic Data States
  const [cvs, setCvs] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (user?.user_metadata) {
      setFullName(user.user_metadata.full_name || '');
      setDob(user.user_metadata.dob || '');
      setPhone(user.user_metadata.phone || '');
      setAddress(user.user_metadata.address || '');
    }

    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    setLoadingData(true);
    try {
      // Fetch user's CVs (assuming table name is 'cvs' and has user_id)
      const { data: cvData, error: cvError } = await supabase
        .from('cvs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (!cvError && cvData) {
        setCvs(cvData);
      }

      // Fetch user's practice history (assuming table name is 'interview_history')
      const { data: historyData, error: historyError } = await supabase
        .from('interview_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (!historyError && historyData) {
        setHistory(historyData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Suppress errors visually since tables might not exist yet
    } finally {
      setLoadingData(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });
    setLoading(true);

    try {
      const { error } = await updateProfile({ 
        full_name: fullName,
        dob: dob,
        phone: phone,
        address: address
      });
      if (error) throw error;
      setProfileMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message || 'Lỗi khi cập nhật thông tin.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (password !== confirmPassword) {
      return setPasswordMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp.' });
    }
    if (password.length < 6) {
      return setPasswordMessage({ type: 'error', text: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(password);
      if (error) throw error;
      setPasswordMessage({ type: 'success', text: 'Cập nhật mật khẩu thành công!' });
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message || 'Lỗi khi cập nhật mật khẩu.' });
    } finally {
      setLoading(false);
    }
  };

  const renderPersonalInfoTab = () => (
    <div className="grid-auto animate-fade">
      {/* General Info Form */}
      <div className="glass-card reveal is-visible" style={{ padding: 'var(--spacing-md)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Thông tin chung</h3>
        
        <form onSubmit={handleUpdateProfile}>
          <div className="auth-form-group">
            <label>Email (Không thể thay đổi)</label>
            <input
              type="email"
              className="auth-input"
              value={user?.email || ''}
              disabled
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="fullName">Họ và tên</label>
            <input
              type="text"
              id="fullName"
              className="auth-input"
              placeholder="Nhập họ và tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="dob">Ngày sinh</label>
            <input
              type="date"
              id="dob"
              className="auth-input"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="phone">Số điện thoại</label>
            <input
              type="tel"
              id="phone"
              className="auth-input"
              placeholder="Nhập số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="address">Địa chỉ</label>
            <input
              type="text"
              id="address"
              className="auth-input"
              placeholder="Nhập địa chỉ của bạn"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {profileMessage.text && (
            <div className={profileMessage.type === 'error' ? 'auth-error-msg' : 'auth-success-msg'}>
              {profileMessage.text}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn--primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </form>
      </div>

      {/* Security Form */}
      <div className="glass-card reveal is-visible" style={{ padding: 'var(--spacing-md)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Bảo mật</h3>
        
        <form onSubmit={handleUpdatePassword}>
          <div className="auth-form-group">
            <label htmlFor="newPassword">Mật khẩu mới</label>
            <input
              type="password"
              id="newPassword"
              className="auth-input"
              placeholder="Nhập mật khẩu mới"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="confirmNewPassword">Xác nhận mật khẩu mới</label>
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
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Đang lưu...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );

  const renderCVTab = () => (
    <div className="glass-card reveal is-visible animate-fade" style={{ padding: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h3 style={{ margin: 0 }}>Quản lý CV</h3>
        <button 
          onClick={() => navigate('/cv-analysis')}
          className="btn btn--primary" 
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          + Tải CV mới
        </button>
      </div>

      <div className="mock-list">
        {loadingData ? (
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</p>
        ) : cvs.length > 0 ? (
          cvs.map(cv => (
            <div key={cv.id} className="mock-list-item">
              <div className="mock-item-info">
                <h4>{cv.file_name || 'Tên file không xác định'}</h4>
                <p>Tải lên ngày: {new Date(cv.created_at).toLocaleDateString('vi-VN')} {cv.file_size ? `• ${cv.file_size}` : ''}</p>
              </div>
              <div className="mock-item-actions">
                <span className={`status-badge ${cv.status === 'Đã phân tích' ? 'success' : 'pending'}`}>
                  {cv.status || 'Đang xử lý'}
                </span>
                <button 
                  onClick={() => navigate('/cv-analysis')}
                  className={cv.status === 'Đã phân tích' ? "btn btn--outline" : "btn btn--primary"}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                >
                  {cv.status === 'Đã phân tích' ? 'Xem chi tiết' : 'Phân tích ngay'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.3)', borderRadius: '12px' }}>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Bạn chưa tải lên CV nào.</p>
            <button onClick={() => navigate('/cv-analysis')} className="btn btn--outline">
              Phân tích CV đầu tiên
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="glass-card reveal is-visible animate-fade" style={{ padding: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h3 style={{ margin: 0 }}>Lịch sử thực hành</h3>
        <button 
          onClick={() => navigate('/interview')}
          className="btn btn--primary" 
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          Luyện tập tiếp
        </button>
      </div>

      <div className="mock-list">
        {loadingData ? (
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</p>
        ) : history.length > 0 ? (
          history.map(item => (
            <div key={item.id} className="mock-list-item">
              <div className="mock-item-info">
                <h4>Phỏng vấn {item.role_title || 'Mặc định'}</h4>
                <p>Ngày thi: {new Date(item.created_at).toLocaleDateString('vi-VN')} {item.duration ? `• Thời gian: ${item.duration}` : ''}</p>
              </div>
              <div className="mock-item-actions">
                <span className={`status-badge ${item.score >= 80 ? 'success' : 'pending'}`}>
                  Điểm: {item.score || 0}/100
                </span>
                <button 
                  className="btn btn--outline" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                >
                  Xem phản hồi
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.3)', borderRadius: '12px' }}>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Bạn chưa có lịch sử phỏng vấn nào.</p>
            <button onClick={() => navigate('/interview')} className="btn btn--outline">
              Bắt đầu luyện tập
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="auth-page animate-fade" style={{ alignItems: 'flex-start', paddingTop: 'var(--spacing-3xl)' }}>
      <div className="container" style={{ maxWidth: '1000px', width: '100%' }}>
        
        <div className="auth-header" style={{ textAlign: 'left', marginBottom: 'var(--spacing-lg)' }}>
          <h1>Hồ sơ & Quản lý</h1>
          <p>Quản lý thông tin, xem lại CV và lịch sử phỏng vấn của bạn.</p>
        </div>

        <div className="profile-layout">
          {/* Sidebar Tabs */}
          <div className="profile-sidebar">
            <button 
              className={`profile-tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              <span>👤</span> Hồ sơ cá nhân
            </button>
            <button 
              className={`profile-tab-btn ${activeTab === 'cv' ? 'active' : ''}`}
              onClick={() => setActiveTab('cv')}
            >
              <span>📄</span> Quản lý CV
            </button>
            <button 
              className={`profile-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <span>🕒</span> Lịch sử thực hành
            </button>
          </div>

          {/* Main Content Area */}
          <div className="profile-content">
            {activeTab === 'personal' && renderPersonalInfoTab()}
            {activeTab === 'cv' && renderCVTab()}
            {activeTab === 'history' && renderHistoryTab()}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
