import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import { Play, FileText, User, ExternalLink, Calendar } from 'lucide-react';

const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

const extractVideoFromContent = (content) => {
  if (!content) return null;
  const match = content.match(/\[VIDEO:\s*(https?:\/\/[^\]]+)\]/);
  return match ? match[1] : null;
};

const BlogPost = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [blog, setBlog] = useState(null);
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState('user');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (id) fetchBlog();
  }, [id]);

  // Resolve author name AFTER blog is loaded and user context is available
  useEffect(() => {
    if (!blog) return;

    const resolveAuthor = async () => {
      // Priority 1: Check if author represents an approved company
      try {
        const { data: companyData } = await supabase
          .from('companies')
          .select('company_name')
          .eq('recruiter_id', blog.author_id)
          .eq('status', 'approved')
          .maybeSingle();

        if (companyData?.company_name) {
          setAuthorName(companyData.company_name);
          setAuthorRole('company');
          return;
        }
      } catch (e) {
        // Ignore
      }

      // Priority 2: If the current logged-in user IS the author, use their profile
      if (user?.id === blog.author_id && profile?.full_name) {
        setAuthorName(profile.full_name);
        setAuthorRole(profile.role || 'user');
        return;
      }

      // Priority 3: Try to fetch the author's profile directly (may fail due to RLS)
      try {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', blog.author_id)
          .maybeSingle(); 

        if (data?.full_name) {
          setAuthorName(data.full_name);
          setAuthorRole(data.role || 'user');
          return;
        }
      } catch (e) {
        // Silently handle RLS errors
      }

      // Priority 4: Use current user's metadata if they are the author
      if (user?.id === blog.author_id) {
        setAuthorName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Tác giả');
        setAuthorRole(profile?.role || 'mentor');
        return;
      }

      // Fallback
      setAuthorName('Tác giả');
      setAuthorRole('mentor');
    };

    resolveAuthor();
  }, [blog, user, profile]);

  const fetchBlog = async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching blog:', error);
        setFetchError(error.message);
      } else if (data) {
        setBlog(data);

        // Increment views silently
        try {
          await supabase.rpc('increment_blog_views', { blog_id: id });
        } catch (_) {
          // RPC may not exist — that's fine
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setFetchError('Đã xảy ra lỗi khi tải bài viết.');
    } finally {
      // ALWAYS stop loading — this fixes the "Đang tải..." forever bug
      setLoading(false);
    }
  };

  // Logic cộng điểm cho người đọc blog
  useEffect(() => {
    if (!user || !blog) return;
    
    // Bỏ qua logic thử thách nếu là tài khoản đặc quyền
    if (['admin', 'company', 'recruiter', 'mentor'].includes(profile?.role?.toLowerCase())) {
      return;
    }
    
    const timer = setTimeout(() => {
      try {
        const storageKey = `ita_user_data_${user.id}`;
        let savedData = JSON.parse(localStorage.getItem(storageKey)) || { points: 0, completedChallenges: [] };
        
        const today = new Date().toLocaleDateString('vi-VN');
        
        if (savedData.challengesDate !== today) {
          savedData.challengesDate = today;
          savedData.completedChallenges = [];
        }
        
        if (!savedData.completedChallenges.includes('blog')) {
          savedData.completedChallenges.push('blog');
          savedData.points = (savedData.points || 0) + 5;
          localStorage.setItem(storageKey, JSON.stringify(savedData));
          
          supabase.from('profiles').update({
            points: savedData.points
          }).eq('id', user.id).then(({error}) => {
            if (!error) {
              supabase.from('notifications').insert([{
                user_id: user.id,
                title: 'Thử thách hoàn thành!',
                content: 'Bạn đã hoàn thành thử thách "Đọc blog" hôm nay và nhận được 5 điểm thưởng.',
                type: 'success',
                action_link: '/challenge/questions'
              }]).then();
            }
          });
        }
      } catch (e) {
        // localStorage might fail
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [user, blog]);

  if (loading) {
    return (
      <div className="section" style={{ background: 'var(--color-cream)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Đang tải bài viết...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="section" style={{ background: 'var(--color-cream)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <h2>Không tìm thấy bài viết</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
          {fetchError || 'Bài viết có thể đã bị xóa hoặc chưa được xuất bản.'}
        </p>
        <Link to="/blogs" className="btn btn--primary btn--pill">Quay lại danh sách</Link>
      </div>
    );
  }

  const rawVideoUrl = blog.video_url || extractVideoFromContent(blog.content);
  const embedUrl = getYouTubeEmbedUrl(rawVideoUrl);
  const isVideo = !!rawVideoUrl;
  
  // Clean content from the [VIDEO: ...] tag if it's there
  let cleanContent = (blog.content || '').replace(/\[VIDEO:\s*(https?:\/\/[^\]]+)\]/, '');

  // Format date
  const formattedDate = blog.created_at 
    ? new Date(blog.created_at).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  
  const roleLabel = authorRole === 'company' ? 'Doanh nghiệp' : (authorRole === 'mentor' ? 'Mentor' : (authorRole === 'admin' ? 'Admin' : 'Thành viên'));

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: '100vh' }}>
      <div className="container container--narrow">
        
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/blogs" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            ← Quay lại danh sách Blog
          </Link>
        </div>

        <article className="glass-card reveal is-visible" style={{ padding: '0', overflow: 'hidden' }}>
          
          {/* Header Section */}
          <div style={{ padding: '4rem 3rem 3rem', background: 'var(--color-warm-white)', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
            <div className="foliage-shadow" style={{ opacity: 0.5 }}></div>
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
              <span style={{ 
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                fontSize: '0.75rem', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                fontWeight: '600',
                color: isVideo ? '#CC0000' : 'var(--color-moss)',
                background: isVideo ? 'rgba(255,0,0,0.05)' : 'rgba(107,127,92,0.1)',
                padding: '0.4rem 1rem',
                borderRadius: '50px',
                marginBottom: '1.5rem',
                border: isVideo ? '1px solid rgba(255,0,0,0.1)' : '1px solid var(--border-color)'
              }}>
                {isVideo ? <><Play size={14}/> Video</> : <><FileText size={14}/> Bài viết</>}
              </span>
              
              <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', marginBottom: '2rem', lineHeight: '1.3', color: 'var(--color-charcoal)' }}>
                {blog.title}
              </h1>
              
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-charcoal)', fontWeight: '500' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-surface-alt)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    {authorRole === 'company' ? '🏢' : <User size={14} />}
                  </div>
                  {authorName || 'Tác giả'}
                </div>
                <span style={{ opacity: 0.5 }}>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                   {roleLabel}
                </span>
                <span style={{ opacity: 0.5 }}>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={14} /> {formattedDate}
                </span>
              </div>
            </div>
          </div>

          <div style={{ padding: '3rem', fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--color-text)' }}>
            
            {/* Cover Image */}
            {!isVideo && blog.cover_image_url && (
              <div style={{ marginBottom: '3rem', borderRadius: '16px', overflow: 'hidden' }}>
                 <img src={blog.cover_image_url} alt={blog.title} style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'cover' }} />
              </div>
            )}

            {/* Video Player */}
            {isVideo && (
              <div style={{ marginBottom: '3rem' }}>
                {embedUrl ? (
                  <div style={{ borderRadius: '16px', overflow: 'hidden', aspectRatio: '16/9', background: '#000', border: '1px solid var(--border-color)' }}>
                    <iframe
                      width="100%"
                      height="100%"
                      src={embedUrl}
                      title={blog.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ display: 'block' }}
                    />
                  </div>
                ) : (
                  <div style={{ padding: '2rem', background: 'rgba(255,0,0,0.05)', borderRadius: '16px', textAlign: 'center', border: '1px dashed rgba(255,0,0,0.2)' }}>
                    <Play size={40} color="#CC0000" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--color-charcoal)', fontWeight: 500, marginBottom: '0.5rem' }}>Video đính kèm</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>Định dạng link không hỗ trợ xem trực tiếp trên trang.</p>
                  </div>
                )}
                
                {/* Fallback YouTube Watch Button */}
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <a 
                    href={rawVideoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.6rem 1.2rem',
                      background: 'rgba(255,0,0,0.08)',
                      color: '#CC0000',
                      borderRadius: '50px',
                      textDecoration: 'none',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      transition: 'all 0.3s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,0,0,0.15)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,0,0,0.08)'}
                  >
                    Xem trên YouTube <ExternalLink size={14} />
                  </a>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                    (Nhấp vào đây nếu video phía trên báo lỗi "Video unavailable")
                  </p>
                </div>
              </div>
            )}

            {/* Content Body */}
            <div 
              className="blog-content" 
              style={{
                fontFamily: 'var(--font-sans)',
              }}
              dangerouslySetInnerHTML={{ 
              __html: cleanContent.replace(/\n/g, '<br/>').replace(/### (.*?)(?:<br\/>|$)/g, '<h3 style="margin-top: 2.5rem; margin-bottom: 1rem; font-family: var(--font-serif); font-size: 1.5rem; color: var(--color-charcoal);">$1</h3>') 
            }} />

            {/* Tags */}
            {blog.tags && Array.isArray(blog.tags) && blog.tags.length > 0 && (
              <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginRight: '0.5rem', display: 'flex', alignItems: 'center' }}>Thẻ:</span>
                {blog.tags.map((tag, idx) => (
                  <span key={idx} style={{ 
                    padding: '0.3rem 0.8rem', 
                    background: 'var(--color-surface-alt)', 
                    borderRadius: '8px', 
                    fontSize: '0.85rem', 
                    color: 'var(--color-text-secondary)' 
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

          </div>
        </article>

      </div>
    </div>
  );
};

export default BlogPost;
