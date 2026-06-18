import React, { useState } from 'react';
import { CheckCircle, Zap, Shield, Crown, Star, FolderOpen } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import PaymentModal from '../../components/PaymentModal';
import { useLocation, useNavigate } from 'react-router-dom';

const PricingPage = () => {
  const { user, profile } = useAuth();
  const [currentPlan, setCurrentPlan] = useState(profile?.plan || 'Free');
  const [usageCount, setUsageCount] = useState(profile?.question_bank_usage_count || 0);
  const [planDaysLeft, setPlanDaysLeft] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [orderCode, setOrderCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dbPlans, setDbPlans] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();
  const isExchangeMode = new URLSearchParams(location.search).get('mode') === 'exchange';
  const currentPoints = profile?.points || 0;

  React.useEffect(() => {
    if (user && profile) {
      let dbPlan = profile.plan || 'Free';
      let daysLeft = null;
      
      // Check expiration from DB
      if (profile.plan_expires_at && dbPlan !== 'Free') {
        const expires = new Date(profile.plan_expires_at);
        const now = new Date();
        const diffTime = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
        if (expires <= now) {
          dbPlan = 'Free';
        } else {
          daysLeft = diffTime;
        }
      }
      setCurrentPlan(dbPlan);
      setPlanDaysLeft(daysLeft);

      const fetchLatestUsage = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('question_bank_usage_count')
            .eq('id', user.id)
            .single();
          if (!error && data) {
            setUsageCount(data.question_bank_usage_count || 0);
          }
        } catch (err) {}
      };
      fetchLatestUsage();
    }

    const fetchPlans = async () => {
      const { data } = await supabase.from('subscription_plans').select('*');
      if (data) setDbPlans(data);
    };
    fetchPlans();
  }, [user, profile]);

  const getPlanLimits = (planName) => {
    const p = dbPlans.find(plan => plan.name.toLowerCase() === planName.toLowerCase());
    return {
      price: p?.price ?? (planName === 'Free' ? 0 : (planName === 'Pro' ? 5000 : 10000)),
      duration_days: p?.duration_days ?? (planName === 'Free' ? 0 : (planName === 'Pro' ? 14 : 30)),
      max_ai_interviews: p?.max_ai_interviews || (planName === 'Free' ? 1 : (planName === 'Pro' ? 5 : 30)),
      max_questions: p?.max_questions || (planName === 'Free' ? 5 : (planName === 'Pro' ? 10 : 999)),
      max_mentor_bookings: p?.max_mentor_bookings || (planName === 'Free' ? 0 : (planName === 'Pro' ? 1 : 5))
    };
  };

  // CẤU HÌNH THÔNG TIN NGÂN HÀNG CỦA BẠN TẠI ĐÂY
  const BANK_ID = 'TPBank'; // Tên viết tắt hoặc BIN của ngân hàng (VD: MB, VCB, TCB)
  const BANK_ACCOUNT = '00004335607'; // Số tài khoản của bạn
  const ACCOUNT_NAME = 'NGUYEN QUANG MINH'; // Tên chủ tài khoản

  const handleUpgrade = async (planName) => {
    if (!user) {
      alert('Vui lòng đăng nhập để nâng cấp gói dịch vụ!');
      return;
    }

    setIsProcessing(true);
    const code = 'RBL' + Math.floor(100000 + Math.random() * 900000); // Sinh mã dạng RBL123456
    const planLimits = getPlanLimits(planName);
    const price = planLimits.price;

    // Lưu vào CSDL
    const { error } = await supabase.from('orders').insert([{
      user_id: user.id,
      plan_name: planName,
      price: price,
      order_code: code,
      status: 'pending'
    }]);

    setIsProcessing(false);

    if (error) {
      alert('Lỗi khi tạo đơn hàng: ' + error.message + '\n(Hãy chắc chắn bạn đã chạy file sepay_orders_schema.sql)');
    } else {
      setSelectedPlan({ name: planName, price: price });
      setOrderCode(code);
      setShowPayment(true);
    }
  };

  const handleExchange = async (planName) => {
    if (!user) {
      alert('Vui lòng đăng nhập!');
      return;
    }
    
    const cost = planName === 'Pro' ? 300 : 500;
    if (currentPoints < cost) {
      alert(`Bạn không có đủ điểm để đổi gói ${planName}. Cần ${cost} điểm, bạn đang có ${currentPoints} điểm.`);
      return;
    }
    
    if (!window.confirm(`Xác nhận dùng ${cost} điểm để đổi gói ${planName}?`)) return;
    
    setIsProcessing(true);
    const planLimits = getPlanLimits(planName);
    const durationDays = planLimits.duration_days;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);
    
    try {
      const { error } = await supabase.from('profiles').update({
        plan: planName,
        plan_expires_at: expiresAt.toISOString(),
        points: Math.max(0, currentPoints - cost)
      }).eq('id', user.id);
      
      if (error) throw error;
      
      const storageKey = `ita_user_data_${user.id}`;
      let savedData = JSON.parse(localStorage.getItem(storageKey));
      if (savedData) {
        savedData.points = Math.max(0, savedData.points - cost);
        localStorage.setItem(storageKey, JSON.stringify(savedData));
      }
      
      alert(`Đổi gói thành công! Bạn đã được cấp gói ${planName}.`);
      navigate('/dashboard');
    } catch (err) {
      console.error('Lỗi khi đổi gói:', err);
      alert('Có lỗi xảy ra: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container animate-fade" style={{ paddingTop: '120px', paddingBottom: 'var(--spacing-xl)', textAlign: 'center' }}>
      <header style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: 'var(--spacing-sm)' }}>
          {isExchangeMode ? <><span className="gradient-text">Đổi Điểm</span> Nhận Gói Dịch Vụ</> : <>Nâng cấp <span className="gradient-text">Trải nghiệm</span> của bạn</>}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          {isExchangeMode 
            ? `Sử dụng điểm tích lũy của bạn để đổi lấy các gói đặc quyền. Bạn đang có ${currentPoints} điểm.` 
            : `Chọn gói phù hợp để mở khóa toàn bộ tính năng phỏng vấn AI và bộ câu hỏi chuyên sâu.`}
        </p>
        {user && (
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ padding: '0.4rem 1rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '99px', fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
              {['admin', 'company', 'recruiter', 'mentor'].includes(profile?.role?.toLowerCase()) 
                ? 'Tài khoản đặc quyền (Không giới hạn)'
                : `Gói hiện tại: ${currentPlan} ${planDaysLeft !== null ? `(Còn ${planDaysLeft} ngày)` : ''}`
              }
            </div>
          </div>
        )}
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)', alignItems: 'center' }}>
        {/* Free Plan */}
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'left', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Gói Free</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{getPlanLimits('Free').price === 0 ? '0đ' : `${getPlanLimits('Free').price.toLocaleString('vi-VN')}đ`} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{getPlanLimits('Free').duration_days === 0 ? '/ Vĩnh viễn' : `/${getPlanLimits('Free').duration_days} ngày`}</span></div>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            <FeatureItem text={`${getPlanLimits('Free').max_ai_interviews} lượt luyện tập với AI`} />
            <FeatureItem text={`${getPlanLimits('Free').max_questions > 900 ? 'Không giới hạn' : getPlanLimits('Free').max_questions} lượt luyện tập question`} />
          </ul>
          <button style={{
            width: '100%', padding: '0.85rem', borderRadius: '12px', border: '2px solid #e2e8f0',
            background: '#f8fafc', color: '#64748b', fontWeight: 'bold', cursor: 'default',
            transition: 'all 0.3s ease', marginTop: 'auto'
          }}
          disabled={currentPlan === 'Free' || ['admin', 'company', 'recruiter', 'mentor'].includes(profile?.role?.toLowerCase())}
          >
            {['admin', 'company', 'recruiter', 'mentor'].includes(profile?.role?.toLowerCase()) ? 'Không giới hạn' : (currentPlan === 'Free' ? 'Gói hiện tại' : 'Đang sử dụng gói cao hơn')}
          </button>
        </div>

        {/* Pro Plan */}
        <div className="glass-card" style={{ padding: '2.5rem 2rem', textAlign: 'left', border: '2px solid var(--primary)', transform: 'scale(1.05)', position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', zIndex: 10, boxShadow: '0 20px 40px -10px rgba(79, 70, 229, 0.15)' }}>
          <div style={{ position: 'absolute', top: '-15px', right: '20px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', padding: '0.4rem 1.25rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)' }}>
            PHỔ BIẾN
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Zap color="hsl(var(--primary-hsl))" />
              <h3 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--primary)' }}>Pro</h3>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
              {isExchangeMode ? '300 điểm' : `${getPlanLimits('Pro').price.toLocaleString('vi-VN')}đ`} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{getPlanLimits('Pro').duration_days === 0 ? '/ Vĩnh viễn' : `/${getPlanLimits('Pro').duration_days} ngày`}</span>
            </div>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            <FeatureItem text={`${getPlanLimits('Pro').max_ai_interviews} lượt luyện tập với AI`} />
            <FeatureItem text={`${getPlanLimits('Pro').max_questions > 900 ? 'Không giới hạn' : getPlanLimits('Pro').max_questions} lượt luyện tập question`} />
            <FeatureItem text={`Đặt lịch mentor ${getPlanLimits('Pro').max_mentor_bookings} lần`} />
          </ul>
          <button style={{
            width: '100%', padding: '0.9rem', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', fontWeight: 'bold', fontSize: '1rem',
            cursor: (currentPlan === 'Pro' || currentPlan === 'Premium' || ['admin', 'company', 'recruiter', 'mentor'].includes(profile?.role?.toLowerCase())) ? 'default' : 'pointer', marginTop: 'auto',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', opacity: (currentPlan === 'Pro' || currentPlan === 'Premium' || ['admin', 'company', 'recruiter', 'mentor'].includes(profile?.role?.toLowerCase())) ? 0.7 : 1,
            boxShadow: (currentPlan === 'Pro' || currentPlan === 'Premium' || ['admin', 'company', 'recruiter', 'mentor'].includes(profile?.role?.toLowerCase())) ? 'none' : '0 4px 15px rgba(79, 70, 229, 0.4)'
          }}
          onMouseOver={(e) => { if(currentPlan !== 'Pro' && currentPlan !== 'Premium' && !['admin', 'company', 'recruiter', 'mentor'].includes(profile?.role?.toLowerCase())) e.target.style.transform = 'translateY(-3px) scale(1.02)'; }}
          onMouseOut={(e) => { if(currentPlan !== 'Pro' && currentPlan !== 'Premium' && !['admin', 'company', 'recruiter', 'mentor'].includes(profile?.role?.toLowerCase())) e.target.style.transform = 'translateY(0) scale(1)'; }}
          onClick={() => {
            if (currentPlan === 'Pro' || currentPlan === 'Premium' || ['admin', 'company', 'recruiter', 'mentor'].includes(profile?.role?.toLowerCase())) return;
            if (isExchangeMode) handleExchange('Pro');
            else handleUpgrade('Pro');
          }} disabled={isProcessing || currentPlan === 'Pro' || currentPlan === 'Premium' || ['admin', 'company', 'recruiter', 'mentor'].includes(profile?.role?.toLowerCase())}
          >
            {['admin', 'company', 'recruiter', 'mentor'].includes(profile?.role?.toLowerCase()) ? 'Không giới hạn' : (isProcessing ? 'Đang xử lý...' : (currentPlan === 'Premium' ? 'Đang sử dụng gói cao hơn' : (currentPlan === 'Pro' ? 'Đang sử dụng' : (isExchangeMode ? 'Đổi 300 điểm' : 'Nâng cấp Pro'))))}
          </button>
        </div>

        {/* Premium Plan */}
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'left', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Crown color="#f59e0b" />
              <h3 style={{ fontSize: '1.5rem', margin: 0, color: '#f59e0b' }}>Premium</h3>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
              {isExchangeMode ? '500 điểm' : `${getPlanLimits('Premium').price.toLocaleString('vi-VN')}đ`} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>{getPlanLimits('Premium').duration_days === 0 ? '/ Vĩnh viễn' : `/${getPlanLimits('Premium').duration_days} ngày`}</span>
            </div>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            <FeatureItem text={`${getPlanLimits('Premium').max_ai_interviews} lượt luyện tập với AI`} />
            <FeatureItem text={`${getPlanLimits('Premium').max_questions > 900 ? 'Không giới hạn' : getPlanLimits('Premium').max_questions} lượt luyện tập question`} />
            <FeatureItem text={`Đặt lịch mentor ${getPlanLimits('Premium').max_mentor_bookings} lần`} />
          </ul>
          <button style={{
            width: '100%', padding: '0.9rem', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', fontWeight: 'bold', fontSize: '1rem',
            cursor: (currentPlan === 'Premium' || ['admin', 'company', 'recruiter', 'mentor'].includes(profile?.role?.toLowerCase())) ? 'default' : 'pointer', marginTop: 'auto',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', opacity: (currentPlan === 'Premium' || ['admin', 'company', 'recruiter', 'mentor'].includes(profile?.role?.toLowerCase())) ? 0.7 : 1,
            boxShadow: (currentPlan === 'Premium' || ['admin', 'company', 'recruiter', 'mentor'].includes(profile?.role?.toLowerCase())) ? 'none' : '0 4px 15px rgba(245, 158, 11, 0.4)'
          }}
          onMouseOver={(e) => { if(currentPlan !== 'Premium' && !['admin', 'company', 'recruiter', 'mentor'].includes(profile?.role?.toLowerCase())) e.target.style.transform = 'translateY(-3px) scale(1.02)'; }}
          onMouseOut={(e) => { if(currentPlan !== 'Premium' && !['admin', 'company', 'recruiter', 'mentor'].includes(profile?.role?.toLowerCase())) e.target.style.transform = 'translateY(0) scale(1)'; }}
          onClick={() => {
            if (currentPlan === 'Premium' || ['admin', 'company', 'recruiter', 'mentor'].includes(profile?.role?.toLowerCase())) return;
            if (isExchangeMode) handleExchange('Premium');
            else handleUpgrade('Premium');
          }}
          disabled={isProcessing || currentPlan === 'Premium' || ['admin', 'company', 'recruiter', 'mentor'].includes(profile?.role?.toLowerCase())}
          >
            {['admin', 'company', 'recruiter', 'mentor'].includes(profile?.role?.toLowerCase()) ? 'Không giới hạn' : (isProcessing ? 'Đang xử lý...' : (currentPlan === 'Premium' ? 'Đang sử dụng' : (isExchangeMode ? 'Đổi 500 điểm' : 'Nâng cấp Premium')))}
          </button>
        </div>
      </div>

      {showPayment && selectedPlan && (
        <PaymentModal
          planName={selectedPlan.name}
          price={selectedPlan.price}
          orderCode={orderCode}
          bankId={BANK_ID}
          bankAccount={BANK_ACCOUNT}
          accountName={ACCOUNT_NAME}
          onClose={() => setShowPayment(false)}
          onSuccess={async () => {
            const planLimits = getPlanLimits(selectedPlan.name);
            const durationDays = planLimits.duration_days;
            const expiresAt = new Date();
            if (durationDays > 0) {
              expiresAt.setDate(expiresAt.getDate() + durationDays);
            }
            
            try {
              await supabase.from('profiles').update({
                plan: selectedPlan.name,
                plan_expires_at: durationDays > 0 ? expiresAt.toISOString() : null
              }).eq('id', user.id);
            } catch (err) {
              console.error('Lỗi khi nâng cấp DB:', err);
            }

            alert(`Thanh toán thành công! Hạng thành viên của bạn đã được nâng cấp lên ${selectedPlan.name}.`);
            setShowPayment(false);
            window.location.href = '/dashboard';
          }}
        />
      )}
    </div>
  );
};

const FeatureItem = ({ text }) => (
  <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
    <CheckCircle size={20} color="#32c864" />
    <span>{text}</span>
  </li>
);

export default PricingPage;
