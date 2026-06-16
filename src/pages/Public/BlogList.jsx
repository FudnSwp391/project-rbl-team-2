import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../utils/AuthContext';
import { Play, FileText, User } from 'lucide-react';

const BlogList = () => {
  const { user, profile } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Try to fetch author profiles (may fail due to RLS — that's OK)
        const authorIds = [...new Set(data.map(b => b.author_id).filter(Boolean))];
        let authorMap = {};

        if (authorIds.length > 0) {
          try {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, full_name, role')
              .in('id', authorIds);
            
            (profiles || []).forEach(p => { authorMap[p.id] = p; });
          } catch (_) {
            // RLS blocks profile reads — we'll use fallbacks
          }
        }

        // Attach author info to each blog
        const enriched = data.map(blog => ({
          ...blog,
          _author: authorMap[blog.author_id] || null,
        }));

        setBlogs(enriched);
      } else {
        console.error('Error fetching blogs:', error);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const hasVideo = (blog) => {
    if (blog.video_url) return true;
    if (blog.content && blog.content.includes('[VIDEO:')) return true;
    return false;
  };

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: '100vh' }}>
      <div className="container">
        
        <div className="reveal is-visible" style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
          <span className="label" style={{ marginBottom: '1rem' }}>Resources & Insights</span>
          <h1 style={{ marginBottom: '1rem' }}>Interview & Career Blog</h1>
          <p style={{ maxWidth: '600px', margin: '0 auto' }}>Học hỏi kinh nghiệm từ các chuyên gia. Khám phá mẹo phỏng vấn, lời khuyên nghề nghiệp và các kiến thức chuyên sâu.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>
            Đang tải danh sách bài viết...
          </div>
        ) : blogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-secondary)' }}>
            <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <p>Chưa có bài viết nào được xuất bản.</p>
          </div>
        ) : (
          <div className="grid-auto">
            {blogs.map((blog, index) => {
              const isVideo = hasVideo(blog);
              // Use current user profile if they are the author, otherwise use fetched profile
              const isOwnBlog = user?.id === blog.author_id;
              const authorName = isOwnBlog
                ? (profile?.full_name || user?.user_metadata?.full_name || 'Bạn')
                : (blog._author?.full_name || 'Tác giả');
              const authorRole = isOwnBlog ? (profile?.role || 'user') : (blog._author?.role || 'mentor');
              const role = authorRole === 'mentor' ? 'Mentor' : (authorRole === 'admin' ? 'Admin' : 'Thành viên');
              
              // Tạo summary từ content
              let summary = blog.content.replace(/\[VIDEO:.*?\]/g, '').replace(/[#*`]/g, '').substring(0, 150);
              if (blog.content.length > 150) summary += '...';

              return (
                <Link 
                  to={`/blog/${blog.id}`} 
                  key={blog.id} 
                  className={`glass-card reveal is-visible reveal--delay-${(index % 4) + 1}`} 
                  style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', transition: 'transform 0.4s var(--ease-out-expo), box-shadow 0.4s var(--ease-out-expo)' }} 
                  onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }} 
                  onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                >
                  
                  {/* Ảnh bìa */}
                  {blog.cover_image_url && (
                    <div style={{
                      margin: '-1.5rem -1.5rem 1rem -1.5rem',
                      borderRadius: '16px 16px 0 0',
                      overflow: 'hidden',
                      height: '160px'
                    }}>
                      <img src={blog.cover_image_url} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.style.display = 'none'} />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <span style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      fontSize: '0.75rem', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em', 
                      fontWeight: '600',
                      color: isVideo ? '#CC0000' : 'var(--color-moss)',
                      background: isVideo ? 'rgba(255,0,0,0.08)' : 'rgba(107,127,92,0.1)',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '50px'
                    }}>
                      {isVideo ? <><Play size={12}/> Video</> : <><FileText size={12}/> Bài viết</>}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formatDate(blog.created_at)}</span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', lineHeight: '1.4', color: 'var(--color-charcoal)' }}>
                    {blog.title}
                  </h3>
                  
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', flex: 1, lineHeight: '1.6' }}>
                    {summary}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-surface-alt)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={16} />
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-charcoal)' }}>{authorName}</span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{role}</span>
                    </div>
                  </div>

                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogList;
