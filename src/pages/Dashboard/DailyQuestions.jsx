import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, XCircle, Trophy } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';

// Mock questions from the SQL seed files
const MOCK_QUESTIONS = [];

const DailyQuestions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  if (MOCK_QUESTIONS.length === 0) {
    return (
      <div className="container animate-fade" style={{ paddingTop: '8rem', paddingBottom: 'var(--spacing-xl)', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Đang cập nhật thử thách</h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
            Thử thách hằng ngày hiện tại chưa có câu hỏi. Dữ liệu sẽ sớm được cập nhật, bạn vui lòng quay lại sau nhé!
          </p>
          <button className="btn btn--primary" onClick={() => navigate('/dashboard')}>
            Trở về Bảng điều khiển
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = MOCK_QUESTIONS[currentQuestionIndex];

  const handleSelectOption = (index) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    
    if (index === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < MOCK_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      finishChallenge();
    }
  };

  const finishChallenge = () => {
    setIsCompleted(true);
    
    // Update local storage and Database
    if (user) {
      const storageKey = `ita_user_data_${user.id}`;
      let savedData = JSON.parse(localStorage.getItem(storageKey));
      
      if (savedData && !savedData.completedChallenges.includes('qa')) {
        savedData.completedChallenges.push('qa');
        // Earn 50 points if they got at least half right, otherwise base 10 points
        const earnedPoints = score >= 5 ? 50 : 10;
        savedData.points += earnedPoints;
        localStorage.setItem(storageKey, JSON.stringify(savedData));
        
        // Sync to Database
        import('../../utils/supabaseClient').then(({ supabase }) => {
          supabase.from('profiles').update({
            points: savedData.points
          }).eq('id', user.id).then(({ error }) => {
            if (error) console.error('Lỗi khi cập nhật điểm DB:', error);
          });
        });
      }
    }
  };

  if (isCompleted) {
    return (
      <div className="container animate-fade" style={{ paddingTop: '8rem', paddingBottom: 'var(--spacing-xl)', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Trophy size={64} color="#32c864" style={{ marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Thử thách hoàn tất!</h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
            Bạn đã trả lời đúng {score}/{MOCK_QUESTIONS.length} câu hỏi.
          </p>
          <div style={{ padding: '1rem 2rem', background: 'rgba(50, 200, 100, 0.1)', borderRadius: '12px', marginBottom: '2rem' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#32c864' }}>
              +{score >= 5 ? 50 : 10} Điểm
            </span>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Trở về Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade" style={{ paddingTop: '8rem', paddingBottom: 'var(--spacing-xl)', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>Thử thách Câu hỏi</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Chuyên ngành: <span style={{ color: 'hsl(var(--accent-hsl))' }}>{currentQuestion.industry}</span></p>
        </div>
        <div style={{ padding: '0.5rem 1rem', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
          Câu {currentQuestionIndex + 1}/{MOCK_QUESTIONS.length}
        </div>
      </header>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '2rem', fontWeight: 500 }}>
          {currentQuestion.question}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {currentQuestion.options.map((option, index) => {
            let bgColor = 'var(--glass-bg)';
            let borderColor = 'var(--glass-border)';
            let textColor = 'inherit';

            if (isAnswered) {
              if (index === currentQuestion.correctAnswer) {
                bgColor = 'rgba(50, 200, 100, 0.1)';
                borderColor = '#32c864';
              } else if (index === selectedOption) {
                bgColor = 'rgba(255, 50, 50, 0.1)';
                borderColor = '#ff3232';
              }
            } else if (selectedOption === index) {
              borderColor = 'hsl(var(--accent-hsl))';
            }

            return (
              <button
                key={index}
                disabled={isAnswered}
                onClick={() => handleSelectOption(index)}
                style={{
                  padding: '1.2rem',
                  background: bgColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '8px',
                  color: textColor,
                  textAlign: 'left',
                  cursor: isAnswered ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  fontSize: '1rem'
                }}
              >
                <div style={{ 
                  minWidth: '24px', height: '24px', borderRadius: '50%', 
                  border: `2px solid ${isAnswered && index === currentQuestion.correctAnswer ? '#32c864' : (isAnswered && index === selectedOption ? '#ff3232' : 'var(--text-secondary)')}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {isAnswered && index === currentQuestion.correctAnswer && <CheckCircle2 size={16} color="#32c864" />}
                  {isAnswered && index === selectedOption && index !== currentQuestion.correctAnswer && <XCircle size={16} color="#ff3232" />}
                </div>
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          className="btn btn-primary" 
          disabled={!isAnswered}
          onClick={handleNext}
          style={{ opacity: !isAnswered ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {currentQuestionIndex < MOCK_QUESTIONS.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành'} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default DailyQuestions;
