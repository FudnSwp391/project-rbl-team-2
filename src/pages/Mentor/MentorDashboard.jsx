import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Eye, Calendar, Settings, BookOpen, Video, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabaseClient';

const MentorDashboard = () => {
  const { user, profile } = useAuth();

  // Stats (will be fetched from DB later)
  const [stats, setStats] = useState({
    pendingReviews: 3,
    upcomingSessions: 2,
    publishedBlogs: 5,
    completedReviews: 12,
  });

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container">
        {/* Header */}
        <div className="reveal is-visible" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <span className="label" style={{ marginBottom: 'var(--spacing-sm)', display: 'inline-block' }}>Mentor Portal</span>
          <h1 style={{ marginTop: 'var(--spacing-sm)', fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
            Xin chào, <span className="gradient-text">{profile?.full_name || user?.email?.split('@')[0] || 'Mentor'}</span>
          </h1>
          <p style={{ marginTop: '0.5rem', maxWidth: '600px' }}>
            Quản lý đánh giá phỏng vấn, lịch hẹn mentoring và chia sẻ kiến thức qua blog.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid-auto" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <div className="glass-card reveal is-visible" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div style={{ padding: '1rem', background: 'rgba(196, 149, 106, 0.12)', borderRadius: '12px' }}>
              <Eye size={28} color="var(--color-accent)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--color-charcoal)' }}>{stats.pendingReviews}</h3>
              <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.9rem' }}>Yêu cầu đánh giá chờ</p>
            </div>
          </div>

          <div className="glass-card reveal is-visible reveal--delay-1" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div style={{ padding: '1rem', background: 'rgba(107, 127, 92, 0.12)', borderRadius: '12px' }}>
              <Calendar size={28} color="var(--color-moss)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--color-charcoal)' }}>{stats.upcomingSessions}</h3>
              <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.9rem' }}>Buổi hẹn sắp tới</p>
            </div>
          </div>

          <div className="glass-card reveal is-visible reveal--delay-2" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div style={{ padding: '1rem', background: 'rgba(139, 115, 85, 0.12)', borderRadius: '12px' }}>
              <BookOpen size={28} color="var(--color-earth)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--color-charcoal)' }}>{stats.publishedBlogs}</h3>
              <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '0.9rem' }}>Bài blog đã xuất bản</p>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid-auto">
          {/* Blog Management */}
          <Link to="/mentor/blogs" className="glass-card reveal is-visible" style={{ display: 'block', textDecoration: 'none', cursor: 'pointer' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1.25rem' }}>📝</div>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-charcoal)' }}>Quản lý Blog</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
              Tạo bài viết mới, chỉnh sửa và xuất bản nội dung chia sẻ kiến thức, kinh nghiệm phỏng vấn cho ứng viên.
            </p>
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent)', fontSize: '0.85rem', fontWeight: 500 }}>
              Quản lý blog <span style={{ transition: 'transform 0.3s' }}>→</span>
            </div>
          </Link>

          {/* Review */}
          <Link to="/mentor/reviews" className="glass-card reveal is-visible reveal--delay-1" style={{ display: 'block', textDecoration: 'none', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1.25rem' }}>🎬</div>
              {stats.pendingReviews > 0 && (
                <span style={{
                  background: 'var(--color-accent)',
                  color: 'white',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '50px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}>
                  {stats.pendingReviews} mới
                </span>
              )}
            </div>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-charcoal)' }}>Đánh giá Phỏng vấn</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
              Xem video phỏng vấn của ứng viên, đánh giá kỹ năng chuyên môn và kỹ năng giao tiếp, gửi nhận xét chi tiết.
            </p>
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent)', fontSize: '0.85rem', fontWeight: 500 }}>
              Xem yêu cầu đánh giá <span>→</span>
            </div>
          </Link>

          {/* Schedule Management */}
          <Link to="/mentor/schedule" className="glass-card reveal is-visible reveal--delay-2" style={{ display: 'block', textDecoration: 'none', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1.25rem' }}>📅</div>
              {stats.upcomingSessions > 0 && (
                <span style={{
                  background: 'var(--color-moss)',
                  color: 'white',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '50px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}>
                  {stats.upcomingSessions} sắp tới
                </span>
              )}
            </div>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-charcoal)' }}>Quản lý Lịch hẹn</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
              Quản lý yêu cầu đặt lịch từ ứng viên, chấp nhận hoặc từ chối, tham gia phiên mentoring trực tuyến 1-on-1.
            </p>
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent)', fontSize: '0.85rem', fontWeight: 500 }}>
              Xem lịch hẹn <span>→</span>
            </div>
          </Link>

          {/* Profile Settings */}
          <Link to="/mentor/profile" className="glass-card reveal is-visible reveal--delay-3" style={{ display: 'block', textDecoration: 'none', cursor: 'pointer' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1.25rem' }}>⚙️</div>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-charcoal)' }}>Cài đặt Hồ sơ</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: '1.7' }}>
              Cập nhật thông tin cá nhân, chuyên môn, kinh nghiệm và ảnh đại diện để ứng viên tin tưởng hơn.
            </p>
            <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-accent)', fontSize: '0.85rem', fontWeight: 500 }}>
              Cài đặt hồ sơ <span>→</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MentorDashboard;
