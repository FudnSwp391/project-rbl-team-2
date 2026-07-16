import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../utils/supabaseClient';
import { Edit2, Trash2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
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

const SubscriptionPlansView = () => {
  const confirm = useConfirm();
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
    const isConfirmed = await new Promise(resolve => confirm({ message: 'Bạn có chắc chắn muốn xóa gói dịch vụ này?', isDanger: true, onConfirm: () => resolve(true), onCancel: () => resolve(false) }));
    if (isConfirmed) {
      const { error } = await supabase.from('subscription_plans').delete().eq('id', id);
      if (error) toast.error('Lỗi khi xóa: ' + error.message);
      else {
        toast.success('Xóa thành công');
        setItems(items.filter(item => item.id !== id));
      }
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
      if (error) return toast.error('Lỗi cập nhật: ' + error.message);
      toast.success('Cập nhật gói thành công');
    } else {
      const { error } = await supabase.from('subscription_plans').insert([payload]);
      if (error) return toast.error('Lỗi thêm mới: ' + error.message);
      toast.success('Thêm gói dịch vụ mới thành công');
    }
    
    setIsEditing(false);
    setCurrentItem(null);
    fetchItems();
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ position: 'relative' }}>
      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-charcoal)', letterSpacing: '-0.5px', margin: 0, fontFamily: 'var(--font-heading)' }}>Gói dịch vụ ({items.length})</h2>
        <button 
          onClick={handleAdd}
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
          <Plus size={18} /> Thêm mới
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card" style={{ overflowX: 'auto', padding: 0, borderRadius: '24px', boxShadow: '0 15px 35px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', background: 'linear-gradient(90deg, rgba(234, 88, 12, 0.03), transparent)' }}>
              <th style={{ padding: '1.25rem 1rem', fontWeight: '600', color: 'var(--color-charcoal)' }}>Tên gói</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: '600', color: 'var(--color-charcoal)' }}>Giá</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: '600', color: 'var(--color-charcoal)' }}>Thời hạn</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: '600', color: 'var(--color-charcoal)' }}>Tính năng</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: '600', color: 'var(--color-charcoal)', width: '100px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                  <span style={{
                    background: item.name.toLowerCase() === 'premium' ? 'rgba(234, 88, 12, 0.1)' : (item.name.toLowerCase() === 'pro' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)'),
                    color: item.name.toLowerCase() === 'premium' ? '#EA580C' : (item.name.toLowerCase() === 'pro' ? '#10b981' : '#64748b'),
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {item.name}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontWeight: '600', color: '#1e293b' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}</td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.price === 0 || item.duration_days === 0 ? 'Vĩnh viễn' : `${item.duration_days} ngày`}</td>
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {item.features && Array.isArray(item.features) ? item.features.join(', ') : ''}
                </td>
                <td style={{ padding: '1rem', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  <button onClick={() => handleEdit(item)} style={{...iconBtnStyle, background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5'}} title="Sửa"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(item.id)} style={{...iconBtnStyle, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'}} title="Xóa"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && <tr><td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Không có dữ liệu</td></tr>}
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
                <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: 'var(--color-charcoal)', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>{currentItem.id ? 'Sửa gói dịch vụ' : 'Thêm gói dịch vụ'}</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Nhập thông tin chi tiết cho gói dịch vụ.</p>
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
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '0.85rem', background: '#f1f5f9', border: 'none', color: '#475569', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.background = '#e2e8f0'} onMouseOut={e => e.target.style.background = '#f1f5f9'}>Hủy bỏ</button>
                <button type="submit" style={{ flex: 1, padding: '0.85rem', background: '#EA580C', border: 'none', color: '#ffffff', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 4px 15px rgba(234, 88, 12, 0.3)', transition: 'transform 0.2s' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>Lưu thay đổi</button>
              </div>
            </form>
          </motion.div>
        </div>,
        document.body
      )}
    </motion.div>
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
  width: '100%', maxWidth: '700px', margin: 'auto', 
  padding: '2.5rem', background: '#ffffff', borderRadius: '24px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
};

export default SubscriptionPlansView;
