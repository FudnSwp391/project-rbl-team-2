import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabaseClient';

const MentorBlogManagement = () => {
  const { user } = useAuth();
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
        .eq('author_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase blogs fetch error, using mock data:', error.message);
        setBlogs(mockBlogs);
      } else {
        setBlogs(data && data.length > 0 ? data : mockBlogs);
      }
    } catch {
      setBlogs(mockBlogs);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    setBlogs(prev => prev.filter(b => b.id !== id));
  };

  const handlePublish = async (id) => {
    setBlogs(prev => prev.map(b => b.id === id ? { ...b, status: 'Published' } : b));
  };

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container">
        {/* Header */}
        <div className="reveal is-visible" style={{
          marginBottom: 'var(--spacing-xl)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <span className="label">Mentor Portal</span>
            <h1 style={{ marginTop: 'var(--spacing-sm)' }}>Quản lý Blog</h1>
            <p style={{ marginTop: '0.5rem' }}>Tạo và chia sẻ bài viết, kinh nghiệm phỏng vấn cho ứng viên.</p>
          </div>
          <Link to="/mentor/blogs/new" className="btn btn--primary btn--pill" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Tạo bài viết mới
          </Link>
        </div>

        {/* Blog Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            Đang tải bài viết...
          </div>
        ) : (
          <div className="grid-auto">
            {blogs.map((blog, idx) => (
              <div key={blog.id} className={`glass-card reveal is-visible ${idx > 0 ? `reveal--delay-${Math.min(idx, 3)}` : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Type & Status Tags */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 600,
                    color: blog.type === 'Video' ? 'var(--color-accent)' : 'var(--color-moss)',
                    background: blog.type === 'Video' ? 'rgba(196, 149, 106, 0.1)' : 'rgba(107, 127, 92, 0.1)',
                    padding: '0.25rem 0.7rem',
                    borderRadius: '50px'
                  }}>
                    {blog.type === 'Video' ? '🎥 Video' : '📄 Bài viết'}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.7rem',
                    borderRadius: '50px',
                    fontWeight: 500,
                    background: blog.status === 'Published' ? 'rgba(107, 127, 92, 0.15)' : 'rgba(155, 147, 133, 0.15)',
                    color: blog.status === 'Published' ? 'var(--color-moss)' : 'var(--color-stone)'
                  }}>
                    {blog.status === 'Published' ? '✓ Đã xuất bản' : '◷ Bản nháp'}
                  </span>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', flex: 1, color: 'var(--color-charcoal)' }}>
                  {blog.title}
                </h3>

                {/* Meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  <span>{blog.date || 'Vừa tạo'}</span>
                  <span>{blog.views || 0} lượt xem</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <Link
                    to={`/mentor/blogs/edit/${blog.id}`}
                    className="btn btn--outline"
                    style={{ flex: 1, padding: '0.5rem', textAlign: 'center', justifyContent: 'center', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Edit2 size={14} /> Chỉnh sửa
                  </Link>
                  {blog.status === 'Draft' && (
                    <button
                      onClick={() => handlePublish(blog.id)}
                      className="btn btn--primary"
                      style={{ flex: 1, padding: '0.5rem', justifyContent: 'center', fontSize: '0.85rem' }}
                    >
                      Xuất bản
                    </button>
                  )}
                  {blog.status === 'Published' && (
                    <Link
                      to={`/blog/${blog.id}`}
                      className="btn btn--outline"
                      style={{ flex: 1, padding: '0.5rem', textAlign: 'center', justifyContent: 'center', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Eye size={14} /> Xem
                    </Link>
                  )}
                  <button
                    onClick={() => handleDelete(blog.id)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      border: '1px solid rgba(192, 57, 43, 0.2)',
                      background: 'rgba(192, 57, 43, 0.05)',
                      borderRadius: '50px',
                      cursor: 'pointer',
                      color: '#c0392b',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'all 0.3s'
                    }}
                    title="Xóa bài viết"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            {blogs.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Bạn chưa có bài viết nào.</p>
                <Link to="/mentor/blogs/new" className="btn btn--primary btn--pill">
                  <Plus size={18} /> Tạo bài viết đầu tiên
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Mock data for demo
const mockBlogs = [
  { id: 1, title: 'Hướng dẫn trả lời câu hỏi phỏng vấn hành vi (Behavioral Interview)', type: 'Article', views: 1520, status: 'Published', date: '3 ngày trước' },
  { id: 2, title: '5 lỗi phổ biến khi phỏng vấn kỹ thuật — Video hướng dẫn', type: 'Video', views: 987, status: 'Published', date: '1 tuần trước' },
  { id: 3, title: 'Cách chuẩn bị cho phỏng vấn System Design', type: 'Article', views: 0, status: 'Draft', date: '2 ngày trước' },
];

export default MentorBlogManagement;
