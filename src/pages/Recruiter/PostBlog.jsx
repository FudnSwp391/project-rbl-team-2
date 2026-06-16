import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';

const PostBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: '',
    type: 'Article',
    content: '',
    videoUrl: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkCompanyStatus();
    if (isEditing) {
      fetchBlogDetails();
    }
  }, [id]);

  const checkCompanyStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from('companies').select('status').eq('recruiter_id', session.user.id).single();
      if (data?.status !== 'approved') {
        alert('Bạn chưa được duyệt để đăng bài!');
        navigate('/recruiter');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBlogDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (data) {
        setFormData({
          title: data.title || '',
          type: data.type || 'Article',
          content: data.content || '',
          videoUrl: data.video_url || ''
        });
      }
    } catch (err) {
      console.error('Error fetching blog details:', err);
      setError('Could not load blog details.');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e, status) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('You must be logged in to post a blog.');

      const authorId = session.user.id;

      const blogPayload = {
        author_id: authorId,
        title: formData.title,
        type: formData.type,
        content: formData.content,
        video_url: formData.type === 'Video' ? formData.videoUrl : null,
        status: status
      };

      if (isEditing) {
        const { error: updateError } = await supabase
          .from('blogs')
          .update(blogPayload)
          .eq('id', id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('blogs')
          .insert([blogPayload]);
        if (insertError) throw insertError;
      }

      navigate('/recruiter/blogs');
    } catch (err) {
      console.error('Error saving blog:', err);
      setError(err.message || 'An error occurred while saving the blog.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container container--narrow">
        <div className="reveal is-visible" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <span className="label">Recruiter Portal</span>
          <h1 style={{ marginTop: 'var(--spacing-sm)' }}>{isEditing ? 'Edit Blog' : 'Create New Blog'}</h1>
        </div>

        {error && (
          <div style={{ background: '#ffebee', color: '#c62828', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, 'published')} className="glass-card reveal is-visible">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div>
              <label style={labelStyle}>Blog Title</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                style={inputStyle} 
                placeholder="Catchy title..."
                required 
              />
            </div>

            <div>
              <label style={labelStyle}>Content Type</label>
              <select name="type" value={formData.type} onChange={handleChange} style={inputStyle}>
                <option value="Article">Article</option>
                <option value="Video">Video</option>
              </select>
            </div>

            {formData.type === 'Video' && (
              <div>
                <label style={labelStyle}>Video URL (YouTube/Vimeo)</label>
                <input 
                  type="url" 
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleChange}
                  style={inputStyle} 
                  placeholder="https://..."
                  required
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>{formData.type === 'Video' ? 'Video Description' : 'Article Content'}</label>
              <textarea 
                name="content"
                value={formData.content}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: '200px', resize: 'vertical' }} 
                placeholder="Write your content here..."
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => navigate('/recruiter/blogs')} className="btn btn--outline" disabled={loading}>Cancel</button>
              <button type="button" onClick={(e) => handleSubmit(e, 'draft')} className="btn btn--outline" style={{ background: 'var(--color-surface)' }} disabled={loading}>Save as Draft</button>
              <button type="submit" className="btn btn--primary btn--pill" disabled={loading}>{isEditing ? 'Update & Publish' : 'Publish Now'}</button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  fontWeight: '500',
  color: 'var(--color-charcoal)',
  fontSize: '0.9rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  background: 'rgba(255, 255, 255, 0.8)',
  fontFamily: 'var(--font-sans)',
  fontSize: '1rem',
  color: 'var(--color-text)',
  transition: 'border-color 0.3s'
};

export default PostBlog;
