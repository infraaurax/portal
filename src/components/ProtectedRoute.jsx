import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, needsPasswordChange, loading, session, user, logout } = useAuth();
  const isInactive = user?.status && user.status.toLowerCase() === 'inativo';

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Carregando...
      </div>
    );
  }

  useEffect(() => {
    if (isInactive && (isAuthenticated || session)) {
      logout();
    }
  }, [isInactive, isAuthenticated, session, logout]);

  // Não permitir acesso apenas com session; exige isAuthenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (isInactive) {
    return <Navigate to="/" replace />;
  }

  if (needsPasswordChange) {
    return <Navigate to="/change-password" replace />;
  }

  return children;
};

export default ProtectedRoute;
