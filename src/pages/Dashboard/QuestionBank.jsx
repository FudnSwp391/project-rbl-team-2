import React, { useState, useEffect } from 'react';
import { useAuth } from '../../utils/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { Crown, Search, Filter, BookMarked, ChevronDown, CheckCircle, ArrowUp } from 'lucide-react';

const QuestionBank = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [localPlan, setLocalPlan] = useState('Free');
  const [usageCount, setUsageCount] = useState(0);
  
  const [industries, setIndustries] = useState([{ id: 'all', name: 'Tất cả lĩnh vực' }]);
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [questions, setQuestions] = useState([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 20;
  const [loading, setLoading] = useState(true);
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll to top listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch plan & usage
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
      
      const fetchLatestUsage = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('question_bank_usage_count')
            .eq('id', user.id)
            .single();
          if (!error && data) {
            setUsageCount(data.question_bank_usage_count || 0);
          } else {
            setUsageCount(profile.question_bank_usage_count || 0);
          }
        } catch (err) {
          console.error('Error fetching usage count:', err);
        }
      };

      fetchLatestUsage();
    }
  }, [user, profile]);

  // Fetch industries
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const { data, error } = await supabase.from('industries').select('id, name').order('name');
        if (!error && data) {
          setIndustries([{ id: 'all', name: 'Tất cả lĩnh vực' }, ...data]);
        }
      } catch (err) {
        console.error('Error fetching industries:', err);
      }
    };
    fetchIndustries();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedIndustry, searchQuery]);

  // Fetch questions
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        let query = supabase.from('questions').select('*', { count: 'exact' });
        
        if (selectedIndustry !== 'all') {
          query = query.eq('industry_id', selectedIndustry);
        }

        if (searchQuery.trim() !== '') {
          query = query.ilike('content', `%${searchQuery}%`);
        }
        
        const from = (currentPage - 1) * questionsPerPage;
        const to = from + questionsPerPage - 1;

        const { data, count, error } = await query.range(from, to);
        if (!error && data) {
          setQuestions(data);
          setTotalQuestions(count || 0);
        }
      } catch (err) {
        console.error('Error fetching questions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [selectedIndustry, searchQuery, currentPage]);

  // Handle outside click for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.industry-dropdown')) setIsIndustryDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUsageLimit = (plan) => {
    const p = plan ? plan.toLowerCase() : 'free';
    if (p === 'premium') return Infinity;
    if (p === 'pro') return 10; // 10 practices per day
    return 5; // 5 practices per day
  };

  const usageLimit = getUsageLimit(localPlan);
  const isBlocked = usageCount >= usageLimit;

  const handlePracticeClick = async (questionId) => {
    if (isBlocked) return;

    if (localPlan && localPlan.toLowerCase() !== 'premium') {
      try {
        const newUsageCount = usageCount + 1;
        const { error } = await supabase
          .from('profiles')
          .update({ question_bank_usage_count: newUsageCount })
          .eq('id', user.id);
          
        if (!error) {
          setUsageCount(newUsageCount);
        }
      } catch (err) {
        console.error(err);
      }
    }

    navigate(`/question-bank/practice/${questionId}`);
  };


  return (
    <div className="container" style={{ paddingTop: '8rem', paddingBottom: 'var(--spacing-xl)', position: 'relative' }}>
      
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="text-editorial" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-charcoal)' }}>
          <BookMarked color="var(--color-earth)" size={36} /> Ngân hàng Câu hỏi
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>Luyện tập từng câu hỏi phỏng vấn theo định hướng chuyên sâu để chinh phục buổi phỏng vấn thực tế.</p>
      </header>

      <div style={{ 
        position: 'relative',
        filter: isBlocked ? 'blur(8px)' : 'none',
        pointerEvents: isBlocked ? 'none' : 'auto',
        userSelect: isBlocked ? 'none' : 'auto',
        transition: 'filter 0.3s ease'
      }}>
        
        {/* Filters and Search Bar */}
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '2rem', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 100, flexWrap: 'wrap' }}>
          
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
            <Search size={20} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Tìm kiếm câu hỏi..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'var(--surface)',
                fontSize: '0.95rem',
                color: 'var(--color-text)',
                outline: 'none'
              }}
            />
          </div>

          <div className="custom-dropdown industry-dropdown" style={{ position: 'relative', width: '250px' }}>
            <div 
              onClick={() => setIsIndustryDropdownOpen(!isIndustryDropdownOpen)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.75rem 1.25rem', borderRadius: '50px',
                border: isIndustryDropdownOpen ? '1px solid var(--color-earth)' : '1px solid var(--border-color)',
                background: 'var(--surface)', cursor: 'pointer',
                fontWeight: 500, fontSize: '0.95rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Filter size={18} color="var(--color-earth)" />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px', color: 'var(--color-charcoal)' }}>
                  {industries.find(i => i.id === selectedIndustry)?.name || 'Tất cả lĩnh vực'}
                </span>
              </div>
              <ChevronDown size={18} style={{ transform: isIndustryDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--color-text-muted)' }} />
            </div>
            
            {isIndustryDropdownOpen && (
              <div style={{ 
                position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, 
                background: '#ffffff',
                borderRadius: '16px', border: '1px solid var(--border-color)', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 9999, 
                maxHeight: '320px', overflowY: 'auto',
                padding: '0.5rem'
              }}>
                {industries.map(ind => (
                  <div key={ind.id} onClick={() => { setSelectedIndustry(ind.id); setIsIndustryDropdownOpen(false); }}
                    style={{ 
                      padding: '0.75rem 1rem', cursor: 'pointer', borderRadius: '10px',
                      background: selectedIndustry === ind.id ? 'var(--color-cream-dark)' : 'transparent',
                      color: selectedIndustry === ind.id ? 'var(--color-earth-dark)' : 'var(--color-charcoal)',
                      fontWeight: selectedIndustry === ind.id ? 600 : 400,
                      marginBottom: '4px'
                    }}
                    onMouseOver={(e) => { if (selectedIndustry !== ind.id) e.currentTarget.style.background = 'var(--color-cream)' }}
                    onMouseOut={(e) => { if (selectedIndustry !== ind.id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {ind.name}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Question List */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Hiển thị <strong>{questions.length > 0 ? (currentPage - 1) * questionsPerPage + 1 : 0} - {Math.min(currentPage * questionsPerPage, totalQuestions)}</strong> trên tổng số <strong>{totalQuestions}</strong> câu hỏi
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Đang tải danh sách câu hỏi...</div>
        ) : questions.length === 0 ? (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)' }}>Không tìm thấy câu hỏi nào phù hợp với bộ lọc.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {questions.map((q) => {
              return (
                <div key={q.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minWidth: '300px' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', background: 'var(--surface-dark)', padding: '0.25rem 0.75rem', borderRadius: '50px' }}>
                          {industries.find(i => i.id === q.industry_id)?.name || 'Ngành chung'}
                        </span>
                      </div>
                      
                      <h3 style={{ fontSize: '1.25rem', color: 'var(--color-charcoal)', fontWeight: 600, lineHeight: 1.5 }}>
                        {q.content}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <button 
                        className="btn btn--outline" 
                        style={{ borderRadius: '50px', padding: '0.6rem 1.5rem' }}
                        onClick={() => handlePracticeClick(q.id)}
                      >
                        Luyện tập
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalQuestions > questionsPerPage && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '2.5rem' }}>
            <button 
              className="btn btn--outline" 
              disabled={currentPage === 1}
              onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); scrollToTop(); }}
              style={{ padding: '0.5rem 1.25rem', borderRadius: '50px', fontWeight: 500, opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              Trang trước
            </button>
            
            <span style={{ padding: '0 1rem', fontWeight: 500, color: 'var(--color-charcoal)' }}>
              Trang {currentPage} / {Math.ceil(totalQuestions / questionsPerPage)}
            </span>

            <button 
              className="btn btn--outline" 
              disabled={currentPage >= Math.ceil(totalQuestions / questionsPerPage)}
              onClick={() => { setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalQuestions / questionsPerPage))); scrollToTop(); }}
              style={{ padding: '0.5rem 1.25rem', borderRadius: '50px', fontWeight: 500, opacity: currentPage >= Math.ceil(totalQuestions / questionsPerPage) ? 0.5 : 1 }}
            >
              Trang sau
            </button>
          </div>
        )}

      </div>

      {/* Paywall Overlay */}
      {isBlocked && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, background: 'rgba(250, 248, 245, 0.4)'
        }}>
          <div className="glass-premium" style={{
            padding: '3.5rem 2.5rem', borderRadius: '24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
            maxWidth: '480px', animation: 'fadeIn 0.5s ease-out'
          }}>
            <div style={{ 
              background: 'var(--color-earth)', padding: '1.25rem', borderRadius: '20px',
              marginBottom: '1.5rem', boxShadow: 'var(--shadow-md)'
            }}>
              <Crown size={44} color="var(--color-cream)" />
            </div>
            
            <h2 className="text-editorial" style={{ fontSize: '2.2rem', marginBottom: '1rem', color: 'var(--color-charcoal)' }}>Hết lượt luyện tập</h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--color-text-secondary)', marginBottom: '2.5rem' }}>
              Bạn đã dùng hết {usageLimit} lượt luyện tập hôm nay. Hãy nâng cấp lên gói <strong style={{ color: 'var(--color-earth)' }}>Pro</strong> hoặc <strong style={{ color: 'var(--color-earth-dark)' }}>Premium</strong> để tiếp tục ôn luyện không giới hạn.
            </p>
            
            <button className="btn btn--primary btn--pill" onClick={() => navigate('/pricing')}>Xem các Gói Nâng cấp</button>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      <button 
        onClick={scrollToTop}
        title="Quay về đầu trang"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: 'var(--color-earth)',
          color: 'var(--color-cream)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-lg)',
          opacity: showScrollTop ? 1 : 0,
          visibility: showScrollTop ? 'visible' : 'hidden',
          transform: showScrollTop ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 999
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'var(--color-earth-dark)';
          e.currentTarget.style.transform = showScrollTop ? 'translateY(-5px)' : 'translateY(20px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'var(--color-earth)';
          e.currentTarget.style.transform = showScrollTop ? 'translateY(0)' : 'translateY(20px)';
        }}
      >
        <ArrowUp size={24} />
      </button>

    </div>
  );
};

export default QuestionBank;
