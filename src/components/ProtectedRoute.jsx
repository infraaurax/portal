import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, needsPasswordChange, loading, session } = useAuth();

  if (loading && !session) {
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

  if (!isAuthenticated && !session) {
    return <Navigate to="/" replace />;
  }

  if (needsPasswordChange) {
    return <Navigate to="/change-password" replace />;
  }

  return children;
};

export default ProtectedRoute;
