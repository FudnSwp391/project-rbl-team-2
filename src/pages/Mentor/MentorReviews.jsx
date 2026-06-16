import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, AlertCircle, Play, Video } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabaseClient';

const MentorReviews = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchReviews();
  }, [user]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      // Fetch interview_history entries that are available for mentor review
      const { data, error } = await supabase
        .from('interview_history')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching interview_history:', error.message);
        setReviews([]);
      } else {
        // Check which ones this mentor has already reviewed
        const { data: myReviews } = await supabase
          .from('mentor_reviews')
          .select('interview_id')
          .eq('mentor_id', user.id);

        const reviewedIds = new Set((myReviews || []).map(r => r.interview_id));

        const mapped = (data || []).map(item => ({
          id: item.id,
          candidateName: item.profiles?.full_name || item.user_id?.substring(0, 8) || 'Ứng viên',
          industry: item.industry || item.position || 'Chưa xác định',
          difficulty: item.difficulty || 'Trung bình',
          date: item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '',
          duration: item.duration || '--:--',
          status: reviewedIds.has(item.id) ? 'reviewed' : 'pending',
          video_url: item.video_url || null,
        }));

        setReviews(mapped);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setReviews([]);
    }
    setLoading(false);
  };

  const filteredReviews = filter === 'all'
    ? reviews
    : reviews.filter(r => r.status === filter);

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container">
        {/* Back to Dashboard */}
        <Link to="/mentor" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem', textDecoration: 'none', marginBottom: '1.5rem', transition: 'color 0.3s', fontFamily: 'var(--font-sans)' }} onMouseOver={e => e.currentTarget.style.color = 'var(--color-charcoal)'} onMouseOut={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}>
          ← Quay lại Mentor Dashboard
        </Link>

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

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            Đang tải danh sách đánh giá...
          </div>
        ) : (
          /* Review List */
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
              <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-text-secondary)' }}>
                <Video size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>
                  {filter === 'pending' ? 'Không có yêu cầu đánh giá nào đang chờ.' : 
                   filter === 'reviewed' ? 'Bạn chưa đánh giá phỏng vấn nào.' :
                   'Chưa có video phỏng vấn nào trong hệ thống.'}
                </p>
                <p style={{ fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto' }}>
                  Video phỏng vấn sẽ xuất hiện tại đây khi ứng viên hoàn thành phiên phỏng vấn AI trên hệ thống.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorReviews;
