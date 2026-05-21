import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMenuOpen(false);
  };

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
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      padding: scrolled ? '0.75rem 0' : '1.25rem 0',
      background: scrolled ? 'rgba(245, 240, 235, 0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border-color)' : '1px solid transparent',
      transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
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
            fontSize: '1.6rem',
            fontWeight: 400,
            letterSpacing: '-0.02em',
          }}>
            ITA
          </span>
          <span style={{
            fontSize: '0.6rem',
            fontWeight: 500,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
            borderLeft: '1px solid var(--border-color-strong)',
            paddingLeft: '12px',
          }}>
            Interview<br />Technology AI
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav style={{
          display: 'flex',
          gap: '2.5rem',
          alignItems: 'center',
        }} className="desktop-nav">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                textDecoration: 'none',
                color: location.pathname === link.to ? 'var(--color-charcoal)' : 'var(--color-text-muted)',
                fontSize: '0.85rem',
                fontWeight: 500,
                letterSpacing: '0',
                transition: 'color 0.3s ease',
                position: 'relative',
              }}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link to="/profile" style={{ 
                fontSize: '0.85rem', 
                fontWeight: 600, 
                color: 'var(--color-charcoal)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: 'var(--color-earth)', 
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem'
                }}>
                  {(user.user_metadata?.full_name || user.email).charAt(0).toUpperCase()}
                </div>
                {user.user_metadata?.full_name || user.email}
              </Link>
              <button 
                onClick={handleLogout}
                className="btn btn--outline" 
                style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn--primary" style={{
              padding: '0.6rem 1.5rem',
              fontSize: '0.75rem',
            }}>
              Bắt đầu
            </Link>
          )}
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
          }}
          className="mobile-toggle"
          aria-label="Menu"
        >
          <span style={{
            display: 'block',
            width: '24px',
            height: '2px',
            background: 'var(--color-charcoal)',
            transition: 'all 0.3s ease',
            transform: menuOpen ? 'rotate(45deg) translateY(0)' : 'translateY(-4px)',
            position: 'absolute',
            left: '4px',
          }} />
          <span style={{
            display: 'block',
            width: '24px',
            height: '2px',
            background: 'var(--color-charcoal)',
            transition: 'all 0.3s ease',
            transform: menuOpen ? 'rotate(-45deg) translateY(0)' : 'translateY(4px)',
            position: 'absolute',
            left: '4px',
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
        gap: '2rem',
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
            }}
          >
            {link.label}
          </Link>
        ))}
        {user ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Link to="/profile" onClick={() => setMenuOpen(false)} style={{
              textDecoration: 'none',
              color: 'var(--color-charcoal)',
              fontFamily: 'var(--font-serif)',
              fontSize: '1.5rem',
            }}>
              Hồ sơ của tôi
            </Link>
            <button 
              onClick={handleLogout}
              className="btn btn--outline" 
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn btn--primary" onClick={() => setMenuOpen(false)}>
            Bắt đầu
          </Link>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: flex !important; align-items: center; justify-content: center; }
          .mobile-menu { display: flex !important; }
        }
      `}</style>
    </header>
  );
};

export default Header;
