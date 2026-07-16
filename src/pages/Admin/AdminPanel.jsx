import React, { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Users, BarChart3, Database, FileText, Award, CreditCard, Briefcase, DollarSign, GraduationCap, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

const sidebarVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0, 
    transition: { 
      duration: 0.5,
      staggerChildren: 0.05
    } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};

const AdminPanel = () => {
  const location = useLocation();

  useEffect(() => {
    // Scrolling to top is now handled globally in App.jsx
  }, [location.pathname]);

  return (
    <div style={{ background: 'var(--color-cream)', minHeight: '100vh', paddingTop: '120px', paddingBottom: '4rem' }}>
      <div className="container" style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start' }}>

        {/* Sidebar */}
        <motion.aside 
          variants={sidebarVariants}
          initial="hidden"
          animate="visible"
          style={{ width: '280px', flexShrink: 0 }}
        >
          <div className="glass-card" style={{ position: 'sticky', top: '120px', padding: '1.5rem', borderRadius: '24px', boxShadow: '0 20px 40px rgba(44, 40, 36, 0.04)', overflow: 'hidden' }}>
            <div className="foliage-shadow" style={{ opacity: 0.1 }}></div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', paddingLeft: '0.5rem' }}>
                <div style={{ padding: '0.6rem', background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.1), rgba(194, 65, 12, 0.1))', borderRadius: '14px', color: '#EA580C', display: 'flex' }}>
                  <LayoutDashboard size={22} />
                </div>
                <h2 style={{ fontSize: '1.3rem', margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-charcoal)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>Quản Trị</h2>
              </div>
              
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <NavTab to="/admin/statistics" icon={<BarChart3 size={18} />} label="Thống kê" variants={itemVariants} />
                <NavTab to="/admin/users" icon={<Users size={18} />} label="Người dùng" variants={itemVariants} />
                <NavTab to="/admin/questions" icon={<Database size={18} />} label="Câu hỏi (Bank)" variants={itemVariants} />
                <NavTab to="/admin/blogs" icon={<FileText size={18} />} label="Bài viết / Blog" variants={itemVariants} />
                <NavTab to="/admin/challenges" icon={<Award size={18} />} label="Thử thách" variants={itemVariants} />
                <NavTab to="/admin/subscriptions" icon={<CreditCard size={18} />} label="Gói dịch vụ" variants={itemVariants} />
                <NavTab to="/admin/orders" icon={<DollarSign size={18} />} label="Lịch sử giao dịch" variants={itemVariants} />
                <NavTab to="/admin/employers" icon={<Briefcase size={18} />} label="Nhà tuyển dụng" variants={itemVariants} />
                <NavTab to="/admin/mentors" icon={<GraduationCap size={18} />} label="Mentor" variants={itemVariants} />
              </nav>
            </div>
          </div>
        </motion.aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <Outlet />
        </main>

      </div>
    </div>
  );
};

const NavTab = ({ to, icon, label, variants }) => (
  <NavLink
    to={to}
    className={({ isActive }) => (isActive ? 'active' : '')}
    style={({ isActive }) => ({
      display: 'block',
      padding: '0.85rem 1rem',
      width: '100%',
      background: isActive ? 'linear-gradient(135deg, rgba(234, 88, 12, 0.1), rgba(234, 88, 12, 0.02))' : 'transparent',
      border: 'none',
      color: isActive ? '#EA580C' : 'var(--color-text-secondary)',
      fontWeight: isActive ? 600 : 500,
      textAlign: 'left',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textDecoration: 'none'
    })}
    onMouseOver={(e) => {
      if (!e.currentTarget.classList.contains('active')) {
         e.currentTarget.style.background = 'rgba(44, 40, 36, 0.03)';
         e.currentTarget.style.color = 'var(--color-charcoal)';
      }
    }}
    onMouseOut={(e) => {
      if (!e.currentTarget.classList.contains('active')) {
         e.currentTarget.style.background = 'transparent';
         e.currentTarget.style.color = 'var(--color-text-secondary)';
      }
    }}
  >
    {({ isActive }) => (
      <motion.div variants={variants} style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          transition: 'transform 0.3s ease, color 0.3s ease',
          transform: isActive ? 'scale(1.1)' : 'scale(1)',
          color: isActive ? '#EA580C' : 'inherit'
        }}>
          {icon}
        </div>
        <span style={{ fontSize: '0.95rem' }}>{label}</span>
      </motion.div>
    )}
  </NavLink>
);

export default AdminPanel;
