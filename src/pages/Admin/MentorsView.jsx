import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Check, X as XIcon, Eye, Info, FileText } from 'lucide-react';

const MentorsView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'managed'

  const fetchMentors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mentors')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching mentors:', error);
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('mentors')
        .select('*')
        .order('created_at', { ascending: false });
      if (!fallbackError) {
        setMentors(fallbackData || []);
      }
    } else {
      setMentors(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const handleApprove = async (mentor) => {
    if (window.confirm(`Bạn có chắc chắn muốn DUYỆT đăng ký mentor của ${mentor.full_name}?`)) {
      const { error: updateMentorError } = await supabase
        .from('mentors')
        .update({ status: 'approved' })
        .eq('id', mentor.id);

      if (updateMentorError) {
        return alert('Lỗi khi duyệt (update mentors): ' + updateMentorError.message);
      }

      if (mentor.mentor_id) {
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update({ role: 'mentor', status: 'active' })
          .eq('id', mentor.mentor_id);
          
        if (updateProfileError) {
           console.error('Không thể cập nhật role cho user:', updateProfileError);
           alert('Đã duyệt hồ sơ, nhưng có lỗi khi cập nhật role cho User: ' + updateProfileError.message);
        } else {
           alert(`Đã duyệt thành công Mentor ${mentor.full_name}!`);
        }
      }

      fetchMentors();
    }
  };

  const handleReject = async (mentor) => {
    if (window.confirm(`Bạn có chắc chắn muốn TỪ CHỐI yêu cầu đăng ký của ${mentor.full_name}?`)) {
      const { error: updateMentorError } = await supabase
        .from('mentors')
        .update({ status: 'rejected' })
        .eq('id', mentor.id);

      if (updateMentorError) {
        return alert('Lỗi khi từ chối: ' + updateMentorError.message);
      }

      // Nếu trước đó đã approved, có thể cần revoke quyền
      if (mentor.status === 'approved' && mentor.mentor_id) {
        let planToRestore = 'Free';
        let expiresAt = null;
        const { data: latestOrder } = await supabase
          .from('orders')
          .select('plan_name, created_at')
          .eq('user_id', mentor.mentor_id)
          .eq('status', 'paid')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (latestOrder) {
          const durationDays = latestOrder.plan_name === 'Pro' ? 14 : (latestOrder.plan_name === 'Premium' ? 30 : 0);
          const orderDate = new Date(latestOrder.created_at);
          const expirationDate = new Date(orderDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
          
          if (expirationDate > new Date()) {
            planToRestore = latestOrder.plan_name;
            expiresAt = expirationDate.toISOString();
          }
        }

        await supabase
          .from('profiles')
          .update({ role: 'candidate', plan: planToRestore, plan_expires_at: expiresAt })
          .eq('id', mentor.mentor_id);
      }

      fetchMentors();
    }
  };

  const pendingCount = mentors.filter(m => m.status === 'pending').length;

  const filteredMentors = mentors.filter(mentor => {
    const matchesSearch = (mentor.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (mentor.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'pending' ? mentor.status === 'pending' : mentor.status !== 'pending';
    return matchesSearch && matchesTab;
  });

  return (
    <div className="animate-fade" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>{activeTab === 'pending' ? 'Duyệt Đăng Ký Mentor' : 'Quản Lý Danh Sách Mentor'}</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Tìm kiếm mentor, email..."
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

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'pending' ? '2px solid #6B7F5C' : '2px solid transparent',
            color: activeTab === 'pending' ? '#6B7F5C' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          Yêu Cầu Chờ Duyệt 
          {pendingCount > 0 && <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>{pendingCount}</span>}
        </button>
        <button
          onClick={() => setActiveTab('managed')}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'managed' ? '2px solid #6B7F5C' : '2px solid transparent',
            color: activeTab === 'managed' ? '#6B7F5C' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          Danh Sách Mentor
        </button>
      </div>

      <div className="glass-card" style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Tên Mentor</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Email Liên Hệ</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Chuyên Môn</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Trạng Thái</th>
              <th style={{ padding: '1rem', fontWeight: '500', textAlign: 'center' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredMentors.length > 0 ? filteredMentors.map(mentor => (
              <tr key={mentor.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '1rem', fontWeight: '600', color: '#1e293b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {mentor.avatar_url ? (
                      <img src={mentor.avatar_url} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6B7F5C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
                        {(mentor.full_name || 'M').charAt(0).toUpperCase()}
                      </div>
                    )}
                    {mentor.full_name}
                  </div>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{mentor.email || 'N/A'}</td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{mentor.expertise || 'N/A'}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    color: mentor.status === 'approved' ? '#059669' : (mentor.status === 'rejected' ? '#e11d48' : '#d97706'),
                    fontWeight: '500', fontSize: '0.9rem', textTransform: 'capitalize'
                  }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: mentor.status === 'approved' ? '#10b981' : (mentor.status === 'rejected' ? '#f43f5e' : '#f59e0b') }} />
                    {mentor.status === 'approved' ? 'Đã duyệt' : (mentor.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt')}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  <button onClick={() => setSelectedMentor(mentor)} style={{...iconBtnStyle, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'}} title="Xem chi tiết"><Eye size={16} /></button>
                  {activeTab === 'pending' && (
                    <>
                      <button onClick={() => handleApprove(mentor)} style={{...iconBtnStyle, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}} title="Đồng ý"><Check size={16} /></button>
                      <button onClick={() => handleReject(mentor)} style={{...iconBtnStyle, background: 'rgba(225, 29, 72, 0.1)', color: '#e11d48'}} title="Từ chối"><XIcon size={16} /></button>
                    </>
                  )}
                  {activeTab === 'managed' && mentor.status === 'approved' && (
                     <button onClick={() => handleReject(mentor)} style={{...iconBtnStyle, background: 'rgba(225, 29, 72, 0.1)', color: '#e11d48'}} title="Đình chỉ/Hủy duyệt"><XIcon size={16} /></button>
                  )}
                  {activeTab === 'managed' && mentor.status === 'rejected' && (
                     <button onClick={() => handleApprove(mentor)} style={{...iconBtnStyle, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}} title="Khôi phục/Duyệt lại"><Check size={16} /></button>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  {loading ? 'Đang tải dữ liệu...' : (activeTab === 'pending' ? 'Không có yêu cầu đăng ký nào đang chờ duyệt' : 'Chưa có Mentor nào trong hệ thống')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedMentor && (
        <div style={modalOverlayStyle}>
          <div className="animate-fade" style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(107, 127, 92, 0.1)', color: '#6B7F5C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Info size={24} />
                </div>
                <div>
                  <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: '#1e293b' }}>Thông Tin Đăng Ký Mentor</h2>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Hồ sơ đăng ký của: {selectedMentor.full_name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMentor(null)} style={closeBtnStyle}><XIcon size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Họ và tên</label>
                  <div style={readOnlyFieldStyle}>{selectedMentor.full_name}</div>
                </div>
                <div>
                  <label style={labelStyle}>Email liên hệ</label>
                  <div style={readOnlyFieldStyle}>{selectedMentor.email}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Số điện thoại</label>
                  <div style={readOnlyFieldStyle}>{selectedMentor.phone || 'Không cung cấp'}</div>
                </div>
                <div>
                  <label style={labelStyle}>LinkedIn Profile</label>
                  <div style={readOnlyFieldStyle}>
                    {selectedMentor.linkedin_url ? (
                      <a href={selectedMentor.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                        {selectedMentor.linkedin_url}
                      </a>
                    ) : 'Không cung cấp'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Chuyên môn</label>
                  <div style={readOnlyFieldStyle}>{selectedMentor.expertise}</div>
                </div>
                <div>
                  <label style={labelStyle}>Kinh nghiệm</label>
                  <div style={readOnlyFieldStyle}>{selectedMentor.years_of_experience} năm</div>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Giới thiệu & Động lực</label>
                <div style={{ ...readOnlyFieldStyle, minHeight: '80px', whiteSpace: 'pre-wrap' }}>
                  {selectedMentor.bio || 'Không có mô tả'}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Tài liệu đính kèm (CV / Chứng chỉ)</label>
                <div style={readOnlyFieldStyle}>
                  {selectedMentor.document_url ? (
                    <a href={selectedMentor.document_url} target="_blank" rel="noopener noreferrer" style={{ color: '#6B7F5C', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                      <FileText size={18} />
                      Xem tài liệu đính kèm (PDF)
                    </a>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>Không có tài liệu đính kèm</span>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                {selectedMentor.status !== 'approved' && (
                  <button onClick={() => { handleApprove(selectedMentor); setSelectedMentor(null); }} style={{ flex: 1, padding: '0.85rem', background: '#6B7F5C', border: 'none', color: '#ffffff', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'transform 0.2s' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>Duyệt Mentor</button>
                )}
                {selectedMentor.status !== 'rejected' && (
                  <button onClick={() => { handleReject(selectedMentor); setSelectedMentor(null); }} style={{ flex: 1, padding: '0.85rem', background: '#e11d48', border: 'none', color: '#ffffff', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'transform 0.2s' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>Từ Chối Yêu Cầu</button>
                )}
                <button type="button" onClick={() => setSelectedMentor(null)} style={{ flex: selectedMentor.status === 'pending' ? '0 0 auto' : 1, padding: '0.85rem 1.5rem', background: '#f1f5f9', border: 'none', color: '#475569', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.background = '#e2e8f0'} onMouseOut={e => e.target.style.background = '#f1f5f9'}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '0.4rem', color: '#475569', fontSize: '0.85rem', fontWeight: '600' };

const readOnlyFieldStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  color: '#334155',
  fontSize: '0.95rem',
  lineHeight: '1.5',
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
  width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', 
  padding: '2.5rem', background: '#ffffff', borderRadius: '24px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
};

export default MentorsView;
