import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../utils/supabaseClient';
import { ArrowLeft, ArrowRight, ArrowLeft as ArrowLeftIcon, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import './TestMode.css';

const TestMode = () => {
  const [searchParams] = useSearchParams();
  const industryId = searchParams.get('industry') || 'all';
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testState, setTestState] = useState('config'); // 'config', 'playing', 'result'
  
  // Config state
  const [numQuestions, setNumQuestions] = useState(20);

  // Playing state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { questionIndex: answer }

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        let query = supabase.from('questions').select('*');
        if (industryId && industryId !== 'all') {
          query = query.eq('industry_id', industryId);
        }
        
        // Fetch all questions for this industry
        const { data, error } = await query;
        
        if (error) throw error;
        
        // True random shuffle of the entire dataset
        const shuffled = data.sort(() => 0.5 - Math.random());
        setQuestions(shuffled);
      } catch (err) {
        console.error('Error fetching questions:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, [industryId]);

  const startTest = () => {
    setQuestions(prev => prev.slice(0, numQuestions));
    setTestState('playing');
    setCurrentIndex(0);
    setUserAnswers({});
  };

  const getParsedOptions = (optionsText) => {
    if (!optionsText) return [];
    try {
      const parsed = JSON.parse(optionsText);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
    const lines = optionsText.split('\n').filter(l => l.trim() !== '');
    if (lines.length > 1) return lines;
    return [optionsText];
  };

  const getIsCorrect = (opt, index, q) => {
    const ansTrimmed = q?.correct_answer?.trim();
    if (!ansTrimmed) return false;
    if (/^[A-D]$/i.test(ansTrimmed)) {
      const correctIndex = ansTrimmed.toUpperCase().charCodeAt(0) - 65;
      return index === correctIndex;
    }
    return opt.trim() === ansTrimmed || opt.includes(ansTrimmed);
  };

  const handleSelectAnswer = (option) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentIndex]: option
    }));
  };

  const submitTest = () => {
    setTestState('result');
  };

  useEffect(() => {
    if (testState !== 'playing') return;
    
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const currentQuestion = questions[currentIndex];
      const options = getParsedOptions(currentQuestion?.options);

      // Select options 1, 2, 3, 4
      if (['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key) - 1;
        if (options[index]) {
          handleSelectAnswer(options[index]);
        }
      }
      // Prev
      else if (e.key === 'ArrowLeft') {
         if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
      }
      // Next
      else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, questions, testState]);

  if (loading) {
    return (
      <div className="container flex-center" style={{ minHeight: '100vh', paddingTop: '6rem' }}>
        <Loader2 className="animate-spin" size={48} color="var(--color-earth)" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="container flex-center" style={{ minHeight: '100vh', paddingTop: '6rem', flexDirection: 'column', gap: '1rem' }}>
        <h2 className="text-editorial">Không có câu hỏi nào</h2>
        <button className="btn btn--primary" onClick={() => navigate('/question-bank')}>Quay lại Bảng điều khiển</button>
      </div>
    );
  }

  if (testState === 'config') {
    return (
      <div className="container flex-center" style={{ minHeight: '100vh', paddingTop: '6rem' }}>
        <div className="test-config-modal glass-card">
          <div className="test-config-header">
            <FileText size={32} color="var(--color-accent)" />
            <h2 className="text-editorial">Thiết lập bài kiểm tra</h2>
          </div>
          
          <div className="test-config-body">
            <div className="config-group">
              <label>Số lượng câu hỏi (tối đa {Math.min(40, questions.length)})</label>
              <input 
                type="number" 
                min="5" 
                max={Math.min(40, questions.length)} 
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                className="config-input"
              />
            </div>
          </div>
          
          <div className="test-config-footer">
            <button className="btn btn--outline" onClick={() => navigate('/question-bank')}>Hủy</button>
            <button className="btn btn--accent" onClick={startTest}>Bắt đầu làm kiểm tra</button>
          </div>
        </div>
      </div>
    );
  }

  if (testState === 'playing') {
    const currentQuestion = questions[currentIndex];
    const options = getParsedOptions(currentQuestion.options);
    const hasAnsweredAll = Object.keys(userAnswers).length === questions.length;

    return (
      <div className="test-container container">
        <div className="test-header">
          <button className="btn btn--outline" style={{ padding: '0.5rem 1rem' }} onClick={() => navigate('/question-bank')}>
            <ArrowLeft size={18} /> Hủy bài
          </button>
          <div className="test-progress-text">
            <span style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--color-earth)' }}>{currentIndex + 1}</span> 
            <span style={{ opacity: 0.5 }}> / {questions.length}</span>
          </div>
        </div>

        <div className="test-wrapper">
          <div className="test-inner">
            <div className="test-question">
              {currentQuestion.content}
            </div>
            
            {options.length > 0 ? (
              <div className="test-options">
                {options.map((opt, idx) => {
                  const isSelected = userAnswers[currentIndex] === opt;
                  let optionClass = 'test-option';
                  if (isSelected) optionClass += ' selected';

                  const letter = String.fromCharCode(65 + idx);

                  return (
                    <div 
                      key={idx} 
                      className={optionClass}
                      onClick={() => handleSelectAnswer(opt)}
                    >
                      <div className="option-letter">{letter}.</div>
                      <div className="option-text" style={{ flexGrow: 1 }}>{opt}</div>
                      {isSelected && <CheckCircle color="currentColor" size={20} />}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="test-no-options">
                <textarea 
                  className="test-textarea" 
                  placeholder="Nhập câu trả lời của bạn vào đây..."
                  value={userAnswers[currentIndex] || ''}
                  onChange={(e) => handleSelectAnswer(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="test-controls-static">
          <button 
            className="btn btn--outline" 
            onClick={() => setCurrentIndex(prev => prev - 1)}
            disabled={currentIndex === 0}
            style={{ width: '150px' }}
          >
            <ArrowLeftIcon size={18} /> Trước
          </button>
          
          <div className="test-overview-dots">
            {questions.map((_, i) => (
              <div 
                key={i} 
                className={`test-dot ${userAnswers[i] ? 'answered' : ''} ${i === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(i)}
                title={`Câu ${i + 1}`}
              />
            ))}
          </div>

          {currentIndex < questions.length - 1 ? (
            <button className="btn btn--primary" onClick={() => setCurrentIndex(prev => prev + 1)} style={{ width: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Tiếp <ArrowRight size={18} style={{ marginLeft: '10px' }} />
            </button>
          ) : (
            <button className="btn btn--accent" onClick={submitTest} disabled={!hasAnsweredAll} style={{ width: '150px' }}>
              Nộp bài
            </button>
          )}
        </div>
        
        <div style={{ marginTop: '1rem', height: '20px', opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', letterSpacing: '1px', width: '100%' }}>
            Bấm phím 1, 2, 3, 4 để chọn, Mũi tên trái/phải để chuyển câu
        </div>
      </div>
    );
  }

  if (testState === 'result') {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      const uAnswer = userAnswers[idx];
      const options = getParsedOptions(q.options);
      
      let isCorrect = false;
      if (options.length > 0) {
          const ansIndex = options.indexOf(uAnswer);
          if (ansIndex !== -1) {
              isCorrect = getIsCorrect(uAnswer, ansIndex, q);
          }
      } else {
          isCorrect = q.correct_answer && uAnswer && uAnswer.includes(q.correct_answer);
      }
      
      if (isCorrect) correctCount++;
    });

    return (
      <div className="test-result-container container" style={{ paddingTop: '8rem', paddingBottom: '4rem', minHeight: '100vh' }}>
        <h2 className="text-editorial" style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '2rem' }}>Kết quả kiểm tra</h2>
        
        <div className="glass-card flex-center" style={{ padding: '3rem', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
          <div style={{ fontSize: '5rem', fontWeight: 'bold', color: 'var(--color-accent)' }}>
            {correctCount} / {questions.length}
          </div>
          <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)' }}>Câu trả lời chính xác</p>
        </div>

        <div className="test-review">
          <h3 className="text-editorial" style={{ marginBottom: '1.5rem' }}>Chi tiết bài làm</h3>
          {questions.map((q, idx) => {
            const uAnswer = userAnswers[idx];
            const options = getParsedOptions(q.options);
            
            let isCorrect = false;
            if (options.length > 0) {
                const ansIndex = options.indexOf(uAnswer);
                if (ansIndex !== -1) {
                    isCorrect = getIsCorrect(uAnswer, ansIndex, q);
                }
            } else {
                isCorrect = q.correct_answer && uAnswer && uAnswer.includes(q.correct_answer);
            }
            
            return (
              <div key={idx} className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ marginTop: '0.2rem' }}>
                    {q.correct_answer ? (
                      isCorrect ? <CheckCircle color="var(--color-moss)" size={24} /> : <XCircle color="#ef4444" size={24} />
                    ) : (
                      <FileText color="var(--color-stone)" size={24} />
                    )}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Câu {idx + 1}: {q.content}</h4>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                      <strong>Bạn đã chọn:</strong> {uAnswer || 'Không trả lời'}
                    </p>
                    <p style={{ color: 'var(--color-moss)' }}>
                      <strong>Đáp án đúng:</strong> {q.correct_answer || 'Đây là câu hỏi tự luận mở.'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <button className="btn btn--primary" onClick={() => navigate('/question-bank')}>Trở về Bảng điều khiển</button>
        </div>
      </div>
    );
  }

  return null;
};

export default TestMode;
