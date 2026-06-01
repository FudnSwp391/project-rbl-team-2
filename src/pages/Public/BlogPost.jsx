import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabaseClient';

const mockBlog = {
  id: 1,
  title: 'How to ace a technical interview at TechCorp',
  company: 'TechCorp Solutions',
  companyId: 1,
  type: 'Article',
  date: '3 days ago',
  author: 'Jane Doe, VP of Engineering',
  content: `Interviewing can be daunting, but at TechCorp, we want you to succeed. Our interview process is designed to evaluate your problem-solving skills, architectural thinking, and how well you collaborate with others.

Here are our top tips for a successful interview with us:

### 1. Understand the "Why"
We care less about whether you memorize every sorting algorithm, and more about whether you understand the trade-offs of different approaches. When presented with a problem, take a step back and explain your thought process. Why did you choose a hash map over an array? Why did you structure your components this way?

### 2. Communicate Continuously
The worst thing you can do in a technical interview is stay silent for 20 minutes while you write code. Talk to your interviewer. If you're stuck, tell them what you're thinking. They are there to guide you, not trick you.

### 3. Ask Questions
An interview is a two-way street. We want to know that you're curious about our business, our tech stack, and our engineering culture. Ask us hard questions!

### 4. Practice System Design (for Senior Roles)
If you're interviewing for a senior or staff position, expect a system design round. We want to see how you think about scale, database choices, caching layers, and potential bottlenecks.

Remember, we are looking for teammates, not just coders. Good luck!`,
  videoUrl: null
};

const BlogPost = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const blog = mockBlog; // Real app: fetch by id

  useEffect(() => {
    if (!user) return;
    
    // Tôi đã thiết lập 5 giây thay vì 5 phút để bạn có thể test ngay lập tức mà không phải chờ đợi.
    const timer = setTimeout(() => {
      const storageKey = `ita_user_data_${user.id}`;
      let savedData = JSON.parse(localStorage.getItem(storageKey));
      
      if (savedData) {
        const today = new Date().toLocaleDateString('vi-VN');
        
        if (savedData.challengesDate !== today) {
          savedData.challengesDate = today;
          savedData.completedChallenges = [];
        }
        
        if (!savedData.completedChallenges.includes('blog')) {
          savedData.completedChallenges.push('blog');
          savedData.points += 5;
          localStorage.setItem(storageKey, JSON.stringify(savedData));
          
          // Sync to Supabase
          supabase.from('profiles').update({
            points: savedData.points
          }).eq('id', user.id).then(({error}) => {
            if (!error) {
              alert('🎉 Chúc mừng! Bạn đã hoàn thành thử thách "Đọc blog" và nhận được 5 điểm!');
            }
          });
        }
      }
    }, 5000); // 5 seconds for testing

    return () => clearTimeout(timer);
  }, [user]);

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: '100vh' }}>
      <div className="container container--narrow">
        
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/blogs" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ← Back to All Blogs
          </Link>
        </div>

        <article className="glass-card reveal is-visible" style={{ padding: '0', overflow: 'hidden' }}>
          
          <div style={{ padding: '4rem 3rem 3rem', background: 'var(--color-warm-white)', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
            <div className="foliage-shadow" style={{ opacity: 0.5 }}></div>
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
              <span style={{ 
                display: 'inline-block',
                fontSize: '0.75rem', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                fontWeight: '600',
                color: blog.type === 'Video' ? 'var(--color-accent)' : 'var(--color-moss)',
                background: 'rgba(255,255,255,0.7)',
                padding: '0.4rem 1rem',
                borderRadius: '50px',
                marginBottom: '1.5rem',
                border: '1px solid var(--border-color)'
              }}>
                {blog.type === 'Video' ? '🎥 Video' : '📄 Article'}
              </span>
              
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '1.5rem', lineHeight: '1.2' }}>{blog.title}</h1>
              
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
                <Link to={`/company/${blog.companyId}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-charcoal)', fontWeight: '500', textDecoration: 'none' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-surface-alt)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>🏢</span>
                  {blog.company}
                </Link>
                <span>•</span>
                <span>{blog.author}</span>
                <span>•</span>
                <span>{blog.date}</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '3rem', fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--color-text)' }}>
            
            {blog.type === 'Video' && blog.videoUrl && (
              <div style={{ marginBottom: '3rem', borderRadius: '12px', overflow: 'hidden', aspectRatio: '16/9', background: '#000' }}>
                {/* Normally an iframe here, just simulating for mock */}
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.2rem' }}>
                  [Video Player Placeholder: {blog.videoUrl}]
                </div>
              </div>
            )}

            <div className="blog-content" dangerouslySetInnerHTML={{ 
              __html: blog.content.replace(/\n\n/g, '<br/><br/>').replace(/### (.*?)\n/g, '<h3 style="margin-top: 2rem; margin-bottom: 1rem; font-family: var(--font-serif); font-size: 1.5rem; color: var(--color-charcoal);">$1</h3>') 
            }} />

          </div>

        </article>

      </div>
    </div>
  );
};

export default BlogPost;
