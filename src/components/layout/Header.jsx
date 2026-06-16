import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();

  // Debugging log to see if user state is populated
  useEffect(() => {
    console.log("Current user state in Header:", user);
  }, [user]);

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

  const isMentor = profile?.role?.toLowerCase() === 'mentor' || user?.user_metadata?.role?.toLowerCase() === 'mentor';
  const isRecruiter = profile?.role?.toLowerCase() === 'recruiter' || profile?.role?.toLowerCase() === 'company';
  const isAdmin = profile?.role?.toLowerCase() === 'admin' || user?.user_metadata?.role?.toLowerCase() === 'admin';

  let navLinks = [
    { to: '/interview', label: 'Phỏng vấn' },
    { to: '/cv-analysis', label: 'Phân tích CV' },
  ];

  const isCandidate = !isMentor && !isAdmin && !isRecruiter;

  if (isCandidate) {
    navLinks.push({ to: '/dashboard', label: 'Thử thách' });
    navLinks.push({
      label: 'Khám phá',
      dropdown: [
        { to: '/mentors', label: 'Tìm Mentors' },
        { to: '/blogs', label: 'Blog' },
        { to: '/jobs', label: 'Việc làm' },
        { to: '/mentor-register', label: 'Đăng ký Mentor' },
        { to: '/recruiter-register', label: 'Dành cho doanh nghiệp' }
      ]
    });
    navLinks.push({ to: '/pricing', label: 'Gói dịch vụ' });
  } else {
    if (!isAdmin) {
      navLinks.push({ to: '/mentors', label: 'Mentors' });
    }

    if (isRecruiter) {
      navLinks.push({ to: '/question-bank', label: 'Ngân hàng câu hỏi' });
    }

    if (!isRecruiter && !isMentor) { // This covers Admin
      navLinks.push({ to: '/pricing', label: 'Gói dịch vụ' });
    }

    navLinks.push({ to: '/blogs', label: 'Blog' });

    if (isAdmin) {
      navLinks.push({ to: '/admin', label: 'Quản trị' });
    }

    if (isRecruiter) {
      navLinks.push({ to: '/recruiter', label: 'Tuyển Dụng' });
    }

    if (isMentor) {
      navLinks.push({ to: '/mentor', label: 'Mentor Portal' });
    }
  }

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
          {navLinks.map((link, idx) => (
            link.dropdown ? (
              <div key={idx} className="nav-dropdown" style={{ position: 'relative' }}>
                <span style={{
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  transition: 'color 0.3s ease',
                  padding: '0.5rem 0'
                }} className="nav-link-item">
                  {link.label} ▾
                </span>
                <div className="nav-dropdown-menu" style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%) translateY(10px)',
                  background: 'var(--color-cream)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-md)',
                  padding: '0.5rem',
                  minWidth: '200px',
                  opacity: 0,
                  visibility: 'hidden',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem'
                }}>
                  {link.dropdown.map(subItem => (
                    <Link
                      key={subItem.to}
                      to={subItem.to}
                      style={{
                        padding: '0.6rem 1rem',
                        textDecoration: 'none',
                        color: 'var(--color-charcoal)',
                        fontSize: '0.85rem',
                        borderRadius: '8px',
                        transition: 'background 0.2s',
                        whiteSpace: 'nowrap'
                      }}
                      className="dropdown-link-item"
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
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
                className="nav-link-item"
              >
                {link.label}
              </Link>
            )
          ))}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link 
                to={
                  profile?.role === 'mentor' || user?.user_metadata?.role === 'mentor' 
                    ? '/mentor/profile' 
                    : profile?.role === 'recruiter' || user?.user_metadata?.role === 'recruiter'
                      ? '/recruiter/company'
                      : '/profile'
                } 
                style={{
                  textDecoration: 'none',
                  color: 'var(--color-charcoal)',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }} className="nav-link-item">
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'var(--color-earth, #c4956a)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: '14px'
                }}>
                  {user.user_metadata?.full_name
                    ? user.user_metadata.full_name.charAt(0).toUpperCase()
                    : (user.email ? user.email.charAt(0).toUpperCase() : 'U')}
                </div>
                <span>
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                {profile?.role?.toLowerCase() === 'admin' ? (
                  <span style={{
                    background: 'linear-gradient(135deg, #d97706, #fbbf24)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '12px',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    marginLeft: '4px',
                    boxShadow: '0 0 8px rgba(217, 119, 6, 0.6), 0 0 16px rgba(251, 191, 36, 0.4)'
                  }}>
                    ADMIN
                  </span>
                ) : isMentor ? (
                  <span style={{
                    background: 'var(--color-moss, #6B7F5C)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '12px',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    marginLeft: '4px'
                  }}>
                    MENTOR
                  </span>
                ) : profile?.role === 'recruiter' ? (
                  <span style={{
                    background: '#0ea5e9', // Premium Ocean/Sky Blue color for company
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '12px',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    marginLeft: '4px'
                  }}>
                    COMPANY
                  </span>
                ) : profile?.plan && profile.plan !== 'Free' && (
                  <span style={{
                    background: profile.plan === 'Premium' ? '#ff9632' : (profile.plan === 'Pro' ? '#32c864' : '#e2e8f0'),
                    color: profile.plan === 'Premium' ? 'white' : (profile.plan === 'Pro' ? 'white' : '#64748b'),
                    padding: '2px 6px',
                    borderRadius: '12px',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    marginLeft: '4px'
                  }}>
                    {profile.plan}
                  </span>
                )}
              </Link>
              <button onClick={handleLogout} className="btn btn--outline" style={{
                padding: '0.4rem 1rem',
                fontSize: '0.75rem',
                borderRadius: '9999px',
                border: '1px solid var(--border-color, #e0d5c1)',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}>
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
        {navLinks.map((link, idx) => (
          link.dropdown ? (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{link.label}</div>
              {link.dropdown.map(subItem => (
                <Link
                  key={subItem.to}
                  to={subItem.to}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    textDecoration: 'none',
                    color: 'var(--color-charcoal)',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.75rem',
                    transition: 'color 0.3s ease'
                  }}
                  className="mobile-nav-link"
                >
                  {subItem.label}
                </Link>
              ))}
            </div>
          ) : (
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
          )
        ))}
        {user ? (
          <>
            <Link to="/profile" onClick={() => setMenuOpen(false)} style={{
              textDecoration: 'none',
              color: 'var(--color-earth, #c4956a)',
              fontFamily: 'var(--font-serif)',
              fontSize: '1.5rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              Xin chào, <span>
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                {profile?.role?.toLowerCase() === 'admin' && (
                  <span style={{
                    background: 'linear-gradient(135deg, #d97706, #fbbf24)',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    boxShadow: '0 0 8px rgba(217, 119, 6, 0.6), 0 0 16px rgba(251, 191, 36, 0.4)'
                  }}>
                    ADMIN
                  </span>
                )}
                {isMentor && (
                  <span style={{
                    background: 'var(--color-moss, #6B7F5C)',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    marginLeft: '4px'
                  }}>
                    MENTOR
                  </span>
                )}
            </Link>
            <button onClick={handleLogout} className="btn btn--outline" style={{
              padding: '0.6rem 2rem',
              borderRadius: '9999px',
              border: '1px solid var(--color-earth, #c4956a)',
              background: 'transparent',
              color: 'var(--color-earth, #c4956a)',
              fontSize: '1rem',
              cursor: 'pointer',
              marginTop: '1rem'
            }}>
              Đăng xuất
            </button>
          </>
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
        .nav-dropdown:hover .nav-dropdown-menu {
          opacity: 1 !important;
          visibility: visible !important;
          transform: translateX(-50%) translateY(5px) !important;
        }
        .dropdown-link-item:hover {
          background: var(--color-warm-white);
        }
      `}</style>
    </header>
  );
};

export default Header;
