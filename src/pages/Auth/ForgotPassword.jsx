import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) {
        throw error;
      }
      setMessage('Đã gửi liên kết khôi phục mật khẩu. Vui lòng kiểm tra hộp thư email của bạn.');
    } catch (err) {
      setError(err.message || 'Không thể khôi phục mật khẩu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade">
      <div className="auth-container glass-card reveal is-visible">
        <div className="auth-header">
          <h1>Khôi phục Mật khẩu</h1>
          <p>Nhập email của bạn và chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.</p>
        </div>

        <form onSubmit={handleSubmit}>
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

          {error && <div className="auth-error-msg">{error}</div>}
          {message && <div className="auth-success-msg">{message}</div>}

          <button 
            type="submit" 
            className="btn btn--primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Đang gửi...' : 'Gửi liên kết khôi phục'}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="auth-link">
            ← Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
