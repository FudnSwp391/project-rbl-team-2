import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import './Auth.css';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (password !== confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp.');
    }

    setLoading(true);

    try {
      const { error, data } = await register(email, password, {
        data: {
          full_name: fullName,
        }
      });
      
      if (error) {
        throw error;
      }

      setSuccess('Đăng ký thành công! Vui lòng kiểm tra email của bạn để xác nhận tài khoản (nếu Supabase yêu cầu).');
      
      // Optionally redirect after a few seconds or let the user click login
      setTimeout(() => {
        navigate('/login');
      }, 5000);
      
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra khi đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade">
      <div className="auth-container glass-card reveal is-visible">
        <div className="auth-header">
          <h1>Đăng ký</h1>
          <p>Tạo tài khoản mới để bắt đầu hành trình của bạn.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label htmlFor="fullName">Họ và tên</label>
            <input
              type="text"
              id="fullName"
              className="auth-input"
              placeholder="Nhập họ và tên của bạn"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="auth-input"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              className="auth-input"
              placeholder="Tạo mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <input
              type="password"
              id="confirmPassword"
              className="auth-input"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>

          {error && <div className="auth-error-msg">{error}</div>}
          {success && <div className="auth-success-msg">{success}</div>}

          <button 
            type="submit" 
            className="btn btn--primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
          </button>
        </form>

        <div className="auth-footer">
          Đã có tài khoản?{' '}
          <Link to="/login" className="auth-link">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
