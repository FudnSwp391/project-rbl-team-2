import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Edit2, Trash2, Plus, X } from 'lucide-react';

const UsersView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      alert('Lỗi khi tải users: ' + error.message);
      console.error('Error fetching users:', error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) {
        alert('Lỗi khi xóa: ' + error.message + '\n(Lưu ý: Cần kiểm tra quyền RLS trên Supabase)');
      } else {
        setUsers(users.filter(u => u.id !== id));
      }
    }
  };

  const handleEdit = (u) => {
    setCurrentUser(u);
    setIsEditing(true);
  };

  const handleAdd = () => {
    setCurrentUser({
      full_name: '',
      email: '',
      role: 'candidate',
      plan: 'Free',
      status: 'Active'
    });
    setIsEditing(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    const payload = {
      full_name: currentUser.full_name,
      email: currentUser.email,
      role: currentUser.role,
      plan: currentUser.plan,
      status: currentUser.status
    };

    if (currentUser.id) {
      // Update
      const originalUser = users.find(u => u.id === currentUser.id);
      if (originalUser && originalUser.plan !== currentUser.plan) {
        if (currentUser.plan === 'Pro') {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 14);
          payload.plan_expires_at = expiresAt.toISOString();
        } else if (currentUser.plan === 'Premium') {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);
          payload.plan_expires_at = expiresAt.toISOString();
        } else {
          payload.plan_expires_at = null;
        }
      }

      const { error } = await supabase.from('profiles').update(payload).eq('id', currentUser.id);
      if (error) return alert('Lỗi cập nhật: ' + error.message + '\n(Lưu ý: Cần kiểm tra quyền RLS trên Supabase)');
    } else {
      // Insert
      const { error } = await supabase.from('profiles').insert([payload]);
      if (error) return alert('Lỗi thêm mới: ' + error.message + '\n(Lưu ý: Cần kiểm tra quyền RLS trên Supabase)');
    }
    
    setIsEditing(false);
    setCurrentUser(null);
    fetchUsers();
  };

  const filteredUsers = users.filter(user =>
    (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <h2>Quản lý Người dùng ({users.length})</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '9999px',
              border: '1px solid rgba(0,0,0,0.1)',
              background: 'rgba(255,255,255,0.8)',
              color: '#333',
              width: '300px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}
          />
        </div>
      </div>

      <div className="glass-card" style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1rem', fontWeight: '500' }}>ID</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Họ Tên</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Email</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Vai trò</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Gói</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Trạng thái</th>
              <th style={{ padding: '1rem', fontWeight: '500', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? filteredUsers.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>#{user.id ? user.id.toString().substring(0, 8) : ''}...</td>
                <td style={{ padding: '1rem', fontWeight: '600', color: '#1e293b' }}>{user.full_name || 'Người dùng ẩn danh'}</td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    background: (user.role === 'admin' || user.role === 'Admin') ? 'rgba(255, 150, 50, 0.1)' : 'rgba(100, 108, 255, 0.1)',
                    color: (user.role === 'admin' || user.role === 'Admin') ? '#ea580c' : '#4f46e5',
                    padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>
                    {user.role || 'user'}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    color: user.plan === 'Premium' ? '#ea580c' : (user.plan === 'Pro' ? '#059669' : 'var(--text-secondary)'),
                    fontWeight: 'bold',
                    background: user.plan === 'Premium' ? 'rgba(255, 150, 50, 0.1)' : (user.plan === 'Pro' ? 'rgba(50, 200, 100, 0.1)' : 'transparent'),
                    padding: user.plan !== 'Free' ? '0.25rem 0.5rem' : '0',
                    borderRadius: '6px'
                  }}>
                    {user.plan || 'Free'}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    color: user.status === 'active' ? '#059669' : (user.status === 'pending' ? '#d97706' : 'var(--text-secondary)'),
                    fontWeight: '500', fontSize: '0.9rem', textTransform: 'capitalize'
                  }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: user.status === 'active' ? '#10b981' : (user.status === 'pending' ? '#f59e0b' : 'var(--text-secondary)') }} />
                    {user.status || 'active'}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  <button onClick={() => handleEdit(user)} style={{...iconBtnStyle, background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5'}} title="Sửa thông tin"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(user.id)} style={{...iconBtnStyle, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'}} title="Xóa tài khoản"><Trash2 size={16} /></button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  {loading ? 'Đang tải dữ liệu...' : 'Không tìm thấy người dùng nào'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div style={modalOverlayStyle}>
          <div className="animate-fade" style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: '#1e293b' }}>Chỉnh sửa Người dùng</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Cập nhật vai trò, trạng thái và thông tin tài khoản.</p>
              </div>
              <button onClick={() => setIsEditing(false)} style={closeBtnStyle}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={labelStyle}>Họ và Tên</label>
                <input
                  type="text"
                  required
                  value={currentUser.full_name || ''}
                  onChange={e => setCurrentUser({ ...currentUser, full_name: e.target.value })}
                  style={inputStyle}
                  placeholder="Nhập họ và tên..."
                />
              </div>
              <div>
                <label style={labelStyle}>Email <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="email"
                  required
                  value={currentUser.email || ''}
                  onChange={e => setCurrentUser({ ...currentUser, email: e.target.value })}
                  style={inputStyle}
                  disabled
                  title="Không thể thay đổi email của người dùng"
                />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>Email được quản lý bởi Supabase Auth, không thể sửa tại đây.</span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Vai trò</label>
                  <select
                    value={currentUser.role || 'candidate'}
                    onChange={e => setCurrentUser({ ...currentUser, role: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="candidate">Candidate (Ứng viên)</option>
                    <option value="recruiter">Recruiter (Nhà tuyển dụng)</option>
                    <option value="mentor">Mentor (Cố vấn)</option>
                    <option value="admin">Admin (Quản trị viên)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Gói (Plan)</label>
                  <select
                    value={currentUser.plan || 'Free'}
                    onChange={e => setCurrentUser({ ...currentUser, plan: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="Free">Gói Free</option>
                    <option value="Pro">Gói Pro</option>
                    <option value="Premium">Gói Premium</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label style={labelStyle}>Trạng thái tài khoản</label>
                <select
                  value={currentUser.status || 'active'}
                  onChange={e => setCurrentUser({ ...currentUser, status: e.target.value })}
                  style={inputStyle}
                >
                  <option value="active">Hoạt động bình thường (Active)</option>
                  <option value="pending">Chờ duyệt / Tạm khóa (Pending)</option>
                  <option value="banned">Cấm vĩnh viễn (Banned)</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                <button type="button" onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '0.85rem', background: '#f1f5f9', border: 'none', color: '#475569', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.background = '#e2e8f0'} onMouseOut={e => e.target.style.background = '#f1f5f9'}>Hủy bỏ</button>
                <button type="submit" style={{ flex: 1, padding: '0.85rem', background: '#4f46e5', border: 'none', color: '#ffffff', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)', transition: 'transform 0.2s' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
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

const iconBtnStyle = {
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
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  padding: '1rem'
};
const modalContentStyle = { 
  width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', 
  padding: '2.5rem', background: '#ffffff', borderRadius: '24px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
};

export default UsersView;
