import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Send } from 'lucide-react';

const MentorPostBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: isEditing ? 'Hướng dẫn trả lời câu hỏi phỏng vấn hành vi' : '',
    type: isEditing ? 'Article' : 'Article',
    content: isEditing ? 'Phỏng vấn hành vi (Behavioral Interview) là một phương pháp phỏng vấn dựa trên các tình huống thực tế mà ứng viên đã trải qua...' : '',
    videoUrl: '',
    category: isEditing ? 'interview-tips' : '',
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e, isDraft = false) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      navigate('/mentor/blogs');
    }, 800);
  };

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

            {/* Type & Category Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Loại nội dung</label>
                <select name="type" value={formData.type} onChange={handleChange} style={inputStyle}>
                  <option value="Article">📄 Bài viết</option>
                  <option value="Video">🎥 Video</option>
                </select>
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
            {formData.type === 'Video' && (
              <div>
                <label style={labelStyle}>URL Video (YouTube / Vimeo)</label>
                <input
                  type="url"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
              </div>
            )}

            {/* Content */}
            <div>
              <label style={labelStyle}>
                {formData.type === 'Video' ? 'Mô tả video' : 'Nội dung bài viết'} <span style={{ color: 'var(--color-accent)' }}>*</span>
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
