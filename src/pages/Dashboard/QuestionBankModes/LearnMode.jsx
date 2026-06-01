import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../utils/supabaseClient';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle, XCircle } from 'lucide-react';
import './LearnMode.css';

const LearnMode = () => {
  const [searchParams] = useSearchParams();
  const industryId = searchParams.get('industry') || 'all';
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        let query = supabase.from('questions').select('*');
        if (industryId && industryId !== 'all') {
          query = query.eq('industry_id', industryId);
        }

        // Fetch all questions for true randomness
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

  const currentQuestion = questions[currentIndex];

  // Parse options nicely
  const getParsedOptions = (optionsText) => {
    if (!optionsText) return [];
    try {
      const parsed = JSON.parse(optionsText);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) { }
    const lines = optionsText.split('\n').filter(l => l.trim() !== '');
    if (lines.length > 1) return lines;
    return [optionsText];
  };

  const options = getParsedOptions(currentQuestion?.options);

  const getIsCorrect = (opt, index) => {
    const ansTrimmed = currentQuestion?.correct_answer?.trim();
    if (!ansTrimmed) return false;
    if (/^[A-D]$/i.test(ansTrimmed)) {
      const correctIndex = ansTrimmed.toUpperCase().charCodeAt(0) - 65;
      return index === correctIndex;
    }
    return opt.trim() === ansTrimmed || opt.includes(ansTrimmed);
  };

  const handleSelectAnswer = (opt, index) => {
    if (selectedAnswer) return;
    setSelectedAnswer(opt);

    let isCorrect = false;
    const ansTrimmed = currentQuestion?.correct_answer?.trim();
    if (ansTrimmed) {
      isCorrect = getIsCorrect(opt, index);
    } else {
      isCorrect = true; // behavioral
    }

    if (isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setIsFinished(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Select options 1, 2, 3, 4
      if (['1', '2', '3', '4'].includes(e.key) && !selectedAnswer) {
        const index = parseInt(e.key) - 1;
        if (options[index]) {
          handleSelectAnswer(options[index], index);
        }
      }
      // Next
      else if (e.key === ' ' || e.key === 'Enter') {
        if (selectedAnswer) {
          e.preventDefault();
          handleNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, questions.length, selectedAnswer, currentQuestion, options]);

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

  if (isFinished) {
    return (
      <div className="container flex-center" style={{ minHeight: '100vh', paddingTop: '6rem', flexDirection: 'column', gap: '2rem' }}>
        <h2 className="text-editorial" style={{ fontSize: '3rem', color: 'var(--color-earth)' }}>Hoàn thành!</h2>
        <div className="glass-premium flex-center" style={{ padding: '3rem', borderRadius: '20px', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '1.25rem' }}>Bạn đã hoàn thành phiên học 30 câu hỏi.</p>
          <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--color-charcoal)' }}>
            {score} / {questions.length}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn--outline" onClick={() => navigate('/question-bank')}>Trở về Bảng điều khiển</button>
          <button className="btn btn--primary" onClick={() => window.location.reload()}>Học lại</button>
        </div>
      </div>
    );
  }

  const progressPercent = ((currentIndex) / questions.length) * 100;

  return (
    <div className="learn-container container">
      <div className="learn-header">
        <button className="btn btn--outline" style={{ padding: '0.5rem 1rem' }} onClick={() => navigate('/question-bank')}>
          <ArrowLeft size={18} /> Quay lại
        </button>
        <div className="learn-progress-text">
          <span style={{ fontSize: '1.5rem', fontFamily: 'var(--font-serif)', color: 'var(--color-earth)' }}>{currentIndex + 1}</span>
          <span style={{ opacity: 0.5 }}> / {questions.length}</span>
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%`, backgroundColor: 'var(--color-moss)' }}></div>
      </div>

      <div className="learn-wrapper">
        <div className="learn-inner">
          <div className="learn-question">
            {currentQuestion.content}
          </div>

          {options.length > 0 ? (
            <div className="learn-options">
              {options.map((opt, idx) => {
                const isSelected = selectedAnswer === opt;
                const isCorrectAnswer = getIsCorrect(opt, idx);
                let optionClass = 'learn-option';

                if (selectedAnswer) {
                  if (isCorrectAnswer) optionClass += ' correct';
                  else if (isSelected) optionClass += ' incorrect';
                  else optionClass += ' disabled';
                }

                const letter = String.fromCharCode(65 + idx);

                return (
                  <div
                    key={idx}
                    className={optionClass}
                    onClick={() => handleSelectAnswer(opt, idx)}
                  >
                    <div className="option-letter">{letter}.</div>
                    <div className="option-text" style={{ flexGrow: 1 }}>{opt}</div>
                    {selectedAnswer && isCorrectAnswer && <CheckCircle color="currentColor" size={20} />}
                    {selectedAnswer && isSelected && !isCorrectAnswer && <XCircle color="currentColor" size={20} />}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="learn-no-options">
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>Câu hỏi này không có trắc nghiệm sẵn. Hãy tự suy nghĩ đáp án nhé!</p>
              {!selectedAnswer ? (
                <button className="btn btn--primary" onClick={() => setSelectedAnswer('viewed')}>Xem đáp án</button>
              ) : (
                <div style={{ padding: '1.5rem', background: 'var(--color-cream-dark)', borderRadius: '12px' }}>
                  <h4 style={{ color: 'var(--color-moss)', marginBottom: '0.5rem' }}>Đáp án:</h4>
                  <p>{currentQuestion.correct_answer || 'Không có đáp án cố định cho câu hỏi này.'}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="learn-controls-static">
        {selectedAnswer ? (
          <button className="btn btn--primary" onClick={handleNext} style={{ width: '100%', padding: '1rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {currentIndex < questions.length - 1 ? 'Tiếp tục' : 'Hoàn thành'} <ArrowRight size={20} style={{ marginLeft: '10px' }} />
          </button>
        ) : (
          <div style={{ height: '56px', opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', letterSpacing: '1px' }}>
            Bấm phím 1, 2, 3, 4 để chọn đáp án
          </div>
        )}
      </div>

    </div>
  );
};

export default LearnMode;
