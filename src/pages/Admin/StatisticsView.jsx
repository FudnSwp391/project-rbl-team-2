import React from 'react';
import { mockStats } from '../../utils/mockData';
import { Users, Activity, Target, Crown } from 'lucide-react';

const StatisticsView = () => {
  const maxInterviews = Math.max(...mockStats.interviewsPastWeek);

  return (
    <div className="animate-fade">
      <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Báo cáo Thống kê</h2>

      <div className="grid-auto" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <StatCard title="Tổng Phỏng vấn" value={mockStats.totalInterviews} icon={<Activity color="hsl(var(--primary-hsl))" />} />
        <StatCard title="Điểm Trung bình" value={`${mockStats.avgScore}/100`} icon={<Target color="#32c864" />} />
        <StatCard title="Người dùng Active" value={mockStats.activeUsers} icon={<Users color="hsl(var(--accent-hsl))" />} />
        <StatCard title="Subscribers" value={mockStats.premiumSubscribers} icon={<Crown color="#ff9632" />} />
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Phỏng vấn trong 7 ngày qua</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '250px', padding: '1rem 0' }}>
          {mockStats.interviewsPastWeek.map((count, index) => {
            const heightPercentage = (count / maxInterviews) * 100;
            const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

            return (
              <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{count}</div>
                <div style={{
                  width: '100%',
                  height: `${heightPercentage}%`,
                  background: 'linear-gradient(to top, hsl(var(--primary-hsl)), hsl(var(--accent-hsl)))',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.5s ease-out',
                  minHeight: '2px'
                }} />
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{days[index]}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div style={{ padding: '1rem', background: 'var(--glass-bg)', borderRadius: '12px' }}>
      {icon}
    </div>
    <div>
      <h3 style={{ fontSize: '1.8rem', margin: 0 }}>{value}</h3>
      <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{title}</p>
    </div>
  </div>
);

export default StatisticsView;
