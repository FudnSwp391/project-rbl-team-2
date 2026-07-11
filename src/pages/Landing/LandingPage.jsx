import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Frown, FileText, RefreshCw } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);
import CloudDivider from '../../components/common/CloudDivider';
import heroVideo from '../../assets/hero.mp4';
import featureInterview from '../../assets/feature-interview.png';
import featureCv from '../../assets/feature-cv.png';
import featureChallenge from '../../assets/feature-challenge.png';
import featureFeedback from '../../assets/feature-feedback.png';
import problemIllustration1 from '../../assets/problem-illustration-1.png';
import problemIllustration2 from '../../assets/problem-illustration-2.png';
import problemIllustration3 from '../../assets/problem-illustration-3.png';
import ArchitecturePortfolio from '../../components/portfolio/ArchitecturePortfolio';
import CardStackSection from '../../components/landing/CardStackSection';
import './LandingPage.css';

const LandingPage = () => {
  const { user } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const statsRef = useRef(null);
  const tabsRef = useRef(null);
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [activeProblem, setActiveProblem] = useState(0);
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Stats counter observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Scroll-based activation for Problems Accordion
  useEffect(() => {
    let ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: '.problems-accordion-container',
        start: 'top 50%',
        end: 'bottom 50%',
        onUpdate: (self) => {
          const progress = self.progress;
          let index = Math.floor(progress * 3);
          if (index >= 3) index = 2;
          if (index < 0) index = 0;
          
          setActiveProblem(prev => prev !== index ? index : prev);
        }
      });
    });

    return () => ctx.revert();
  }, []);

  // Update sliding tab indicator position
  useEffect(() => {
    const updateIndicator = () => {
      if (tabsRef.current) {
        // Find all tab buttons
        const tabs = Array.from(tabsRef.current.querySelectorAll('.features__tab'));
        const activeElement = tabs[activeFeature];
        if (activeElement) {
          setTabIndicatorStyle({
            left: activeElement.offsetLeft,
            width: activeElement.offsetWidth,
            opacity: 1
          });
        }
      }
    };

    // Delay slightly to ensure fonts/layout are ready
    const timer = setTimeout(updateIndicator, 100);
    window.addEventListener('resize', updateIndicator);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeFeature]);

  const features = [
    {
      id: 0,
      label: 'Phỏng vấn AI',
      title: 'Phỏng vấn giả lập thời gian thực',
      desc: 'AI đóng vai nhà tuyển dụng chuyên nghiệp, đặt câu hỏi sát thực tế và đánh giá biểu cảm, giọng nói của bạn trong thời gian thực. Trải nghiệm như phỏng vấn thật.',
      img: featureInterview,
      link: '/interview',
      color: 'var(--color-accent-vivid)',
    },
    {
      id: 1,
      label: 'Phân tích CV',
      title: 'AI đánh giá & tối ưu CV của bạn',
      desc: 'Tải lên CV để nhận đánh giá chi tiết về điểm mạnh, điểm yếu. AI gợi ý từ khóa giúp CV vượt qua hệ thống sàng lọc ATS của nhà tuyển dụng.',
      img: featureCv,
      link: '/cv-analysis',
      color: 'var(--color-moss)',
    },
    {
      id: 2,
      label: 'Thử thách hàng ngày',
      title: 'Luyện tập mỗi ngày, thăng hạng liên tục',
      desc: 'Hoàn thành thử thách câu hỏi tình huống mỗi ngày, tích điểm và leo hạng trên bảng xếp hạng. Duy trì streak để nhận thưởng đặc biệt.',
      img: featureChallenge,
      link: '/dashboard',
      color: 'var(--color-accent)',
    },
    {
      id: 3,
      label: 'Phản hồi tức thì',
      title: 'Báo cáo chi tiết sau mỗi buổi phỏng vấn',
      desc: 'Nhận điểm số, nhận xét và lời khuyên cụ thể từ AI. Phân tích ngữ điệu, ngữ pháp, nội dung trả lời để bạn cải thiện liên tục.',
      img: featureFeedback,
      link: '/interview',
      color: 'var(--color-earth)',
    },
  ];

  return (
    <div className="landing">
      {/* ══════════════ HERO SECTION — Koi-style Split Layout ══════════════ */}
      <section className="hero-section">
        {/* Floating organic shapes */}
        <div className="hero__shapes">
          <div className="hero__shape hero__shape--1" />
          <div className="hero__shape hero__shape--2" />
          <div className="hero__shape hero__shape--3" />
        </div>

        <div className="hero__visual reveal--slide-right">
          <div className="hero__illustration-wrapper">
            <video
              src={heroVideo}
              autoPlay
              loop
              muted
              playsInline
              className="hero__illustration"
            />
          </div>
        </div>

        <div className="container hero__container" style={{ position: 'relative', zIndex: 10 }}>
          <div className="hero__text">
            <div className="hero__text-inner">

              <h1 className="hero__headline">
                <span className="reveal reveal--delay-1" style={{ display: 'inline-block' }}>Chinh phục</span>
                <br />
                <span className="reveal reveal--delay-2" style={{ display: 'inline-block' }}><em className="hero__headline-accent">mọi buổi phỏng vấn</em></span>
                <br />
                <span className="reveal reveal--delay-3" style={{ display: 'inline-block' }}>cùng AI</span>
              </h1>
              <p className="hero__description reveal reveal--delay-4">
                Nền tảng phỏng vấn giả lập thông minh — AI phân tích biểu cảm,
                giọng nói và nội dung trả lời. Nhận phản hồi tức thì, cải thiện
                kỹ năng mỗi ngày.
              </p>
              <div className="hero__cta reveal reveal--delay-5">
                <Link
                  to={user ? '/interview' : '/register'}
                  className="btn btn--vivid btn--lg"
                >
                  Bắt đầu miễn phí
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
                <Link to="/interview" className="btn btn--outline btn--lg">
                  Xem demo
                </Link>
              </div>
              <div className="hero__social-proof reveal reveal--delay-6">
                <div className="hero__avatars">
                  {['T', 'H', 'N', 'M', 'L'].map((letter, i) => (
                    <div
                      key={i}
                      className="hero__avatar"
                      style={{
                        background: ['#C4956A', '#6B7F5C', '#E07A4B', '#8B7355', '#D4A574'][i],
                        zIndex: 5 - i,
                        marginLeft: i > 0 ? '-8px' : 0,
                      }}
                    >
                      {letter}
                    </div>
                  ))}
                </div>
                <div className="hero__social-text">
                  <strong>10,000+</strong> ứng viên đang luyện tập
                  <div className="hero__rating">
                    {'★★★★★'.split('').map((s, i) => (
                      <span key={i} style={{ color: 'var(--color-accent)' }}>{s}</span>
                    ))}
                    <span style={{ color: 'var(--color-text-muted)', marginLeft: '4px' }}>4.9/5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════ PROBLEM STATEMENT — KOEI Accordion ══════════════ */}
      <section className="section problems">
        <div className="container">
          <div 
            className="section-header text-center reveal--slide-up" 
            style={{ 
              marginBottom: '4rem', 
              textAlign: 'center', 
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <h2 style={{
              fontFamily: 'var(--font-heading, "Inter", sans-serif)',
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: 'var(--color-charcoal, #2C2824)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              maxWidth: '900px',
              margin: '0 auto'
            }}>
              Chuẩn bị phỏng vấn
              <br />
              <em style={{ fontStyle: 'italic', color: 'var(--color-accent-vivid)', fontWeight: 500, fontFamily: 'var(--font-serif, "Playfair Display", serif)' }}>
                không nên là trò may rủi
              </em>
            </h2>
          </div>

          <div className="problems-accordion-container reveal">
            {[
              {
                title: "Không biết mình yếu ở đâu?",
                subtitle: "LACK OF FEEDBACK",
                description: "Phỏng vấn không chuẩn bị, trả lời lan man, thiếu tự tin — và không ai phản hồi cho bạn biết.",
                image: <img src={problemIllustration1} alt="Bối rối phỏng vấn" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />,
                color: 'var(--color-accent-vivid)'
              },
              {
                title: "CV bị loại bởi robot?",
                subtitle: "ATS REJECTION",
                description: "80% CV bị hệ thống ATS loại trước khi nhà tuyển dụng đọc — vì thiếu từ khóa phù hợp.",
                image: <img src={problemIllustration2} alt="CV bị loại" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />,
                color: '#35a78c'
              },
              {
                title: "Luyện tập không hệ thống?",
                subtitle: "POOR PREPARATION",
                description: "Tự luyện trước gương, hỏi bạn bè — nhưng không có feedback chuyên nghiệp và nhất quán.",
                image: <img src={problemIllustration3} alt="Luyện tập không hệ thống" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />,
                color: 'var(--color-accent)'
              }
            ].map((prob, idx) => (
                <ProblemAccordionItem 
                    key={idx}
                    {...prob}
                    isActive={activeProblem === idx}
                    onMouseEnter={() => setActiveProblem(idx)}
                    onClick={() => setActiveProblem(idx)}
                />
            ))}
          </div>
        </div>
      </section>

      {/* ── Cloud Divider: Problems → Features ── */}
      <CloudDivider
        topColor="transparent"
        bottomColor="#35a78c"
        variant="cloud"
      />

      {/* ══════════════ FEATURES SECTION — Architecture Portfolio Style ══════════════ */}
      <ArchitecturePortfolio features={features} />

      {/* ── Cloud Divider: Features → How It Works ── */}
      <CloudDivider
        topColor="#35a78c"
        bottomColor="#FAF7F2"
        highlightColor="#237a65"
        flip={true}
        variant="cloud"
      />

      {/* ══════════════ HOW IT WORKS — Card Stack Scroll (Blueprint Style) ══════════════ */}
      <CardStackSection />



      {/* ══════════════ CTA SECTION ══════════════ */}
      <section className="section cta">
        <div className="cta__shapes">
          <div className="cta__shape cta__shape--1" />
          <div className="cta__shape cta__shape--2" />
        </div>
        <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <h2 className="reveal" style={{ marginBottom: '1.5rem' }}>
            Sẵn sàng chinh phục
            <br />
            <em style={{ fontStyle: 'italic', color: 'var(--color-accent-vivid)' }}>buổi phỏng vấn tiếp theo?</em>
          </h2>
          <p className="reveal reveal--delay-1" style={{
            maxWidth: '500px',
            margin: '0 auto 2.5rem',
            fontSize: '1.05rem'
          }}>
            Tham gia cùng hàng nghìn ứng viên đã cải thiện kỹ năng phỏng vấn với ITA.
            Hoàn toàn miễn phí để bắt đầu.
          </p>
          <div className="reveal reveal--delay-2" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to={user ? '/interview' : '/register'}
              className="btn btn--vivid btn--lg"
            >
              Đăng ký miễn phí
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link to="/interview" className="btn btn--outline btn--lg">
              Thử ngay
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

/* ── Problem Accordion Item ── */
const ProblemAccordionItem = ({ title, subtitle, description, image, color, isActive, onMouseEnter, onClick }) => (
  <div 
    className={`problem-accordion-item ${isActive ? 'is-active' : ''}`}
    onMouseEnter={onMouseEnter}
    onClick={onClick}
    style={{ '--active-bg': color }}
  >
    <div className="problem-accordion-item__header">
      <div className="problem-accordion-item__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </div>
      <h3 className="problem-accordion-item__title">
        {title} <span className="problem-accordion-item__subtitle">{subtitle}</span>
      </h3>
    </div>
    
    <div className="problem-accordion-item__body-wrapper">
      <div className="problem-accordion-item__body">
        <div className="problem-accordion-item__content">
          <p className="problem-accordion-item__desc">{description}</p>
        </div>
        <div className="problem-accordion-item__image-box">
          {image}
        </div>
      </div>
    </div>
  </div>
);

/* ── Step Card ── */
const StepCard = ({ number, title, description, icon, delay }) => (
  <div className={`step-card reveal reveal--delay-${delay}`}>
    <div className="step-card__number">{number}</div>
    <div className="step-card__icon">{icon}</div>
    <h3 className="step-card__title">{title}</h3>
    <p className="step-card__desc">{description}</p>
  </div>
);

/* ── Counter Card ── */
const CounterCard = ({ number, suffix, label, visible, delay, color, index }) => {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (visible && !hasAnimated.current) {
      hasAnimated.current = true;
      const duration = 2000;
      const startTime = Date.now() + delay;

      const animate = () => {
        const now = Date.now();
        if (now < startTime) {
          requestAnimationFrame(animate);
          return;
        }
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(eased * number));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCount(number);
        }
      };
      requestAnimationFrame(animate);
    }
  }, [visible, number, delay]);

  const formatNumber = (n) => {
    if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K';
    return n.toString();
  };

  return (
    <div 
      className={`counter-card ${visible ? 'is-visible' : ''}`}
      style={{ 
        '--card-color': color, 
        transitionDelay: `${index * 0.15}s`
      }}
    >
      <div className="counter-card__number">
        {formatNumber(count)}{suffix}
      </div>
      <div className="counter-card__label">{label}</div>
    </div>
  );
};

/* ── Value Card ── */
const ValueCard = ({ icon, title, description, delay }) => (
  <div className={`value-card reveal reveal--delay-${delay}`}>
    <div className="value-card__icon">{icon}</div>
    <div className="value-card__content">
      <h3 className="value-card__title">{title}</h3>
      <p className="value-card__desc">{description}</p>
    </div>
  </div>
);

export default LandingPage;
