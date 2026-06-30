import React, { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Users, BarChart3, Database, FileText, Award, CreditCard, Briefcase, DollarSign, GraduationCap } from 'lucide-react';

const AdminPanel = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: 'var(--spacing-xl)', display: 'flex', gap: 'var(--spacing-lg)', minHeight: '80vh' }}>

      {/* Sidebar */}
      <aside style={{ width: '250px', flexShrink: 0 }}>
        <div className="glass-card" style={{ position: 'sticky', top: 'var(--spacing-xl)', padding: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', paddingLeft: '1rem' }}>Admin Dashboard</h2>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <NavTab to="/admin/statistics" icon={<BarChart3 size={20} />} label="Thống kê" />
            <NavTab to="/admin/users" icon={<Users size={20} />} label="Người dùng" />
            <NavTab to="/admin/questions" icon={<Database size={20} />} label="Câu hỏi (Bank)" />
            <NavTab to="/admin/blogs" icon={<FileText size={20} />} label="Bài viết / Blog" />
            <NavTab to="/admin/challenges" icon={<Award size={20} />} label="Thử thách" />
            <NavTab to="/admin/subscriptions" icon={<CreditCard size={20} />} label="Gói dịch vụ" />
            <NavTab to="/admin/orders" icon={<DollarSign size={20} />} label="Lịch sử giao dịch" />
            <NavTab to="/admin/employers" icon={<Briefcase size={20} />} label="Nhà tuyển dụng" />
            <NavTab to="/admin/mentors" icon={<GraduationCap size={20} />} label="Mentor" />
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </main>

    </div>
  );
};

const NavTab = ({ to, icon, label }) => (
  <NavLink
    to={to}
    style={({ isActive }) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      width: '100%',
      background: isActive ? 'rgba(100, 108, 255, 0.15)' : 'transparent',
      border: 'none',
      borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
      color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
      fontWeight: isActive ? 'bold' : 'normal',
      textAlign: 'left',
      borderRadius: '0 8px 8px 0',
      cursor: 'pointer',
      transition: 'all 0.2s',
      textDecoration: 'none'
    })}
    onMouseOver={(e) => {
      if (e.currentTarget.style.borderLeftColor === 'transparent') {
         e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
      }
    }}
    onMouseOut={(e) => {
      if (e.currentTarget.style.borderLeftColor === 'transparent') {
         e.currentTarget.style.background = 'transparent';
      }
    }}
  >
    {icon}
    <span>{label}</span>
  </NavLink>
);

export default AdminPanel;
