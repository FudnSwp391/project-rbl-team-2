import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const mockBlogs = [
  { id: 1, title: 'How to ace a technical interview at TechCorp', type: 'Article', views: 1205, status: 'Published', date: '3 days ago' },
  { id: 2, title: 'Inside our engineering culture', type: 'Video', views: 856, status: 'Draft', date: '1 week ago' },
];

const BlogManagement = () => {
  const [blogs, setBlogs] = useState(mockBlogs);

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container">
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
                  background: blog.status === 'Published' ? 'var(--color-moss-light)' : 'var(--color-stone)',
                  color: 'white'
                }}>
                  {blog.status}
                </span>
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', flex: 1 }}>{blog.title}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                <span>{blog.date}</span>
                <span>{blog.views} views</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <Link to={`/recruiter/blogs/edit/${blog.id}`} className="btn btn--outline" style={{ flex: 1, padding: '0.5rem', textAlign: 'center', justifyContent: 'center' }}>Edit</Link>
                {blog.status === 'Draft' && (
                  <button className="btn btn--primary" style={{ flex: 1, padding: '0.5rem', justifyContent: 'center' }}>Publish</button>
                )}
                {blog.status === 'Published' && (
                  <Link to={`/blog/${blog.id}`} className="btn btn--outline" style={{ flex: 1, padding: '0.5rem', justifyContent: 'center' }}>View</Link>
                )}
              </div>
            </div>
          ))}
          {blogs.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
              No blogs created yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogManagement;
