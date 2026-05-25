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
      role: 'user',
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
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              color: 'white',
              width: '250px'
            }}
          />
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
              <tr key={user.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '1rem' }}>#{user.id ? user.id.toString().substring(0, 8) : ''}...</td>
                <td style={{ padding: '1rem', fontWeight: '500' }}>{user.full_name || 'Người dùng ẩn danh'}</td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    background: (user.role === 'admin' || user.role === 'Admin') ? 'rgba(255, 150, 50, 0.2)' : 'rgba(100, 108, 255, 0.2)',
                    color: (user.role === 'admin' || user.role === 'Admin') ? '#ff9632' : 'hsl(var(--primary-hsl))',
                    padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem',
                    textTransform: 'capitalize'
                  }}>
                    {user.role || 'user'}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    color: user.plan === 'Premium' ? 'hsl(var(--accent-hsl))' : (user.plan === 'Pro' ? 'hsl(var(--primary-hsl))' : 'var(--text-secondary)'),
                    fontWeight: 'bold'
                  }}>
                    {user.plan || 'Free'}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    color: user.status === 'Active' ? '#32c864' : 'var(--text-secondary)'
                  }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: user.status === 'Active' ? '#32c864' : 'var(--text-secondary)' }} />
                    {user.status || 'Active'}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center' }}>
                  <button onClick={() => handleEdit(user)} style={iconBtnStyle} title="Sửa"><Edit2 size={18} color="hsl(var(--primary-hsl))" /></button>
                  <button onClick={() => handleDelete(user.id)} style={iconBtnStyle} title="Xóa"><Trash2 size={18} color="#ff4d4d" /></button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  {loading ? 'Đang tải...' : 'Không có dữ liệu người dùng'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div style={modalOverlayStyle}>
          <div className="animate-fade glass-card" style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>{currentUser.id ? 'Sửa người dùng' : 'Thêm người dùng mới'}</h2>
              <button onClick={() => setIsEditing(false)} style={closeBtnStyle}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Họ và Tên</label>
                <input
                  type="text"
                  required
                  value={currentUser.full_name || ''}
                  onChange={e => setCurrentUser({ ...currentUser, full_name: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
                <input
                  type="email"
                  required
                  value={currentUser.email || ''}
                  onChange={e => setCurrentUser({ ...currentUser, email: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Vai trò</label>
                <select
                  value={currentUser.role || 'user'}
                  onChange={e => setCurrentUser({ ...currentUser, role: e.target.value })}
                  style={inputStyle}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="candidate">Candidate</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Gói (Plan)</label>
                <select
                  value={currentUser.plan || 'Free'}
                  onChange={e => setCurrentUser({ ...currentUser, plan: e.target.value })}
                  style={inputStyle}
                >
                  <option value="Free">Free</option>
                  <option value="Pro">Pro</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Trạng thái</label>
                <select
                  value={currentUser.status || 'Active'}
                  onChange={e => setCurrentUser({ ...currentUser, status: e.target.value })}
                  style={inputStyle}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Banned">Banned</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Lưu</button>
                <button type="button" onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--text-secondary)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--glass-border)',
  background: 'var(--glass-bg)',
  color: '#000000',
  outline: 'none'
};

const iconBtnStyle = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: '0.25rem',
  margin: '0 0.25rem'
};

const closeBtnStyle = { background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' };
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
};
const modalContentStyle = { width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' };

export default UsersView;
