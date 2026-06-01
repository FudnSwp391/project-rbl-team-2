import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Clock, CheckCircle, AlertCircle, Play } from 'lucide-react';

const MentorReviews = () => {
  const [filter, setFilter] = useState('all');
  const [reviews] = useState(mockReviews);

  const filteredReviews = filter === 'all'
    ? reviews
    : reviews.filter(r => r.status === filter);

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container">
        {/* Header */}
        <div className="reveal is-visible" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <span className="label">Mentor Portal</span>
          <h1 style={{ marginTop: 'var(--spacing-sm)' }}>Đánh giá Phỏng vấn</h1>
          <p style={{ marginTop: '0.5rem' }}>Xem video phỏng vấn của ứng viên và gửi nhận xét chi tiết giúp họ cải thiện.</p>
        </div>

        {/* Filter Tabs */}
        <div className="reveal is-visible" style={{
          display: 'flex', gap: '0.5rem', marginBottom: 'var(--spacing-lg)',
          flexWrap: 'wrap',
        }}>
          {[
            { key: 'all', label: 'Tất cả', count: reviews.length },
            { key: 'pending', label: 'Chờ đánh giá', count: reviews.filter(r => r.status === 'pending').length },
            { key: 'reviewed', label: 'Đã đánh giá', count: reviews.filter(r => r.status === 'reviewed').length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '50px',
                border: filter === tab.key ? '1px solid var(--color-charcoal)' : '1px solid var(--border-color)',
                background: filter === tab.key ? 'var(--color-charcoal)' : 'rgba(255,255,255,0.6)',
                color: filter === tab.key ? 'var(--color-cream)' : 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.3s var(--ease-out-expo)',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}
            >
              {tab.label}
              <span style={{
                background: filter === tab.key ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)',
                padding: '0.1rem 0.5rem',
                borderRadius: '50px',
                fontSize: '0.75rem',
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Review List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredReviews.map((review, idx) => (
            <Link
              key={review.id}
              to={`/mentor/reviews/${review.id}`}
              className={`glass-card reveal is-visible ${idx > 0 ? `reveal--delay-${Math.min(idx, 3)}` : ''}`}
              style={{
                display: 'flex', alignItems: 'center', gap: '1.5rem',
                textDecoration: 'none', cursor: 'pointer',
                flexWrap: 'wrap',
              }}
            >
              {/* Video Thumbnail */}
              <div style={{
                width: '120px', height: '80px',
                background: 'linear-gradient(135deg, var(--color-earth-dark), var(--color-charcoal))',
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Play size={28} color="rgba(255,255,255,0.7)" />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.3rem 0', color: 'var(--color-charcoal)' }}>
                  {review.candidateName}
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  {review.industry} · {review.difficulty} · {review.date}
                </p>
              </div>

              {/* Status Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {review.status === 'pending' ? (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.4rem 0.85rem', borderRadius: '50px',
                    background: 'rgba(196, 149, 106, 0.12)',
                    color: 'var(--color-accent)',
                    fontSize: '0.8rem', fontWeight: 600,
                  }}>
                    <Clock size={14} /> Chờ đánh giá
                  </span>
                ) : (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.4rem 0.85rem', borderRadius: '50px',
                    background: 'rgba(107, 127, 92, 0.12)',
                    color: 'var(--color-moss)',
                    fontSize: '0.8rem', fontWeight: 600,
                  }}>
                    <CheckCircle size={14} /> Đã đánh giá
                  </span>
                )}
              </div>

              {/* Arrow */}
              <span style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>→</span>
            </Link>
          ))}

          {filteredReviews.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
              <AlertCircle size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p>Không có yêu cầu đánh giá nào{filter !== 'all' ? ' trong mục này' : ''}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const mockReviews = [
  { id: 1, candidateName: 'Trần Văn Hùng', industry: 'Backend Developer', difficulty: 'Trung bình', date: '28/05/2026', status: 'pending', duration: '15:32' },
  { id: 2, candidateName: 'Nguyễn Thị Mai', industry: 'Frontend Developer', difficulty: 'Khó', date: '27/05/2026', status: 'pending', duration: '22:10' },
  { id: 3, candidateName: 'Phạm Đức Anh', industry: 'Fullstack Developer', difficulty: 'Dễ', date: '25/05/2026', status: 'reviewed', duration: '12:45' },
  { id: 4, candidateName: 'Lê Hoàng Minh', industry: 'Data Engineer', difficulty: 'Trung bình', date: '24/05/2026', status: 'reviewed', duration: '18:20' },
  { id: 5, candidateName: 'Võ Ngọc Hân', industry: 'DevOps Engineer', difficulty: 'Khó', date: '23/05/2026', status: 'pending', duration: '20:05' },
];

export default MentorReviews;
