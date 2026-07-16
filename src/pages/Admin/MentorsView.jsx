import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Check, X as XIcon, Eye, Info, FileText } from 'lucide-react';
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

const MentorsView = () => {
  const confirm = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'managed'

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingCount, setPendingCount] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMentors();
      fetchPendingCount();
    }, 400);
    return () => clearTimeout(timer);
  }, [page, searchTerm, activeTab]);

  const fetchPendingCount = async () => {
    const { count } = await supabase.from('mentors').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    setPendingCount(count || 0);
  };

  const fetchMentors = async () => {
    setLoading(true);
    
    let query = supabase.from('mentors').select('*', { count: 'exact' });
    
    if (activeTab === 'pending') {
      query = query.eq('status', 'pending');
    } else {
      query = query.neq('status', 'pending');
    }
    
    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (error) {
      toast.error('Lỗi khi tải mentors: ' + error.message);
      console.error('Error fetching mentors:', error);
    } else {
      setMentors(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage) || 1);
    }
    setLoading(false);
  };

  const handleApprove = async (mentor) => {
    const isConfirmed = await new Promise(resolve => confirm({ message: `Bạn có chắc chắn muốn DUYỆT đăng ký mentor của ${mentor.full_name}?`, isDanger: true, onConfirm: () => resolve(true), onCancel: () => resolve(false) }));
    if (isConfirmed) {
      const { error: updateMentorError } = await supabase
        .from('mentors')
        .update({ status: 'approved' })
        .eq('id', mentor.id);

      if (updateMentorError) {
        return toast.error('Lỗi khi duyệt (update mentors): ' + updateMentorError.message);
      }

      // 2. Cập nhật role trong profiles
      if (mentor.mentor_id) {
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update({ role: 'mentor', status: 'active', plan: 'Premium' })
          .eq('id', mentor.mentor_id);
          
        if (updateProfileError) {
           console.error('Không thể cập nhật role cho user:', updateProfileError);
           toast.error('Đã duyệt đơn đăng ký Mentor, nhưng có lỗi khi cập nhật role cho User: ' + updateProfileError.message);
        } else {
           // GỬI THÔNG BÁO CHO MENTOR
           await supabase.from('notifications').insert([{
             user_id: mentor.mentor_id,
             title: 'Hồ sơ Mentor của bạn đã được duyệt!',
             content: 'Chúc mừng bạn đã chính thức trở thành Mentor. Bạn hiện đã có thể truy cập Mentor Portal để cập nhật lịch trống và nhận yêu cầu hướng dẫn.',
             type: 'success',
             action_link: '/mentor/profile'
           }]);
           toast.success('Duyệt Mentor thành công và đã gửi thông báo!');
        }
      } else {
        toast.success('Duyệt Mentor thành công!');
      }
      fetchMentors();
      fetchPendingCount();
    }
  };

  const handleReject = async (mentor) => {
    const isConfirmed = await new Promise(resolve => confirm({ message: `Bạn có chắc chắn muốn TỪ CHỐI yêu cầu đăng ký của ${mentor.full_name}?`, isDanger: true, onConfirm: () => resolve(true), onCancel: () => resolve(false) }));
    if (isConfirmed) {
      const { error: updateMentorError } = await supabase
        .from('mentors')
        .update({ status: 'rejected' })
        .eq('id', mentor.id);

      if (updateMentorError) {
        return toast.error('Lỗi khi từ chối: ' + updateMentorError.message);
      }
      toast.success(`Đã từ chối Mentor ${mentor.full_name}`);

      if (mentor.mentor_id) {
        // Lấy thông tin profile hiện tại để kiểm tra xem có đang là mentor không
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', mentor.mentor_id).single();
        
        if (profile && profile.role === 'mentor') {
          // Nếu đang là mentor thì phải thu hồi quyền (Hạ cấp về candidate)
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

          // GỬI THÔNG BÁO TỪ CHỐI/HUỶ DUYỆT
          await supabase.from('notifications').insert([{
            user_id: mentor.mentor_id,
            title: 'Hồ sơ Mentor của bạn chưa được duyệt / Đã bị đình chỉ',
            content: 'Quản trị viên đã từ chối yêu cầu đăng ký Mentor hoặc tạm đình chỉ tài khoản Mentor của bạn. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.',
            type: 'warning'
          }]);
        } else {
          // Nếu không phải mentor (chỉ đang chờ duyệt), chỉ gửi thông báo từ chối
          await supabase.from('notifications').insert([{
            user_id: mentor.mentor_id,
            title: 'Yêu cầu đăng ký Mentor của bạn đã bị từ chối',
            content: 'Rất tiếc, hồ sơ Mentor của bạn hiện tại chưa phù hợp hoặc thiếu thông tin xác minh.',
            type: 'warning'
          }]);
        }
      }

      fetchMentors();
      fetchPendingCount();
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ position: 'relative' }}>
      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-charcoal)', letterSpacing: '-0.5px', margin: 0, fontFamily: 'var(--font-heading)' }}>{activeTab === 'pending' ? 'Duyệt Đăng Ký Mentor' : 'Quản Lý Danh Sách Mentor'}</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Tìm kiếm mentor, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              width: '300px',
              outline: 'none',
              boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1rem', borderBottom: '2px solid #e2e8f0', marginBottom: '2rem' }}>
        <button
          onClick={() => { setActiveTab('pending'); setPage(1); }}
          style={{
            padding: '1rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'pending' ? '3px solid #EA580C' : '3px solid transparent',
            color: activeTab === 'pending' ? '#EA580C' : '#64748b',
            fontWeight: '700',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            marginBottom: '-2px'
          }}
        >
          Yêu Cầu Chờ Duyệt 
          {pendingCount > 0 && <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>{pendingCount}</span>}
        </button>
        <button
          onClick={() => { setActiveTab('managed'); setPage(1); }}
          style={{
            padding: '1rem 1.5rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'managed' ? '3px solid #EA580C' : '3px solid transparent',
            color: activeTab === 'managed' ? '#EA580C' : '#64748b',
            fontWeight: '700',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 0.2s',
            marginBottom: '-2px'
          }}
        >
          Danh Sách Mentor
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card" style={{ overflowX: 'auto', padding: 0, borderRadius: '24px', boxShadow: '0 15px 35px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', background: 'linear-gradient(90deg, rgba(234, 88, 12, 0.03), transparent)' }}>
              <th style={{ padding: '1.25rem 1rem', fontWeight: '600', color: 'var(--color-charcoal)' }}>Tên Mentor</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: '600', color: 'var(--color-charcoal)' }}>Email Liên Hệ</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: '600', color: 'var(--color-charcoal)' }}>Chuyên Môn</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: '600', color: 'var(--color-charcoal)' }}>Trạng Thái</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: '600', color: 'var(--color-charcoal)', textAlign: 'center' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {mentors.length > 0 ? mentors.map(mentor => (
              <tr key={mentor.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '1.25rem 1rem', fontWeight: '600', color: '#1e293b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {mentor.avatar_url ? (
                      <img src={mentor.avatar_url} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#EA580C' }}>
                        {(mentor.full_name || 'M').charAt(0).toUpperCase()}
                      </div>
                    )}
                    {mentor.full_name}
                  </div>
                </td>
                <td style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)' }}>{mentor.email || 'N/A'}</td>
                <td style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)' }}>{mentor.expertise || 'N/A'}</td>
                <td style={{ padding: '1.25rem 1rem' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    color: mentor.status === 'approved' ? '#10b981' : (mentor.status === 'rejected' ? '#ef4444' : '#f59e0b'),
                    background: mentor.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : (mentor.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)'),
                    padding: '0.35rem 0.75rem', borderRadius: '9999px',
                    fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase'
                  }}>
                    {mentor.status === 'approved' ? 'Đã duyệt' : (mentor.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt')}
                  </span>
                </td>
                <td style={{ padding: '1.25rem 1rem', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
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
                <td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  {loading ? 'Đang tải dữ liệu...' : (activeTab === 'pending' ? 'Không có yêu cầu đăng ký nào đang chờ duyệt' : 'Chưa có Mentor nào trong hệ thống')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>

      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
        <button
          disabled={page === 1}
          onClick={() => { setPage(page - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #EA580C, #C2410C)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', transition: 'transform 0.2s', opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(234, 88, 12, 0.2)' }}
        >
          &larr; Prev
        </button>
        <span style={{ padding: '0.6rem 1.25rem', background: '#ffffff', borderRadius: '12px', fontWeight: '700', color: 'var(--color-charcoal)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          {page} / {totalPages}
        </span>
        <button
          disabled={page === totalPages || totalPages === 0}
          onClick={() => { setPage(page + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg, #EA580C, #C2410C)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', transition: 'transform 0.2s', opacity: (page === totalPages || totalPages === 0) ? 0.5 : 1, cursor: (page === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(234, 88, 12, 0.2)' }}
        >
          Next &rarr;
        </button>
      </motion.div>

      {selectedMentor && (
        <div style={modalOverlayStyle}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={modalContentStyle}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(234, 88, 12, 0.1)', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Info size={28} />
                </div>
                <div>
                  <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: 'var(--color-charcoal)', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>Thông Tin Đăng Ký Mentor</h2>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Hồ sơ đăng ký của: {selectedMentor.full_name}</p>
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
                    <a href={selectedMentor.document_url} target="_blank" rel="noopener noreferrer" style={{ color: '#EA580C', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
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
                  <button onClick={() => { handleApprove(selectedMentor); setSelectedMentor(null); }} style={{ flex: 1, padding: '0.85rem', background: '#10b981', border: 'none', color: '#ffffff', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'transform 0.2s', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>Duyệt Mentor</button>
                )}
                {selectedMentor.status !== 'rejected' && (
                  <button onClick={() => { handleReject(selectedMentor); setSelectedMentor(null); }} style={{ flex: 1, padding: '0.85rem', background: '#ef4444', border: 'none', color: '#ffffff', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'transform 0.2s', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>Từ Chối Yêu Cầu</button>
                )}
                <button type="button" onClick={() => setSelectedMentor(null)} style={{ flex: selectedMentor.status === 'pending' ? '0 0 auto' : 1, padding: '0.85rem 1.5rem', background: '#f1f5f9', border: 'none', color: '#475569', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.background = '#e2e8f0'} onMouseOut={e => e.target.style.background = '#f1f5f9'}>Đóng</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
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
  display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 9999,
  padding: '5rem 1rem 2rem', overflowY: 'auto'
};
const modalContentStyle = { 
  width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', 
  padding: '2.5rem', background: '#ffffff', borderRadius: '24px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
};

export default MentorsView;
