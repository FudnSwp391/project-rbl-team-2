import React from 'react';
import { Link } from 'react-router-dom';

const mockBlogs = [
  { id: 1, title: 'How to ace a technical interview at TechCorp', company: 'TechCorp Solutions', type: 'Article', date: '3 days ago', summary: 'Discover the insider tips and tricks to succeed in our technical interview process, direct from our engineering managers.' },
  { id: 2, title: 'Inside our engineering culture', company: 'TechCorp Solutions', type: 'Video', date: '1 week ago', summary: 'A sneak peek into how our product teams collaborate, ship fast, and learn continuously.' },
  { id: 3, title: '5 Resume mistakes to avoid', company: 'Global Innovations', type: 'Article', date: '2 weeks ago', summary: 'We analyze thousands of resumes every month. Here are the top 5 mistakes that will get your CV rejected immediately.' }
];

const BlogList = () => {
  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: '100vh' }}>
      <div className="container">
        
        <div className="reveal is-visible" style={{ textAlign: 'center', marginBottom: 'var(--spacing-2xl)' }}>
          <span className="label" style={{ marginBottom: '1rem' }}>Resources & Insights</span>
          <h1 style={{ marginBottom: '1rem' }}>Interview & Career Blog</h1>
          <p style={{ maxWidth: '600px', margin: '0 auto' }}>Learn from top companies. Discover interview tips, career advice, and get an inside look at company cultures.</p>
        </div>

        <div className="grid-auto">
          {mockBlogs.map((blog, index) => (
            <Link to={`/blog/${blog.id}`} key={blog.id} className={`glass-card reveal is-visible reveal--delay-${(index % 4) + 1}`} style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', transition: 'transform 0.4s var(--ease-out-expo), box-shadow 0.4s var(--ease-out-expo)' }} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em', 
                  fontWeight: '600',
                  color: blog.type === 'Video' ? 'var(--color-accent)' : 'var(--color-moss)',
                  background: 'rgba(255,255,255,0.7)',
                  padding: '0.3rem 0.8rem',
                  borderRadius: '50px'
                }}>
                  {blog.type === 'Video' ? '🎥 Video' : '📄 Article'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{blog.date}</span>
              </div>

              <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem', lineHeight: '1.3', color: 'var(--color-charcoal)' }}>
                {blog.title}
              </h3>
              
              <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', flex: 1 }}>
                {blog.summary}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                  🏢
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-charcoal)' }}>{blog.company}</span>
              </div>

            </Link>
          ))}
        </div>

      </div>
    </div>
  );
};

export default BlogList;
