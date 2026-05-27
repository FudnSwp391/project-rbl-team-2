import React, { useState, useEffect } from 'react';
import { Target, Zap, Trophy, History, Star, Search, FolderOpen } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, profile } = useAuth();
  
  // Dữ liệu trống, sẽ fetch từ backend sau
  const dailyChallenges = [];

  return (
    <div className="container animate-fade" style={{ paddingTop: '8rem', paddingBottom: 'var(--spacing-xl)' }}>
      <header style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-xs)' }}>
          Xin chào, <span className="gradient-text">{profile?.full_name || user?.email?.split('@')[0] || 'Bạn'}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Sẵn sàng để tiếp tục luyện tập hôm nay chưa?</p>
      </header>

      <div className="grid-auto" style={{ marginBottom: 'var(--spacing-lg)' }}>
        {/* Streak Card */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <div style={{ padding: '1rem', background: 'rgba(255, 150, 50, 0.1)', borderRadius: '12px' }}>
            <Zap size={32} color="#ff9632" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{profile?.streak_days || 0} Ngày</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Streak liên tiếp</p>
          </div>
        </div>

        {/* Score Card */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <div style={{ padding: '1rem', background: 'rgba(50, 200, 100, 0.1)', borderRadius: '12px' }}>
            <Trophy size={32} color="#32c864" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{profile?.points || 0} Điểm</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Tổng điểm xếp hạng</p>
          </div>
        </div>

        {/* Plan Card */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <div style={{ padding: '1rem', background: 'rgba(100, 108, 255, 0.1)', borderRadius: '12px' }}>
            <Star size={32} color="hsl(var(--primary-hsl))" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Gói {profile?.plan || 'Free'}</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              <Link to="/pricing" style={{ color: 'hsl(var(--accent-hsl))', textDecoration: 'none' }}>Nâng cấp ngay &rarr;</Link>
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
        {/* Daily Challenges */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--spacing-md)' }}>
            <Target color="hsl(var(--accent-hsl))" />
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Thử thách Hàng ngày</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', flex: 1 }}>
            {dailyChallenges.length > 0 ? (
              dailyChallenges.map(challenge => (
                <div key={challenge.id} style={{
                  padding: '1rem',
                  background: challenge.completed ? 'rgba(50, 200, 100, 0.05)' : 'var(--glass-bg)',
                  border: `1px solid ${challenge.completed ? 'rgba(50, 200, 100, 0.2)' : 'var(--glass-border)'}`,
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" readOnly checked={challenge.completed} style={{ accentColor: '#32c864', width: '18px', height: '18px' }} />
                    <span style={{ textDecoration: challenge.completed ? 'line-through' : 'none', color: challenge.completed ? 'var(--text-secondary)' : 'inherit' }}>
                      {challenge.title}
                    </span>
                  </div>
                  <span style={{ fontWeight: 'bold', color: 'hsl(var(--accent-hsl))' }}>+{challenge.points} XP</span>
                </div>
              ))
            ) : (
              <div style={{ 
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', 
                justifyContent: 'center', padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' 
              }}>
                <Search size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>Hiện chưa có thử thách nào dành cho bạn.</p>
                <p style={{ fontSize: '0.85rem' }}>Hãy quay lại sau nhé!</p>
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
};

export default Dashboard;
