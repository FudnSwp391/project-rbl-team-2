import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

const CATEGORIES = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Bí kíp phỏng vấn', value: 'interview-tips' },
  { label: 'Kỹ năng kỹ thuật', value: 'tech-skills' },
  { label: 'Tư vấn nghề nghiệp', value: 'career-advice' },
  { label: 'Xu hướng ngành', value: 'industry-trends' },
  { label: 'Tuyển dụng', value: 'recruitment' },
];

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const location = useLocation();

  useEffect(() => {
    fetchBlogs();
  }, []);

  useEffect(() => {
    if (location.state?.category) {
      setSelectedCategory(location.state.category);
    }
  }, [location.state]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blogs')
        .select(`
          id,
          title,
          created_at,
          content,
          cover_image_url,
          tags,
          profiles!blogs_author_id_fkey (
            full_name,
            companies (company_name, status)
          )
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedBlogs = (data || []).map(blog => {
        const isVideo = blog.content && blog.content.includes('[VIDEO:');
        
        let companyName = null;
        if (blog.profiles?.companies) {
          const comps = Array.isArray(blog.profiles.companies) ? blog.profiles.companies : [blog.profiles.companies];
          const approvedComp = comps.find(c => c.status === 'approved');
          if (approvedComp) {
            companyName = approvedComp.company_name;
          }
        }

        return {
          id: blog.id,
          title: blog.title,
          type: isVideo ? 'Video' : 'Article',
          date: new Date(blog.created_at).toLocaleDateString('vi-VN'),
          summary: blog.content 
            ? blog.content.replace(/\[VIDEO:.*?\]/g, '').replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').substring(0, 150) + '...' 
            : '',
          authorName: blog.profiles?.full_name || 'Tác giả',
          company: companyName,
          cover_image_url: blog.cover_image_url,
          tags: blog.tags || [],
        };
      });
      
      setBlogs(formattedBlogs);
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) || blog.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || blog.tags.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (tags) => {
    if (!tags || !tags.length) return 'BÀI VIẾT TỔNG HỢP';
    const cat = CATEGORIES.find(c => tags.includes(c.value));
    return cat ? cat.label.toUpperCase() : 'BÀI VIẾT';
  };

  const getCustomTags = (tags) => {
    if (!tags || !tags.length) return [];
    const categoryValues = CATEGORIES.map(c => c.value);
    return tags.filter(tag => !categoryValues.includes(tag));
  };

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: '100vh', padding: '6rem 0 4rem' }}>
      <div className="container">
        
        {/* Banner with categories and search */}
        <div style={{ 
          background: 'white', 
          borderRadius: '24px', 
          padding: '3.5rem 3rem', 
          marginBottom: '3rem',
          boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
        }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#1A202C', fontFamily: 'var(--font-serif)', fontWeight: 'bold' }}>
            Blog phát triển sự nghiệp & kỹ năng ứng tuyển
          </h1>
          <p style={{ color: '#4A5568', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
            Cập nhật kiến thức thực tiễn về phỏng vấn, CV, kỹ năng ứng tuyển và xu hướng nghề nghiệp cùng AI.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Search Bar */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
              <Search size={18} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Tìm bài viết..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem 0.8rem 2.8rem',
                  borderRadius: '50px',
                  border: '1px solid #E2E8F0',
                  outline: 'none',
                  fontSize: '0.95rem',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                }}
              />
            </div>

            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '50px',
                    border: selectedCategory === cat.value ? '1px solid #3182CE' : '1px solid #E2E8F0',
                    background: selectedCategory === cat.value ? '#3182CE' : 'transparent',
                    color: selectedCategory === cat.value ? 'white' : '#4A5568',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    boxShadow: selectedCategory === cat.value ? '0 4px 10px rgba(49, 130, 206, 0.2)' : 'none'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Blog Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Đang tải danh sách bài viết...</div>
        ) : filteredBlogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            Không tìm thấy bài viết nào phù hợp.
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '2rem' 
          }}>
            {filteredBlogs.map((blog, index) => (
              <Link to={`/blog/${blog.id}`} key={blog.id} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                textDecoration: 'none', 
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'transform 0.3s, box-shadow 0.3s',
                border: '1px solid #F1F5F9',
                boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
              }} 
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.08)'; }} 
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)'; }}>
                
                {/* Cover Image */}
                <div style={{ width: '100%', height: '220px', backgroundColor: '#EDF2F7', position: 'relative' }}>
                  {blog.cover_image_url ? (
                    <img src={blog.cover_image_url} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A0AEC0', fontSize: '3rem' }}>
                      {blog.type === 'Video' ? '🎥' : '📄'}
                    </div>
                  )}
                  {blog.type === 'Video' && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(229, 62, 62, 0.9)', color: 'white', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      VIDEO
                    </div>
                  )}
                </div>

                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Category */}
                  <div style={{ fontSize: '0.8rem', color: '#805AD5', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.5px' }}>
                    {getCategoryLabel(blog.tags)}
                  </div>
                  
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', lineHeight: '1.4', color: '#1A202C', fontWeight: '700' }}>
                    {blog.title}
                  </h3>
                  
                  <div style={{ fontSize: '0.85rem', color: '#718096', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontWeight: '500' }}>Tác giả: {blog.company ? blog.company : blog.authorName}</span>
                    <span>•</span>
                    <span>{blog.date}</span>
                  </div>

                  {/* Render Custom Tags */}
                  {(() => {
                    const customTags = getCustomTags(blog.tags);
                    if (customTags.length > 0) {
                      return (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                          {customTags.map((tag, idx) => (
                            <span key={idx} style={{
                              padding: '0.2rem 0.6rem',
                              background: '#F1F5F9',
                              color: '#64748B',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <p style={{ fontSize: '0.95rem', color: '#4A5568', marginBottom: '1.5rem', lineHeight: '1.6', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {blog.summary}
                  </p>

                  <div style={{ fontSize: '0.9rem', color: '#805AD5', fontWeight: '600', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    Đọc chi tiết <span style={{ fontSize: '1.2rem' }}>→</span>
                  </div>
                </div>

              </Link>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default BlogList;
