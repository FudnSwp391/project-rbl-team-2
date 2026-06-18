import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Edit2, Trash2, Plus, X, ExternalLink } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';

const BlogsView = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
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
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      const { data, error } = await supabase.from('blogs').delete().eq('id', id).select();
      if (error) {
        alert('Lỗi khi xóa: ' + error.message + '\n(Cần kiểm tra RLS trên Supabase)');
      } else if (!data || data.length === 0) {
        alert('Không thể xóa bài viết. Bạn không có quyền (Lỗi RLS) hoặc bài đã bị xóa.');
      } else {
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
      if (error) return alert('Lỗi cập nhật: ' + error.message + '\n(Cần kiểm tra RLS trên Supabase)');
    } else {
      payload.author_id = user?.id; // Tác giả là người đang đăng nhập
      const { error } = await supabase.from('blogs').insert([payload]);
      if (error) return alert('Lỗi thêm mới: ' + error.message + '\n(Cần kiểm tra RLS trên Supabase)');
    }
    
    setIsEditing(false);
    setCurrentItem(null);
    fetchItems();
  };

  return (
    <div className="animate-fade" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <h2>Bài viết / Blog ({items.length})</h2>

      </div>

      <div className="glass-card" style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Tiêu đề</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Trạng thái</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Tác giả</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Lượt xem</th>
              <th style={{ padding: '1rem', fontWeight: '500', width: '100px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.title}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.85rem',
                    background: item.status === 'published' ? 'rgba(50, 200, 100, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                    color: item.status === 'published' ? '#32c864' : 'var(--text-secondary)'
                  }}>
                    {item.status}
                  </span>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.profiles?.full_name || 'Unknown'}</td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.views || 0}</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(item)} style={iconBtnStyle} title="Sửa"><Edit2 size={18} color="hsl(var(--primary-hsl))" /></button>
                  <button onClick={() => handleDelete(item.id)} style={iconBtnStyle} title="Xóa"><Trash2 size={18} color="#ff4d4d" /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center' }}>Không có dữ liệu bài viết</td></tr>}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div style={modalOverlayStyle}>
          <div className="animate-fade glass-card" style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>{currentItem.id ? 'Sửa bài viết' : 'Thêm bài viết mới'}</h2>
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

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Lưu bài viết</button>
                <button type="button" onClick={() => setIsEditing(false)} style={cancelBtnStyle}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: '#000000', outline: 'none' };
const labelStyle = { display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' };
const iconBtnStyle = { background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', margin: '0 0.25rem' };
const cancelBtnStyle = { flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--text-secondary)', color: 'white', borderRadius: '8px', cursor: 'pointer' };
const closeBtnStyle = { background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' };
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};
const modalContentStyle = { width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' };

export default BlogsView;
