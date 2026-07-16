import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../utils/supabaseClient';
import { Edit2, Trash2, Plus, X, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../utils/AuthContext';
import { useConfirm } from '../../utils/ConfirmContext';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};

const BlogsView = () => {
  const confirm = useConfirm();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isEditing) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isEditing]);

  const [currentItem, setCurrentItem] = useState(null);
  const [tagsInput, setTagsInput] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blogs')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });
      
    if (error) console.error('Error fetching blogs:', error);
    else setItems(data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const isConfirmed = await new Promise(resolve => confirm({ message: 'Bạn có chắc chắn muốn xóa bài viết này?', isDanger: true, onConfirm: () => resolve(true), onCancel: () => resolve(false) }));
    if (isConfirmed) {
      const { data, error } = await supabase.from('blogs').delete().eq('id', id).select();
      if (error) {
        toast.error('Lỗi khi xóa: ' + error.message);
      } else if (!data || data.length === 0) {
        toast.error('Không thể xóa bài viết. Bạn không có quyền hoặc bài đã bị xóa.');
      } else {
        toast.success('Xóa bài viết thành công');
        setItems(items.filter(item => item.id !== id));
      }
    }
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setTagsInput(item.tags ? (Array.isArray(item.tags) ? item.tags.join(', ') : item.tags) : '');
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    let tagsArray = tagsInput.split(',').map(s => s.trim()).filter(s => s !== '');

    const payload = { 
      title: currentItem.title, 
      content: currentItem.content,
      status: currentItem.status,
      cover_image_url: currentItem.cover_image_url,
      tags: tagsArray
    };

    if (currentItem.id) {
      const { error } = await supabase.from('blogs').update(payload).eq('id', currentItem.id);
      if (error) return toast.error('Lỗi cập nhật: ' + error.message);
      toast.success('Cập nhật bài viết thành công');
    } else {
      payload.author_id = user?.id; // Tác giả là người đang đăng nhập
      const { error } = await supabase.from('blogs').insert([payload]);
      if (error) return toast.error('Lỗi thêm mới: ' + error.message);
      toast.success('Thêm bài viết mới thành công');
    }
    
    setIsEditing(false);
    setCurrentItem(null);
    fetchItems();
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ position: 'relative' }}>
      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-charcoal)', letterSpacing: '-0.5px', margin: 0, fontFamily: 'var(--font-heading)' }}>Bài viết / Blog ({items.length})</h2>
        <button 
          onClick={() => {
            setCurrentItem({ title: '', content: '', status: 'draft', cover_image_url: '', tags: [] });
            setTagsInput('');
            setIsEditing(true);
          }}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            background: 'linear-gradient(135deg, #EA580C, #C2410C)',
            color: '#ffffff',
            fontWeight: '600',
            padding: '0.7rem 1.4rem',
            borderRadius: '12px',
            border: 'none', 
            boxShadow: '0 4px 15px rgba(234, 88, 12, 0.2)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(234, 88, 12, 0.3)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(234, 88, 12, 0.2)'; }}
        >
          <Plus size={18} /> Thêm bài viết
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card" style={{ overflowX: 'auto', padding: 0, borderRadius: '24px', boxShadow: '0 15px 35px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', background: 'linear-gradient(90deg, rgba(234, 88, 12, 0.03), transparent)' }}>
              <th style={{ padding: '1.25rem 1rem', fontWeight: '600', color: 'var(--color-charcoal)' }}>Tiêu đề</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: '600', color: 'var(--color-charcoal)' }}>Trạng thái</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: '600', color: 'var(--color-charcoal)' }}>Tác giả</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: '600', color: 'var(--color-charcoal)' }}>Lượt xem</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: '600', color: 'var(--color-charcoal)', width: '100px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '1rem', fontWeight: '600', color: '#1e293b' }}>{item.title}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.35rem 0.75rem', 
                    borderRadius: '9999px', 
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    background: item.status === 'published' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: item.status === 'published' ? '#10b981' : '#f59e0b'
                  }}>
                    {item.status}
                  </span>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.profiles?.full_name || 'Unknown'}</td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.views || 0}</td>
                <td style={{ padding: '1rem', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  <button onClick={() => handleEdit(item)} style={{...iconBtnStyle, background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5'}} title="Sửa"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(item.id)} style={{...iconBtnStyle, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'}} title="Xóa"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Không có dữ liệu bài viết</td></tr>}
          </tbody>
        </table>
      </motion.div>

      {isEditing && createPortal(
        <div style={modalOverlayStyle}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={modalContentStyle}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: 'var(--color-charcoal)', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>{currentItem.id ? 'Sửa bài viết' : 'Thêm bài viết mới'}</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Nhập thông tin chi tiết cho bài viết trên blog.</p>
              </div>
              <button onClick={() => setIsEditing(false)} style={closeBtnStyle}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Tiêu đề bài viết</label>
                <input required type="text" value={currentItem.title} onChange={e => setCurrentItem({ ...currentItem, title: e.target.value })} style={inputStyle} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Link ảnh bìa (Cover Image URL)</label>
                  <input type="url" value={currentItem.cover_image_url || ''} onChange={e => setCurrentItem({ ...currentItem, cover_image_url: e.target.value })} style={inputStyle} placeholder="https://..." />
                </div>
                <div style={{ width: '200px' }}>
                  <label style={labelStyle}>Trạng thái</label>
                  <select value={currentItem.status} onChange={e => setCurrentItem({ ...currentItem, status: e.target.value })} style={inputStyle}>
                    <option value="draft">Bản nháp (Draft)</option>
                    <option value="published">Đã xuất bản (Published)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label style={labelStyle}>Nội dung bài viết (Markdown/HTML)</label>
                <textarea required rows={10} value={currentItem.content} onChange={e => setCurrentItem({ ...currentItem, content: e.target.value })} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace' }} />
              </div>
              
              <div>
                <label style={labelStyle}>Thẻ (Tags) - Phân cách bằng dấu phẩy</label>
                <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)} style={inputStyle} placeholder="interview, tips, cv..." />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '0.85rem', background: '#f1f5f9', border: 'none', color: '#475569', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.background = '#e2e8f0'} onMouseOut={e => e.target.style.background = '#f1f5f9'}>Hủy bỏ</button>
                <button type="submit" style={{ flex: 1, padding: '0.85rem', background: '#EA580C', border: 'none', color: '#ffffff', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 4px 15px rgba(234, 88, 12, 0.3)', transition: 'transform 0.2s' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>{currentItem.id ? 'Lưu thay đổi' : 'Đăng bài viết'}</button>
              </div>
            </form>
          </motion.div>
        </div>,
        document.body
      )}
    </motion.div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '0.85rem 1rem',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  color: '#334155',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s'
};
const labelStyle = { display: 'block', marginBottom: '0.4rem', color: '#475569', fontSize: '0.85rem', fontWeight: '600' };
const iconBtnStyle = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '0.5rem',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s'
};
const closeBtnStyle = { background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem', transition: 'color 0.2s' };
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 9999,
  padding: '5rem 1rem 2rem', overflowY: 'auto'
};
const modalContentStyle = { 
  width: '100%', maxWidth: '800px', margin: 'auto', 
  padding: '2.5rem', background: '#ffffff', borderRadius: '24px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
};

export default BlogsView;
