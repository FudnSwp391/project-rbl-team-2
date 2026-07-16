import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { Trash2 } from 'lucide-react';
import { useConfirm } from '../../utils/ConfirmContext';

const BlogManagement = () => {
  const confirm = useConfirm();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in.');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('blogs')
        .select('*')
        .eq('author_id', session.user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setBlogs(data || []);
    } catch (err) {
      console.error('Error fetching blogs:', err);
      setError('Failed to load blogs.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (blogId) => {
    try {
      const { error } = await supabase
        .from('blogs')
        .update({ status: 'published' })
        .eq('id', blogId);
        
      if (error) throw error;
      fetchBlogs();
    } catch (err) {
      console.error('Error publishing blog:', err);
      alert('Failed to publish blog.');
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await new Promise(resolve => confirm({ 
      message: 'Bạn có chắc chắn muốn xóa bài viết này?', 
      isDanger: true, 
      onConfirm: () => resolve(true), 
      onCancel: () => resolve(false) 
    }));
    if (!isConfirmed) return;
    try {
      const { error } = await supabase.from('blogs').delete().eq('id', id);
      if (error) throw error;
      setBlogs(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error('Error deleting blog:', err);
      alert('Lỗi khi xóa bài viết: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container">
        
        <div style={{ marginBottom: '1.5rem' }}>
          <Link to="/recruiter" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            ← Về trang Dashboard
          </Link>
        </div>

        <div className="reveal is-visible" style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="label">Recruiter Portal</span>
            <h1 style={{ marginTop: 'var(--spacing-sm)' }}>Blog Management</h1>
            <p style={{ marginTop: '0.5rem' }}>Share interview tips, experiences, and company insights.</p>
          </div>
          <Link to="/recruiter/blogs/new" className="btn btn--primary btn--pill">
            + Create New Blog
          </Link>
        </div>

        {error && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>
        ) : (
          <div className="grid-auto">
            {blogs.map(blog => (
              <div key={blog.id} className="glass-card reveal is-visible" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em', 
                    fontWeight: '600',
                    color: blog.type === 'Video' ? 'var(--color-accent)' : 'var(--color-moss)',
                    background: 'rgba(255,255,255,0.7)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px'
                  }}>
                    {blog.type === 'Video' ? '🎥 Video' : '📄 Article'}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '50px',
                    background: blog.status === 'published' ? 'var(--color-moss-light)' : 'var(--color-stone)',
                    color: 'white',
                    textTransform: 'capitalize'
                  }}>
                    {blog.status}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', flex: 1 }}>{blog.title}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  <span>{formatDate(blog.created_at)}</span>
                  <span>{blog.views} views</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <Link to={`/recruiter/blogs/edit/${blog.id}`} className="btn btn--outline" style={{ flex: 1, padding: '0.5rem', textAlign: 'center', justifyContent: 'center' }}>Edit</Link>
                  {blog.status === 'draft' && (
                    <button onClick={() => handlePublish(blog.id)} className="btn btn--primary" style={{ flex: 1, padding: '0.5rem', justifyContent: 'center' }}>Publish</button>
                  )}
                  {blog.status === 'published' && (
                    <Link to={`/blog/${blog.id}`} className="btn btn--outline" style={{ flex: 1, padding: '0.5rem', justifyContent: 'center', textAlign: 'center' }}>View</Link>
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
                      justifyContent: 'center',
                      transition: 'all 0.3s'
                    }}
                    title="Xóa bài viết"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {blogs.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
                No blogs created yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogManagement;
