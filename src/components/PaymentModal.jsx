import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { X, CheckCircle, Loader } from 'lucide-react';

const PaymentModal = ({ planName, price, orderCode, bankAccount, bankId, accountName, onClose, onSuccess }) => {
  const [status, setStatus] = useState('pending'); // pending, success, failed

  useEffect(() => {
    // Đăng ký lắng nghe Realtime từ bảng orders
    const channel = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `order_code=eq.${orderCode}`
        },
        (payload) => {
          if (payload.new.status === 'paid') {
            setStatus('success');
            setTimeout(() => {
              onSuccess();
            }, 3000); // Đóng modal sau 3s
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderCode, onSuccess]);

  // Sinh link ảnh QR VietQR thông qua SePay hoặc VietQR API (Khuyến nghị VietQR để miễn phí và nhanh)
  // Format vietqr: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<DESCRIPTION>&accountName=<ACCOUNT_NAME>
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${bankAccount}-compact2.png?amount=${price}&addInfo=${orderCode}&accountName=${encodeURIComponent(accountName)}`;

  return (
    <div style={modalOverlayStyle}>
      <div className="animate-fade glass-card" style={modalContentStyle}>
        <button onClick={onClose} style={closeBtnStyle}><X size={24} /></button>
        
        {status === 'pending' ? (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: '0.25rem', color: 'hsl(var(--primary-hsl))', fontSize: '1.5rem' }}>Thanh toán Gói {planName}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Mở app ngân hàng và quét mã QR bên dưới.
            </p>
            
            <div style={{ background: 'white', padding: '0.5rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1rem' }}>
              <img src={qrUrl} alt="Payment QR Code" style={{ width: '200px', height: '200px', display: 'block' }} />
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', textAlign: 'left' }}>
              <p style={infoStyle}><strong>Ngân hàng:</strong> {bankId}</p>
              <p style={infoStyle}><strong>Số tài khoản:</strong> {bankAccount}</p>
              <p style={infoStyle}><strong>Chủ tài khoản:</strong> {accountName}</p>
              <p style={infoStyle}><strong>Số tiền:</strong> <span style={{ color: '#ff9632', fontWeight: 'bold' }}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}</span></p>
              <p style={infoStyle}><strong>Nội dung CK:</strong> <span style={{ color: '#32c864', fontWeight: 'bold' }}>{orderCode}</span></p>
            </div>
            
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <Loader size={16} className="animate-spin" />
              <span>Đang chờ thanh toán...</span>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <CheckCircle size={64} color="#32c864" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ color: '#32c864', marginBottom: '0.5rem' }}>Thanh toán Thành công!</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Gói dịch vụ <strong>{planName}</strong> của bạn đã được kích hoạt. Đang chuyển hướng...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const infoStyle = { margin: '0.25rem 0', fontSize: '0.85rem' };
const closeBtnStyle = { position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' };
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
};
const modalContentStyle = { 
  position: 'relative', width: '90%', maxWidth: '400px', 
  padding: '1.5rem', textAlign: 'center',
  maxHeight: '90vh', overflowY: 'auto'
};

export default PaymentModal;
