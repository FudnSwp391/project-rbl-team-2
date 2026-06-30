import React, { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext();

export const useConfirm = () => {
  return useContext(ConfirmContext);
};

export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState(null);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmState({
        title: options.title || 'Xác nhận',
        message: options.message || 'Bạn có chắc chắn muốn thực hiện hành động này?',
        confirmText: options.confirmText || 'Xác nhận',
        cancelText: options.cancelText || 'Hủy bỏ',
        isDanger: options.isDanger || false,
        onConfirm: () => {
          setConfirmState(null);
          if (options.onConfirm) options.onConfirm();
          resolve(true);
        },
        onCancel: () => {
          setConfirmState(null);
          if (options.onCancel) options.onCancel();
          resolve(false);
        }
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      
      {confirmState && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999
        }}>
          <div className="animate-fade" style={{
            background: 'white', padding: '2rem', borderRadius: '20px', maxWidth: '400px', width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>
              {confirmState.title}
            </h3>
            <p style={{ color: '#475569', marginBottom: '2rem', lineHeight: '1.6', fontSize: '1rem' }}
               dangerouslySetInnerHTML={{ __html: confirmState.message }}>
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={confirmState.onCancel}
                style={{ flex: 1, padding: '0.85rem', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.target.style.background = '#f1f5f9'}
                onMouseOut={(e) => e.target.style.background = '#f8fafc'}
              >
                {confirmState.cancelText}
              </button>
              <button 
                onClick={confirmState.onConfirm}
                style={{ 
                  flex: 1, padding: '0.85rem', borderRadius: '12px', border: 'none', 
                  background: confirmState.isDanger ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)', 
                  color: 'white', fontWeight: 'bold', cursor: 'pointer', 
                  boxShadow: confirmState.isDanger ? '0 4px 15px rgba(239, 68, 68, 0.3)' : '0 4px 15px rgba(79, 70, 229, 0.3)', 
                  transition: 'transform 0.2s' 
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
