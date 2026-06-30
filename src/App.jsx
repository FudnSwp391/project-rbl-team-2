import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Lenis from 'lenis';
import Header from './components/layout/Header';
import AppRoutes from './routes/AppRoutes';
import BookingReminder from './components/BookingReminder';
import { ConfirmProvider } from './utils/ConfirmContext';
import './index.css';

function AppContent() {
  const location = useLocation();
  const lenisRef = useRef(null);

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

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
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
      <main style={{ flex: 1 }}>
        <AppRoutes />
      </main>
      <Footer />
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

function Footer() {
  return (
    <footer style={{
      padding: '3rem 0',
      borderTop: '1px solid var(--border-color)',
      background: 'var(--color-charcoal)',
      color: 'var(--color-cream)',
    }}>
      <div className="container" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '2rem',
        alignItems: 'start',
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.5rem',
            marginBottom: '1rem',
            color: 'var(--color-cream)',
          }}>
            ITA
          </div>
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--color-stone)',
            lineHeight: '1.7',
            maxWidth: '280px',
          }}>
            Interview Technology AI — Nền tảng phỏng vấn giả lập thông minh, giúp bạn tự tin chinh phục mọi buổi phỏng vấn.
          </p>
        </div>

        <div>
          <h4 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            color: 'var(--color-stone)',
            marginBottom: '1rem',
          }}>
            Tính năng
          </h4>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {['Phỏng vấn AI', 'Phân tích CV', 'Thử thách hàng ngày', 'Bảng xếp hạng'].map((item, i) => (
              <li key={i} style={{ fontSize: '0.9rem', color: 'var(--color-sand)', cursor: 'pointer', transition: 'color 0.3s' }}>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            color: 'var(--color-stone)',
            marginBottom: '1rem',
          }}>
            Liên hệ
          </h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-sand)', lineHeight: '2' }}>
            Team RBL - Nhóm 2<br />
            Interview Technology AI<br />
            ita@team-rbl.com
          </p>
        </div>
      </div>

      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.1)',
        marginTop: '2rem',
        paddingTop: '1.5rem',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-stone)' }}>
          © 2026 Interview Technology AI — Team RBL Nhóm 2. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default App;
