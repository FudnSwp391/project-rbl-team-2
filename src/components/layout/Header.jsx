import React from 'react';
import { Link } from 'react-router-dom';
import { BrainCircuit, User, Menu } from 'lucide-react';

const Header = () => {
  return (
    <header style={{
      padding: 'var(--spacing-sm) 0',
      borderBottom: '1px solid var(--glass-border)',
      position: 'sticky',
      top: 0,
      background: 'rgba(9, 11, 18, 0.8)',
      backdropFilter: 'blur(10px)',
      zIndex: 100
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link to="/" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          textDecoration: 'none',
          color: 'inherit'
        }}>
          <BrainCircuit size={32} color="hsl(var(--primary-hsl))" />
          <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-1px' }}>
            AI<span className="gradient-text">Interview</span>
          </span>
        </Link>

        <nav style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
          <Link to="/interview" className="nav-link" style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>Phỏng vấn</Link>
          <Link to="/cv-analysis" className="nav-link" style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>Phân tích CV</Link>
          <Link to="/dashboard" className="nav-link" style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>Thử thách</Link>
          <Link to="/login" className="btn-primary" style={{ padding: '0.5rem 1.2rem' }}>Bắt đầu</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
