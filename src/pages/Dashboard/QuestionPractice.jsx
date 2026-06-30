import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../utils/AuthContext';
import { ArrowLeft, Lightbulb, PenTool, CheckCircle, Save, Loader2, AlertCircle } from 'lucide-react';

const QuestionPractice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        setQuestion(data);
      } catch (err) {
        console.error('Error fetching question:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchQuestion();
  }, [id]);

  const handleSave = async () => {
    if (!answerText.trim() || !user || !question) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const payload = {
        user_id: user.id,
        question_id: question.id,
        answer_text: answerText,
        status: 'submitted'
      };
      
      const { error } = await supabase.from('practice_answers').insert([payload]);
      
      if (error) throw error;
      
      setSaveSuccess(true);
      
      // Gửi thông báo
      await supabase.from('notifications').insert([{
        user_id: user.id,
        title: 'Nộp bài thành công',
        content: 'Bạn đã hoàn thành bài luyện tập. Chờ đánh giá hoặc xem lại phần làm bài của mình.',
        type: 'success',
        action_link: '/question-bank/history'
      }]);
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving answer:', err);
      alert('Có lỗi xảy ra khi lưu bài. Vui lòng kiểm tra lại bạn đã chạy script tạo bảng practice_answers chưa.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container flex-center" style={{ minHeight: '100vh', paddingTop: '6rem' }}>
        <Loader2 className="animate-spin" size={48} color="var(--color-earth)" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="container flex-center" style={{ minHeight: '100vh', paddingTop: '6rem', flexDirection: 'column', gap: '1rem' }}>
        <h2 className="text-editorial">Không tìm thấy câu hỏi</h2>
        <button className="btn btn--primary" onClick={() => navigate('/question-bank')}>Quay lại Bảng điều khiển</button>
      </div>
    );
  }

  const isBehavioral = question.question_type === 'behavioral';

  return (
    <div className="container" style={{ paddingTop: '8rem', paddingBottom: '4rem', maxWidth: '1000px' }}>
      <button 
        className="btn btn--outline" 
        style={{ padding: '0.5rem 1rem', marginBottom: '2rem' }} 
        onClick={() => navigate('/question-bank')}
      >
        <ArrowLeft size={18} /> Quay lại
      </button>

      <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {/* Industry name omitted or fetched elsewhere if needed */}
        </div>
        
        <h1 className="text-editorial" style={{ fontSize: '2rem', color: 'var(--color-charcoal)', lineHeight: 1.4 }}>
          {question.content}
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Framework Section */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', color: 'var(--color-earth)', marginBottom: '1.5rem', fontWeight: 600 }}>
            <Lightbulb size={24} /> 
            {isBehavioral ? 'Gợi ý cấu trúc trả lời: Phương pháp STAR' : 'Gợi ý cấu trúc trả lời: Câu hỏi Kỹ thuật'}
          </h3>
          
          {isBehavioral ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #f59e0b' }}>
                <strong style={{ color: '#d97706', display: 'block', marginBottom: '0.25rem' }}>S (Situation) - Tình huống</strong>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>Mô tả ngắn gọn hoàn cảnh, bối cảnh xảy ra sự việc. (Ví dụ: Dự án sắp trễ deadline, server bị sập...)</p>
              </div>
              <div style={{ background: '#e0f2fe', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #0ea5e9' }}>
                <strong style={{ color: '#0284c7', display: 'block', marginBottom: '0.25rem' }}>T (Task) - Nhiệm vụ</strong>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>Vai trò và trách nhiệm cụ thể của bạn trong tình huống đó là gì? Mục tiêu cần đạt được?</p>
              </div>
              <div style={{ background: '#dcfce7', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #22c55e' }}>
                <strong style={{ color: '#16a34a', display: 'block', marginBottom: '0.25rem' }}>A (Action) - Hành động</strong>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>Các bước chi tiết bạn đã thực hiện để giải quyết vấn đề. Nhấn mạnh vào những gì BẠN đã làm (dùng đại từ "Tôi", không dùng "Chúng tôi").</p>
              </div>
              <div style={{ background: '#f3e8ff', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #a855f7' }}>
                <strong style={{ color: '#9333ea', display: 'block', marginBottom: '0.25rem' }}>R (Result) - Kết quả</strong>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>Kết quả đạt được là gì? Có số liệu cụ thể không? Bạn rút ra bài học gì từ trải nghiệm này?</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #64748b' }}>
                <strong style={{ color: '#334155', display: 'block', marginBottom: '0.25rem' }}>1. Khái niệm cốt lõi (Concept)</strong>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>Định nghĩa ngắn gọn, dễ hiểu về công nghệ/khái niệm được hỏi. Tránh dùng quá nhiều thuật ngữ học thuật phức tạp nếu không cần thiết.</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #64748b' }}>
                <strong style={{ color: '#334155', display: 'block', marginBottom: '0.25rem' }}>2. Cách thức hoạt động / Bản chất</strong>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>Giải thích cơ chế hoạt động của nó ở bên dưới (Under the hood). Tại sao nó lại được thiết kế như vậy?</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #64748b' }}>
                <strong style={{ color: '#334155', display: 'block', marginBottom: '0.25rem' }}>3. Ưu / Nhược điểm & Trường hợp sử dụng</strong>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>Khi nào thì nên dùng nó? Khi nào không nên dùng? (Trade-offs).</p>
              </div>
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid #64748b' }}>
                <strong style={{ color: '#334155', display: 'block', marginBottom: '0.25rem' }}>4. Ví dụ thực tế (Kinh nghiệm cá nhân)</strong>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>Kể một ví dụ ngắn về dự án bạn đã từng áp dụng công nghệ này, và bạn đã giải quyết vấn đề gì với nó.</p>
              </div>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', background: 'var(--color-cream)', padding: '1rem', borderRadius: '12px', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            <AlertCircle size={20} color="var(--color-earth)" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0 }}><strong>Lưu ý:</strong> Khung sườn trên chỉ là gợi ý. Bạn có thể tự do triển khai câu trả lời theo cách riêng của mình để thể hiện tốt nhất năng lực cá nhân trước Mentor.</p>
          </div>
        </div>

        {/* Practice Area */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', color: 'var(--color-charcoal)', marginBottom: '1.5rem', fontWeight: 600 }}>
            <PenTool size={24} /> Trả lời của bạn
          </h3>
          
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Hãy viết câu trả lời hoàn chỉnh của bạn tại đây..."
            style={{
              width: '100%',
              minHeight: '250px',
              padding: '1.5rem',
              borderRadius: '16px',
              border: '2px solid var(--border-color)',
              background: 'var(--surface)',
              fontSize: '1.05rem',
              color: 'var(--color-text)',
              lineHeight: 1.6,
              resize: 'vertical',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-earth)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              {answerText.length} ký tự
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {saveSuccess && (
                <span style={{ color: 'var(--color-moss)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 500, animation: 'fadeIn 0.3s' }}>
                  <CheckCircle size={18} /> Đã lưu thành công!
                </span>
              )}
              <button 
                className="btn btn--primary" 
                style={{ padding: '0.8rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={handleSave}
                disabled={isSaving || !answerText.trim()}
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Lưu bài làm
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default QuestionPractice;
