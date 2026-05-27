import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const PostBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: isEditing ? 'How to ace a technical interview at TechCorp' : '',
    type: isEditing ? 'Article' : 'Article',
    content: isEditing ? 'Here are some tips for interviewing...' : '',
    videoUrl: isEditing ? '' : ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTimeout(() => {
      navigate('/recruiter/blogs');
    }, 500);
  };

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container container--narrow">
        <div className="reveal is-visible" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <span className="label">Recruiter Portal</span>
          <h1 style={{ marginTop: 'var(--spacing-sm)' }}>{isEditing ? 'Edit Blog' : 'Create New Blog'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="glass-card reveal is-visible">
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
                <option>Article</option>
                <option>Video</option>
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
              <button type="button" onClick={() => navigate('/recruiter/blogs')} className="btn btn--outline">Cancel</button>
              <button type="button" className="btn btn--outline" style={{ background: 'var(--color-surface)' }}>Save as Draft</button>
              <button type="submit" className="btn btn--primary btn--pill">{isEditing ? 'Update & Publish' : 'Publish Now'}</button>
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
