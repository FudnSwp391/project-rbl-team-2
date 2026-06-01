import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../utils/supabaseClient';
import { ArrowLeft, ArrowRight, RotateCcw, Loader2 } from 'lucide-react';
import './Flashcards.css';

const Flashcards = () => {
  const [searchParams] = useSearchParams();
  const industryId = searchParams.get('industry') || 'all';
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        let query = supabase.from('questions').select('*');
        if (industryId && industryId !== 'all') {
          query = query.eq('industry_id', industryId);
        }
        
        // Fetch all questions for this industry to ensure true randomness
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Shuffle the entire dataset and pick 30 random questions
        const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, 30);
        setQuestions(shuffled);
      } catch (err) {
        console.error('Error fetching questions:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, [industryId]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev + 1), 150);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(prev => prev - 1), 150);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Không xử lý nếu đang nhập liệu
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault(); // Ngăn trang cuộn xuống khi bấm space/mũi tên
        setIsFlipped(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, questions.length]);

  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  // Parse options nicely
  const getParsedOptions = (optionsText) => {
    if (!optionsText) return [];
    try {
      const parsed = JSON.parse(optionsText);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // not json array
    }
    const lines = optionsText.split('\n').filter(l => l.trim() !== '');
    if (lines.length > 1) return lines;
    return [optionsText];
  };

  let parsedOptions = [];
  let displayAnswer = '';
  let correctLetter = '';
  
  if (currentQuestion) {
    parsedOptions = getParsedOptions(currentQuestion.options);
    displayAnswer = currentQuestion.correct_answer || '';
    
    if (parsedOptions.length > 0 && displayAnswer) {
      const ansTrimmed = displayAnswer.trim();
      
      // If DB stores correct answer as just "A", "B", "C", "D"
      if (/^[A-D]$/i.test(ansTrimmed)) {
        const index = ansTrimmed.toUpperCase().charCodeAt(0) - 65;
        if (parsedOptions[index]) {
          correctLetter = ansTrimmed.toUpperCase();
          displayAnswer = parsedOptions[index];
        }
      } 
      // If DB stores the full text of the correct option
      else {
        const correctIndex = parsedOptions.findIndex(o => o.trim() === ansTrimmed);
        if (correctIndex !== -1) {
          correctLetter = String.fromCharCode(65 + correctIndex);
        }
      }
    }
    
    // Handle empty answers
    if (!displayAnswer && currentQuestion.question_type === 'behavioral') {
      displayAnswer = 'Câu hỏi mở, không có đáp án đúng sai tuyệt đối.';
    } else if (!displayAnswer) {
      displayAnswer = 'Đang cập nhật đáp án...';
    }
  }

  if (loading) {
    return (
      <div className="container flex-center" style={{ minHeight: '60vh', paddingTop: '8rem' }}>
        <Loader2 className="animate-spin" size={48} color="var(--color-earth)" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="container flex-center" style={{ minHeight: '60vh', paddingTop: '8rem', flexDirection: 'column', gap: '1rem' }}>
        <h2 className="text-editorial">Không có câu hỏi nào</h2>
        <p>Không tìm thấy câu hỏi nào cho chuyên ngành này.</p>
        <button className="btn btn--primary" onClick={() => navigate('/question-bank')}>Quay lại Bảng điều khiển</button>
      </div>
    );
  }

  return (
    <div className="flashcards-container container">
      
      <div className="flashcards-header">
        <button className="btn btn--outline" style={{ padding: '0.5rem 1rem' }} onClick={() => navigate('/question-bank')}>
          <ArrowLeft size={18} /> Quay lại
        </button>
        <div className="flashcards-progress-text">
          <span style={{ fontSize: '2rem' }}>{currentIndex + 1}</span> <span style={{ opacity: 0.5 }}>/ {questions.length}</span>
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
      </div>

      <div className="flashcard-wrapper">
        <div 
          className={`flashcard-inner ${isFlipped ? 'is-flipped' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Mặt trước: Câu hỏi */}
          <div className="flashcard-front">
            <div className="flashcard-content">
              {currentQuestion.content}
            </div>
            {parsedOptions.length > 0 && (
              <div className="flashcard-options-list">
                {parsedOptions.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  return (
                    <div key={i} className="flashcard-option-item">
                      <strong>{letter}.</strong> {opt}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flashcard-hint">Nhấp vào thẻ để lật</div>
          </div>

          {/* Mặt sau: Đáp án */}
          <div className="flashcard-back">
            <div className="flashcard-content flashcard-content-back">
              {correctLetter && (
                <div className="correct-letter-badge">
                  {correctLetter}
                </div>
              )}
              <div className="correct-answer-text">
                {displayAnswer}
              </div>
            </div>
            <div className="flashcard-hint" style={{ color: 'var(--color-moss-light)' }}>Nhấp vào thẻ để lật lại</div>
          </div>
        </div>
      </div>

      <div className="flashcards-controls">
        <button 
          className={`control-btn ${currentIndex === 0 ? 'disabled' : ''}`} 
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ArrowLeft size={24} />
        </button>
        
        <button 
          className="control-btn" 
          onClick={() => setIsFlipped(!isFlipped)}
          title="Lật thẻ"
        >
          <RotateCcw size={24} />
        </button>
        
        <button 
          className={`control-btn ${currentIndex === questions.length - 1 ? 'disabled' : ''}`} 
          onClick={handleNext}
          disabled={currentIndex === questions.length - 1}
        >
          <ArrowRight size={24} />
        </button>
      </div>

    </div>
  );
};

export default Flashcards;
