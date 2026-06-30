import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Edit2, Trash2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ChallengesView = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .order('active_date', { ascending: false });
      
    if (error) console.error('Error fetching challenges:', error);
    else setItems(data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thử thách này?')) {
      const { error } = await supabase.from('challenges').delete().eq('id', id);
      if (error) toast.error('Lỗi khi xóa: ' + error.message);
      else {
        toast.success('Xóa thử thách thành công');
        setItems(items.filter(item => item.id !== id));
      }
    }
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setIsEditing(true);
  };

  const handleAdd = () => {
    setCurrentItem({ title: '', description: '', points_reward: 10, active_date: new Date().toISOString().split('T')[0] });
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { 
      title: currentItem.title, 
      description: currentItem.description,
      points_reward: currentItem.points_reward,
      active_date: currentItem.active_date
    };

    if (currentItem.id) {
      const { error } = await supabase.from('challenges').update(payload).eq('id', currentItem.id);
      if (error) return toast.error('Lỗi cập nhật: ' + error.message);
      toast.success('Cập nhật thử thách thành công');
    } else {
      const { error } = await supabase.from('challenges').insert([payload]);
      if (error) return toast.error('Lỗi thêm mới: ' + error.message);
      toast.success('Thêm thử thách mới thành công');
    }
    
    setIsEditing(false);
    setCurrentItem(null);
    fetchItems();
  };

  return (
    <div className="animate-fade" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <h2>Thử thách hàng ngày ({items.length})</h2>
        <button 
          className="btn-primary" 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            background: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
            color: '#000000',
            fontWeight: '600',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            border: 'none', 
            boxShadow: '0 4px 15px rgba(255, 255, 255, 0.15)',
            transition: 'all 0.3s ease'
          }} 
          onClick={handleAdd}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={18} /> Thêm mới
        </button>
      </div>

      <div className="glass-card" style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Ngày</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Tiêu đề</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Phần thưởng</th>
              <th style={{ padding: '1rem', fontWeight: '500', width: '100px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '1rem', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{item.active_date}</td>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{item.title}</td>
                <td style={{ padding: '1rem', color: '#ff9632', fontWeight: 'bold' }}>+{item.points_reward} PTS</td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(item)} style={iconBtnStyle} title="Sửa"><Edit2 size={18} color="hsl(var(--primary-hsl))" /></button>
                  <button onClick={() => handleDelete(item.id)} style={iconBtnStyle} title="Xóa"><Trash2 size={18} color="#ff4d4d" /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center' }}>Không có dữ liệu</td></tr>}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div style={modalOverlayStyle}>
          <div className="animate-fade glass-card" style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>{currentItem.id ? 'Sửa thử thách' : 'Thêm thử thách'}</h2>
              <button onClick={() => setIsEditing(false)} style={closeBtnStyle}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Tiêu đề thử thách</label>
                <input required type="text" value={currentItem.title} onChange={e => setCurrentItem({ ...currentItem, title: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Mô tả</label>
                <textarea rows={3} required value={currentItem.description} onChange={e => setCurrentItem({ ...currentItem, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Phần thưởng (Điểm)</label>
                  <input required type="number" value={currentItem.points_reward} onChange={e => setCurrentItem({ ...currentItem, points_reward: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Ngày áp dụng</label>
                  <input required type="date" value={currentItem.active_date} onChange={e => setCurrentItem({ ...currentItem, active_date: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Lưu</button>
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
const modalContentStyle = { width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' };

export default ChallengesView;
