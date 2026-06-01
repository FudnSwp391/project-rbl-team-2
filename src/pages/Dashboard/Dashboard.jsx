import React, { useState, useEffect } from 'react';
import { Target, Zap, Trophy, History, Star, Search, FolderOpen, Lock, ArrowRight, CheckCircle2, Play } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  // Local state for challenges and points
  const [localPoints, setLocalPoints] = useState(profile?.points || 0);
  const [localStreak, setLocalStreak] = useState(profile?.streak_days || 0);
  const [localPlan, setLocalPlan] = useState(profile?.plan || 'Free');
  const [planDaysLeft, setPlanDaysLeft] = useState(null);
  const [dailyChallenges, setDailyChallenges] = useState([
    { id: 'login', title: 'Duy trì đăng nhập', points: 5, completed: false, action: 'Đã hoàn thành', type: 'auto' },
    { id: 'qa', title: 'Trả lời câu hỏi (10 câu)', points: 50, completed: false, action: 'Làm bài', type: 'link', path: '/challenge/questions' },
    { id: 'blog', title: 'Đọc blog ít nhất 5 phút', points: 5, completed: false, action: 'Đọc ngay', type: 'link', path: '/blogs' }
  ]);

  useEffect(() => {
    if (!user) return;
    
    // Simulating backend logic with LocalStorage for the prototype
    const storageKey = `ita_user_data_${user.id}`;
    let savedData = JSON.parse(localStorage.getItem(storageKey));
    const today = new Date().toLocaleDateString('vi-VN');
    
    if (!savedData) {
      savedData = {
        lastLogin: '',
        streak: profile?.streak_days || 0,
        points: profile?.points || 0,
        challengesDate: '',
        completedChallenges: []
      };
    }
    
    let isDataUpdated = false;

    // Supabase Single Source of Truth for Plan
    let currentPlan = profile?.plan || 'Free';
    let daysLeft = null;

    if (profile?.plan_expires_at && currentPlan !== 'Free') {
      const expires = new Date(profile.plan_expires_at);
      const now = new Date();
      const diffTime = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
      
      if (diffTime <= 0) {
        // Plan has expired, downgrade in Supabase
        currentPlan = 'Free';
        daysLeft = 0;
        
        const downgradePlan = async () => {
          try {
            await supabase.from('profiles').update({
              plan: 'Free',
              plan_expires_at: null
            }).eq('id', user.id);
          } catch (err) {
            console.error('Lỗi hạ cấp gói:', err);
          }
        };
        downgradePlan();
      } else {
        daysLeft = diffTime;
      }
    } else if (!profile?.plan_expires_at && currentPlan !== 'Free') {
      // Trường hợp Admin chỉnh tay nhưng quên set ngày hết hạn
      const durationDays = currentPlan === 'Pro' ? 14 : 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + durationDays);
      daysLeft = durationDays;
      
      const fixPlanDate = async () => {
        try {
          await supabase.from('profiles').update({
            plan_expires_at: expiresAt.toISOString()
          }).eq('id', user.id);
        } catch (err) {
          console.error('Lỗi fix ngày:', err);
        }
      };
      fixPlanDate();
    }
    
    setLocalPlan(currentPlan);
    setPlanDaysLeft(daysLeft);

    // Reset challenges if it's a new day
    if (savedData.challengesDate !== today) {
      savedData.challengesDate = today;
      savedData.completedChallenges = [];
      isDataUpdated = true;
    }
    
    // Challenge 1: Login Streak logic
    if (savedData.lastLogin !== today) {
      // Increment streak
      savedData.streak += 1;
      savedData.lastLogin = today;
      
      // Auto-complete Challenge 1 and add 5 points if not already completed today
      if (!savedData.completedChallenges.includes('login')) {
        savedData.completedChallenges.push('login');
        savedData.points += 5;
      }
      isDataUpdated = true;
    }
    
    // Check if we need to force a sync to DB because local points/streak are higher (e.g. from before DB sync was added)
    const needsSync = profile && (profile.points < savedData.points || profile.streak_days < savedData.streak);

    if (isDataUpdated || needsSync) {
      localStorage.setItem(storageKey, JSON.stringify(savedData));
      
      // ĐỒNG BỘ LÊN DATABASE SUPABASE (Bảo mật an toàn)
      const updateDB = async () => {
        try {
          const { error } = await supabase.from('profiles').update({
            streak_days: savedData.streak,
            points: savedData.points,
            last_login_date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
          }).eq('id', user.id);
          
          if (error) console.error('Lỗi khi đồng bộ DB:', error);
        } catch (err) {
          console.error(err);
        }
      };
      updateDB();
    }
    
    setLocalStreak(savedData.streak);
    setLocalPoints(savedData.points);
    
    // Update daily challenges UI state based on completed list
    setDailyChallenges(prev => prev.map(ch => ({
      ...ch,
      completed: savedData.completedChallenges.includes(ch.id)
    })));
    
  }, [user, profile]);

  const hasPremium = localPlan && localPlan.toLowerCase() !== 'free';

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
            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{localStreak} Ngày</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Streak liên tiếp</p>
          </div>
        </div>

        {/* Score Card */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <div style={{ padding: '1rem', background: 'rgba(50, 200, 100, 0.1)', borderRadius: '12px' }}>
            <Trophy size={32} color="#32c864" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{localPoints} Điểm</h3>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Tổng điểm xếp hạng</p>
          </div>
          <div>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              onClick={() => alert("Tính năng dùng điểm đổi gói đang trong quá trình phát triển!")}
            >
              Đổi gói
            </button>
          </div>
        </div>

        {/* Plan Card */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <div style={{ padding: '1rem', background: 'rgba(100, 108, 255, 0.1)', borderRadius: '12px' }}>
            <Star size={32} color="hsl(var(--primary-hsl))" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Gói {localPlan}</h3>
            {hasPremium && planDaysLeft !== null ? (
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Còn lại: <span style={{ color: 'hsl(var(--primary-hsl))', fontWeight: 'bold' }}>{planDaysLeft} ngày</span>
              </p>
            ) : (
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                <Link to="/pricing" style={{ color: 'hsl(var(--accent-hsl))', textDecoration: 'none' }}>Nâng cấp ngay &rarr;</Link>
              </p>
            )}
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
            {dailyChallenges.map(challenge => (
              <div key={challenge.id} style={{
                padding: '1rem',
                background: challenge.completed ? 'rgba(50, 200, 100, 0.05)' : 'var(--glass-bg)',
                border: `1px solid ${challenge.completed ? 'rgba(50, 200, 100, 0.2)' : 'var(--glass-border)'}`,
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {challenge.completed ? (
                    <CheckCircle2 color="#32c864" size={20} />
                  ) : (
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--text-secondary)', opacity: 0.5 }}></div>
                  )}
                  <div>
                    <span style={{ 
                      display: 'block',
                      textDecoration: challenge.completed ? 'line-through' : 'none', 
                      color: challenge.completed ? 'var(--text-secondary)' : 'inherit',
                      fontWeight: 500
                    }}>
                      {challenge.title}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'hsl(var(--accent-hsl))', fontWeight: 'bold' }}>
                      +{challenge.points} Điểm
                    </span>
                  </div>
                </div>
                
                {!challenge.completed && challenge.type === 'link' && (
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    onClick={() => navigate(challenge.path)}
                  >
                    <Play size={14} /> {challenge.action}
                  </button>
                )}
                {challenge.completed && (
                  <span style={{ fontSize: '0.8rem', color: '#32c864', fontWeight: 500 }}>{challenge.action}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Question Bank (Ngân hàng câu hỏi) */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 'var(--spacing-md)' }}>
            <FolderOpen color="hsl(var(--accent-hsl))" />
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Ngân hàng Câu hỏi</h2>
          </div>
          
          <div style={{ 
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', 
            justifyContent: 'center', padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' 
          }}>
            <Search size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p style={{ marginBottom: '1.5rem' }}>Khám phá hàng ngàn câu hỏi phỏng vấn từ các chuyên ngành khác nhau.</p>
            <button className="btn btn-primary" onClick={() => navigate('/question-bank')}>
              Truy cập Ngân hàng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;

