import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './utils/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--background)' }}>
        <div style={{ color: 'var(--color-charcoal)' }}>Đang tải...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
