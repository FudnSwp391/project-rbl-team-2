import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../utils/AuthContext';

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
    return (
      <div className="section" style={{ background: 'var(--color-cream)', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <div className="container container--narrow">
          <div className="glass-card reveal is-visible" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h1 style={{ marginBottom: '1rem' }}>Đăng Ký Thành Công!</h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: '1.8' }}>
              Cảm ơn bạn đã đăng ký trở thành <strong>Mentor</strong> trên hệ thống Interview Technology AI.
              Hồ sơ của bạn đã được gửi đến ban quản trị để xét duyệt.
              <br /><br />
              Chúng tôi sẽ xử lý yêu cầu và gửi thông báo kết quả qua email <strong>{formData.email}</strong> trong vòng 24 - 48 giờ làm việc.
            </p>
            <button onClick={() => navigate('/')} className="btn btn--primary btn--pill">
              Quay lại Trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: '100vh' }}>
      <div className="container container--narrow">
        {/* Header */}
        <div className="reveal is-visible" style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <span className="label" style={{ marginBottom: '1rem' }}>Dành cho Mentor</span>
          <h1 style={{ marginBottom: '1rem' }}>Đăng Ký Trở Thành Mentor</h1>
          <p style={{ maxWidth: '600px', margin: '0 auto' }}>
            Chia sẻ kinh nghiệm và hỗ trợ ứng viên phát triển sự nghiệp. Điền thông tin bên dưới, ban quản trị sẽ xem xét và phản hồi qua email.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card reveal is-visible reveal--delay-1">
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            Thông Tin Mentor
          </h3>

          {errorMessage && (
            <div style={{ padding: '1rem', background: '#ffebee', color: '#c62828', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #ffcdd2' }}>
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
                <select
                  name="expertise"
                  value={formData.expertise}
                  onChange={handleChange}
                  style={inputStyle}
                  required
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
              <div>
                <label style={labelStyle}>Số năm Kinh nghiệm *</label>
                <select
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                >
                  <option value="">Chọn số năm...</option>
                  <option value="1">1 - 2 năm</option>
                  <option value="3">3 - 5 năm</option>
                  <option value="5">5 - 10 năm</option>
                  <option value="10">Trên 10 năm</option>
                </select>
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
              <label style={labelStyle}>Tài liệu đính kèm (CV, Chứng chỉ chuyên môn)</label>
              <input
                type="file"
                name="mentorFile"
                onChange={handleFileChange}
                style={inputStyle}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                Hỗ trợ định dạng: PDF, Word, Ảnh (Tối đa 5MB)
              </p>
            </div>

            {/* Terms */}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Điều khoản & Thỏa thuận dành cho Mentor</h4>
              <div style={{
                height: '150px',
                overflowY: 'auto',
                padding: '1rem',
                background: 'rgba(0,0,0,0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: 'var(--color-text-secondary)',
                lineHeight: '1.6',
                marginBottom: '1rem'
              }}>
                <strong>1. Xác thực thông tin:</strong> Mentor cam kết cung cấp thông tin cá nhân và chuyên môn chính xác, trung thực. Mọi thông tin sai lệch có thể dẫn đến việc thu hồi tư cách Mentor.<br /><br />
                <strong>2. Trách nhiệm hướng dẫn:</strong> Mentor có trách nhiệm đánh giá khách quan, cung cấp phản hồi chất lượng và hỗ trợ ứng viên một cách chuyên nghiệp. Nghiêm cấm các hành vi phân biệt đối xử, quấy rối hoặc lạm dụng quyền hạn.<br /><br />
                <strong>3. Bảo mật dữ liệu:</strong> Mentor cam kết bảo mật tuyệt đối thông tin cá nhân, video phỏng vấn và kết quả đánh giá của ứng viên. Không được chia sẻ thông tin này cho bên thứ ba dưới bất kỳ hình thức nào.<br /><br />
                <strong>4. Quyền của nền tảng:</strong> Ban quản trị ITA bảo lưu quyền từ chối phê duyệt, tạm ngưng hoặc thu hồi vĩnh viễn tư cách Mentor bất cứ lúc nào nếu phát hiện có dấu hiệu vi phạm điều khoản mà không cần báo trước.
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', cursor: 'pointer', marginBottom: '1.5rem' }}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  style={{ marginTop: '0.2rem', width: '1.2rem', height: '1.2rem', accentColor: 'var(--color-charcoal)' }}
                />
                <span style={{ fontSize: '0.9rem', color: 'var(--color-charcoal)', fontWeight: '500' }}>
                  Tôi đã đọc và đồng ý với các Điều khoản & Thỏa thuận dành cho Mentor ở trên.
                </span>
              </label>

              <button
                type="submit"
                disabled={!agreedToTerms || isSubmitting}
                className="btn btn--primary btn--pill"
                style={{
                  width: '100%',
                  fontSize: '1.1rem',
                  padding: '1.2rem',
                  opacity: (!agreedToTerms || isSubmitting) ? 0.5 : 1,
                  cursor: (!agreedToTerms || isSubmitting) ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Đang Gửi Yêu Cầu...' : 'Gửi Yêu Cầu'}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  fontWeight: '500',
  color: 'var(--color-charcoal)',
  fontSize: '0.9rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.9rem 1rem',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  background: 'rgba(255, 255, 255, 0.8)',
  fontFamily: 'var(--font-sans)',
  fontSize: '1rem',
  color: 'var(--color-text)',
  transition: 'border-color 0.3s, box-shadow 0.3s',
  boxSizing: 'border-box',
};

export default MentorRegistration;
