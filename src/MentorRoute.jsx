import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './utils/AuthContext';
import { supabase } from './utils/supabaseClient';

const MentorRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [isMentor, setIsMentor] = useState(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkMentorRole = async () => {
      if (!user) {
        setCheckingRole(false);
        return;
      }

      // Check role in user_metadata first
      const metaRole = user.user_metadata?.role;
      if (metaRole === 'mentor') {
        setIsMentor(true);
        setCheckingRole(false);
        return;
      }

      // If not in metadata, query from profiles table
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (data?.role === 'mentor' || data?.role === 'Mentor') {
        setIsMentor(true);
      } else {
        setIsMentor(false);
      }
      setCheckingRole(false);
    };

    if (!loading) {
      checkMentorRole();
    }
  }, [user, loading]);

  if (loading || checkingRole) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--background)' }}>
        <div style={{ color: 'var(--color-charcoal)', fontFamily: 'var(--font-sans)' }}>Đang xác thực quyền Mentor...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isMentor === false) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--background)', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ color: 'var(--color-accent-hover)', fontFamily: 'var(--font-serif)' }}>Truy cập bị từ chối</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>Bạn không có quyền Mentor để xem trang này.</p>
        <a href="/dashboard" className="btn btn--primary" style={{ marginTop: '0.5rem' }}>Quay lại Dashboard</a>
      </div>
    );
  }

  return children;
};

export default MentorRoute;
