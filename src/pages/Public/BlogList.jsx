import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';
import { motion } from 'framer-motion';

const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80',
  'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80'
];

const CATEGORIES = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Bí kíp phỏng vấn', value: 'interview-tips' },
  { label: 'Kỹ năng kỹ thuật', value: 'tech-skills' },
  { label: 'Tư vấn nghề nghiệp', value: 'career-advice' },
  { label: 'Xu hướng ngành', value: 'industry-trends' },
  { label: 'Tuyển dụng', value: 'recruitment' },
];

const BlogList = () => {
  const location = useLocation();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(location.state?.category || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchBlogs() {
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
  }

  fetchBlogs();
}, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
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

  return (
    <motion.div 
      className="section" 
      style={{ background: 'var(--color-cream)', minHeight: '100vh', paddingTop: '120px' }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="container">
        
        <motion.div variants={itemVariants} style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ marginBottom: '1rem', background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.1), rgba(194, 65, 12, 0.1))', color: '#EA580C', padding: '0.5rem 1.25rem', borderRadius: '50px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', fontSize: '0.85rem' }}>
            Tài liệu & Góc nhìn
          </span>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-charcoal)', letterSpacing: '-1px', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
            Blog <span style={{ color: '#EA580C' }}>&</span> Kinh Nghiệm
          </h1>
          <p style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--color-text-secondary)', fontSize: '1.15rem', fontWeight: 500, lineHeight: 1.6, marginBottom: '2.5rem' }}>
            Khám phá những mẹo phỏng vấn, lời khuyên phát triển sự nghiệp và trải nghiệm thực tế từ các chuyên gia hàng đầu.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
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
                  padding: '1rem 1rem 1rem 3.5rem',
                  borderRadius: '50px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  outline: 'none',
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                  fontFamily: 'var(--font-sans)'
                }}
              />
            </div>

            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', paddingBottom: '0.5rem', width: '100%', justifyContent: 'flex-start', scrollbarWidth: 'none', padding: '0 0.5rem' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  style={{
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    padding: '0.6rem 1.25rem',
                    borderRadius: '50px',
                    border: selectedCategory === cat.value ? '1px solid #EA580C' : '1px solid rgba(0,0,0,0.06)',
                    background: selectedCategory === cat.value ? '#EA580C' : 'white',
                    color: selectedCategory === cat.value ? 'white' : 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    boxShadow: selectedCategory === cat.value ? '0 4px 10px rgba(234, 88, 12, 0.2)' : '0 2px 5px rgba(0,0,0,0.02)'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Blog Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Đang tải danh sách bài viết...</div>
        ) : filteredBlogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-secondary)' }}>
            Không tìm thấy bài viết nào phù hợp.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2.5rem' }}>
            {filteredBlogs.map((blog, index) => (
              <motion.div key={blog.id} variants={itemVariants}>
                <Link to={`/blog/${blog.id}`} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  textDecoration: 'none', 
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)', 
                  height: '100%', 
                  background: '#ffffff',
                  borderRadius: '16px', 
                  padding: '1.5rem', 
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '6px 6px 0px #e0e7ff',
                  position: 'relative'
                }} 
                onMouseOver={(e) => { 
                  e.currentTarget.style.transform = 'translate(-4px, -4px)'; 
                  e.currentTarget.style.boxShadow = '10px 10px 0px #e0e7ff'; 
                }} 
                onMouseOut={(e) => { 
                  e.currentTarget.style.transform = 'translate(0, 0)'; 
                  e.currentTarget.style.boxShadow = '6px 6px 0px #e0e7ff'; 
                }}>
                  
                  {/* Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em', 
                      fontWeight: '700',
                      color: 'var(--color-charcoal)',
                      background: '#ffffff',
                      border: '1px solid rgba(0,0,0,0.1)',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '50px'
                    }}>
                      {blog.type === 'Video' ? 'VIDEO' : 'BÀI VIẾT'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#EA580C', fontWeight: '700', textTransform: 'uppercase' }}>
                      {getCategoryLabel(blog.tags)}
                    </span>
                  </div>

                  {/* Cover Image */}
                  <div style={{ 
                    width: '100%', 
                    height: '200px', 
                    borderRadius: '12px', 
                    overflow: 'hidden',
                    marginBottom: '1.5rem'
                  }}>
                    <img 
                      src={blog.cover_image_url || (blog.type === 'Video' ? 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80' : COVER_IMAGES[index % COVER_IMAGES.length])} 
                      alt={blog.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Title */}
                  <h3 style={{ 
                    fontSize: '1.35rem', 
                    fontWeight: 800, 
                    lineHeight: '1.4', 
                    color: 'var(--color-charcoal)', 
                    fontFamily: 'var(--font-heading)',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    flex: 1
                  }}>
                    {blog.title}
                  </h3>

                  {/* Footer (Author & Date) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
                    <div style={{ 
                      width: '42px', 
                      height: '42px', 
                      borderRadius: '50%', 
                      background: 'linear-gradient(135deg, var(--color-accent-vivid), var(--color-accent))', 
                      color: 'white',
                      overflow: 'hidden',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)',
                      flexShrink: 0
                    }}>
                      {(blog.company ? blog.company : blog.authorName).charAt(0).toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-charcoal)' }}>
                        {blog.company ? blog.company : blog.authorName}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#a0aec0', fontWeight: 500, marginTop: '2px' }}>
                        {blog.date}
                      </span>
                    </div>
                  </div>

                </Link>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default BlogList;
