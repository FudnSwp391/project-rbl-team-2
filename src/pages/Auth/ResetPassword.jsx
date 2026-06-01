import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import './Auth.css';

const getPasswordStrength = (pass) => {
  if (!pass) return { label: '', color: 'transparent', width: '0%' };
  if (pass.length < 8) return { label: 'Quá ngắn (ít nhất 8 ký tự)', color: '#D32F2F', width: '25%' };
  
  let strength = 0;
  if (/[a-zA-Z]/.test(pass)) strength += 1;
  if (/[0-9]/.test(pass)) strength += 1;
  if (/[^a-zA-Z0-9]/.test(pass)) strength += 1;
  
  if (strength === 1) return { label: 'Yếu', color: '#ff9800', width: '50%' };
  if (strength === 2) return { label: 'Trung bình', color: '#2196F3', width: '75%' };
  if (strength >= 3) return { label: 'Mạnh', color: '#4CAF50', width: '100%' };
  
  return { label: '', color: 'transparent', width: '0%' };
};

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const pwdStrength = getPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      return setError('Mật khẩu phải có ít nhất 8 ký tự.');
    }

    if (newPassword !== confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp.');
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(newPassword);

      if (error) {
        throw error;
      }

      setSuccess('Đặt lại mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra khi đặt lại mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade">
      <div className="auth-container glass-card reveal is-visible">
        <div className="auth-header">
          <h1>Đặt lại mật khẩu</h1>
          <p>Nhập mật khẩu mới cho tài khoản của bạn.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label htmlFor="newPassword">Mật khẩu mới</label>
            <input
              type="password"
              id="newPassword"
              className="auth-input"
              placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength="8"
            />
            {newPassword && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ height: '4px', width: '100%', backgroundColor: '#e9ecef', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pwdStrength.width, backgroundColor: pwdStrength.color, transition: 'all 0.3s ease-in-out' }}></div>
                </div>
                <small style={{ color: pwdStrength.color, marginTop: '4px', display: 'block', fontSize: '0.85rem', fontWeight: '500' }}>
                  Độ mạnh: {pwdStrength.label}
                </small>
              </div>
            )}
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
              minLength="8"
            />
          </div>

          {error && <div className="auth-error-msg">{error}</div>}
          {success && <div className="auth-success-msg">{success}</div>}

          <button 
            type="submit" 
            className="btn btn--primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="auth-link">
            ← Quay lại trang đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
