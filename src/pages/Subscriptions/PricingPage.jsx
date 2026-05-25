import React, { useState } from 'react';
import { CheckCircle, Zap, Shield, Crown } from 'lucide-react';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabaseClient';
import PaymentModal from '../../components/PaymentModal';

const PricingPage = () => {
  const { user, profile } = useAuth();
  const currentPlan = profile?.plan || 'Free';
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [orderCode, setOrderCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
    <div className="container animate-fade" style={{ padding: 'var(--spacing-xl) 0', textAlign: 'center' }}>
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
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'left' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Gói Free</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>0đ <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/tháng</span></div>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FeatureItem text="5 lần phỏng vấn AI / tháng" />
            <FeatureItem text="Phân tích CV cơ bản" />
            <FeatureItem text="Truy cập bộ câu hỏi (Easy)" />
          </ul>
          <button style={{
            width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--primary)',
            background: 'transparent', color: 'var(--primary)', fontWeight: 'bold', cursor: currentPlan === 'Free' ? 'default' : 'pointer',
            opacity: currentPlan === 'Free' ? 0.7 : 1
          }}
          disabled={currentPlan === 'Free'}
          >
            {currentPlan === 'Free' ? 'Gói hiện tại' : 'Đang sử dụng gói cao hơn'}
          </button>
        </div>

        {/* Pro Plan */}
        <div className="glass-card" style={{ padding: '2.5rem 2rem', textAlign: 'left', border: '2px solid var(--primary)', transform: 'scale(1.05)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-15px', right: '20px', background: 'var(--primary)', color: 'white', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
            PHỔ BIẾN
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Zap color="hsl(var(--primary-hsl))" />
              <h3 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--primary)' }}>Pro</h3>
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>5.000đ <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/tháng</span></div>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FeatureItem text="Không giới hạn phỏng vấn AI" />
            <FeatureItem text="Đánh giá CV chuyên sâu" />
            <FeatureItem text="Truy cập toàn bộ câu hỏi" />
            <FeatureItem text="Phân tích giọng nói & biểu cảm" />
          </ul>
          <button className="btn-primary" style={{ width: '100%', textAlign: 'center', opacity: currentPlan === 'Pro' ? 0.7 : 1 }} onClick={() => currentPlan !== 'Pro' && handleUpgrade('Pro')} disabled={isProcessing || currentPlan === 'Pro'}>
            {isProcessing ? 'Đang tạo đơn hàng...' : (currentPlan === 'Pro' ? 'Gói hiện tại' : 'Nâng cấp Pro')}
          </button>
        </div>

        {/* Premium Plan */}
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'left' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Crown color="hsl(var(--accent-hsl))" />
              <h3 style={{ fontSize: '1.5rem', margin: 0 }}>Premium</h3>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>10.000đ <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/tháng</span></div>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <FeatureItem text="Mọi tính năng của Pro" />
            <FeatureItem text="Review từ chuyên gia (1 lần/tháng)" />
            <FeatureItem text="Ưu tiên hỗ trợ 24/7" />
          </ul>
          <button style={{
            width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--accent)',
            background: currentPlan === 'Premium' ? 'var(--accent)' : 'transparent', 
            color: currentPlan === 'Premium' ? '#000' : 'var(--accent)', 
            fontWeight: 'bold', cursor: currentPlan === 'Premium' ? 'default' : 'pointer',
            transition: 'all 0.2s', opacity: currentPlan === 'Premium' ? 0.7 : 1
          }}
            onMouseOver={(e) => { if(currentPlan !== 'Premium') { e.target.style.background = 'var(--accent)'; e.target.style.color = 'black'; } }}
            onMouseOut={(e) => { if(currentPlan !== 'Premium') { e.target.style.background = 'transparent'; e.target.style.color = 'var(--accent)'; } }}
            onClick={() => currentPlan !== 'Premium' && handleUpgrade('Premium')}
            disabled={isProcessing || currentPlan === 'Premium'}
          >
            {isProcessing ? 'Đang tạo đơn hàng...' : (currentPlan === 'Premium' ? 'Gói hiện tại' : 'Nâng cấp Premium')}
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
            // Cập nhật hạng thành viên (plan) cho user trong bảng profiles
            const { error } = await supabase
              .from('profiles')
              .update({ plan: selectedPlan.name })
              .eq('id', user.id);

            if (error) {
              console.error('Lỗi cập nhật hạng thành viên:', error);
              alert('Thanh toán thành công nhưng chưa cập nhật được hạng thành viên. Vui lòng liên hệ Admin.');
            } else {
              alert(`Thanh toán thành công! Hạng thành viên của bạn đã được nâng cấp lên ${selectedPlan.name}.`);
            }

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
