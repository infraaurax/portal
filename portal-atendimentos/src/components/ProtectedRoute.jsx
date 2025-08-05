import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, needsPasswordChange } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (needsPasswordChange) {
    return <Navigate to="/change-password" replace />;
  }

  return children;
};

export default ProtectedRoute;