import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../utils/AuthContext';
import { 
  ArrowLeft, 
  Lightbulb, 
  PenTool, 
  CheckCircle, 
  Save, 
  Loader2, 
  AlertCircle, 
  Sparkles, 
  TrendingUp, 
  Copy, 
  Check 
} from 'lucide-react';

const QuestionPractice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [copied, setCopied] = useState(false);

  // Fetch question details
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

  // Fetch user's latest answer and AI feedback for this question (if any)
  useEffect(() => {
    const fetchLatestAnswer = async () => {
      if (!user || !id) return;
      try {
        const { data, error } = await supabase
          .from('practice_answers')
          .select('*')
          .eq('user_id', user.id)
          .eq('question_id', id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          setAnswerText(data[0].answer_text);
          if (data[0].ai_feedback) {
            setAiFeedback(data[0].ai_feedback);
          }
        }
      } catch (err) {
        console.error('Error fetching latest answer:', err);
      }
    };

    fetchLatestAnswer();
  }, [user, id]);

  // Save as draft (does not invoke AI evaluation)
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
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving answer:', err);
      alert('Có lỗi xảy ra khi lưu bài nháp. Vui lòng kiểm tra lại kết nối hoặc cơ sở dữ liệu của bạn.');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit and analyze using Edge Function (Approach 2)
  const handleAnalyze = async () => {
    if (!answerText.trim() || !user || !question) return;
    
    setIsAnalyzing(true);
    setSaveSuccess(false);
    
    try {
      // 1. Insert the answer into Supabase with 'analyzing' status
      const payload = {
        user_id: user.id,
        question_id: question.id,
        answer_text: answerText,
        status: 'analyzing'
      };
      
      const { data, error } = await supabase
        .from('practice_answers')
        .insert([payload])
        .select()
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Không nhận được bản ghi phản hồi sau khi lưu câu trả lời.');

      // 2. Invoke the practice-eval Edge Function
      const { data: responseData, error: evalError } = await supabase.functions.invoke('practice-eval', {
        body: { answerId: data.id }
      });
      
      if (evalError) throw evalError;
      
      if (responseData && responseData.success && responseData.data?.ai_feedback) {
        setAiFeedback(responseData.data.ai_feedback);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error(responseData?.error || 'Đánh giá AI thất bại.');
      }
    } catch (err) {
      console.error('Error analyzing answer:', err);
      alert(`Có lỗi xảy ra khi phân tích: ${err.message || 'Lỗi không xác định'}`);
    } finally {
      setIsAnalyzing(false);
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
        <h1 className="text-editorial" style={{ fontSize: '2rem', color: 'var(--color-charcoal)', lineHeight: 1.4, margin: 0 }}>
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
            disabled={isAnalyzing}
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
              transition: 'border-color 0.2s',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--color-earth)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
              {answerText.length} ký tự
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {saveSuccess && (
                <span style={{ color: 'var(--color-moss)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 500, animation: 'fadeIn 0.3s' }}>
                  <CheckCircle size={18} /> Lưu bài thành công!
                </span>
              )}
              
              <button 
                className="btn btn--outline" 
                style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onClick={handleSave}
                disabled={isSaving || isAnalyzing || !answerText.trim()}
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Lưu nháp
              </button>

              <button 
                className="btn btn--primary" 
                style={{ padding: '0.8rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-earth-dark)' }}
                onClick={handleAnalyze}
                disabled={isSaving || isAnalyzing || !answerText.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    AI đang đánh giá...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Nộp bài & Phân tích AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* AI Analysis Section */}
        {isAnalyzing && (
          <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', border: '1px dashed var(--color-earth)' }}>
            <Loader2 className="animate-spin" size={48} color="var(--color-earth)" />
            <div>
              <h4 style={{ fontSize: '1.25rem', color: 'var(--color-charcoal)', fontWeight: 600, marginBottom: '0.5rem' }}>AI đang đánh giá bài làm của bạn</h4>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', margin: 0 }}>
                Hệ thống đang chấm điểm, tìm lỗi sai, tạo bài mẫu và đối chiếu sự tiến bộ...
              </p>
            </div>
          </div>
        )}

        {!isAnalyzing && aiFeedback && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '2.5rem', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Header / Score */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'var(--color-cream)', padding: '0.75rem', borderRadius: '12px' }}>
                  <Sparkles size={28} color="var(--color-earth)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>Kết quả Đánh giá từ AI</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Cập nhật tự động dựa trên lần nộp bài gần nhất</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', background: 'var(--color-cream-dark)', padding: '0.75rem 1.5rem', borderRadius: '50px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-earth-dark)', lineHeight: 1 }}>{aiFeedback.score}</span>
                <span style={{ fontSize: '1.1rem', color: 'var(--color-earth)', fontWeight: 600 }}>/ 100</span>
              </div>
            </div>

            {/* General Feedback */}
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', borderLeft: '4px solid var(--color-earth)' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: 'var(--color-charcoal)', fontWeight: 600 }}>
                <Lightbulb size={20} color="var(--color-earth)" /> Nhận xét tổng quan
              </h4>
              <p style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text)', lineHeight: 1.6 }}>{aiFeedback.general_feedback}</p>
            </div>

            {/* Progress Analysis */}
            {aiFeedback.progress_analysis && (
              <div style={{ background: '#ecfdf5', padding: '1.5rem', borderRadius: '16px', borderLeft: '4px solid #059669' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', color: '#047857', fontWeight: 600 }}>
                  <TrendingUp size={20} /> Theo dõi sự tiến bộ
                </h4>
                <p style={{ margin: 0, fontSize: '1rem', color: '#065f46', lineHeight: 1.6 }}>{aiFeedback.progress_analysis}</p>
              </div>
            )}

            {/* Errors & Weaknesses */}
            <div>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', color: 'var(--color-charcoal)', fontWeight: 600 }}>Điểm cần cải thiện & Lỗi sai</h4>
              {aiFeedback.errors && aiFeedback.errors.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {aiFeedback.errors.map((errorItem, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.75rem', background: '#fffaf0', padding: '1rem', borderRadius: '12px', border: '1px solid #feebc8' }}>
                      <AlertCircle size={20} color="#dd6b20" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                      <div>
                        <strong style={{ color: '#c05621', fontSize: '0.95rem' }}>[{errorItem.type}]</strong>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.95rem', color: 'var(--color-text)', lineHeight: 1.5 }}>{errorItem.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, color: 'var(--color-moss)', fontStyle: 'italic', fontSize: '0.95rem' }}>Tuyệt vời! Không phát hiện lỗi sai đáng tiếc nào.</p>
              )}
            </div>

            {/* Sample Answer */}
            {aiFeedback.sample_answer && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-charcoal)', fontWeight: 600 }}>Câu trả lời mẫu tham khảo</h4>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(aiFeedback.sample_answer);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      background: 'none', border: 'none', color: 'var(--color-earth)',
                      fontSize: '0.95rem', cursor: 'pointer', fontWeight: 500,
                      outline: 'none'
                    }}
                  >
                    {copied ? (
                      <>
                        <Check size={16} color="var(--color-moss)" />
                        <span style={{ color: 'var(--color-moss)' }}>Đã sao chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', whiteSpace: 'pre-line', fontSize: '1rem', color: 'var(--color-text)', lineHeight: 1.7 }}>
                  {aiFeedback.sample_answer}
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default QuestionPractice;

