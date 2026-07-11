import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, useLocation, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from './components/layout/Header';
import AppRoutes from './routes/AppRoutes';
import BookingReminder from './components/BookingReminder';
import { ConfirmProvider } from './utils/ConfirmContext';
import './index.css';

gsap.registerPlugin(ScrollTrigger);

function AppContent() {
  const location = useLocation();
  const lenisRef = useRef(null);
  const [footerHeight, setFooterHeight] = useState(0);

  // Hide Header/Footer on interview routes for immersive experience
  const isInterviewRoute = location.pathname === '/interview' || location.pathname.startsWith('/interview/');

  useEffect(() => {
    // Disable Lenis on interview routes (they handle their own scrolling)
    if (isInterviewRoute) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });
    lenisRef.current = lenis;
    window.lenis = lenis; // Expose globally for components that need to lock scroll

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, [isInterviewRoute]);

  if (isInterviewRoute) {
    return (
      <AppRoutes />
    );
  }

  return (
    <div className="app" data-lenis-prevent={false}>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#333', color: '#fff' } }} />
      <Header />
      <main style={{ 
        flex: 1, 
        position: 'relative', 
        zIndex: 1, 
        marginBottom: footerHeight,
        background: 'var(--color-warm-white)',
        borderBottomLeftRadius: '80px',
        borderBottomRightRadius: '80px',
        overflow: 'clip',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <AppRoutes />
      </main>
      <Footer setHeight={setFooterHeight} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <ConfirmProvider>
        <BookingReminder />
        <AppContent />
      </ConfirmProvider>
    </Router>
  );
}

function Footer({ setHeight }) {
  const footerRef = useRef(null);

  useEffect(() => {
    if (!footerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // Use offsetHeight to include padding and border, contentRect ignores them
        setHeight(entry.target.offsetHeight);
      }
    });
    observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, [setHeight]);

  return (
    <footer ref={footerRef} style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      zIndex: 0,
      padding: '5rem 0 2rem 0',
      background: 'var(--color-charcoal)',
      color: 'var(--color-cream)',
    }}>
      {/* Background extension to fill the border-radius gap of main */}
      <div style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        width: '100%',
        height: '100px',
        background: 'var(--color-charcoal)',
        zIndex: -1,
      }} />

      <div className="container" style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: '4rem',
        marginBottom: '4rem',
      }}>
        {/* Brand Side */}
        <div style={{ flex: '1 1 300px', maxWidth: '400px' }}>
          <Link to="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '1.5rem',
            textDecoration: 'none'
          }}>
            <span style={{
              fontFamily: 'var(--font-heading, var(--font-serif))',
              fontSize: '2.5rem',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              color: 'var(--color-cream)',
              lineHeight: 1
            }}>
              ita.
            </span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-stone)',
              borderLeft: '2px solid rgba(255, 255, 255, 0.15)',
              paddingLeft: '12px',
              lineHeight: '1.4'
            }}>
              Interview<br />Technology AI
            </span>
          </Link>
          <p style={{
            fontSize: '0.95rem',
            color: 'var(--color-sand)',
            lineHeight: '1.8',
            fontWeight: 300
          }}>
            Nền tảng phỏng vấn giả lập thông minh, giúp bạn tự tin chinh phục mọi buổi phỏng vấn.
          </p>
        </div>

        {/* Links Side */}
        <div style={{
          flex: '2 1 500px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '2rem'
        }}>
          {/* Links Column 1 */}
          <div>
            <h4 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              color: 'var(--color-cream)',
              marginBottom: '1.5rem',
            }}>
              Sản phẩm
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Phỏng vấn AI', path: '/interview' },
                { label: 'Phân tích CV', path: '/cv-analysis' },
                { label: 'Thử thách', path: '/dashboard' },
                { label: 'Gói dịch vụ', path: '/pricing' }
              ].map((item, i) => (
                <li key={i}>
                  <Link to={item.path} style={{ 
                    fontSize: '0.9rem', 
                    color: 'var(--color-stone)', 
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-cream)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-stone)'; }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              color: 'var(--color-cream)',
              marginBottom: '1.5rem',
            }}>
              Khám phá
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Tìm Mentors', path: '/mentors' },
                { label: 'Việc làm', path: '/jobs' },
                { label: 'Blog', path: '/blogs' },
                { label: 'Đăng ký Mentor', path: '/mentor-register' },
                { label: 'Doanh nghiệp', path: '/recruiter-register' }
              ].map((item, i) => (
                <li key={i}>
                  <Link to={item.path} style={{ 
                    fontSize: '0.9rem', 
                    color: 'var(--color-stone)', 
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-cream)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-stone)'; }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 3 */}
          <div>
            <h4 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              color: 'var(--color-cream)',
              marginBottom: '1.5rem',
            }}>
              Hỗ trợ
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Trung tâm trợ giúp', path: '#' },
                { label: 'Điều khoản sử dụng', path: '#' },
                { label: 'Chính sách bảo mật', path: '#' }
              ].map((item, i) => (
                <li key={i}>
                  <Link to={item.path} style={{ 
                    fontSize: '0.9rem', 
                    color: 'var(--color-stone)', 
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-cream)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-stone)'; }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href="mailto:ita@team-rbl.com" style={{ 
                    fontSize: '0.9rem', 
                    color: 'var(--color-stone)', 
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-cream)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-stone)'; }}>
                  Liên hệ
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>



      {/* Bottom Bar */}
      <div className="container">
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-stone)', letterSpacing: '0.02em' }}>
            © 2026 Interview Technology AI. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-stone)', cursor: 'pointer', transition: 'color 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-cream)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-stone)'}>Privacy Policy</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-stone)', cursor: 'pointer', transition: 'color 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-cream)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-stone)'}>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default App;
