import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../utils/supabaseClient';
import { Edit2, Trash2, Plus, X } from 'lucide-react';

const SubscriptionPlansView = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [featuresInput, setFeaturesInput] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price', { ascending: true });
      
    if (error) console.error('Error fetching subscription_plans:', error);
    else setItems(data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa gói dịch vụ này?')) {
      const { error } = await supabase.from('subscription_plans').delete().eq('id', id);
      if (error) alert('Lỗi khi xóa: ' + error.message + '\n(Cần kiểm tra RLS trên Supabase)');
      else setItems(items.filter(item => item.id !== id));
    }
  };

  const handleEdit = (item) => {
    setCurrentItem(item);
    setFeaturesInput(item.features ? (Array.isArray(item.features) ? item.features.join('\n') : JSON.stringify(item.features)) : '');
    setIsEditing(true);
  };

  const handleAdd = () => {
    setCurrentItem({ name: '', price: 0, duration_days: 30, max_mentor_bookings: 0, max_ai_interviews: 0, max_questions: 5 });
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    const max_ai = parseInt(currentItem.max_ai_interviews) || 0;
    const max_q = parseInt(currentItem.max_questions) || 0;
    const max_m = parseInt(currentItem.max_mentor_bookings) || 0;
    
    const features = [];
    if (max_ai > 0) {
      features.push(`${max_ai} lượt luyện tập với AI`);
    }
    if (max_q > 900) {
      features.push('Không giới hạn lượt luyện tập question');
    } else if (max_q > 0) {
      features.push(`${max_q} lượt luyện tập question`);
    }
    if (max_m > 0) {
      features.push(`Đặt lịch mentor ${max_m} lần`);
    }
    
    const payload = { 
      name: currentItem.name, 
      price: parseInt(currentItem.price) || 0,
      duration_days: parseInt(currentItem.duration_days) || 0,
      features: features,
      max_mentor_bookings: max_m,
      max_ai_interviews: max_ai,
      max_questions: max_q
    };

    if (currentItem.id) {
      const { error } = await supabase.from('subscription_plans').update(payload).eq('id', currentItem.id);
      if (error) return alert('Lỗi cập nhật: ' + error.message + '\n(Cần kiểm tra RLS trên Supabase)');
    } else {
      const { error } = await supabase.from('subscription_plans').insert([payload]);
      if (error) return alert('Lỗi thêm mới: ' + error.message + '\n(Cần kiểm tra RLS trên Supabase)');
    }
    
    setIsEditing(false);
    setCurrentItem(null);
    fetchItems();
  };

  return (
    <div className="animate-fade" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <h2>Gói dịch vụ ({items.length})</h2>
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
              <th style={{ padding: '1rem', fontWeight: '500' }}>Tên gói</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Giá</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Thời hạn</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Tính năng</th>
              <th style={{ padding: '1rem', fontWeight: '500', width: '100px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                  <span style={{
                    background: item.name.toLowerCase() === 'premium' ? '#ff9632' : (item.name.toLowerCase() === 'pro' ? '#32c864' : '#e2e8f0'),
                    color: item.name.toLowerCase() === 'premium' ? 'white' : (item.name.toLowerCase() === 'pro' ? 'white' : '#64748b'),
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.85rem'
                  }}>
                    {item.name}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}</td>
                <td style={{ padding: '1rem' }}>{item.price === 0 || item.duration_days === 0 ? 'Vĩnh viễn' : `${item.duration_days} ngày`}</td>
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {item.features && Array.isArray(item.features) ? item.features.join(', ') : ''}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(item)} style={iconBtnStyle} title="Sửa"><Edit2 size={18} color="#4f46e5" /></button>
                  <button onClick={() => handleDelete(item.id)} style={iconBtnStyle} title="Xóa"><Trash2 size={18} color="#ff4d4d" /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center' }}>Không có dữ liệu</td></tr>}
          </tbody>
        </table>
      </div>

      {isEditing && createPortal(
        <div style={modalOverlayStyle}>
          <div className="animate-fade" style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: '#1e293b' }}>{currentItem.id ? 'Sửa gói dịch vụ' : 'Thêm gói dịch vụ'}</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{currentItem.id ? 'Cập nhật nội dung và thuộc tính gói dịch vụ.' : 'Điền thông tin bên dưới để thêm gói dịch vụ mới.'}</p>
              </div>
              <button type="button" onClick={() => setIsEditing(false)} style={closeBtnStyle}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={labelStyle}>Tên gói</label>
                <input required type="text" value={currentItem.name} onChange={e => setCurrentItem({ ...currentItem, name: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Giá (VND)</label>
                  <input required type="number" min="0" value={currentItem.price} onChange={e => setCurrentItem({ ...currentItem, price: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Thời hạn (ngày) <span style={{fontSize: '0.75rem', fontWeight: 'normal', color: '#94a3b8'}}>(0 = Vĩnh viễn)</span></label>
                  <input required type="number" min="0" value={currentItem.duration_days} onChange={e => setCurrentItem({ ...currentItem, duration_days: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Lượt đặt Mentor</label>
                  <input required type="number" min="0" value={currentItem.max_mentor_bookings !== undefined ? currentItem.max_mentor_bookings : 0} onChange={e => setCurrentItem({ ...currentItem, max_mentor_bookings: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Lượt LT với AI</label>
                  <input required type="number" min="0" value={currentItem.max_ai_interviews !== undefined ? currentItem.max_ai_interviews : 0} onChange={e => setCurrentItem({ ...currentItem, max_ai_interviews: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Lượt LT Question</label>
                  <input required type="number" min="0" value={currentItem.max_questions !== undefined ? currentItem.max_questions : 0} onChange={e => setCurrentItem({ ...currentItem, max_questions: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: 'none', color: '#475569', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.background = '#e2e8f0'} onMouseOut={e => e.target.style.background = '#f1f5f9'}>Hủy bỏ</button>
                <button type="submit" style={{ flex: 1, padding: '0.75rem', background: '#4f46e5', border: 'none', color: '#ffffff', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)', transition: 'transform 0.2s' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '0.4rem', color: '#475569', fontSize: '0.85rem', fontWeight: '600' };

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

const iconBtnStyle = { background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', margin: '0 0.25rem' };
const closeBtnStyle = { background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem', transition: 'color 0.2s' };
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  padding: '1rem'
};
const modalContentStyle = { 
  width: '100%', maxWidth: '600px', maxHeight: '95vh', overflowY: 'auto', 
  padding: '1.5rem 2rem', background: '#ffffff', borderRadius: '20px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', boxSizing: 'border-box'
};

export default SubscriptionPlansView;
