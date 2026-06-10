import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Send, Play } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabaseClient';

const MentorPostBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    cover_image_url: '',
    video_url: '',
    tags: '',
  });

  const [saving, setSaving] = useState(false);
  const [loadingBlog, setLoadingBlog] = useState(false);

  // Fetch existing blog data when editing
  useEffect(() => {
    if (isEditing && id) {
      fetchBlog();
    }
  }, [id]);

  const fetchBlog = async () => {
    setLoadingBlog(true);
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching blog:', error.message);
      alert('Không tìm thấy bài viết này.');
      navigate('/mentor/blogs');
    } else if (data) {
      setFormData({
        title: data.title || '',
        content: data.content || '',
        category: data.category || '',
        cover_image_url: data.cover_image_url || '',
        video_url: data.video_url || '',
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || ''),
      });
    }
    setLoadingBlog(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault();
    if (!user?.id) {
      alert('Bạn cần đăng nhập để tạo bài viết.');
      return;
    }
    setSaving(true);

    const tagsArray = formData.tags
      .split(',')
      .map(s => s.trim())
      .filter(s => s !== '');

    // Build payload — only include columns that exist in the table
    const payload = {
      title: formData.title,
      content: formData.content,
      status: isDraft ? 'draft' : 'published',
      cover_image_url: formData.cover_image_url || null,
      tags: tagsArray,
    };

    // Try to include video_url if the column exists
    if (formData.video_url) {
      payload.video_url = formData.video_url;
    }

    try {
      if (isEditing) {
        // Update existing blog
        const { error } = await supabase
          .from('blogs')
          .update(payload)
          .eq('id', id);

        if (error) {
          // If video_url column doesn't exist, retry without it
          if (error.message?.includes('video_url') || error.message?.includes('column')) {
            delete payload.video_url;
            // Store video URL inside content instead
            if (formData.video_url) {
              payload.content = `[VIDEO: ${formData.video_url}]\n\n${formData.content}`;
            }
            const { error: retryError } = await supabase
              .from('blogs')
              .update(payload)
              .eq('id', id);
            if (retryError) {
              alert('Lỗi cập nhật bài viết: ' + retryError.message);
              setSaving(false);
              return;
            }
          } else {
            alert('Lỗi cập nhật bài viết: ' + error.message);
            setSaving(false);
            return;
          }
        }
      } else {
        // Insert new blog
        payload.author_id = user.id;

        const { error } = await supabase
          .from('blogs')
          .insert([payload]);

        if (error) {
          // If RLS or column error, try workarounds
          const errMsg = error.message || '';

          if (errMsg.includes('video_url') || errMsg.includes('column')) {
            // video_url column doesn't exist — embed in content
            delete payload.video_url;
            if (formData.video_url) {
              payload.content = `[VIDEO: ${formData.video_url}]\n\n${formData.content}`;
            }
            const { error: retryError } = await supabase
              .from('blogs')
              .insert([payload]);
            if (retryError) {
              alert('Lỗi tạo bài viết: ' + retryError.message + '\n\nNếu lỗi RLS, hãy chạy lệnh SQL trong Supabase SQL Editor:\nCREATE POLICY "Allow mentors to insert blogs" ON blogs FOR INSERT WITH CHECK (auth.uid() = author_id);');
              setSaving(false);
              return;
            }
          } else if (errMsg.includes('row-level security') || errMsg.includes('RLS')) {
            alert('Lỗi quyền truy cập (RLS)!\n\nVui lòng chạy lệnh SQL sau trong Supabase SQL Editor:\n\nCREATE POLICY "Allow authenticated users to insert blogs"\nON blogs FOR INSERT\nTO authenticated\nWITH CHECK (auth.uid() = author_id);\n\nCREATE POLICY "Allow authors to update own blogs"\nON blogs FOR UPDATE\nTO authenticated\nUSING (auth.uid() = author_id);');
            setSaving(false);
            return;
          } else {
            alert('Lỗi tạo bài viết: ' + errMsg);
            setSaving(false);
            return;
          }
        }
      }

      alert('Tạo bài viết thành công!');
      navigate('/mentor/blogs');
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi không xác định.');
    } finally {
      setSaving(false);
    }
  };

  // YouTube URL preview helper
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  if (loadingBlog) {
    return (
      <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
        <div className="container container--narrow" style={{ textAlign: 'center', paddingTop: '15vh' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(formData.video_url);

  return (
    <div className="section" style={{ background: 'var(--color-cream)', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container container--narrow">
        {/* Back Button */}
        <button
          onClick={() => navigate('/mentor/blogs')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-secondary)', fontSize: '0.9rem',
            marginBottom: 'var(--spacing-md)', transition: 'color 0.3s',
            fontFamily: 'var(--font-sans)',
          }}
          onMouseOver={e => e.currentTarget.style.color = 'var(--color-charcoal)'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
        >
          <ArrowLeft size={18} /> Quay lại danh sách blog
        </button>

        {/* Header */}
        <div className="reveal is-visible" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <span className="label">Mentor Portal</span>
          <h1 style={{ marginTop: 'var(--spacing-sm)' }}>
            {isEditing ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="glass-card reveal is-visible">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Title */}
            <div>
              <label style={labelStyle}>Tiêu đề bài viết <span style={{ color: 'var(--color-accent)' }}>*</span></label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Nhập tiêu đề bài viết..."
                required
              />
            </div>

            {/* Cover Image & Category Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Link ảnh bìa (Cover Image URL)</label>
                <input
                  type="url"
                  name="cover_image_url"
                  value={formData.cover_image_url}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label style={labelStyle}>Danh mục</label>
                <select name="category" value={formData.category} onChange={handleChange} style={inputStyle}>
                  <option value="">Chọn danh mục...</option>
                  <option value="interview-tips">Mẹo phỏng vấn</option>
                  <option value="tech-skills">Kỹ năng kỹ thuật</option>
                  <option value="career-advice">Tư vấn nghề nghiệp</option>
                  <option value="industry-trends">Xu hướng ngành</option>
                </select>
              </div>
            </div>

            {/* Video URL */}
            <div>
              <label style={labelStyle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Play size={16} color="#FF0000" /> Link Video YouTube (tùy chọn)
                </span>
              </label>
              <input
                type="url"
                name="video_url"
                value={formData.video_url}
                onChange={handleChange}
                style={inputStyle}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              {/* Video Preview */}
              {embedUrl && (
                <div style={{
                  marginTop: '0.75rem',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  aspectRatio: '16/9',
                  maxHeight: '280px',
                }}>
                  <iframe
                    width="100%"
                    height="100%"
                    src={embedUrl}
                    title="Video Preview"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ display: 'block' }}
                  />
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label style={labelStyle}>Thẻ (Tags) — Phân cách bằng dấu phẩy</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                style={inputStyle}
                placeholder="interview, tips, cv, frontend..."
              />
            </div>

            {/* Content */}
            <div>
              <label style={labelStyle}>
                Nội dung bài viết <span style={{ color: 'var(--color-accent)' }}>*</span>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: '250px', resize: 'vertical', lineHeight: '1.7' }}
                placeholder="Viết nội dung bài viết tại đây... (Hỗ trợ Markdown)"
                required
              />
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex', gap: '1rem', marginTop: '0.5rem',
              justifyContent: 'flex-end', flexWrap: 'wrap',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-color)'
            }}>
              <button
                type="button"
                onClick={() => navigate('/mentor/blogs')}
                className="btn btn--outline"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="btn btn--outline"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-warm-white)' }}
                disabled={saving}
              >
                <Save size={16} /> Lưu bản nháp
              </button>
              <button
                type="submit"
                className="btn btn--primary btn--pill"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                disabled={saving}
              >
                <Send size={16} /> {saving ? 'Đang xử lý...' : (isEditing ? 'Cập nhật & Xuất bản' : 'Xuất bản ngay')}
              </button>
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
  fontWeight: 500,
  color: 'var(--color-charcoal)',
  fontSize: '0.9rem',
  fontFamily: 'var(--font-sans)',
};

const inputStyle = {
  width: '100%',
  padding: '0.8rem 1rem',
  borderRadius: '10px',
  border: '1px solid var(--border-color)',
  background: 'rgba(255, 255, 255, 0.8)',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.95rem',
  color: 'var(--color-text)',
  transition: 'border-color 0.3s, box-shadow 0.3s',
  outline: 'none',
  boxSizing: 'border-box',
};

export default MentorPostBlog;
