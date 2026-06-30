import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Check, X as XIcon, Eye, Info, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '../../utils/ConfirmContext';

const EmployersView = () => {
  const confirm = useConfirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'managed'

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    // Lấy thông tin công ty và kèm theo profile của recruiter nếu cần
    const { data, error } = await supabase
      .from('companies')
      .select('*, profiles!companies_recruiter_id_fkey(full_name)')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching companies:', error);
      // Fallback nếu không có khoá ngoại (profiles) liên kết trực tiếp bằng tên
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });
      if (!fallbackError) {
        setCompanies(fallbackData || []);
      }
    } else {
      setCompanies(data || []);
    }
    setLoading(false);
  };

  const handleApprove = async (company) => {
    const isConfirmed = await new Promise(resolve => confirm({ message: `Bạn có chắc chắn muốn DUYỆT nhà tuyển dụng ${company.company_name}?`, isDanger: true, onConfirm: () => resolve(true), onCancel: () => resolve(false) }));
    if (isConfirmed) {
      // 1. Cập nhật trạng thái company
      const { error: updateCompanyError } = await supabase
        .from('companies')
        .update({ status: 'approved' })
        .eq('id', company.id);

      if (updateCompanyError) {
        return toast.error('Lỗi khi duyệt (update companies): ' + updateCompanyError.message);
      }

      // 2. Cập nhật role trong profiles
      if (company.recruiter_id) {
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update({ role: 'recruiter', status: 'active', plan: 'Premium' })
          .eq('id', company.recruiter_id);
          
        if (updateProfileError) {
           console.error('Không thể cập nhật role cho user:', updateProfileError);
           toast.error('Đã duyệt công ty, nhưng có lỗi khi cập nhật role cho User: ' + updateProfileError.message);
        } else {
           // Gửi thông báo
           await supabase.from('notifications').insert([{
             user_id: company.recruiter_id,
             title: 'Hồ sơ Nhà tuyển dụng đã được duyệt!',
             content: 'Chúc mừng bạn đã chính thức trở thành Nhà tuyển dụng. Bạn hiện đã có thể truy cập Recruiter Portal để quản lý công ty và đăng tuyển.',
             type: 'success',
             action_link: '/recruiter/dashboard'
           }]);
           toast.success('Duyệt nhà tuyển dụng thành công và đã gửi thông báo');
        }
      } else {
        toast.success('Duyệt nhà tuyển dụng thành công');
      }

      fetchCompanies();
    }
  };

  const handleReject = async (company) => {
    const isConfirmed = await new Promise(resolve => confirm({ message: `Bạn có chắc chắn muốn TỪ CHỐI nhà tuyển dụng ${company.company_name}?`, isDanger: true, onConfirm: () => resolve(true), onCancel: () => resolve(false) }));
    if (isConfirmed) {
      const { error: updateCompanyError } = await supabase
        .from('companies')
        .update({ status: 'rejected' })
        .eq('id', company.id);

      if (updateCompanyError) {
        return toast.error('Lỗi khi từ chối: ' + updateCompanyError.message);
      }
      toast.success('Đã từ chối nhà tuyển dụng');

      // Nếu trước đó đã approved, có thể cần revoke quyền
      if (company.status === 'approved' && company.recruiter_id) {
        // Khôi phục lại gói dịch vụ mà user đang sở hữu, nếu không có thì về Free
        let planToRestore = 'Free';
        let expiresAt = null;
        const { data: latestOrder } = await supabase
          .from('orders')
          .select('plan_name, created_at')
          .eq('user_id', company.recruiter_id)
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
            .eq('id', company.recruiter_id);

          await supabase.from('notifications').insert([{
            user_id: company.recruiter_id,
            title: 'Tài khoản Nhà tuyển dụng đã bị đình chỉ',
            content: 'Quản trị viên đã tạm đình chỉ tài khoản Nhà tuyển dụng của bạn. Vui lòng liên hệ hỗ trợ.',
            type: 'warning'
          }]);
      } else if (company.recruiter_id) {
          await supabase.from('notifications').insert([{
            user_id: company.recruiter_id,
            title: 'Yêu cầu đăng ký Nhà tuyển dụng bị từ chối',
            content: 'Rất tiếc, hồ sơ đăng ký Nhà tuyển dụng của bạn không được duyệt do chưa phù hợp.',
            type: 'warning'
          }]);
      }

      fetchCompanies();
    }
  };

  const pendingCount = companies.filter(c => c.status === 'pending').length;

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = (company.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (company.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'pending' ? company.status === 'pending' : company.status !== 'pending';
    return matchesSearch && matchesTab;
  });

  return (
    <div className="animate-fade" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>{activeTab === 'pending' ? 'Duyệt Yêu Cầu Đăng Ký' : 'Quản Lý Thông Tin Nhà Tuyển Dụng'}</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            placeholder="Tìm kiếm công ty, email..."
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
            borderBottom: activeTab === 'pending' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'pending' ? '#3b82f6' : '#64748b',
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
            borderBottom: activeTab === 'managed' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'managed' ? '#3b82f6' : '#64748b',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          Danh Sách Doanh Nghiệp
        </button>
      </div>

      <div className="glass-card" style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Tên Công Ty</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Email Liên Hệ</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Mã Số Thuế</th>
              <th style={{ padding: '1rem', fontWeight: '500' }}>Trạng Thái</th>
              <th style={{ padding: '1rem', fontWeight: '500', textAlign: 'center' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.length > 0 ? filteredCompanies.map(company => (
              <tr key={company.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '1rem', fontWeight: '600', color: '#1e293b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {company.logo_url ? (
                      <img src={company.logo_url} alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#94a3b8' }}>
                        {company.company_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {company.company_name}
                  </div>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{company.email || 'N/A'}</td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{company.tax_id || 'N/A'}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    color: company.status === 'approved' ? '#059669' : (company.status === 'rejected' ? '#e11d48' : '#d97706'),
                    fontWeight: '500', fontSize: '0.9rem', textTransform: 'capitalize'
                  }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: company.status === 'approved' ? '#10b981' : (company.status === 'rejected' ? '#f43f5e' : '#f59e0b') }} />
                    {company.status === 'approved' ? 'Đã duyệt' : (company.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt')}
                  </span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  <button onClick={() => setSelectedCompany(company)} style={{...iconBtnStyle, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'}} title="Xem chi tiết"><Eye size={16} /></button>
                  {activeTab === 'pending' && (
                    <>
                      <button onClick={() => handleApprove(company)} style={{...iconBtnStyle, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}} title="Đồng ý"><Check size={16} /></button>
                      <button onClick={() => handleReject(company)} style={{...iconBtnStyle, background: 'rgba(225, 29, 72, 0.1)', color: '#e11d48'}} title="Từ chối"><XIcon size={16} /></button>
                    </>
                  )}
                  {activeTab === 'managed' && company.status === 'approved' && (
                     <button onClick={() => handleReject(company)} style={{...iconBtnStyle, background: 'rgba(225, 29, 72, 0.1)', color: '#e11d48'}} title="Đình chỉ/Hủy duyệt"><XIcon size={16} /></button>
                  )}
                  {activeTab === 'managed' && company.status === 'rejected' && (
                     <button onClick={() => handleApprove(company)} style={{...iconBtnStyle, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}} title="Khôi phục/Duyệt lại"><Check size={16} /></button>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  {loading ? 'Đang tải dữ liệu...' : (activeTab === 'pending' ? 'Không có yêu cầu đăng ký nào đang chờ duyệt' : 'Chưa có doanh nghiệp nào trong hệ thống')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Chi tiết Modal */}
      {selectedCompany && (
        <div style={modalOverlayStyle}>
          <div className="animate-fade" style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Info size={24} />
                </div>
                <div>
                  <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: '#1e293b' }}>Thông Tin Doanh Nghiệp</h2>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Hồ sơ đăng ký của: {selectedCompany.company_name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCompany(null)} style={closeBtnStyle}><XIcon size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Tên công ty</label>
                  <div style={readOnlyFieldStyle}>{selectedCompany.company_name}</div>
                </div>
                <div>
                  <label style={labelStyle}>Mã số thuế</label>
                  <div style={readOnlyFieldStyle}>{selectedCompany.tax_id || 'Không cung cấp'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Email liên hệ</label>
                  <div style={readOnlyFieldStyle}>{selectedCompany.email || 'Không cung cấp'}</div>
                </div>
                <div>
                  <label style={labelStyle}>Số điện thoại</label>
                  <div style={readOnlyFieldStyle}>{selectedCompany.phone || 'Không cung cấp'}</div>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Website</label>
                <div style={readOnlyFieldStyle}>
                  {selectedCompany.website ? (
                    <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                      {selectedCompany.website}
                    </a>
                  ) : 'Không cung cấp'}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Địa chỉ trụ sở</label>
                <div style={readOnlyFieldStyle}>{selectedCompany.address || 'Không cung cấp'}</div>
              </div>

              <div>
                <label style={labelStyle}>Mô tả công ty</label>
                <div style={{ ...readOnlyFieldStyle, minHeight: '80px', whiteSpace: 'pre-wrap' }}>
                  {selectedCompany.description || 'Không có mô tả'}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Tài liệu xác minh (Giấy phép kinh doanh / Hồ sơ công ty)</label>
                <div style={readOnlyFieldStyle}>
                  {selectedCompany.document_url ? (
                    <a href={selectedCompany.document_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                      <FileText size={18} />
                      Xem tài liệu đính kèm (PDF)
                    </a>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>Không có tài liệu đính kèm</span>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                {selectedCompany.status !== 'approved' && (
                  <button onClick={() => { handleApprove(selectedCompany); setSelectedCompany(null); }} style={{ flex: 1, padding: '0.85rem', background: '#10b981', border: 'none', color: '#ffffff', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'transform 0.2s' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>Duyệt Doanh Nghiệp</button>
                )}
                {selectedCompany.status !== 'rejected' && (
                  <button onClick={() => { handleReject(selectedCompany); setSelectedCompany(null); }} style={{ flex: 1, padding: '0.85rem', background: '#e11d48', border: 'none', color: '#ffffff', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'transform 0.2s' }} onMouseOver={e => e.target.style.transform = 'translateY(-2px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>Từ Chối Yêu Cầu</button>
                )}
                <button type="button" onClick={() => setSelectedCompany(null)} style={{ flex: selectedCompany.status === 'pending' ? '0 0 auto' : 1, padding: '0.85rem 1.5rem', background: '#f1f5f9', border: 'none', color: '#475569', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.background = '#e2e8f0'} onMouseOut={e => e.target.style.background = '#f1f5f9'}>Đóng</button>
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
  display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 9999,
  padding: '5rem 1rem 2rem', overflowY: 'auto'
};
const modalContentStyle = { 
  width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', 
  padding: '2.5rem', background: '#ffffff', borderRadius: '24px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
};

export default EmployersView;
