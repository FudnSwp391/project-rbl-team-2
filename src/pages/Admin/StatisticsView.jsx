import React, { useState, useEffect } from 'react';
import { Users, Activity, Target, Crown } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

const StatisticsView = () => {
  // Dữ liệu trống, sẽ được fetch từ backend sau
  const [stats, setStats] = useState({
    totalInterviews: 0,
    avgScore: 0,
    activeUsers: 0,
    premiumSubscribers: 0,
    interviewsPastWeek: [0, 0, 0, 0, 0, 0, 0]
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // 1. Tổng phỏng vấn
      const { count: totalInterviews } = await supabase
        .from('interviews')
        .select('*', { count: 'exact', head: true });

      // 2. Điểm trung bình (lấy overall_score của các bài phỏng vấn đã chấm)
      const { data: interviewsWithScore } = await supabase
        .from('interviews')
        .select('overall_score')
        .not('overall_score', 'is', null);
      
      let avgScore = 0;
      if (interviewsWithScore && interviewsWithScore.length > 0) {
        const sum = interviewsWithScore.reduce((acc, curr) => acc + curr.overall_score, 0);
        avgScore = Math.round(sum / interviewsWithScore.length);
      }

      // 3. Người dùng Active (đếm role là user/candidate/recruiter có status active)
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'Active']);

      // 4. Subscribers (Pro, Premium)
      const { count: premiumSubscribers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('plan', ['Pro', 'Premium']);

      // 5. Phỏng vấn 7 ngày qua
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: recentInterviews } = await supabase
        .from('interviews')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

      const interviewsPastWeek = [0, 0, 0, 0, 0, 0, 0];
      
      if (recentInterviews) {
        recentInterviews.forEach(interview => {
          const date = new Date(interview.created_at);
          // getDay(): 0 = Sunday, 1 = Monday ... 6 = Saturday
          // Đổi thành 0 = Monday ... 6 = Sunday
          let dayIndex = date.getDay() - 1;
          if (dayIndex === -1) dayIndex = 6; 
          interviewsPastWeek[dayIndex]++;
        });
      }

      setStats({
        totalInterviews: totalInterviews || 0,
        avgScore,
        activeUsers: activeUsers || 0,
        premiumSubscribers: premiumSubscribers || 0,
        interviewsPastWeek
      });

    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const maxInterviews = Math.max(...stats.interviewsPastWeek, 10);

  return (
    <div className="animate-fade">
      <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Báo cáo Thống kê</h2>

      <div className="grid-auto" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <StatCard title="Tổng Phỏng vấn" value={stats.totalInterviews} icon={<Activity color="hsl(var(--primary-hsl))" />} />
        <StatCard title="Điểm Trung bình" value={`${stats.avgScore}/100`} icon={<Target color="#32c864" />} />
        <StatCard title="Người dùng Active" value={stats.activeUsers} icon={<Users color="hsl(var(--accent-hsl))" />} />
        <StatCard title="Subscribers" value={stats.premiumSubscribers} icon={<Crown color="#ff9632" />} />
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Phỏng vấn trong 7 ngày qua</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '250px', padding: '1rem 0' }}>
          {stats.interviewsPastWeek.map((count, index) => {
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
