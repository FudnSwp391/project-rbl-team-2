import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import itaLogo from '../../assets/ita-logo.png';
import './LandingPage.css';

const LandingPage = () => {
  const heroRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Floema-style scroll-driven zoom calculations
  const heroScrollHeight = typeof window !== 'undefined' ? window.innerHeight * 1.8 : 1200;
  const scrollProgress = Math.min(scrollY / heroScrollHeight, 1); // 0 → 1

  // Logo: starts at scale 1, zooms up to scale 8
  const logoScale = 1 + scrollProgress * 7;
  // Fade out logo after 60% scroll progress
  const logoOpacity = scrollProgress > 0.6 ? Math.max(0, 1 - (scrollProgress - 0.6) / 0.3) : 1;

  // Background text: scale up faster, fade out earlier
  const bgTextScale = 1 + scrollProgress * 5;
  const bgTextOpacity = scrollProgress > 0.4 ? Math.max(0, 0.4 * (1 - (scrollProgress - 0.4) / 0.4)) : 0.4;

  // Hero content (subtitle/CTA): fade out quickly
  const contentOpacity = Math.max(0, 1 - scrollProgress * 3);
  const contentTranslateY = scrollProgress * -60;

  // Intersection Observer for reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.reveal, .reveal--slide-left, .reveal--slide-right, .reveal--scale').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing">
      {/* ══════════════ HERO SECTION — Floema-style scroll zoom ══════════════ */}
      <div className="hero-scroll-container">
        <section className="hero" ref={heroRef}>
          <div className="hero__background">
            {/* Large background text — "INTERVIEW TECHNOLOGY AI" */}
            <div
              className="hero__bg-text"
              style={{
                transform: `scale(${bgTextScale})`,
                opacity: bgTextOpacity,
              }}
            >
              <span className="hero__bg-text-line">INTERVIEW</span>
              <span className="hero__bg-text-line">TECHNOLOGY</span>
              <span className="hero__bg-text-line">AI</span>
            </div>
          </div>

          {/* ITA Logo — positioned in front of the background text */}
          <div
            className="hero__logo-wrapper"
            style={{
              transform: `scale(${logoScale})`,
              opacity: logoOpacity,
            }}
          >
            <img
              src={itaLogo}
              alt="ITA - Interview Technology AI"
              className="hero__logo"
            />
          </div>

          {/* Hero subtitle and CTA */}
          <div
            className="hero__content"
            style={{
              transform: `translateY(${contentTranslateY}px)`,
              opacity: contentOpacity,
            }}
          >
            <p className="hero__subtitle">
              Nền tảng phỏng vấn giả lập thông minh
            </p>
            <div className="hero__cta">
              <Link to="/interview" className="btn btn--primary">
                Khám phá ngay
              </Link>
              <Link to="/cv-analysis" className="btn btn--outline">
                Phân tích CV
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="hero__scroll-indicator" style={{
            opacity: Math.max(0, 1 - scrollProgress * 5),
          }}>
            <div className="hero__scroll-line" />
          </div>
        </section>
      </div>

      {/* ══════════════ INTRO SECTION ══════════════ */}
      <section className="section intro">
        <div className="container">
          <div className="intro__grid">
            <div className="intro__left reveal">
              <span className="label">Giới thiệu</span>
            </div>
            <div className="intro__right">
              <h2 className="reveal reveal--delay-1">
                Chinh phục mọi buổi phỏng vấn cùng{' '}
                <em style={{ fontStyle: 'italic', color: 'var(--color-accent)' }}>
                  trí tuệ nhân tạo
                </em>
              </h2>
              <p className="reveal reveal--delay-2" style={{ marginTop: '1.5rem', fontSize: '1.1rem' }}>
                ITA sử dụng AI tiên tiến để mô phỏng buổi phỏng vấn thực tế,
                phân tích biểu cảm, giọng nói và nội dung trả lời của bạn.
                Nhận phản hồi tức thì, cải thiện kỹ năng mỗi ngày.
              </p>
              <div className="reveal reveal--delay-3" style={{ marginTop: '2rem' }}>
                <div className="scroll-indicator">
                  <span className="scroll-indicator__line" />
                  <span>Tìm hiểu thêm ↓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ FEATURES SECTION ══════════════ */}
      <section className="section features" style={{ background: 'var(--color-warm-white)' }}>
        <div className="container">
          <div className="features__header">
            <span className="label reveal">Tính năng</span>
            <h2 className="reveal reveal--delay-1" style={{ marginTop: '1.5rem' }}>
              Trải nghiệm phỏng vấn<br />
              <em style={{ fontStyle: 'italic' }}>hoàn toàn mới</em>
            </h2>
          </div>

          <div className="features__grid">
            <FeatureCard
              number="01"
              title="Phỏng vấn Giả lập"
              description="AI đóng vai nhà tuyển dụng chuyên nghiệp, đặt câu hỏi sát thực tế và đánh giá biểu cảm, giọng nói của bạn trong thời gian thực."
              delay={1}
            />
            <FeatureCard
              number="02"
              title="Phân tích CV"
              description="Tải lên CV để nhận đánh giá chi tiết về điểm mạnh, điểm yếu từ AI. Tối ưu hóa CV của bạn để vượt qua vòng sàng lọc."
              delay={2}
            />
            <FeatureCard
              number="03"
              title="Thử thách Hàng ngày"
              description="Luyện tập các câu hỏi tình huống, tích điểm và thăng hạng trên bảng xếp hạng toàn hệ thống."
              delay={3}
            />
            <FeatureCard
              number="04"
              title="Phản hồi Tức thì"
              description="Nhận báo cáo đánh giá chi tiết sau mỗi buổi phỏng vấn với điểm số, nhận xét và lời khuyên cải thiện cụ thể."
              delay={4}
            />
          </div>
        </div>
      </section>

      {/* ══════════════ HOW IT WORKS - Timeline ══════════════ */}
      <section className="section timeline">
        <div className="container">
          <div className="timeline__header">
            <span className="label reveal">Quy trình</span>
            <h2 className="reveal reveal--delay-1" style={{ marginTop: '1.5rem' }}>
              Bắt đầu trong{' '}
              <em style={{ fontStyle: 'italic' }}>3 bước đơn giản</em>
            </h2>
          </div>

          <div className="timeline__steps">
            <TimelineStep
              year="Bước 1"
              title="Tạo tài khoản"
              description="Đăng ký miễn phí và hoàn thiện hồ sơ cá nhân. Tải lên CV để hệ thống hiểu rõ về bạn hơn."
            />
            <TimelineStep
              year="Bước 2"
              title="Chọn lĩnh vực"
              description="Lựa chọn vị trí, ngành nghề và cấp độ phỏng vấn phù hợp với mục tiêu nghề nghiệp của bạn."
            />
            <TimelineStep
              year="Bước 3"
              title="Bắt đầu phỏng vấn"
              description="Tham gia phỏng vấn giả lập với AI, nhận phản hồi chi tiết và cải thiện kỹ năng liên tục."
            />
          </div>
        </div>
      </section>

      {/* ══════════════ STATS SECTION ══════════════ */}
      <section className="section stats" style={{ background: 'var(--color-charcoal)' }}>
        <div className="container">
          <div className="stats__grid">
            <StatCard number="10K+" label="Người dùng" />
            <StatCard number="50K+" label="Buổi phỏng vấn" />
            <StatCard number="95%" label="Hài lòng" />
            <StatCard number="200+" label="Câu hỏi AI" />
          </div>
        </div>
      </section>

      {/* ══════════════ VALUES SECTION ══════════════ */}
      <section className="section values">
        <div className="container">
          <div className="values__header">
            <span className="label reveal">Giá trị cốt lõi</span>
            <h2 className="reveal reveal--delay-1" style={{ marginTop: '1.5rem', maxWidth: '700px' }}>
              Tạo ra trải nghiệm phỏng vấn{' '}
              <em style={{ fontStyle: 'italic', color: 'var(--color-accent)' }}>
                vượt mọi kỳ vọng
              </em>
            </h2>
          </div>

          <div className="values__grid">
            <ValueCard
              number="01"
              title="Trí tuệ Nhân tạo"
              description="Sử dụng AI tiên tiến nhất để phân tích và đánh giá năng lực ứng viên một cách chính xác."
            />
            <ValueCard
              number="02"
              title="Cá nhân hóa"
              description="Mỗi buổi phỏng vấn được tùy chỉnh theo lĩnh vực, kinh nghiệm và mục tiêu riêng của bạn."
            />
            <ValueCard
              number="03"
              title="Bảo mật"
              description="Dữ liệu cá nhân được mã hóa và bảo vệ theo tiêu chuẩn bảo mật cao nhất."
            />
            <ValueCard
              number="04"
              title="Liên tục cải tiến"
              description="Hệ thống AI không ngừng học hỏi và cải tiến để mang đến trải nghiệm tốt nhất cho bạn."
            />
          </div>
        </div>
      </section>

      {/* ══════════════ TEAM SECTION ══════════════ */}
      <section className="section team" style={{ background: 'var(--color-warm-white)' }}>
        <div className="container">
          <div className="team__header">
            <span className="label reveal">Đội ngũ</span>
            <h2 className="reveal reveal--delay-1" style={{ marginTop: '1.5rem' }}>
              Gặp gỡ những bộ óc{' '}
              <em style={{ fontStyle: 'italic' }}>đam mê sáng tạo</em>
            </h2>
          </div>

          <div className="team__quote reveal">
            <blockquote>
              "Chúng tôi tin rằng công nghệ AI có thể thay đổi cách mọi người chuẩn bị cho sự nghiệp.
              Mỗi ngày, chúng tôi làm việc để biến tầm nhìn đó thành hiện thực."
            </blockquote>
            <p className="team__quote-author">— Team RBL, Nhóm 2</p>
          </div>

          <div className="team__info reveal">
            <p style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: '0.5rem'
            }}>
              Đội ngũ đa lĩnh vực
            </p>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '500px' }}>
              Kỹ sư phần mềm, chuyên gia AI, nhà thiết kế UX và các chuyên gia tuyển dụng
              cùng hợp tác để xây dựng nền tảng phỏng vấn thế hệ mới.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════ CTA SECTION ══════════════ */}
      <section className="section cta">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="reveal" style={{ marginBottom: '1.5rem' }}>
            Sẵn sàng chinh phục<br />
            <em style={{ fontStyle: 'italic', color: 'var(--color-accent)' }}>buổi phỏng vấn tiếp theo?</em>
          </h2>
          <p className="reveal reveal--delay-1" style={{
            maxWidth: '500px',
            margin: '0 auto 2.5rem',
            fontSize: '1.05rem'
          }}>
            Tham gia cùng hàng nghìn ứng viên đã cải thiện kỹ năng phỏng vấn với ITA.
          </p>
          <div className="reveal reveal--delay-2" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn--accent">
              Đăng ký miễn phí
            </Link>
            <Link to="/interview" className="btn btn--outline">
              Thử ngay
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

/* ── Feature Card Component ── */
const FeatureCard = ({ number, title, description, delay }) => (
  <div className={`feature-card reveal reveal--delay-${delay}`}>
    <div className="feature-card__number">{number}</div>
    <h3 className="feature-card__title">{title}</h3>
    <p className="feature-card__desc">{description}</p>
    <div className="feature-card__arrow">
      <span>Tìm hiểu ↗</span>
    </div>
  </div>
);

/* ── Timeline Step Component ── */
const TimelineStep = ({ year, title, description }) => (
  <div className="timeline__step reveal">
    <div className="timeline__step-marker">
      <div className="timeline__step-dot" />
      <div className="timeline__step-line" />
    </div>
    <div className="timeline__step-content">
      <span className="timeline__step-year">{year}</span>
      <h3 className="timeline__step-title">{title}</h3>
      <p className="timeline__step-desc">{description}</p>
    </div>
  </div>
);

/* ── Stat Card Component ── */
const StatCard = ({ number, label }) => (
  <div className="stat-card reveal">
    <div className="stat-card__number">{number}</div>
    <div className="stat-card__label">{label}</div>
  </div>
);

/* ── Value Card Component ── */
const ValueCard = ({ number, title, description }) => (
  <div className="value-card reveal">
    <div className="value-card__header">
      <span className="value-card__number">{number}</span>
      <h3 className="value-card__title">{title}</h3>
    </div>
    <p className="value-card__desc">{description}</p>
  </div>
);

export default LandingPage;
