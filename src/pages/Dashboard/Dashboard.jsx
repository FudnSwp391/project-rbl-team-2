import React, { useState, useEffect } from 'react';
import { Target, Zap, Trophy, History, Star, Search, FolderOpen, Lock, ArrowRight, CheckCircle2, Play, Calendar, User, Laptop, Brain, BookOpen } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import streakVideo from '../../assets/b26e62716d9941d48d2a27f363eabb41.webm';
import { motion, AnimatePresence } from 'framer-motion';

const StreakOverlay = ({ streak, onClose }) => {
  const [displayNumber, setDisplayNumber] = useState(Math.max(0, streak - 1));

  useEffect(() => {
    // Nhảy số sau khi video chạy được 1 lúc (ví dụ 1.2s)
    const timer = setTimeout(() => {
      setDisplayNumber(streak);
    }, 1200);
    return () => clearTimeout(timer);
  }, [streak]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        backdropFilter: 'blur(5px)',
        cursor: 'pointer'
      }}
      onClick={onClose}
    >
      <motion.video 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
        src={streakVideo} 
        autoPlay 
        playsInline
        muted
        style={{ width: '400px', height: '400px', objectFit: 'contain', marginBottom: '-3rem' }} 
        onEnded={onClose}
      />
      <motion.h2 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
        style={{ color: '#fff', fontSize: '3.5rem', fontWeight: 900, textShadow: '0 4px 12px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '0.75rem', textTransform: 'uppercase' }}
      >
        <span>STREAK</span>
        <div style={{ display: 'inline-grid', textAlign: 'center' }}>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={displayNumber}
              initial={{ y: 40, opacity: 0, rotateX: -90 }}
              animate={{ y: 0, opacity: 1, rotateX: 0 }}
              exit={{ y: -40, opacity: 0, rotateX: 90 }}
              transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
              style={{ gridArea: '1 / 1', transformOrigin: 'center center', color: '#FFD54F' }}
            >
              {displayNumber}
            </motion.span>
          </AnimatePresence>
        </div>
        <span>NGÀY!</span>
      </motion.h2>
    </motion.div>
  );
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'CHÀO BUỔI SÁNG';
  if (hour < 18) return 'CHÀO BUỔI CHIỀU';
  return 'CHÀO BUỔI TỐI';
};

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  // Local state for challenges and points
  const [localPoints, setLocalPoints] = useState(profile?.points || 0);
  const [localStreak, setLocalStreak] = useState(profile?.streak_days || 0);
  const [localPlan, setLocalPlan] = useState(profile?.plan || 'Free');
  const [usageCount, setUsageCount] = useState(profile?.question_bank_usage_count || 0);
  const [planDaysLeft, setPlanDaysLeft] = useState(null);
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
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
    } else if (profile) {
      // Đồng bộ từ DB xuống LocalStorage nếu Admin hoặc thiết bị khác đã thay đổi điểm
      if (profile.points !== undefined && profile.points !== savedData.points) {
        savedData.points = profile.points;
      }
      if (profile.streak_days !== undefined && profile.streak_days !== savedData.streak) {
        savedData.streak = profile.streak_days;
      }
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

    const fetchLatestUsage = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('question_bank_usage_count')
          .eq('id', user.id)
          .single();
        if (!error && data) {
          setUsageCount(data.question_bank_usage_count || 0);
        }
      } catch (err) {}
    };
    fetchLatestUsage();

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
      setShowStreakAnimation(true);
      
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
  const planLimit = profile?.planLimits?.max_questions || 5;
  const remainingCount = Math.max(0, planLimit - usageCount);
  const displayLimit = planLimit;
  const isSpecialRole = ['admin', 'company', 'recruiter', 'mentor'].includes(profile?.role?.toLowerCase());

  return (
    <div className="container animate-fade" style={{ paddingTop: '8rem', paddingBottom: 'var(--spacing-xl)' }}>
      <header style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase' }}
            >
              {getGreeting()}, <span style={{ color: '#EA580C' }}>{profile?.full_name || user?.email?.split('@')[0] || 'Bạn'}</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              style={{ color: 'var(--text-secondary)' }}
            >
              Sẵn sàng để tiếp tục luyện tập hôm nay chưa?
            </motion.p>
          </div>

        </div>
      </header>

      {!isSpecialRole && (
        <div className="grid-auto" style={{ marginBottom: 'var(--spacing-lg)' }}>
          {/* Streak Card */}
          <div style={{ 
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)',
            borderRadius: '24px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            minHeight: '160px',
            boxShadow: '0 8px 24px rgba(255, 152, 0, 0.25)'
          }}>
            <h3 style={{ 
              fontSize: '4rem', 
              fontWeight: 900, 
              color: '#1a2733', 
              margin: 0,
              lineHeight: 1,
              letterSpacing: '-2px',
              zIndex: 2
            }}>
              {localStreak}
            </h3>
            <p style={{ 
              color: '#1a2733', 
              margin: '0.25rem 0 0 0', 
              fontSize: '1.1rem',
              fontWeight: 600,
              opacity: 0.9,
              zIndex: 2
            }}>
              Streak Days
            </p>

            <button 
              onClick={() => setShowStreakAnimation(true)}
              style={{ 
                position: 'absolute', top: '1rem', right: '1rem', 
                fontSize: '0.7rem', padding: '4px 8px', 
                background: 'rgba(255,255,255,0.3)', color: '#1a2733',
                border: '1px solid rgba(0,0,0,0.1)', borderRadius: '6px', 
                cursor: 'pointer', zIndex: 10, fontWeight: 600
              }}
            >
              Test Hiệu Ứng
            </button>
            
            {/* Viền vàng phía sau (Background shape) */}
            <div style={{
              position: 'absolute',
              bottom: '-12px',
              right: '-5px',
              transform: 'scale(1.15) rotate(-5deg)',
              zIndex: 0,
              opacity: 0.9
            }}>
               <svg width="140" height="140" viewBox="0 0 100 100" fill="#FFD54F" stroke="none">
                 <path d="M 50 5 C 65 20, 85 40, 85 65 A 35 35 0 0 1 15 65 C 15 50, 25 40, 30 35 C 30 45, 40 55, 45 55 C 45 40, 50 20, 50 5 Z"/>
               </svg>
            </div>
            
            {/* Main Flame */}
            <div style={{
              position: 'absolute',
              bottom: '-25px',
              right: '-15px',
              transform: 'rotate(-5deg)',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
              zIndex: 1
            }}>
               <svg width="140" height="140" viewBox="0 0 100 100" fill="url(#flame-grad)" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                 <defs>
                   <linearGradient id="flame-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                     <stop offset="0%" stopColor="#ff9a00" />
                     <stop offset="100%" stopColor="#ff4b2b" />
                   </linearGradient>
                 </defs>
                 <path d="M 50 5 C 65 20, 85 40, 85 65 A 35 35 0 0 1 15 65 C 15 50, 25 40, 30 35 C 30 45, 40 55, 45 55 C 45 40, 50 20, 50 5 Z"/>
                 {/* Vạch ở trong lửa (Inner highlight) */}
                 <path d="M 35 75 Q 50 90 65 75" stroke="#ffdf32" strokeWidth="6" fill="none" strokeLinecap="round" />
               </svg>
            </div>
          </div>

          {/* Score Card */}
          <div style={{ 
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #4ade80 0%, #16a34a 100%)',
            borderRadius: '24px', 
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            minHeight: '160px',
            boxShadow: '0 8px 24px rgba(22, 163, 74, 0.25)'
          }}>
            <h3 style={{ 
              fontSize: '4rem', 
              fontWeight: 900, 
              color: '#ffffff', 
              margin: 0,
              lineHeight: 1,
              letterSpacing: '-2px',
              zIndex: 2
            }}>
              {localPoints}
            </h3>
            <p style={{ 
              color: 'rgba(255,255,255,0.95)', 
              margin: '0.25rem 0 0 0', 
              fontSize: '1.1rem',
              fontWeight: 600,
              zIndex: 2
            }}>
              Điểm xếp hạng
            </p>
            
            <div style={{
              position: 'absolute',
              bottom: '-20px',
              right: '-15px',
              transform: 'rotate(10deg)',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
              zIndex: 1
            }}>
               <svg width="130" height="130" viewBox="0 0 24 24" fill="url(#trophy-grad)" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                 <defs>
                   <linearGradient id="trophy-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                     <stop offset="0%" stopColor="#fef08a" />
                     <stop offset="100%" stopColor="#eab308" />
                   </linearGradient>
                 </defs>
                 <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                 <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                 <path d="M4 22h16"/>
                 <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                 <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                 <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
               </svg>
            </div>
            
            <button 
              style={{ 
                position: 'absolute', 
                top: '1.25rem', 
                right: '1.25rem', 
                padding: '0.4rem 0.8rem', 
                fontSize: '0.85rem', 
                background: 'rgba(255,255,255,0.25)', 
                color: '#fff', 
                border: '1px solid rgba(255,255,255,0.3)', 
                borderRadius: '99px',
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
                zIndex: 10
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
              onClick={() => navigate('/pricing?mode=exchange')}
            >
              Đổi gói
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
        
        {/* Daily Challenges */}
        {!isSpecialRole && (
        <div className="solid-card" style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem 2rem', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h2 style={{ margin: '0 0 2rem 0', fontSize: '1.15rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thử thách hàng ngày</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1 }}>
            {dailyChallenges.map((challenge, index) => {
              const pillStyles = [
                { bg: 'linear-gradient(135deg, #38b6ff 0%, #0097ff 100%)', shadow: '0 8px 16px -4px rgba(56, 182, 255, 0.4)', icon: <Laptop size={32} color="#fff" strokeWidth={1.5} /> },
                { bg: 'linear-gradient(135deg, #ff5e7e 0%, #ff3b62 100%)', shadow: '0 8px 16px -4px rgba(255, 94, 126, 0.4)', icon: <Brain size={32} color="#fff" strokeWidth={1.5} /> },
                { bg: 'linear-gradient(135deg, #00c6ff 0%, #009ded 100%)', shadow: '0 8px 16px -4px rgba(0, 198, 255, 0.4)', icon: <BookOpen size={32} color="#fff" strokeWidth={1.5} /> }
              ];
              const style = pillStyles[index % pillStyles.length];

              return (
                <div key={challenge.id} style={{
                  padding: '1rem 1.25rem',
                  background: challenge.completed ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' : style.bg,
                  borderRadius: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: style.shadow,
                  position: 'relative',
                  overflow: 'hidden',
                  gap: '0.5rem'
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%)', pointerEvents: 'none' }}></div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 1, flex: 1, minWidth: 0 }}>
                    <div style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))', lineHeight: 1, flexShrink: 0 }}>
                      {style.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ 
                        display: 'block',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '1rem',
                        marginBottom: '0.25rem',
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        lineHeight: 1.3
                      }}>
                        {challenge.title}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.95)', fontWeight: 600 }}>
                        <Star size={12} color="#ff4757" fill="#ff4757" /> {challenge.points} Điểm
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ zIndex: 1, flexShrink: 0 }}>
                    {!challenge.completed && challenge.type === 'link' && (
                      <button 
                        style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '0.5rem 1rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', backdropFilter: 'blur(4px)', whiteSpace: 'nowrap' }}
                        onClick={() => navigate(challenge.path)}
                      >
                        <Play size={10} fill="currentColor" /> {challenge.action}
                      </button>
                    )}
                    {challenge.completed && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', background: 'rgba(255,255,255,0.25)', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(4px)' }}>
                        <CheckCircle2 size={16} color="#fff" strokeWidth={2.5} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Question Bank (Ngân hàng câu hỏi) */}
        <div className="solid-card" style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem 2rem', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h2 style={{ margin: '0 0 2rem 0', fontSize: '1.15rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ngân hàng Câu hỏi</h2>
          
          <div style={{ 
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', 
            justifyContent: 'center', textAlign: 'center', color: '#6b7280' 
          }}>
            <div style={{ padding: '1.2rem', background: 'rgba(234, 88, 12, 0.05)', borderRadius: '50%', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(234, 88, 12, 0.1)' }}>
              <Search size={36} color="#EA580C" strokeWidth={2} />
            </div>
            <p style={{ marginBottom: '2.5rem', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '240px' }}>Khám phá hàng ngàn câu hỏi phỏng vấn từ các chuyên ngành khác nhau.</p>
            <button 
              style={{ background: '#EA580C', color: '#fff', border: 'none', padding: '0.8rem 1.8rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)', transition: 'all 0.3s ease' }} 
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(234, 88, 12, 0.4)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(234, 88, 12, 0.3)'; }}
              onClick={() => navigate('/question-bank')}
            >
              Truy cập Ngân hàng
            </button>
          </div>
        </div>

        {/* Mentor Mentoring */}
        <div className="solid-card" style={{ background: '#fff', borderRadius: '24px', padding: '2.5rem 2rem', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h2 style={{ margin: '0 0 2rem 0', fontSize: '1.15rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mentoring 1-on-1</h2>
          
          <div style={{ 
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', 
            justifyContent: 'center', textAlign: 'center', color: '#6b7280' 
          }}>
            <div style={{ padding: '1.2rem', background: 'rgba(234, 88, 12, 0.05)', borderRadius: '50%', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(234, 88, 12, 0.1)' }}>
              <User size={36} color="#EA580C" strokeWidth={2} />
            </div>
            <p style={{ marginBottom: '2.5rem', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '240px' }}>Kết nối với chuyên gia để nhận lời khuyên định hướng và mock interview.</p>
            
            {localPlan === 'Free' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', alignItems: 'center' }}>
                <button 
                  onClick={() => navigate('/pricing')}
                  style={{ background: '#EA580C', color: '#fff', border: 'none', padding: '0.9rem 1.5rem', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', width: '100%', maxWidth: '240px', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)', transition: 'all 0.3s ease' }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(234, 88, 12, 0.4)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(234, 88, 12, 0.3)'; }}
                >Nâng cấp để Đặt lịch</button>
                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>* Dành cho thành viên Pro/Premium</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', alignItems: 'center' }}>
                <button 
                  onClick={() => navigate('/mentors')}
                  style={{ background: '#EA580C', color: '#fff', border: 'none', padding: '0.9rem 1.5rem', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', width: '100%', maxWidth: '240px', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)', transition: 'all 0.3s ease' }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(234, 88, 12, 0.4)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(234, 88, 12, 0.3)'; }}
                >Tìm Mentor ngay</button>
                <Link to="/my-bookings" style={{ fontSize: '0.85rem', color: '#6b7280', textDecoration: 'none', fontWeight: 600 }}>Xem lịch sử hẹn →</Link>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Streak Animation Overlay */}
      <AnimatePresence>
        {showStreakAnimation && (
          <StreakOverlay streak={localStreak} onClose={() => setShowStreakAnimation(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;

