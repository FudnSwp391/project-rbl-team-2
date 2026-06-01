import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../utils/supabaseClient';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import './MatchingMode.css';

const MatchingMode = () => {
  const [searchParams] = useSearchParams();
  const industryId = searchParams.get('industry') || 'all';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [wrongPair, setWrongPair] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  const initGame = async () => {
    try {
      setLoading(true);
      setMatchedPairs([]);
      setIsFinished(false);
      setSelectedQuestion(null);
      setSelectedAnswer(null);

      let query = supabase.from('questions')
        .select('*')
        .not('correct_answer', 'is', null)
        .neq('correct_answer', ''); // Only questions with clear answers

      if (industryId && industryId !== 'all') {
        query = query.eq('industry_id', industryId);
      }
      
      const { data, error } = await query.limit(50);
      
      if (error) throw error;
      
      if (data && data.length >= 5) {
        // Pick 5 random questions
        const shuffledData = data.sort(() => 0.5 - Math.random()).slice(0, 5);
        
        // Setup Left side (Questions)
        const qList = shuffledData.map(q => ({ id: q.id, text: q.content }));
        setQuestions(qList.sort(() => 0.5 - Math.random()));
        
        // Setup Right side (Answers)
        const aList = shuffledData.map(q => ({ id: q.id, text: q.correct_answer }));
        setAnswers(aList.sort(() => 0.5 - Math.random()));
      } else {
        setQuestions([]);
        setAnswers([]);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initGame();
  }, [industryId]);

  useEffect(() => {
    if (selectedQuestion && selectedAnswer) {
      if (selectedQuestion === selectedAnswer) {
        // Match!
        setTimeout(() => {
          setMatchedPairs(prev => [...prev, selectedQuestion]);
          setSelectedQuestion(null);
          setSelectedAnswer(null);
        }, 300);
      } else {
        // Wrong
        setWrongPair({ q: selectedQuestion, a: selectedAnswer });
        setTimeout(() => {
          setWrongPair(null);
          setSelectedQuestion(null);
          setSelectedAnswer(null);
        }, 800);
      }
    }
  }, [selectedQuestion, selectedAnswer]);

  useEffect(() => {
    if (questions.length > 0 && matchedPairs.length === questions.length) {
      setIsFinished(true);
    }
  }, [matchedPairs, questions]);

  if (loading) {
    return (
      <div className="container flex-center" style={{ minHeight: '60vh', paddingTop: '8rem' }}>
        <Loader2 className="animate-spin" size={48} color="var(--color-earth)" />
      </div>
    );
  }

  if (questions.length < 5) {
    return (
      <div className="container flex-center" style={{ minHeight: '60vh', paddingTop: '8rem', flexDirection: 'column', gap: '1rem' }}>
        <h2 className="text-editorial">Chưa đủ dữ liệu</h2>
        <p>Cần ít nhất 5 câu hỏi có sẵn đáp án để chơi trò này.</p>
        <button className="btn btn--primary" onClick={() => navigate('/question-bank')}>Quay lại Bảng điều khiển</button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="container flex-center" style={{ minHeight: '60vh', paddingTop: '8rem', flexDirection: 'column', gap: '2rem' }}>
        <h2 className="text-editorial" style={{ fontSize: '3rem', color: 'var(--color-earth)' }}>Tuyệt vời!</h2>
        <p style={{ fontSize: '1.25rem' }}>Bạn đã ghép đúng tất cả các thẻ.</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn--outline" onClick={() => navigate('/question-bank')}>Trở về Bảng điều khiển</button>
          <button className="btn btn--primary" onClick={initGame}>Chơi lại <RefreshCw size={18} style={{ marginLeft: 8 }} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="matching-container container" style={{ paddingTop: '8rem', paddingBottom: '4rem' }}>
      
      <div className="matching-header">
        <button className="btn btn--outline" style={{ padding: '0.5rem 1rem' }} onClick={() => navigate('/question-bank')}>
          <ArrowLeft size={18} /> Hủy trò chơi
        </button>
        <div className="matching-progress-text">
          Đã ghép: {matchedPairs.length} / {questions.length}
        </div>
      </div>

      <div className="matching-board">
        {/* Cột câu hỏi */}
        <div className="matching-column">
          <h3 className="text-editorial column-title">Câu hỏi</h3>
          <div className="matching-list">
            {questions.map((q) => {
              const isMatched = matchedPairs.includes(q.id);
              const isSelected = selectedQuestion === q.id;
              const isWrong = wrongPair && wrongPair.q === q.id;
              
              if (isMatched) return <div key={`q-matched-${q.id}`} className="matching-card matched" />;
              
              return (
                <div 
                  key={`q-${q.id}`}
                  className={`matching-card ${isSelected ? 'selected' : ''} ${isWrong ? 'wrong' : ''}`}
                  onClick={() => !isSelected && !selectedQuestion && setSelectedQuestion(q.id)}
                >
                  {q.text}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cột đáp án */}
        <div className="matching-column">
          <h3 className="text-editorial column-title">Đáp án</h3>
          <div className="matching-list">
            {answers.map((a) => {
              const isMatched = matchedPairs.includes(a.id);
              const isSelected = selectedAnswer === a.id;
              const isWrong = wrongPair && wrongPair.a === a.id;
              
              if (isMatched) return <div key={`a-matched-${a.id}`} className="matching-card matched" />;
              
              return (
                <div 
                  key={`a-${a.id}`}
                  className={`matching-card answer-card ${isSelected ? 'selected' : ''} ${isWrong ? 'wrong' : ''}`}
                  onClick={() => !isSelected && !selectedAnswer && setSelectedAnswer(a.id)}
                >
                  {a.text}
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};

export default MatchingMode;
