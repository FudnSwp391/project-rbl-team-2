import React, { useState, useEffect } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { Crown, Search, Filter, Layers, BookOpen, FileText, Grid, Rocket, Link2, BookMarked, ChevronDown } from 'lucide-react';

const STUDY_MODES = [
  { id: 'flashcards', name: 'Thẻ ghi nhớ', icon: <Layers size={24} color="var(--color-earth)" /> },
  { id: 'learn', name: 'Học', icon: <BookOpen size={24} color="var(--color-moss)" /> },
  { id: 'test', name: 'Kiểm tra', icon: <FileText size={24} color="var(--color-accent)" /> },
  { id: 'matching', name: 'Ghép thẻ', icon: <Link2 size={24} color="var(--color-highlight)" /> },
  { id: 'match_box', name: 'Khối hộp (Coming Soon)', icon: <Grid size={24} color="var(--color-stone)" />, disabled: true },
  { id: 'blast', name: 'Blast (Coming Soon)', icon: <Rocket size={24} color="var(--color-stone)" />, disabled: true }
];

const QuestionBank = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [localPlan, setLocalPlan] = useState('Free');
  const [industries, setIndustries] = useState([{ id: 'all', name: 'Tất cả lĩnh vực' }]);
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      let currentPlan = profile.plan || 'Free';
      if (profile.plan_expires_at && currentPlan !== 'Free') {
        const expires = new Date(profile.plan_expires_at);
        const now = new Date();
        if (expires <= now) {
          currentPlan = 'Free';
        }
      }
      setLocalPlan(currentPlan);
    }
  }, [user, profile]);

  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const { data, error } = await supabase.from('industries').select('id, name').order('name');
        if (!error && data) {
          setIndustries([{ id: 'all', name: 'Tất cả lĩnh vực' }, ...data]);
        }
      } catch (err) {
        console.error('Error fetching industries:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIndustries();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.custom-dropdown')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasPremium = localPlan && localPlan.toLowerCase() !== 'free';

  const handleModeClick = (modeId) => {
    if (modeId === 'match_box' || modeId === 'blast') return;
    navigate(`/question-bank/${modeId}?industry=${selectedIndustry}`);
  };

  return (
    <div className="container" style={{ paddingTop: '8rem', paddingBottom: 'var(--spacing-xl)', position: 'relative' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="text-editorial" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-charcoal)' }}>
            <BookMarked color="var(--color-earth)" size={36} /> Ngân hàng Câu hỏi
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>Khám phá và ôn luyện hàng ngàn câu hỏi phỏng vấn chất lượng.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="custom-dropdown" style={{ position: 'relative', width: '260px' }}>
            <div 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '50px',
                border: isDropdownOpen ? '1px solid var(--color-earth)' : '1px solid var(--border-color)',
                background: 'var(--surface)',
                color: 'var(--color-text)',
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all var(--transition-fast)',
                fontWeight: 500
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={16} color="var(--color-earth)" />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                  {industries.find(i => i.id === selectedIndustry)?.name || 'Đang tải...'}
                </span>
              </div>
              <ChevronDown size={18} style={{ color: 'var(--color-text-muted)', transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>

            {isDropdownOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
                background: 'var(--surface)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 100,
                maxHeight: '300px',
                overflowY: 'auto',
                animation: 'fadeIn 0.15s ease-out'
              }}>
                {industries.map(ind => (
                  <div
                    key={ind.id}
                    onClick={() => { setSelectedIndustry(ind.id); setIsDropdownOpen(false); }}
                    style={{
                      padding: '0.75rem 1.25rem',
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      cursor: 'pointer',
                      background: selectedIndustry === ind.id ? 'var(--color-cream-dark)' : 'transparent',
                      color: selectedIndustry === ind.id ? 'var(--color-earth)' : 'var(--color-text)',
                      fontWeight: selectedIndustry === ind.id ? 600 : 400,
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (selectedIndustry !== ind.id) e.currentTarget.style.background = 'var(--color-cream)';
                    }}
                    onMouseOut={(e) => {
                      if (selectedIndustry !== ind.id) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span style={{ fontSize: '0.95rem' }}>{ind.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={{ 
        position: 'relative',
        filter: !hasPremium ? 'blur(8px)' : 'none',
        pointerEvents: !hasPremium ? 'none' : 'auto',
        userSelect: !hasPremium ? 'none' : 'auto',
        transition: 'filter 0.3s ease'
      }}>
        
        <div style={{ marginBottom: '3rem' }}>
          <h2 className="text-editorial" style={{ fontSize: '1.8rem', marginBottom: '1.5rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>Chế độ ôn luyện</h2>
          <div className="grid-auto">
            {STUDY_MODES.map(mode => (
              <div 
                key={mode.id} 
                className="glass-card" 
                onClick={() => handleModeClick(mode.id)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1.25rem', 
                  padding: '1.5rem',
                  cursor: mode.disabled ? 'not-allowed' : 'pointer',
                  opacity: mode.disabled ? 0.6 : 1,
                  background: 'var(--surface)'
                }}
              >
                <div style={{ 
                  background: 'var(--color-cream)', 
                  padding: '1rem', 
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {mode.icon}
                </div>
                <div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-charcoal)', display: 'block' }}>{mode.name}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    {mode.disabled ? 'Đang phát triển' : 'Bắt đầu ngay'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-editorial" style={{ fontSize: '1.8rem', marginBottom: '1.5rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>Tổng quan tiến độ</h2>
          <div className="glass-card flex-center" style={{ 
            padding: '4rem 2rem', 
            flexDirection: 'column',
            textAlign: 'center'
          }}>
            <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem', color: 'var(--color-earth)' }} />
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-charcoal)', fontWeight: 500 }}>Chưa có dữ liệu học tập.</p>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>Hãy bắt đầu ôn luyện với một trong các chế độ ở trên!</p>
          </div>
        </div>

      </div>

      {!hasPremium && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          background: 'rgba(250, 248, 245, 0.4)'
        }}>
          <div className="glass-premium" style={{
            padding: '3.5rem 2.5rem',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '480px',
            animation: 'fadeIn 0.5s ease-out'
          }}>
            <div style={{ 
              background: 'var(--color-earth)',
              padding: '1.25rem',
              borderRadius: '20px',
              marginBottom: '1.5rem',
              boxShadow: 'var(--shadow-md)'
            }}>
              <Crown size={44} color="var(--color-cream)" />
            </div>
            
            <h2 className="text-editorial" style={{ fontSize: '2.2rem', marginBottom: '1rem', color: 'var(--color-charcoal)' }}>Nâng cấp gói</h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--color-text-secondary)', marginBottom: '2.5rem' }}>
              Hãy nâng cấp lên gói <strong style={{ color: 'var(--color-earth)' }}>Pro</strong> hoặc <strong style={{ color: 'var(--color-earth-dark)' }}>Premium</strong> để mở khóa ngân hàng câu hỏi.
            </p>
            
            <button 
              className="btn btn--primary btn--pill"
              onClick={() => navigate('/pricing')}
            >
              Xem các Gói Nâng cấp
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default QuestionBank;

