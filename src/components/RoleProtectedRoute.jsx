import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { buscarPorEmail } from '../services/operadoresService';
import { useState, useEffect } from 'react';

const RoleProtectedRoute = ({ children, allowedProfiles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const [operadorData, setOperadorData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const carregarPerfilUsuario = async () => {
      if (user?.email) {
        try {
          const operador = await buscarPorEmail(user.email);
          setOperadorData(operador);
        } catch (error) {
          console.error('Erro ao carregar perfil do usuário:', error);
        }
      }
      setLoadingProfile(false);
    };

    if (isAuthenticated && user) {
      carregarPerfilUsuario();
    } else {
      setLoadingProfile(false);
    }
  }, [user, isAuthenticated]);

  if (loading || loadingProfile) {
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

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const userProfile = operadorData?.perfil || user?.perfil || 'Operador';
  
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