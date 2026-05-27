import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithOAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await login(email, password);
      if (error) {
        throw error;
      }
      
      // Lấy role từ bảng profiles trên Supabase
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const role = profileData?.role || data?.user?.user_metadata?.role;
      if (role === 'admin') {
        navigate('/admin'); // Redirect admin tới trang Admin Panel
      } else {
        navigate('/dashboard'); // Redirect user thường tới Dashboard
      }
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra khi đăng nhập.');
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setError('');
    setLoading(true);
    try {
      const { error } = await loginWithOAuth(provider);
      if (error) throw error;
      // Note: Supabase OAuth usually redirects automatically, so no need to navigate manually here
    } catch (err) {
      setError(err.message || `Đã có lỗi xảy ra khi đăng nhập bằng ${provider}.`);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade">
      <div className="auth-container glass-card reveal is-visible">
        <div className="auth-header">
          <h1>Đăng nhập</h1>
          <p>Chào mừng trở lại! Vui lòng đăng nhập vào tài khoản của bạn.</p>
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

          <div className="auth-form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              type="password"
              id="password"
              className="auth-input"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Link to="/forgot-password" className="auth-forgot-password">
              Quên mật khẩu?
            </Link>
          </div>

          {error && <div className="auth-error-msg">{error}</div>}

          <button
            type="submit"
            className="btn btn--primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="auth-divider">
          <span>Hoặc đăng nhập với</span>
        </div>
        
        <div className="auth-social-group">
          <button 
            type="button"
            className="btn btn--outline auth-social-btn" 
            onClick={() => handleOAuthLogin('google')}
            disabled={loading}
          >
            Google
          </button>
          <button 
            type="button"
            className="btn btn--outline auth-social-btn" 
            onClick={() => handleOAuthLogin('github')}
            disabled={loading}
          >
            GitHub
          </button>
        </div>

        <div className="auth-footer">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="auth-link">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
