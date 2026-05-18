import React from 'react';
import { Sparkles, Target, Zap, TrendingUp } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="animate-fade">
      {/* Hero Section */}
      <section style={{ 
        padding: 'var(--spacing-xl) 0', 
        textAlign: 'center',
        background: 'radial-gradient(circle at 50% 50%, rgba(100, 108, 255, 0.1) 0%, transparent 50%)'
      }}>
        <div className="container">
          <h1 style={{ fontSize: '4rem', marginBottom: 'var(--spacing-sm)', lineHeight: 1.1 }}>
            Chinh phục mọi <br />
            <span className="gradient-text">Buổi phỏng vấn</span> cùng AI
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'var(--text-secondary)', 
            maxWidth: '700px', 
            margin: '0 auto var(--spacing-lg)' 
          }}>
            Hệ thống phỏng vấn giả lập và đánh giá năng lực tự động giúp bạn tự tin hơn, 
            nhận phản hồi ngay lập tức và cải thiện kỹ năng mỗi ngày.
          </p>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'center' }}>
            <button className="btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
              Trải nghiệm ngay
            </button>
            <button className="glass-card" style={{ padding: '1rem 2rem', cursor: 'pointer' }}>
              Tìm hiểu thêm
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>Tính năng nổi bật</h2>
        <div className="grid-auto">
          <FeatureCard 
            icon={<Sparkles color="hsl(var(--primary-hsl))" />}
            title="Phỏng vấn Giả lập"
            desc="AI đóng vai nhà tuyển dụng, đặt câu hỏi sát thực tế và đánh giá biểu cảm, giọng nói."
          />
          <FeatureCard 
            icon={<Target color="hsl(var(--secondary-hsl))" />}
            title="Phân tích CV"
            desc="Tải lên CV của bạn để nhận đánh giá chi tiết về điểm mạnh, điểm yếu từ AI."
          />
          <FeatureCard 
            icon={<Zap color="hsl(var(--accent-hsl))" />}
            title="Thử thách Hàng ngày"
            desc="Luyện tập các câu hỏi tình huống, tích điểm và thăng hạng trên bảng xếp hạng."
          />
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div className="glass-card" style={{ transition: 'transform 0.3s' }}>
    <div style={{ marginBottom: 'var(--spacing-sm)' }}>{icon}</div>
    <h3 style={{ marginBottom: 'var(--spacing-xs)' }}>{title}</h3>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{desc}</p>
  </div>
);

export default LandingPage;
