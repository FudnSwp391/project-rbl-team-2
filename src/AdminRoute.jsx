import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './utils/AuthContext';
import { supabase } from './utils/supabaseClient';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setCheckingRole(false);
        return;
      }
      
      // Kiểm tra role trong user_metadata trước
      const metaRole = user.user_metadata?.role;
      if (metaRole === 'admin') {
        // Đồng bộ quyền admin xuống database để vượt qua RLS
        const { error: syncError } = await supabase.from('profiles').update({ 
          role: 'admin' 
        }).eq('id', user.id);
        
        if (syncError) console.error('Failed to sync admin role:', syncError);
        
        setIsAdmin(true);
        setCheckingRole(false);
        return;
      }

      // Nếu không có, query từ bảng profiles
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (data?.role === 'admin' || data?.role === 'Admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setCheckingRole(false);
    };

    if (!loading) {
      checkAdminRole();
    }
  }, [user, loading]);

  if (loading || checkingRole) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--background)' }}>
        <div style={{ color: 'var(--color-charcoal)' }}>Đang xác thực quyền truy cập...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin === false) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--background)', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ color: '#ff4d4d' }}>Truy cập bị từ chối</h2>
        <p>Bạn không có quyền quản trị để xem trang này.</p>
        <a href="/dashboard" className="btn btn--primary">Quay lại Dashboard</a>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
