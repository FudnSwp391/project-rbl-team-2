import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../utils/AuthContext';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle } from 'lucide-react';

const RecruiterRegistration = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    website: '',
    description: '',
    companyFile: null
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, companyFile: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!user) {
      setErrorMessage('Bạn cần đăng nhập để thực hiện đăng ký nhà tuyển dụng.');
      return;
    }

    setIsSubmitting(true);

    try {
      let documentUrl = null;

      // 1. Nếu có file đính kèm, upload lên bucket 'company-documents'
      if (formData.companyFile) {
        const fileExt = formData.companyFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        
        const { data: fileData, error: uploadError } = await supabase.storage
          .from('company-documents')
          .upload(fileName, formData.companyFile);

        if (uploadError) {
          console.error("Lỗi upload file:", uploadError);
        } else if (fileData) {
          const { data: urlData } = supabase.storage
            .from('company-documents')
            .getPublicUrl(fileName);
          documentUrl = urlData.publicUrl;
        }
      }

      // 2. Lưu thông tin vào bảng companies
      const { error: insertError } = await supabase.from('companies').insert({
        recruiter_id: user.id,
        company_name: formData.companyName,
        email: formData.email,
        phone: formData.phone,
        tax_id: formData.taxId,
        website: formData.website,
        address: formData.address,
        description: formData.description,
        document_url: documentUrl,
        status: 'pending' // Mặc định
      });

      if (insertError) {
        if (insertError.code === '23505') { // Lỗi Unique constraint (đã đăng ký rồi)
          setErrorMessage('Tài khoản của bạn đã gửi yêu cầu đăng ký trước đó rồi!');
        } else {
          setErrorMessage('Có lỗi xảy ra khi gửi yêu cầu: ' + insertError.message);
        }
        setIsSubmitting(false);
        return;
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      setErrorMessage('Đã xảy ra lỗi không xác định.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    const successContainerVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
    };
    const successItemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
    };

    return (
      <motion.div 
        className="section" 
        style={{ background: 'var(--color-cream)', minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: '80px' }}
        variants={successContainerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="container container--narrow">
          <motion.div variants={successItemVariants} className="glass-card" style={{ textAlign: 'center', padding: '4rem 3rem', borderRadius: '24px', boxShadow: '0 20px 40px rgba(44, 40, 36, 0.05)', position: 'relative', overflow: 'hidden' }}>
            <div className="foliage-shadow" style={{ opacity: 0.2 }}></div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <motion.div 
                variants={successItemVariants}
                style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.1)', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem auto' }}
              >
                <CheckCircle size={40} strokeWidth={2.5} />
              </motion.div>
              
              <motion.h1 variants={successItemVariants} style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, color: 'var(--color-charcoal)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '-0.5px', marginBottom: '1.5rem', lineHeight: 1.2 }}>
                Đăng Ký Thành Công
              </motion.h1>
              
              <motion.div variants={successItemVariants} style={{ width: '60px', height: '4px', background: 'linear-gradient(90deg, #EA580C, #F97316)', borderRadius: '2px', margin: '0 auto 2rem auto' }} />

              <motion.p variants={successItemVariants} style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: '1.8', maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
                Cảm ơn bạn đã đăng ký trở thành <strong style={{ color: 'var(--color-charcoal)' }}>Nhà tuyển dụng</strong> trên hệ thống Interview Technology AI. Thông tin của doanh nghiệp đã được gửi đến ban quản trị để xét duyệt.
              </motion.p>
              
              <motion.p variants={successItemVariants} style={{ fontSize: '1.05rem', color: 'var(--color-text-secondary)', marginBottom: '3rem', lineHeight: '1.8', maxWidth: '600px', margin: '0 auto 3rem auto', background: 'rgba(0,0,0,0.02)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                Chúng tôi sẽ xử lý yêu cầu và gửi thông báo kết quả qua email<br/>
                <strong style={{ color: '#EA580C', fontSize: '1.15rem', display: 'block', marginTop: '0.5rem' }}>{formData.email}</strong><br/>
                trong vòng 24 - 48 giờ làm việc.
              </motion.p>
              
              <motion.button 
                variants={successItemVariants}
                onClick={() => navigate('/')}
                style={{
                  display: 'inline-flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '1.1rem',
                  padding: '1rem 2.5rem',
                  borderRadius: '50px',
                  background: 'var(--color-charcoal)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)'; e.currentTarget.style.background = '#000'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.15)'; e.currentTarget.style.background = 'var(--color-charcoal)'; }}
              >
                Quay lại Trang chủ
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  return (
    <motion.div 
      className="section" 
      style={{ background: 'var(--color-cream)', minHeight: '100vh', paddingTop: '120px' }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container container--narrow">
        <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ marginBottom: '1rem', background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.1), rgba(194, 65, 12, 0.1))', color: '#EA580C', padding: '0.5rem 1.25rem', borderRadius: '50px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', fontSize: '0.85rem' }}>
            Dành cho Doanh Nghiệp
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-charcoal)', letterSpacing: '-1px', margin: 0, fontFamily: 'var(--font-heading)' }}>
            Đăng Ký Nhà Tuyển Dụng
          </h1>
        </motion.div>

        <motion.form variants={itemVariants} onSubmit={handleSubmit} className="glass-card" style={{ padding: '3rem', borderRadius: '24px', boxShadow: '0 20px 40px rgba(44, 40, 36, 0.05)', position: 'relative', overflow: 'hidden' }}>
          <div className="foliage-shadow" style={{ opacity: 0.3 }}></div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '2rem', fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-charcoal)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
              Thông Tin Doanh Nghiệp
            </h3>
          
          {errorMessage && (
            <div style={{ padding: '1rem', background: '#ffebee', color: '#c62828', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #ffcdd2' }}>
              {errorMessage}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            <div>
              <label style={labelStyle}>Tên Doanh Nghiệp *</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                style={inputStyle}
                placeholder="VD: Công ty Cổ phần Công nghệ..."
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Email Liên Hệ *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="email@doanhnghiep.com"
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Số Điện Thoại *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="0123 456 789"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Mã Số Thuế *</label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Website Doanh Nghiệp</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Địa Chỉ Trụ Sở *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Số nhà, Tên đường, Quận/Huyện, Tỉnh/Thành phố"
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Giới Thiệu Ngắn (Lĩnh vực hoạt động) *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                placeholder="Mô tả ngắn gọn về quy mô và lĩnh vực hoạt động của doanh nghiệp..."
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Tài Liệu Đính Kèm (Hồ sơ năng lực, Giấy phép kinh doanh) *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  name="companyFile"
                  id="companyFile"
                  onChange={handleFileChange}
                  style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  required
                />
                <div style={{ 
                  ...inputStyle, 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2.5rem 1.5rem',
                  border: '2px dashed var(--border-color)',
                  background: 'var(--color-surface-alt)',
                  transition: 'all 0.3s ease',
                  textAlign: 'center'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#EA580C'; e.currentTarget.style.background = 'rgba(234,88,12,0.02)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--color-surface-alt)'; }}
                >
                  {formData.companyFile ? (
                    <>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(234,88,12,0.1)', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                        <FileText size={24} />
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '0.2rem', wordBreak: 'break-all' }}>{formData.companyFile.name}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{(formData.companyFile.size / (1024 * 1024)).toFixed(2)} MB • Nhấp để thay đổi</span>
                    </>
                  ) : (
                    <>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-cream)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                        <UploadCloud size={24} />
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '0.2rem' }}>Kéo thả hoặc nhấp để tải tài liệu lên</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Hỗ trợ định dạng: PDF, Word, Ảnh (Tối đa 5MB)</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem' }}>
              <h4 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-charcoal)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '-0.3px' }}>
                Điều khoản & Thỏa thuận dành cho doanh nghiệp
              </h4>
              <div style={{
                height: '180px',
                overflowY: 'auto',
                padding: '1.5rem',
                background: 'var(--color-cream)',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: '16px',
                fontSize: '0.95rem',
                color: 'var(--color-text-secondary)',
                lineHeight: '1.8',
                marginBottom: '1.5rem',
                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)'
              }}>
                <div style={{ marginBottom: '1.2rem' }}>
                  <strong style={{ color: 'var(--color-charcoal)' }}>1. Xác thực thông tin:</strong> Doanh nghiệp cam kết cung cấp thông tin đăng ký chính xác, hợp pháp và chịu hoàn toàn trách nhiệm trước pháp luật về tính minh bạch của doanh nghiệp.
                </div>
                <div style={{ marginBottom: '1.2rem' }}>
                  <strong style={{ color: 'var(--color-charcoal)' }}>2. Mục đích sử dụng:</strong> Tài khoản nhà tuyển dụng chỉ được sử dụng cho mục đích đăng tin tuyển dụng và tìm kiếm ứng viên trên nền tảng Interview Technology AI (ITA). Nghiêm cấm các hành vi lừa đảo, thu thập dữ liệu trái phép hoặc spam ứng viên.
                </div>
                <div style={{ marginBottom: '1.2rem' }}>
                  <strong style={{ color: 'var(--color-charcoal)' }}>3. Bảo mật dữ liệu:</strong> Doanh nghiệp cam kết bảo mật tuyệt đối thông tin CV, kết quả phỏng vấn AI và dữ liệu cá nhân của ứng viên theo đúng quy định của pháp luật về bảo vệ dữ liệu.
                </div>
                <div>
                  <strong style={{ color: 'var(--color-charcoal)' }}>4. Quyền của nền tảng:</strong> Ban quản trị ITA bảo lưu quyền từ chối phê duyệt, tạm ngưng hoặc thu hồi vĩnh viễn tư cách nhà tuyển dụng bất cứ lúc nào nếu phát hiện có dấu hiệu vi phạm điều khoản mà không cần báo trước.
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', cursor: 'pointer', marginBottom: '2.5rem' }}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  style={{ width: '1.4rem', height: '1.4rem', accentColor: '#EA580C', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.95rem', color: 'var(--color-charcoal)', fontWeight: '600' }}>
                  Tôi đã đọc và đồng ý với các Điều khoản & Thỏa thuận dành cho doanh nghiệp ở trên.
                </span>
              </label>

              <button
                type="submit"
                disabled={!agreedToTerms || isSubmitting}
                className="btn"
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '1.1rem',
                  padding: '1.2rem',
                  borderRadius: '50px',
                  background: '#EA580C',
                  color: 'white',
                  border: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 15px rgba(234, 88, 12, 0.3)',
                  transition: 'all 0.3s ease',
                  opacity: (!agreedToTerms || isSubmitting) ? 0.6 : 1,
                  cursor: (!agreedToTerms || isSubmitting) ? 'not-allowed' : 'pointer'
                }}
                onMouseOver={(e) => { if (agreedToTerms && !isSubmitting) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(234, 88, 12, 0.4)'; } }}
                onMouseOut={(e) => { if (agreedToTerms && !isSubmitting) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(234, 88, 12, 0.3)'; } }}
              >
                {isSubmitting ? 'Đang Gửi Yêu Cầu...' : 'Gửi Yêu Cầu Đăng Ký'}
              </button>
            </div>

          </div>
          </div>
        </motion.form>
      </div>
    </motion.div>
  );
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.6rem',
  fontWeight: '600',
  color: 'var(--color-charcoal)',
  fontSize: '0.95rem'
};

const inputStyle = {
  width: '100%',
  padding: '1.1rem 1.25rem',
  borderRadius: '12px',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  background: 'rgba(255, 255, 255, 0.8)',
  fontFamily: 'var(--font-sans)',
  fontSize: '1.05rem',
  color: 'var(--color-text)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  transition: 'all 0.3s ease',
  boxSizing: 'border-box',
  outline: 'none'
};

export default RecruiterRegistration;
