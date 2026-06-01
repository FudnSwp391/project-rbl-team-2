import React, { useState } from 'react';
import { Users, BarChart3, Database, FileText, Award, CreditCard, Briefcase, DollarSign, GraduationCap } from 'lucide-react';
import UsersView from './UsersView';
import StatisticsView from './StatisticsView';
import QuestionBankView from './QuestionBankView';
import BlogsView from './BlogsView';
import ChallengesView from './ChallengesView';
import SubscriptionPlansView from './SubscriptionPlansView';
import OrdersView from './OrdersView';
import EmployersView from './EmployersView';
import MentorsView from './MentorsView';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('statistics');

  const renderContent = () => {
    switch (activeTab) {
      case 'users': return <UsersView />;
      case 'statistics': return <StatisticsView />;
      case 'questions': return <QuestionBankView />;
      case 'blogs': return <BlogsView />;
      case 'challenges': return <ChallengesView />;
      case 'subscriptions': return <SubscriptionPlansView />;
      case 'orders': return <OrdersView />;
      case 'employers': return <EmployersView />;
      case 'mentors': return <MentorsView />;
      default: return <StatisticsView />;
    }
  };

  return (
    <div className="container" style={{ paddingTop: '120px', paddingBottom: 'var(--spacing-xl)', display: 'flex', gap: 'var(--spacing-lg)', minHeight: '80vh' }}>

      {/* Sidebar */}
      <aside style={{ width: '250px', flexShrink: 0 }}>
        <div className="glass-card" style={{ position: 'sticky', top: 'var(--spacing-xl)', padding: '1rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', paddingLeft: '1rem' }}>Admin Dashboard</h2>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <TabButton
              active={activeTab === 'statistics'}
              onClick={() => setActiveTab('statistics')}
              icon={<BarChart3 size={20} />}
              label="Thống kê"
            />
            <TabButton
              active={activeTab === 'users'}
              onClick={() => setActiveTab('users')}
              icon={<Users size={20} />}
              label="Người dùng"
            />
            <TabButton
              active={activeTab === 'questions'}
              onClick={() => setActiveTab('questions')}
              icon={<Database size={20} />}
              label="Câu hỏi (Bank)"
            />
            <TabButton
              active={activeTab === 'blogs'}
              onClick={() => setActiveTab('blogs')}
              icon={<FileText size={20} />}
              label="Bài viết / Blog"
            />
            <TabButton
              active={activeTab === 'challenges'}
              onClick={() => setActiveTab('challenges')}
              icon={<Award size={20} />}
              label="Thử thách"
            />
            <TabButton
              active={activeTab === 'subscriptions'}
              onClick={() => setActiveTab('subscriptions')}
              icon={<CreditCard size={20} />}
              label="Gói dịch vụ"
            />
            <TabButton
              active={activeTab === 'orders'}
              onClick={() => setActiveTab('orders')}
              icon={<DollarSign size={20} />}
              label="Lịch sử giao dịch"
            />
            <TabButton
              active={activeTab === 'employers'}
              onClick={() => setActiveTab('employers')}
              icon={<Briefcase size={20} />}
              label="Nhà tuyển dụng"
            />
            <TabButton
              active={activeTab === 'mentors'}
              onClick={() => setActiveTab('mentors')}
              icon={<GraduationCap size={20} />}
              label="Mentor"
            />
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, minWidth: 0 }}>
        {renderContent()}
      </main>

    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      width: '100%',
      background: active ? 'rgba(100, 108, 255, 0.15)' : 'transparent',
      border: 'none',
      borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
      color: active ? 'var(--primary)' : 'var(--text-secondary)',
      fontWeight: active ? 'bold' : 'normal',
      textAlign: 'left',
      borderRadius: '0 8px 8px 0',
      cursor: 'pointer',
      transition: 'all 0.2s',
    }}
    onMouseOver={(e) => {
      if (!active) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
    }}
    onMouseOut={(e) => {
      if (!active) e.currentTarget.style.background = 'transparent';
    }}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default AdminPanel;
