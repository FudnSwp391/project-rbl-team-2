import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import { Eye, EyeOff, Mail, User, X } from 'lucide-react';
import './Auth.css';
import demoVideo from '../../assets/demo.mp4';

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

const Login = ({ initialView = 'login' }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(initialView === 'forgot-password');
  const [isRegister, setIsRegister] = useState(initialView === 'register');
  const [successMessage, setSuccessMessage] = useState('');
  
  const { user, login, loginWithOAuth, resetPassword, register } = useAuth();
  const navigate = useNavigate();

  const pwdStrength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      return setError('Vui lòng điền đầy đủ email và mật khẩu.');
    }

    setLoading(true);

    try {
      const { data, error } = await login(email, password);
      if (error) {
        throw error;
      }
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', data.user.id)
        .single();

      if (profileData?.status === 'banned') {
        await supabase.auth.signOut();
        throw new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
      }

      const role = profileData?.role?.toLowerCase() || data?.user?.user_metadata?.role?.toLowerCase();
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
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
    } catch (err) {
      setError(err.message || `Đã có lỗi xảy ra khi đăng nhập bằng ${provider}.`);
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!email) {
      return setError('Vui lòng nhập email của bạn.');
    }

    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) {
        throw error;
      }
      setSuccessMessage('Đã gửi liên kết khôi phục. Vui lòng kiểm tra email.');
    } catch (err) {
      setError(err.message || 'Không thể khôi phục mật khẩu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!fullName || !email || !password || !confirmPassword) {
      return setError('Vui lòng điền đầy đủ các thông tin.');
    }

    if (password.length < 8) {
      return setError('Mật khẩu phải có ít nhất 8 ký tự.');
    }

    if (password !== confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp.');
    }

    setLoading(true);

    try {
      const { data: emailExists, error: checkError } = await supabase
        .rpc('check_email_exists', { email_input: email });

      if (checkError) {
        console.warn('Không thể kiểm tra email:', checkError.message);
      }

      if (emailExists === true) {
        setLoading(false);
        return setError('Tài khoản Gmail này đã có người dùng khác sử dụng rồi. Vui lòng dùng email khác hoặc đăng nhập.');
      }

      const { error, data } = await register(email, password, {
        data: { full_name: fullName }
      });
      
      if (error) {
        throw error;
      }

      setSuccessMessage('Đăng ký thành công! Vui lòng kiểm tra email của bạn để xác nhận tài khoản.');
      
      setTimeout(() => {
        setIsRegister(false);
        setSuccessMessage('');
        setError('');
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
    <div className="auth-page auth-page--split animate-fade">
      <div className="auth-card-split reveal is-visible">
        <button 
          type="button"
          onClick={() => navigate('/')}
          className="auth-close-btn"
          title="Quay về trang chủ"
        >
          <X size={20} />
        </button>
        
      {/* ── Nửa bên trái: Video nền ── */}
      <div className="auth-media-side">
        <video 
          src={demoVideo} 
          autoPlay 
          loop 
          muted 
          playsInline 
        />
      </div>
        
        {/* ── Nửa bên phải: Form Đăng Nhập / Đăng Ký / Khôi phục ── */}
        <div className="auth-form-side">
          <div key={isRegister ? 'register' : isForgotPassword ? 'forgot' : 'login'} className="form-transition-enter" style={{ width: '100%' }}>
            
            <div className="auth-header">
              <h1>{isRegister ? 'ĐĂNG KÝ' : isForgotPassword ? 'KHÔI PHỤC MẬT KHẨU' : 'ĐĂNG NHẬP'}</h1>
              {isForgotPassword && (
                <p style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.9rem', textTransform: 'none', fontWeight: 'normal', lineHeight: '1.5' }}>
                  Nhập email của bạn và chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
                </p>
              )}
              {isRegister && (
                <p style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.9rem', textTransform: 'none', fontWeight: 'normal', lineHeight: '1.5' }}>
                  Tạo tài khoản mới để bắt đầu hành trình của bạn.
                </p>
              )}
            </div>

            {isRegister ? (
              <form onSubmit={handleRegisterSubmit} noValidate>
                <div className="auth-form-group">
                  <label htmlFor="reg-fullName">Họ và tên</label>
                  <div className="input-with-icon-wrapper">
                    <div className="input-icon-left">
                      <User size={18} />
                    </div>
                    <div className="input-divider"></div>
                    <input
                      type="text"
                      id="reg-fullName"
                      className="auth-input-no-border"
                      placeholder="Nhập họ và tên của bạn"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-form-group">
                  <label htmlFor="reg-email">Email</label>
                  <div className="input-with-icon-wrapper">
                    <div className="input-icon-left">
                      <Mail size={18} />
                    </div>
                    <div className="input-divider"></div>
                    <input
                      type="email"
                      id="reg-email"
                      className="auth-input-no-border"
                      placeholder="Nhập email của bạn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-form-group">
                  <label htmlFor="reg-password">Mật khẩu</label>
                  <div className="input-with-icon-wrapper">
                    <button
                      type="button"
                      className="input-icon-left password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <div className="input-divider"></div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="reg-password"
                      className="auth-input-no-border"
                      placeholder="Tạo mật khẩu (ít nhất 8 ký tự)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength="8"
                    />
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
                  <label htmlFor="reg-confirmPassword">Xác nhận mật khẩu</label>
                  <div className="input-with-icon-wrapper">
                    <button
                      type="button"
                      className="input-icon-left password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <div className="input-divider"></div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="reg-confirmPassword"
                      className="auth-input-no-border"
                      placeholder="Nhập lại mật khẩu"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength="8"
                    />
                  </div>
                </div>

                {error && <div className="auth-error-msg">{error}</div>}
                {successMessage && <div className="auth-success-msg" style={{marginTop: '1rem'}}>{successMessage}</div>}

                <button
                  type="submit"
                  className="btn btn--primary auth-submit-btn"
                  disabled={loading}
                >
                  Đăng ký tài khoản
                </button>

                <div className="auth-footer">
                  Đã có tài khoản?{' '}
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsRegister(false);
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="auth-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.9rem', display: 'inline', fontWeight: 600 }}
                  >
                    Đăng nhập
                  </button>
                </div>
              </form>
            ) : isForgotPassword ? (
              <form onSubmit={handleResetPassword} noValidate>
                <div className="auth-form-group">
                  <label htmlFor="reset-email">Email</label>
                  <div className="input-with-icon-wrapper">
                    <div className="input-icon-left">
                      <Mail size={18} />
                    </div>
                    <div className="input-divider"></div>
                    <input
                      type="email"
                      id="reset-email"
                      className="auth-input-no-border"
                      placeholder="Nhập email của bạn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {error && <div className="auth-error-msg">{error}</div>}
                {successMessage && <div className="auth-success-msg" style={{marginTop: '1rem'}}>{successMessage}</div>}

                <button
                  type="submit"
                  className="btn btn--primary auth-submit-btn"
                  disabled={loading}
                >
                  Gửi liên kết khôi phục
                </button>

                <div className="auth-footer">
                  Đã nhớ mật khẩu?{' '}
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsForgotPassword(false);
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="auth-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.9rem', display: 'inline', fontWeight: 600 }}
                  >
                    Đăng nhập
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <form onSubmit={handleSubmit} noValidate>
                  <div className="auth-form-group">
                    <label htmlFor="email">Email</label>
                    <div className="input-with-icon-wrapper">
                      <div className="input-icon-left">
                        <Mail size={18} />
                      </div>
                      <div className="input-divider"></div>
                      <input
                        type="email"
                        id="email"
                        className="auth-input-no-border"
                        placeholder="Nhập email của bạn"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="auth-form-group">
                    <label htmlFor="password">Mật khẩu</label>
                    <div className="input-with-icon-wrapper">
                      <button
                        type="button"
                        className="input-icon-left password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <div className="input-divider"></div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        className="auth-input-no-border"
                        placeholder="Nhập mật khẩu"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <button 
                      type="button" 
                      className="auth-forgot-password" 
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError('');
                        setSuccessMessage('');
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%' }}
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  {error && <div className="auth-error-msg">{error}</div>}

                  <button
                    type="submit"
                    className="btn btn--primary auth-submit-btn"
                    disabled={loading}
                  >
                    Đăng nhập
                  </button>
                </form>

                <div className="auth-divider">
                  <span>Hoặc đăng nhập với</span>
                </div>
                
                <div className="auth-social-group">
                  <button 
                    type="button"
                    className="auth-social-btn" 
                    onClick={() => handleOAuthLogin('google')}
                    disabled={loading}
                    title="Đăng nhập bằng Google"
                  >
                    <svg width="22" height="22" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.2-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                  </button>
                  <button 
                    type="button"
                    className="auth-social-btn" 
                    onClick={() => handleOAuthLogin('github')}
                    disabled={loading}
                    title="Đăng nhập bằng GitHub"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </button>
                </div>

                <div className="auth-footer">
                  Chưa có tài khoản?{' '}
                  <button 
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="auth-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.9rem', display: 'inline', fontWeight: 600 }}
                  >
                    Đăng ký ngay
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      
      </div> {/* Closes auth-card-split */}
    </div>
  );
};

export default Login;
