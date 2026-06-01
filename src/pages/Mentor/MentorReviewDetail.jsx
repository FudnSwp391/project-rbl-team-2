import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Star, Send, CheckCircle } from 'lucide-react';

const MentorReviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isPlaying, setIsPlaying] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState({
    technicalScore: 7,
    communicationScore: 8,
    problemSolvingScore: 7,
    overallComment: '',
    strengths: '',
    improvements: '',
  });

  // Mock review data
  const review = {
    id: parseInt(id),
    candidateName: 'Trần Văn Hùng',
    industry: 'Backend Developer',
    difficulty: 'Trung bình',
    date: '28/05/2026',
    duration: '15:32',
    questions: [
      'Hãy giải thích sự khác biệt giữa SQL và NoSQL?',
      'Bạn đã xử lý tối ưu hóa hiệu suất database như thế nào?',
      'Mô tả kiến trúc microservices mà bạn đã triển khai.',
    ],
  };

  const handleScoreChange = (field, value) => {
    setFeedback(prev => ({ ...prev, [field]: Math.min(10, Math.max(0, parseInt(value) || 0)) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!feedback.overallComment.trim()) {
      alert('Vui lòng nhập nhận xét tổng quan');
      return;
    }
    setSubmitted(true);
    setTimeout(() => navigate('/mentor/reviews'), 2000);
  };

  if (submitted) {
    return (
      <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
        <div className="container flex-center" style={{ flexDirection: 'column', gap: '1.5rem', paddingTop: '15vh' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(107, 127, 92, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle size={40} color="var(--color-moss)" />
          </div>
          <h2 style={{ color: 'var(--color-charcoal)', fontFamily: 'var(--font-serif)' }}>Đánh giá đã được gửi!</h2>
          <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', maxWidth: '400px' }}>
            Nhận xét chi tiết của bạn cho <strong>{review.candidateName}</strong> đã được lưu thành công. Ứng viên sẽ nhận được phản hồi ngay sau đây.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container">
        {/* Back */}
        <button
          onClick={() => navigate('/mentor/reviews')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-secondary)', fontSize: '0.9rem',
            marginBottom: 'var(--spacing-md)', transition: 'color 0.3s',
            fontFamily: 'var(--font-sans)',
          }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--color-charcoal)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
        >
          <ArrowLeft size={18} /> Quay lại danh sách
        </button>

        {/* Header */}
        <div className="reveal is-visible" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <span className="label">Đánh giá phỏng vấn</span>
          <h1 style={{ marginTop: 'var(--spacing-sm)', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
            {review.candidateName}
          </h1>
          <p style={{ marginTop: '0.25rem' }}>
            {review.industry} · {review.difficulty} · {review.date} · Thời lượng: {review.duration}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--spacing-lg)', alignItems: 'start' }}>
          {/* Video Player Section */}
          <div className="glass-card reveal is-visible" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Video Area */}
            <div style={{
              width: '100%', aspectRatio: '16/9',
              background: 'linear-gradient(135deg, var(--color-charcoal) 0%, var(--color-earth-dark) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative',
            }}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              <div style={{
                width: '70px', height: '70px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.3s, background 0.3s',
                transform: isPlaying ? 'scale(0.9)' : 'scale(1)',
              }}>
                {isPlaying
                  ? <Pause size={28} color="white" />
                  : <Play size={28} color="white" style={{ marginLeft: '3px' }} />
                }
              </div>
              {/* Bottom bar */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '0.75rem 1rem',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                display: 'flex', justifyContent: 'space-between',
                color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem',
              }}>
                <span>Video phỏng vấn</span>
                <span>{review.duration}</span>
              </div>
            </div>

            {/* Questions Section */}
            <div style={{ padding: 'var(--spacing-lg)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-charcoal)' }}>
                Câu hỏi đã được hỏi:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {review.questions.map((q, i) => (
                  <div key={i} style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(196, 149, 106, 0.06)',
                    borderRadius: '10px',
                    border: '1px solid rgba(196, 149, 106, 0.1)',
                    fontSize: '0.9rem',
                    color: 'var(--color-text)',
                    lineHeight: '1.6',
                  }}>
                    <span style={{ color: 'var(--color-accent)', fontWeight: 600, marginRight: '0.5rem' }}>
                      Q{i + 1}.
                    </span>
                    {q}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feedback Form */}
          <form onSubmit={handleSubmit} className="glass-card reveal is-visible reveal--delay-1">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.5rem', color: 'var(--color-charcoal)' }}>
              📝 Gửi nhận xét chi tiết
            </h3>

            {/* Score Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {[
                { key: 'technicalScore', label: 'Kỹ năng kỹ thuật', color: 'var(--color-accent)' },
                { key: 'communicationScore', label: 'Kỹ năng giao tiếp', color: 'var(--color-moss)' },
                { key: 'problemSolvingScore', label: 'Tư duy giải quyết vấn đề', color: 'var(--color-earth)' },
              ].map(({ key, label, color }) => (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-charcoal)' }}>{label}</label>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color }}>{feedback[key]}/10</span>
                  </div>
                  <input
                    type="range" min="0" max="10"
                    value={feedback[key]}
                    onChange={(e) => handleScoreChange(key, e.target.value)}
                    style={{
                      width: '100%', height: '6px', borderRadius: '3px',
                      appearance: 'none', background: `linear-gradient(to right, ${color} 0%, ${color} ${feedback[key] * 10}%, var(--border-color) ${feedback[key] * 10}%, var(--border-color) 100%)`,
                      cursor: 'pointer', outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0 1.5rem' }} />

            {/* Text Feedbacks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={formLabelStyle}>Điểm mạnh nổi bật</label>
                <textarea
                  value={feedback.strengths}
                  onChange={(e) => setFeedback(prev => ({ ...prev, strengths: e.target.value }))}
                  style={{ ...formInputStyle, minHeight: '80px', resize: 'vertical' }}
                  placeholder="Ứng viên có những điểm mạnh gì nổi bật..."
                />
              </div>
              <div>
                <label style={formLabelStyle}>Điểm cần cải thiện</label>
                <textarea
                  value={feedback.improvements}
                  onChange={(e) => setFeedback(prev => ({ ...prev, improvements: e.target.value }))}
                  style={{ ...formInputStyle, minHeight: '80px', resize: 'vertical' }}
                  placeholder="Ứng viên nên cải thiện những gì..."
                />
              </div>
              <div>
                <label style={formLabelStyle}>
                  Nhận xét tổng quan <span style={{ color: 'var(--color-accent)' }}>*</span>
                </label>
                <textarea
                  value={feedback.overallComment}
                  onChange={(e) => setFeedback(prev => ({ ...prev, overallComment: e.target.value }))}
                  style={{ ...formInputStyle, minHeight: '100px', resize: 'vertical' }}
                  placeholder="Viết nhận xét tổng quan về buổi phỏng vấn của ứng viên..."
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn--primary btn--pill"
              style={{ width: '100%', marginTop: '1.5rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Send size={16} /> Gửi nhận xét
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const formLabelStyle = {
  display: 'block',
  marginBottom: '0.4rem',
  fontWeight: 500,
  color: 'var(--color-charcoal)',
  fontSize: '0.85rem',
  fontFamily: 'var(--font-sans)',
};

const formInputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '10px',
  border: '1px solid var(--border-color)',
  background: 'rgba(255, 255, 255, 0.8)',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.9rem',
  color: 'var(--color-text)',
  lineHeight: '1.6',
  transition: 'border-color 0.3s',
  outline: 'none',
  boxSizing: 'border-box',
};

export default MentorReviewDetail;
