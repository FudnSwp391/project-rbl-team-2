import React, { useState } from 'react';
import { CheckCircle, Zap, Shield, Crown } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import PaymentModal from '../../components/PaymentModal';

const PricingPage = () => {
  const { user, profile } = useAuth();
  const [currentPlan, setCurrentPlan] = useState(profile?.plan || 'Free');
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [orderCode, setOrderCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    if (user && profile) {
      let dbPlan = profile.plan || 'Free';
      
      // Check expiration from DB
      if (profile.plan_expires_at && dbPlan !== 'Free') {
        const expires = new Date(profile.plan_expires_at);
        const now = new Date();
        if (expires <= now) {
          dbPlan = 'Free';
        }
      }
      setCurrentPlan(dbPlan);
    }
  }, [user, profile]);

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
    const price = planName === 'Pro' ? 5000 : 10000;

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

  return (
    <div className="container animate-fade" style={{ paddingTop: '120px', paddingBottom: 'var(--spacing-xl)', textAlign: 'center' }}>
      <header style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: 'var(--spacing-sm)' }}>
          Nâng cấp <span className="gradient-text">Trải nghiệm</span> của bạn
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Chọn gói phù hợp để mở khóa toàn bộ tính năng phỏng vấn AI và bộ câu hỏi chuyên sâu.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)', alignItems: 'center' }}>
        {/* Free Plan */}
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'left', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Gói Free</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>0đ <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/tháng</span></div>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            <FeatureItem text="1 lượt luyện tập với AI" />
            <FeatureItem text="5 lượt luyện tập question" />
          </ul>
          <button style={{
            width: '100%', padding: '0.85rem', borderRadius: '12px', border: '2px solid #e2e8f0',
            background: '#f8fafc', color: '#64748b', fontWeight: 'bold', cursor: 'default',
            transition: 'all 0.3s ease', marginTop: 'auto'
          }}
          disabled={currentPlan === 'Free'}
          >
            {currentPlan === 'Free' ? 'Gói hiện tại' : 'Đang sử dụng gói cao hơn'}
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
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>5.000đ <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/14 ngày</span></div>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            <FeatureItem text="5 lượt luyện tập với AI" />
            <FeatureItem text="10 lượt luyện tập question" />
            <FeatureItem text="Đặt lịch mentor 1 lần" />
          </ul>
          <button style={{
            width: '100%', padding: '0.9rem', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', fontWeight: 'bold', fontSize: '1rem',
            cursor: (currentPlan === 'Pro' || currentPlan === 'Premium') ? 'default' : 'pointer', marginTop: 'auto',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', opacity: (currentPlan === 'Pro' || currentPlan === 'Premium') ? 0.7 : 1,
            boxShadow: (currentPlan === 'Pro' || currentPlan === 'Premium') ? 'none' : '0 4px 15px rgba(79, 70, 229, 0.4)'
          }}
          onMouseOver={(e) => { if(currentPlan !== 'Pro' && currentPlan !== 'Premium') e.target.style.transform = 'translateY(-3px) scale(1.02)'; }}
          onMouseOut={(e) => { if(currentPlan !== 'Pro' && currentPlan !== 'Premium') e.target.style.transform = 'translateY(0) scale(1)'; }}
          onClick={() => currentPlan !== 'Pro' && currentPlan !== 'Premium' && handleUpgrade('Pro')} disabled={isProcessing || currentPlan === 'Pro' || currentPlan === 'Premium'}
          >
            {isProcessing ? 'Đang tạo đơn hàng...' : (currentPlan === 'Premium' ? 'Đang sử dụng gói cao hơn' : (currentPlan === 'Pro' ? 'Đang sử dụng' : 'Nâng cấp Pro'))}
          </button>
        </div>

        {/* Premium Plan */}
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'left', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Crown color="#f59e0b" />
              <h3 style={{ fontSize: '1.5rem', margin: 0, color: '#f59e0b' }}>Premium</h3>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>10.000đ <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/30 ngày</span></div>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            <FeatureItem text="30 lượt luyện tập với AI" />
            <FeatureItem text="Không giới hạn luyện tập question" />
            <FeatureItem text="Đặt lịch mentor 5 lần" />
          </ul>
          <button style={{
            width: '100%', padding: '0.9rem', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', fontWeight: 'bold', fontSize: '1rem',
            cursor: currentPlan === 'Premium' ? 'default' : 'pointer', marginTop: 'auto',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', opacity: currentPlan === 'Premium' ? 0.7 : 1,
            boxShadow: currentPlan === 'Premium' ? 'none' : '0 4px 15px rgba(245, 158, 11, 0.4)'
          }}
          onMouseOver={(e) => { if(currentPlan !== 'Premium') e.target.style.transform = 'translateY(-3px) scale(1.02)'; }}
          onMouseOut={(e) => { if(currentPlan !== 'Premium') e.target.style.transform = 'translateY(0) scale(1)'; }}
          onClick={() => currentPlan !== 'Premium' && handleUpgrade('Premium')}
          disabled={isProcessing || currentPlan === 'Premium'}
          >
            {isProcessing ? 'Đang tạo đơn hàng...' : (currentPlan === 'Premium' ? 'Đang sử dụng' : 'Nâng cấp Premium')}
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
            const durationDays = selectedPlan.name === 'Pro' ? 14 : 30;
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + durationDays);
            
            try {
              await supabase.from('profiles').update({
                plan: selectedPlan.name,
                plan_expires_at: expiresAt.toISOString()
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
