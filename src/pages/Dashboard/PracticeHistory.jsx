import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../utils/AuthContext';
import { ArrowLeft, CheckCircle, Clock, BookMarked, MessageSquare } from 'lucide-react';

const PracticeHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        setLoading(true);
        // Fetch practice_answers with the related question content
        const { data, error } = await supabase
          .from('practice_answers')
          .select(`
            *,
            questions (
              content,
              industry_id
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setHistory(data || []);
      } catch (err) {
        console.error('Error fetching practice history:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [user]);

  return (
    <div className="container" style={{ paddingTop: '8rem', paddingBottom: '4rem', maxWidth: '1000px' }}>
      <button 
        className="btn btn--outline" 
        style={{ padding: '0.5rem 1rem', marginBottom: '2rem' }} 
        onClick={() => navigate('/question-bank')}
      >
        <ArrowLeft size={18} /> Quay lại Ngân hàng câu hỏi
      </button>

      <header style={{ marginBottom: '2.5rem' }}>
        <h1 className="text-editorial" style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-charcoal)' }}>
          <BookMarked color="var(--color-earth)" size={32} /> Lịch sử Luyện tập
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>Xem lại các câu hỏi bạn đã trả lời và đánh giá từ AI.</p>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>Đang tải lịch sử...</div>
      ) : history.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>Bạn chưa có bài luyện tập nào.</p>
          <button className="btn btn--primary" onClick={() => navigate('/question-bank')}>
            Bắt đầu luyện tập ngay
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {history.map((item) => (
            <div key={item.id} className="glass-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Header của item */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ 
                      fontSize: '0.8rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: '50px',
                      background: item.ai_feedback ? '#dcfce7' : '#f3f4f6',
                      color: item.ai_feedback ? '#16a34a' : '#4b5563',
                      display: 'flex', alignItems: 'center', gap: '0.25rem'
                    }}>
                      <CheckCircle size={14} />
                      {item.ai_feedback ? 'Đã đánh giá AI' : 'Đã nộp'}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {new Date(item.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--color-charcoal)', fontWeight: 600, lineHeight: 1.5 }}>
                    {item.questions?.content || 'Câu hỏi không xác định'}
                  </h3>
                </div>
              </div>

              {/* Câu trả lời của ứng viên */}
              <div>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Câu trả lời của bạn:
                </h4>
                <div style={{ 
                  background: 'var(--surface)', padding: '1.25rem', borderRadius: '12px', 
                  border: '1px solid var(--border-color)', color: 'var(--color-text)', 
                  lineHeight: 1.6, whiteSpace: 'pre-wrap'
                }}>
                  {item.answer_text}
                </div>
              </div>

              {/* Nhận xét của AI */}
              {item.ai_feedback && (
                <div style={{ 
                  background: 'var(--color-cream-dark)', padding: '1.5rem', borderRadius: '12px', 
                  borderLeft: '4px solid var(--color-moss)', marginTop: '0.5rem'
                }}>
                  <h4 style={{ 
                    fontSize: '0.95rem', color: '#16a34a', marginBottom: '0.75rem', 
                    display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 
                  }}>
                    <MessageSquare size={18} /> Kết quả Đánh giá từ AI:
                  </h4>
                  <div style={{ color: 'var(--color-charcoal)', lineHeight: 1.6 }}>
                    {typeof item.ai_feedback === 'object' && item.ai_feedback !== null ? (
                      <>
                        <div style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
                          <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', background: '#e0f2fe', color: '#0284c7', borderRadius: '4px' }}>
                            Điểm: {item.ai_feedback.score}/100
                          </span>
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap' }}>
                          <strong>Nhận xét tổng quan:</strong><br />
                          {item.ai_feedback.general_feedback || item.ai_feedback.progress_analysis || 'Không có nhận xét chi tiết'}
                        </div>
                      </>
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{item.ai_feedback}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Nhận xét của Mentor (giữ lại nếu có dữ liệu cũ) */}
              {item.feedback && (
                <div style={{ 
                  background: 'var(--color-cream-dark)', padding: '1.5rem', borderRadius: '12px', 
                  borderLeft: '4px solid var(--color-earth)', marginTop: '0.5rem'
                }}>
                  <h4 style={{ 
                    fontSize: '0.95rem', color: 'var(--color-earth-dark)', marginBottom: '0.75rem', 
                    display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 
                  }}>
                    <MessageSquare size={18} /> Nhận xét từ Mentor:
                  </h4>
                  <div style={{ color: 'var(--color-charcoal)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {item.feedback}
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PracticeHistory;
