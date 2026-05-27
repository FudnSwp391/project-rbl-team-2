import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../utils/AuthContext';

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
    return (
      <div className="section" style={{ background: 'var(--color-cream)', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
        <div className="container container--narrow">
          <div className="glass-card reveal is-visible" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h1 style={{ marginBottom: '1rem' }}>Đăng Ký Thành Công!</h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: '1.8' }}>
              Cảm ơn bạn đã đăng ký trở thành nhà tuyển dụng trên hệ thống của chúng tôi.
              Thông tin của doanh nghiệp đã được gửi đến ban quản trị để xét duyệt.
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
        <div className="reveal is-visible" style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <span className="label" style={{ marginBottom: '1rem' }}>Dành cho doanh nghiệp</span>
          <h1 style={{ marginBottom: '1rem' }}>Đăng Ký Nhà Tuyển Dụng</h1>
          <p style={{ maxWidth: '600px', margin: '0 auto' }}>Điền thông tin doanh nghiệp của bạn dưới đây. Sau khi gửi, ban quản trị sẽ xem xét và phản hồi qua email.</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card reveal is-visible reveal--delay-1">
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Thông Tin Doanh Nghiệp</h3>
          
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
              <label style={labelStyle}>Tài Liệu Đính Kèm (Hồ sơ năng lực, Giấy phép kinh doanh)</label>
              <input
                type="file"
                name="companyFile"
                onChange={handleFileChange}
                style={inputStyle}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                Hỗ trợ định dạng: PDF, Word, Ảnh (Tối đa 5MB)
              </p>
            </div>

            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Điều khoản & Thỏa thuận dành cho doanh nghiệp</h4>
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
                <strong>1. Xác thực thông tin:</strong> Doanh nghiệp cam kết cung cấp thông tin đăng ký chính xác, hợp pháp và chịu hoàn toàn trách nhiệm trước pháp luật về tính minh bạch của doanh nghiệp.<br /><br />
                <strong>2. Mục đích sử dụng:</strong> Tài khoản nhà tuyển dụng chỉ được sử dụng cho mục đích đăng tin tuyển dụng và tìm kiếm ứng viên trên nền tảng Interview Technology AI (ITA). Nghiêm cấm các hành vi lừa đảo, thu thập dữ liệu trái phép hoặc spam ứng viên.<br /><br />
                <strong>3. Bảo mật dữ liệu:</strong> Doanh nghiệp cam kết bảo mật tuyệt đối thông tin CV, kết quả phỏng vấn AI và dữ liệu cá nhân của ứng viên theo đúng quy định của pháp luật về bảo vệ dữ liệu.<br /><br />
                <strong>4. Quyền của nền tảng:</strong> Ban quản trị ITA bảo lưu quyền từ chối phê duyệt, tạm ngưng hoặc thu hồi vĩnh viễn tư cách nhà tuyển dụng bất cứ lúc nào nếu phát hiện có dấu hiệu vi phạm điều khoản mà không cần báo trước.
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', cursor: 'pointer', marginBottom: '1.5rem' }}>
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  style={{ marginTop: '0.2rem', width: '1.2rem', height: '1.2rem', accentColor: 'var(--color-charcoal)' }}
                />
                <span style={{ fontSize: '0.9rem', color: 'var(--color-charcoal)', fontWeight: '500' }}>
                  Tôi đã đọc và đồng ý với các Điều khoản & Thỏa thuận dành cho doanh nghiệp ở trên.
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
  transition: 'border-color 0.3s, box-shadow 0.3s'
};

export default RecruiterRegistration;
