import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
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
            Chính Sách Bảo Mật
          </h1>
          
          <div className="glass-card" style={{ padding: '3rem', borderRadius: '24px', boxShadow: '0 20px 40px rgba(44, 40, 36, 0.05)', fontSize: '1.05rem', color: 'var(--color-text-secondary)', lineHeight: 1.8, position: 'relative', overflow: 'hidden' }}>
            <div className="foliage-shadow" style={{ opacity: 0.2 }}></div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h3 style={{ color: 'var(--color-charcoal)', fontSize: '1.4rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>1. Thu thập thông tin</h3>
              <p style={{ marginBottom: '1.5rem' }}>Chúng tôi thu thập các thông tin cá nhân như họ tên, email, và dữ liệu phỏng vấn (bao gồm âm thanh, video) nhằm cung cấp và cải thiện dịch vụ phỏng vấn AI, cũng như trải nghiệm cá nhân hóa cho người dùng.</p>
              
              <h3 style={{ color: 'var(--color-charcoal)', fontSize: '1.4rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>2. Sử dụng dữ liệu</h3>
              <p style={{ marginBottom: '1.5rem' }}>Dữ liệu của bạn được sử dụng để phân tích, đánh giá kỹ năng phỏng vấn, tạo báo cáo phản hồi và tối ưu hóa hệ thống trí tuệ nhân tạo của chúng tôi. Chúng tôi cam kết không bán dữ liệu của bạn cho bất kỳ bên thứ ba nào.</p>
              
              <h3 style={{ color: 'var(--color-charcoal)', fontSize: '1.4rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>3. Bảo vệ dữ liệu</h3>
              <p style={{ marginBottom: '1.5rem' }}>Tất cả thông tin nhạy cảm đều được mã hóa an toàn. Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức phù hợp để bảo vệ dữ liệu khỏi việc truy cập trái phép, mất mát hoặc tiêu hủy.</p>
              
              <h3 style={{ color: 'var(--color-charcoal)', fontSize: '1.4rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>4. Quyền của người dùng</h3>
              <p style={{ marginBottom: '1.5rem' }}>Bạn có quyền truy cập, chỉnh sửa hoặc yêu cầu xóa dữ liệu cá nhân của mình bất kỳ lúc nào thông qua phần Cài đặt tài khoản hoặc bằng cách liên hệ với chúng tôi.</p>
              
              <h3 style={{ color: 'var(--color-charcoal)', fontSize: '1.4rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>5. Liên hệ</h3>
              <p style={{ marginBottom: '0' }}>Nếu bạn có bất kỳ thắc mắc nào về Chính sách bảo mật này, vui lòng liên hệ với chúng tôi qua email: <strong style={{ color: 'var(--color-charcoal)' }}>ita@team-rbl.com</strong>.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
