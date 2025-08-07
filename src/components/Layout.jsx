import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import packageJson from '../../package.json';
import './Layout.css';

const Layout = () => {
  const { logout, user, atendimentoHabilitado, atendimentoPausado } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: 'Atendimentos', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> },
    { path: '/atendimentos-nao-finalizados', label: 'Atendimentos não Finalizados', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg> },
    { path: '/perguntas-nao-respondidas', label: 'Perguntas não Respondidas', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m9,9a3,3 0 1,1 6,0c0,2 -3,3 -3,3"/><path d="m12,17 l.01,0"/></svg> },
    { path: '/usuarios', label: 'Usuários', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m22 21v-2a4 4 0 0 0-3-3.87"/><path d="m16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { path: '/categorias', label: 'Categorias', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Simular dados do usuário para demonstração
  const userData = {
    name: user?.name || 'João Silva',
    profile: user?.profile || 'Operador',
    email: user?.email || 'joao.silva@aurax.com',
    accountStatus: user?.profile === 'Administrador' ? null : 'Habilitado'
  };

  return (
    <div className="layout-container">
      <header className="top-header">
        <div className="header-left">
          <img src="/aurax-logo.svg" alt="Logo Aurax" className="header-logo" />
          <div className="version-info">
            <span className="version-label">v{packageJson.version}</span>
          </div>
        </div>
        
        <div className="header-center">
          <nav className="top-nav">
            {menuItems.map((item) => (
              <button
                key={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="header-right">
          <div className="user-section">
            <div className="user-info">
              <div className="user-name">{userData.name}</div>
              <div className="user-details">
                <span className="user-profile">{userData.profile}</span>
                <span className="user-email">{userData.email}</span>
                {userData.accountStatus && (
                  <span className="account-status">
                    Status do atendimento: <span className={`status-indicator ${
                      atendimentoPausado ? 'status-paused' : 
                      atendimentoHabilitado ? 'status-active' : 'status-inactive'
                    }`}>
                      {atendimentoPausado ? 'Pausado' : 
                       atendimentoHabilitado ? 'Habilitado' : 'Não Habilitado'}
                    </span>
                  </span>
                )}
              </div>
            </div>
            <button className="logout-button" onClick={handleLogout} title="Sair">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;