import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const navLinks = [
    { to: '/', label: 'Trang chủ' },
    { to: '/interview', label: 'Phỏng vấn' },
    { to: '/cv-analysis', label: 'Phân tích CV' },
    { to: '/dashboard', label: 'Thử thách' },
  ];

  return (
    <header id="main-header" style={{
      position: 'fixed',
      top: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 3rem)',
      maxWidth: '1200px',
      zIndex: 1000,
      padding: '0.6rem 2.5rem',
      background: scrolled ? 'rgba(250, 248, 245, 0.65)' : 'rgba(250, 248, 245, 0.45)',
      backdropFilter: 'blur(25px)',
      WebkitBackdropFilter: 'blur(25px)',
      border: '1px solid rgba(255, 255, 255, 0.55)',
      borderRadius: '9999px',
      boxShadow: scrolled ? '0 25px 50px rgba(44, 40, 36, 0.08)' : '0 15px 35px rgba(44, 40, 36, 0.04)',
      transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%'
      }}>
        {/* Logo */}
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textDecoration: 'none',
          color: 'var(--color-charcoal)',
        }}>
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.45rem',
            fontWeight: 500,
            letterSpacing: '-0.03em',
          }}>
            ita.
          </span>
          <span style={{
            fontSize: '0.55rem',
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
            borderLeft: '1px solid rgba(44, 40, 36, 0.15)',
            paddingLeft: '12px',
            lineHeight: '1.2'
          }} className="logo-subtitle">
            Interview<br />Technology AI
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav style={{
          display: 'flex',
          gap: '2.2rem',
          alignItems: 'center',
        }} className="desktop-nav">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  textDecoration: 'none',
                  color: isActive ? 'var(--color-charcoal)' : 'var(--color-text-secondary)',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? '500' : '400',
                  letterSpacing: '0.01em',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  padding: '4px 0'
                }}
                className="nav-link-item"
              >
                {link.label}
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'var(--color-accent)'
                  }} />
                )}
              </Link>
            );
          })}
          <Link to="/login" className="btn btn--primary btn-start-nav" style={{
            padding: '0.65rem 1.6rem',
            fontSize: '0.75rem',
            borderRadius: '9999px',
            marginLeft: '0.5rem',
            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            Bắt đầu
          </Link>
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          id="mobile-menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            position: 'relative',
            width: '32px',
            height: '32px',
            zIndex: 1001,
          }}
          className="mobile-toggle"
          aria-label="Menu"
        >
          <span style={{
            display: 'block',
            width: '20px',
            height: '1.5px',
            background: 'var(--color-charcoal)',
            transition: 'all 0.3s ease',
            transform: menuOpen ? 'rotate(45deg) translateY(0)' : 'translateY(-3px)',
            position: 'absolute',
            left: '6px',
          }} />
          <span style={{
            display: 'block',
            width: '20px',
            height: '1.5px',
            background: 'var(--color-charcoal)',
            transition: 'all 0.3s ease',
            transform: menuOpen ? 'rotate(-45deg) translateY(0)' : 'translateY(3px)',
            position: 'absolute',
            left: '6px',
          }} />
        </button>
      </div>

      {/* Mobile Menu */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--color-cream)',
        display: 'none',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2.5rem',
        transform: menuOpen ? 'translateY(0)' : 'translateY(-100%)',
        visibility: menuOpen ? 'visible' : 'hidden',
        pointerEvents: menuOpen ? 'auto' : 'none',
        transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.6s',
        zIndex: 999,
      }} className="mobile-menu">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            onClick={() => setMenuOpen(false)}
            style={{
              textDecoration: 'none',
              color: 'var(--color-charcoal)',
              fontFamily: 'var(--font-serif)',
              fontSize: '2rem',
              transition: 'color 0.3s ease'
            }}
            className="mobile-nav-link"
          >
            {link.label}
          </Link>
        ))}
        <Link to="/login" className="btn btn--primary" onClick={() => setMenuOpen(false)} style={{ borderRadius: '9999px', padding: '1rem 2.5rem' }}>
          Bắt đầu
        </Link>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; align-items: center; justify-content: center; }
          .mobile-menu { display: flex !important; }
          .logo-subtitle { display: none !important; }
        }
        .nav-link-item:hover {
          color: var(--color-charcoal) !important;
          transform: translateY(-1px);
        }
        .mobile-nav-link:hover {
          color: var(--color-accent) !important;
        }
        .btn-start-nav:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 10px 20px rgba(44, 40, 36, 0.15) !important;
        }
      `}</style>
    </header>
  );
};

export default Header;
