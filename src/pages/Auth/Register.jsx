import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import { Eye, EyeOff } from 'lucide-react';
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

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const pwdStrength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (password.length < 8) {
      return setError('Mật khẩu phải có ít nhất 8 ký tự.');
    }

    if (password !== confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp.');
    }

    setLoading(true);

    try {
      // === BƯỚC 1: KIỂM TRA EMAIL ĐÃ TỒN TẠI CHƯA (trước khi gọi signUp) ===
      // Gọi hàm RPC trên Supabase để kiểm tra bảng profiles (bypass RLS)
      const { data: emailExists, error: checkError } = await supabase
        .rpc('check_email_exists', { email_input: email });

      if (checkError) {
        console.warn('Không thể kiểm tra email:', checkError.message);
        // Nếu hàm RPC chưa tồn tại, vẫn cho phép tiếp tục đăng ký bình thường
      }

      if (emailExists === true) {
        setLoading(false);
        return setError('Tài khoản Gmail này đã có người dùng khác sử dụng rồi. Vui lòng dùng email khác hoặc đăng nhập.');
      }

      // === BƯỚC 2: ĐĂNG KÝ TÀI KHOẢN MỚI ===
      const { error, data } = await register(email, password, {
        data: {
          full_name: fullName,
        }
      });
      
      if (error) {
        throw error;
      }

      setSuccess('Đăng ký thành công! Vui lòng kiểm tra email của bạn để xác nhận tài khoản.');
      
      // Optionally redirect after a few seconds or let the user click login
      setTimeout(() => {
        navigate('/login');
      }, 5000);
      
    } catch (err) {
      const errorMsg = err.message || '';
      if (
        errorMsg.toLowerCase().includes('already registered') || 
        errorMsg.toLowerCase().includes('already exists') ||
        errorMsg.toLowerCase().includes('user already registered')
      ) {
        setError('Tài khoản Gmail này đã có người dùng khác sử dụng rồi. Vui lòng dùng email khác hoặc đăng nhập.');
      } else {
        setError(errorMsg || 'Đã có lỗi xảy ra khi đăng ký.');
      }
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
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="auth-input"
                placeholder="Tạo mật khẩu (ít nhất 8 ký tự)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="8"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {password && (
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
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                className="auth-input"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength="8"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
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
