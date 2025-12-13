import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { buscarPorEmail } from '../services/operadoresService';
import { useState, useEffect } from 'react';

const RoleProtectedRoute = ({ children, allowedProfiles = [] }) => {
  const { user, isAuthenticated, loading, session } = useAuth();

  // Aguardar até loading finalizar OU ter user disponível
  if (loading || (!user && session)) {
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

  // Com o AuthContext robusto, user.perfil já deve estar populado
  // Se não estiver (fallback raro), assume 'Operador' para não bloquear
  const userProfile = user?.perfil || 'Operador';

  // Se não há perfis permitidos especificados, permite acesso
  if (allowedProfiles.length === 0) {
    return children;
  }

  // Verifica se o perfil do usuário está na lista de perfis permitidos
  if (!allowedProfiles.includes(userProfile)) {
    // Redireciona para dashboard se não tem permissão
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleProtectedRoute;
