import React from 'react';
import { motion } from 'framer-motion';

const TermsOfService = () => {
  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: '100vh', paddingTop: '120px' }}>
      <div className="container container--narrow">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span style={{ marginBottom: '1rem', background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.1), rgba(194, 65, 12, 0.1))', color: '#EA580C', padding: '0.5rem 1.25rem', borderRadius: '50px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', fontSize: '0.85rem' }}>
            Pháp lý
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-charcoal)', letterSpacing: '-1px', margin: '0 0 2rem 0', fontFamily: 'var(--font-heading)' }}>
            Điều Khoản Dịch Vụ
          </h1>
          
          <div className="glass-card" style={{ padding: '3rem', borderRadius: '24px', boxShadow: '0 20px 40px rgba(44, 40, 36, 0.05)', fontSize: '1.05rem', color: 'var(--color-text-secondary)', lineHeight: 1.8, position: 'relative', overflow: 'hidden' }}>
            <div className="foliage-shadow" style={{ opacity: 0.2 }}></div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h3 style={{ color: 'var(--color-charcoal)', fontSize: '1.4rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>1. Chấp nhận điều khoản</h3>
              <p style={{ marginBottom: '1.5rem' }}>Bằng việc truy cập và sử dụng nền tảng Interview Technology AI (ITA), bạn đồng ý tuân thủ các điều khoản và điều kiện được quy định dưới đây. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng không sử dụng dịch vụ của chúng tôi.</p>
              
              <h3 style={{ color: 'var(--color-charcoal)', fontSize: '1.4rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>2. Tài khoản người dùng</h3>
              <p style={{ marginBottom: '1.5rem' }}>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động diễn ra dưới tài khoản của mình. Vui lòng thông báo ngay cho chúng tôi nếu phát hiện bất kỳ sự truy cập trái phép nào.</p>
              
              <h3 style={{ color: 'var(--color-charcoal)', fontSize: '1.4rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>3. Quyền và nghĩa vụ</h3>
              <p style={{ marginBottom: '1.5rem' }}>Bạn cam kết không sử dụng nền tảng cho bất kỳ mục đích bất hợp pháp nào, không sao chép, phân phối hoặc khai thác thương mại các nội dung từ nền tảng khi chưa được phép.</p>
              
              <h3 style={{ color: 'var(--color-charcoal)', fontSize: '1.4rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>4. Từ chối bảo đảm</h3>
              <p style={{ marginBottom: '1.5rem' }}>Dịch vụ của chúng tôi được cung cấp theo hiện trạng. Chúng tôi không đảm bảo rằng dịch vụ sẽ không bị gián đoạn, an toàn tuyệt đối hoặc không có lỗi.</p>
              
              <h3 style={{ color: 'var(--color-charcoal)', fontSize: '1.4rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>5. Thay đổi điều khoản</h3>
              <p style={{ marginBottom: '0' }}>Chúng tôi có quyền cập nhật hoặc thay đổi các điều khoản này vào bất kỳ lúc nào. Những thay đổi sẽ có hiệu lực ngay khi được đăng tải trên trang web.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfService;
