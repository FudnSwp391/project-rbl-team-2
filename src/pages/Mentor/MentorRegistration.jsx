import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../utils/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, UploadCloud, FileText, CheckCircle } from 'lucide-react';

const MentorRegistration = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    expertise: '',
    yearsOfExperience: '',
    linkedinUrl: '',
    bio: '',
    mentorFile: null
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, mentorFile: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!user) {
      setErrorMessage('Bạn cần đăng nhập để thực hiện đăng ký Mentor.');
      return;
    }

    setIsSubmitting(true);

    try {
      let documentUrl = null;

      // 1. Upload tài liệu đính kèm (CV / chứng chỉ)
      if (formData.mentorFile) {
        const fileExt = formData.mentorFile.name.split('.').pop();
        const fileName = `mentor-${user.id}-${Date.now()}.${fileExt}`;

        const { data: fileData, error: uploadError } = await supabase.storage
          .from('mentor-documents')
          .upload(fileName, formData.mentorFile);

        if (uploadError) {
          console.error("Lỗi upload file:", uploadError);
          // Fallback: try company-documents bucket
          const { data: fallbackData, error: fallbackError } = await supabase.storage
            .from('company-documents')
            .upload(fileName, formData.mentorFile);
          if (!fallbackError && fallbackData) {
            const { data: urlData } = supabase.storage
              .from('company-documents')
              .getPublicUrl(fileName);
            documentUrl = urlData.publicUrl;
          }
        } else if (fileData) {
          const { data: urlData } = supabase.storage
            .from('mentor-documents')
            .getPublicUrl(fileName);
          documentUrl = urlData.publicUrl;
        }
      }

      // 2. Lưu yêu cầu đăng ký vào bảng mentors (dựa trên cấu trúc 13 cột chính xác từ ảnh của bạn)
      const mentorsTableData = {
        mentor_id: user.id, // sử dụng mentor_id làm khoá ngoại trỏ tới profiles.id
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        expertise: `${formData.expertise} (${formData.yearsOfExperience} năm kinh nghiệm)`,
        linkedin_url: formData.linkedinUrl,
        bio: formData.bio,
        avatar_url: user.user_metadata?.avatar_url || null,
        document_url: documentUrl,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Dữ liệu cho bảng cũ nếu có
      const oldTableData = {
        user_id: user.id,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        expertise: formData.expertise,
        years_of_experience: parseInt(formData.yearsOfExperience) || 0,
        linkedin_url: formData.linkedinUrl,
        bio: formData.bio,
        document_url: documentUrl,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      // 2a. Thử ghi vào bảng 'mentors' chính xác của bạn trước
      let insertError = null;
      try {
        const { error } = await supabase
          .from('mentors')
          .insert(mentorsTableData);
        insertError = error;
      } catch (e) {
        insertError = e;
      }

      // 2b. Fallback 1: Thử ghi vào bảng 'mentor_registrations' (nếu bảng mentors bị lỗi không xác định)
      if (insertError && (insertError.code === '42P01' || insertError.message?.includes('does not exist') || insertError.message?.includes('column'))) {
        try {
          const { error } = await supabase
            .from('mentor_registrations')
            .insert(oldTableData);
          insertError = error;
        } catch (e) {
          insertError = e;
        }
      }

      // 2c. Fallback 2: Thử ghi vào bảng 'companies' làm dự phòng cuối cùng
      if (insertError) {
        if (insertError.code === '42P01' || insertError.message?.includes('does not exist') || insertError.message?.includes('column')) {
          const { error: fallbackInsertError } = await supabase.from('companies').insert({
            recruiter_id: user.id,
            company_name: `[MENTOR] ${formData.fullName}`,
            email: formData.email,
            phone: formData.phone,
            description: `[Đăng ký Mentor]\nChuyên môn: ${formData.expertise}\nKinh nghiệm: ${formData.yearsOfExperience} năm\nLinkedIn: ${formData.linkedinUrl}\n\n${formData.bio}`,
            document_url: documentUrl,
            status: 'pending'
          });

          if (fallbackInsertError) {
            if (fallbackInsertError.code === '23505') {
              setErrorMessage('Tài khoản của bạn đã gửi yêu cầu đăng ký Mentor trước đó rồi!');
            } else {
              setErrorMessage('Có lỗi xảy ra khi gửi yêu cầu: ' + fallbackInsertError.message);
            }
            setIsSubmitting(false);
            return;
          }
        } else if (insertError.code === '23505') {
          setErrorMessage('Tài khoản của bạn đã gửi yêu cầu đăng ký Mentor trước đó rồi!');
          setIsSubmitting(false);
          return;
        } else {
          setErrorMessage('Có lỗi xảy ra khi gửi yêu cầu: ' + insertError.message);
          setIsSubmitting(false);
          return;
        }
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      setErrorMessage('Đã xảy ra lỗi không xác định.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
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
                Cảm ơn bạn đã đăng ký trở thành <strong style={{ color: 'var(--color-charcoal)' }}>Mentor</strong> trên hệ thống Interview Technology AI. Hồ sơ của bạn đã được gửi đến ban quản trị để xét duyệt.
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
        {/* Header */}
        <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ marginBottom: '1rem', background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.1), rgba(194, 65, 12, 0.1))', color: '#EA580C', padding: '0.5rem 1.25rem', borderRadius: '50px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', fontSize: '0.85rem' }}>
            Dành cho Mentor
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-charcoal)', letterSpacing: '-1px', margin: 0, fontFamily: 'var(--font-heading)' }}>
            Đăng Ký Trở Thành Mentor
          </h1>
        </motion.div>

        {/* Form */}
        <motion.form variants={itemVariants} onSubmit={handleSubmit} className="glass-card" style={{ padding: '3rem', borderRadius: '24px', boxShadow: '0 20px 40px rgba(44, 40, 36, 0.05)', position: 'relative', overflow: 'hidden' }}>
          <div className="foliage-shadow" style={{ opacity: 0.3 }}></div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '2rem', fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-charcoal)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
              Thông Tin Mentor
            </h3>

            {errorMessage && (
              <div style={{ padding: '1rem', background: '#ffebee', color: '#c62828', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #ffcdd2', fontWeight: 500 }}>
                {errorMessage}
              </div>
            )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Họ và Tên */}
            <div>
              <label style={labelStyle}>Họ và Tên *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                style={inputStyle}
                placeholder="VD: Nguyễn Văn Minh"
                required
              />
            </div>

            {/* Email & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Email Liên Hệ *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="email@example.com"
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

            {/* Expertise & Experience */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={labelStyle}>Lĩnh vực Chuyên môn *</label>
                <CustomSelect
                  value={formData.expertise}
                  onChange={(val) => setFormData({ ...formData, expertise: val })}
                  placeholder="Chọn lĩnh vực..."
                  required
                  options={[
                    { value: "Frontend Development", label: "Frontend Development" },
                    { value: "Backend Development", label: "Backend Development" },
                    { value: "Fullstack Development", label: "Fullstack Development" },
                    { value: "Mobile Development", label: "Mobile Development" },
                    { value: "Data Science / AI", label: "Data Science / AI" },
                    { value: "DevOps / Cloud", label: "DevOps / Cloud" },
                    { value: "UI/UX Design", label: "UI/UX Design" },
                    { value: "Project Management", label: "Project Management" },
                    { value: "Cybersecurity", label: "Cybersecurity" },
                    { value: "Khác", label: "Khác" }
                  ]}
                />
              </div>
              <div>
                <label style={labelStyle}>Số năm Kinh nghiệm *</label>
                <CustomSelect
                  value={formData.yearsOfExperience}
                  onChange={(val) => setFormData({ ...formData, yearsOfExperience: val })}
                  placeholder="Chọn số năm..."
                  required
                  options={[
                    { value: "1", label: "1 - 2 năm" },
                    { value: "3", label: "3 - 5 năm" },
                    { value: "5", label: "5 - 10 năm" },
                    { value: "10", label: "Trên 10 năm" }
                  ]}
                />
              </div>
            </div>

            {/* LinkedIn */}
            <div>
              <label style={labelStyle}>LinkedIn Profile</label>
              <input
                type="url"
                name="linkedinUrl"
                value={formData.linkedinUrl}
                onChange={handleChange}
                style={inputStyle}
                placeholder="https://www.linkedin.com/in/..."
              />
            </div>

            {/* Bio */}
            <div>
              <label style={labelStyle}>Giới thiệu bản thân & Kinh nghiệm hướng dẫn *</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                placeholder="Mô tả ngắn gọn về kinh nghiệm làm việc, chuyên môn kỹ thuật và động lực trở thành Mentor trên nền tảng ITA..."
                required
              />
            </div>

            {/* File Upload */}
            <div>
              <label style={labelStyle}>Tài liệu đính kèm (CV, Chứng chỉ chuyên môn) *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  name="mentorFile"
                  id="mentorFile"
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
                  {formData.mentorFile ? (
                    <>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(234,88,12,0.1)', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                        <FileText size={24} />
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '0.2rem', wordBreak: 'break-all' }}>{formData.mentorFile.name}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{(formData.mentorFile.size / (1024 * 1024)).toFixed(2)} MB • Nhấp để thay đổi</span>
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

            {/* Terms */}
            <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem' }}>
              <h4 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-charcoal)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '-0.3px' }}>
                Điều khoản & Thỏa thuận dành cho Mentor
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
                  <strong style={{ color: 'var(--color-charcoal)' }}>1. Xác thực thông tin:</strong> Mentor cam kết cung cấp thông tin cá nhân và chuyên môn chính xác, trung thực. Mọi thông tin sai lệch có thể dẫn đến việc thu hồi tư cách Mentor.
                </div>
                <div style={{ marginBottom: '1.2rem' }}>
                  <strong style={{ color: 'var(--color-charcoal)' }}>2. Trách nhiệm hướng dẫn:</strong> Mentor có trách nhiệm đánh giá khách quan, cung cấp phản hồi chất lượng và hỗ trợ ứng viên một cách chuyên nghiệp. Nghiêm cấm các hành vi phân biệt đối xử, quấy rối hoặc lạm dụng quyền hạn.
                </div>
                <div style={{ marginBottom: '1.2rem' }}>
                  <strong style={{ color: 'var(--color-charcoal)' }}>3. Bảo mật dữ liệu:</strong> Mentor cam kết bảo mật tuyệt đối thông tin cá nhân, video phỏng vấn và kết quả đánh giá của ứng viên. Không được chia sẻ thông tin này cho bên thứ ba dưới bất kỳ hình thức nào.
                </div>
                <div>
                  <strong style={{ color: 'var(--color-charcoal)' }}>4. Quyền của nền tảng:</strong> Ban quản trị ITA bảo lưu quyền từ chối phê duyệt, tạm ngưng hoặc thu hồi vĩnh viễn tư cách Mentor bất cứ lúc nào nếu phát hiện có dấu hiệu vi phạm điều khoản mà không cần báo trước.
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
                  Tôi đã đọc và đồng ý với các Điều khoản & Thỏa thuận dành cho Mentor ở trên.
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
  padding: '1rem 1.2rem',
  borderRadius: '12px',
  border: '1px solid var(--border-color)',
  background: 'var(--color-surface)',
  fontFamily: 'var(--font-sans)',
  fontSize: '1rem',
  color: 'var(--color-text)',
  transition: 'border-color 0.3s, box-shadow 0.3s',
  boxSizing: 'border-box',
  outline: 'none'
};

const CustomSelect = ({ value, onChange, options, placeholder, required }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        style={{ ...inputStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: isOpen ? '1px solid #EA580C' : inputStyle.border, boxShadow: isOpen ? '0 0 0 3px rgba(234,88,12,0.1)' : 'none' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ color: value ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} style={{ color: 'var(--color-text-muted)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', zIndex: 10, overflow: 'hidden', padding: '0.5rem' }}
          >
            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {options.map((opt) => (
                <div 
                  key={opt.value}
                  style={{ padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderRadius: '8px', background: value === opt.value ? 'rgba(234,88,12,0.05)' : 'transparent', color: value === opt.value ? '#EA580C' : 'var(--color-charcoal)', fontWeight: value === opt.value ? 600 : 500, transition: 'background 0.2s' }}
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  onMouseOver={(e) => { if(value !== opt.value) e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
                  onMouseOut={(e) => { if(value !== opt.value) e.currentTarget.style.background = 'transparent'; }}
                >
                  {opt.label}
                  {value === opt.value && <Check size={16} />}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {required && <input type="text" value={value} style={{ opacity: 0, position: 'absolute', height: 0, width: 0, pointerEvents: 'none', bottom: 0, left: '50%' }} required onChange={() => {}} />}
    </div>
  );
};

export default MentorRegistration;
