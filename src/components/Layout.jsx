import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { buscarPorEmail, atualizar } from '../services/operadoresService';
import { supabase } from '../lib/supabase';
import packageJson from '../../package.json';
import './Layout.css';

const Layout = () => {
  const { logout, user, atendimentoHabilitado, atendimentoPausado } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserModal, setShowUserModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [operadorData, setOperadorData] = useState(null);
  const [profileForm, setProfileForm] = useState({ nome: '', email: '', cpf: '' });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Log para verificar dados do usuário no Layout
  console.log('🖥️ [Layout] Dados do usuário recebidos:', user);
  console.log('🖥️ [Layout] Estado de autenticação:', { atendimentoHabilitado, atendimentoPausado });

  // Carregar dados completos do operador
  useEffect(() => {
    const carregarDadosOperador = async () => {
      if (user?.email) {
        try {
          const operador = await buscarPorEmail(user.email);
          setOperadorData(operador);
          // Preencher formulário de perfil
          if (operador) {
            setProfileForm({
              nome: operador.nome || '',
              email: operador.email || '',
              cpf: operador.cpf || ''
            });
          }
        } catch (error) {
          console.error('Erro ao carregar dados do operador:', error);
        }
      }
    };

    carregarDadosOperador();
  }, [user?.email]);

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

  const handleAvatarClick = () => {
    setShowUserModal(true);
  };

  const handleCloseModal = () => {
    setShowUserModal(false);
  };

  const handleProfileClick = () => {
    setShowUserModal(false);
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setProfileError('');
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordError('');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');

    try {
      const updatedOperador = await atualizar(operadorData.id, {
        nome: profileForm.nome,
        email: profileForm.email,
        cpf: profileForm.cpf
      });

      setOperadorData(updatedOperador);
      setShowProfileModal(false);
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setProfileError('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');

    try {
      // Validações
      if (passwordForm.newPassword.length < 6) {
        setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordError('As senhas não coincidem.');
        return;
      }

      // Atualizar a senha diretamente
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (updateError) {
        setPasswordError('Erro ao alterar senha. Tente novamente.');
        return;
      }

      setShowPasswordModal(false);
      alert('Senha alterada com sucesso!');
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setPasswordError('Erro ao alterar senha. Tente novamente.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangePasswordClick = () => {
    setShowProfileModal(false);
    setShowPasswordModal(true);
  };

  // Gerar iniciais para o avatar
  const getInitials = (nome) => {
    if (!nome) return 'U';
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Dados do usuário vindos do Supabase
  const userData = {
    name: operadorData?.nome || user?.nome || 'Usuário',
    profile: user?.perfil || 'Operador',
    email: user?.email || 'usuario@exemplo.com',
    accountStatus: user?.perfil === 'Admin' ? null : 'Habilitado'
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
            <div className="user-avatar" onClick={handleAvatarClick} title="Clique para ver perfil">
              {getInitials(userData.name)}
            </div>
          </div>
        </div>
      </header>
      
      <main className="main-content">
        <Outlet />
      </main>

      {/* Modal do Usuário */}
      {showUserModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Perfil do Usuário</h3>
              <button className="close-button" onClick={handleCloseModal}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="user-avatar-large">
                {getInitials(userData.name)}
              </div>
              
              <div className="user-details-modal">
                <div className="detail-item">
                  <label>Nome:</label>
                  <span>{operadorData?.nome || userData.name}</span>
                </div>
                
                <div className="detail-item">
                  <label>E-mail:</label>
                  <span>{operadorData?.email || userData.email}</span>
                </div>
                
                <div className="detail-item">
                  <label>CPF:</label>
                  <span>{operadorData?.cpf || '-'}</span>
                </div>
                
                <div className="detail-item">
                  <label>Perfil:</label>
                  <span>{operadorData?.perfil || userData.profile}</span>
                </div>
                
                <div className="detail-item">
                  <label>Status:</label>
                  <span className={`status-badge ${
                    operadorData?.habilitado ? 'status-active' : 'status-inactive'
                  }`}>
                    {operadorData?.habilitado ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                
                {userData.accountStatus && (
                  <div className="detail-item">
                    <label>Atendimento:</label>
                    <span className={`status-badge ${
                      atendimentoPausado ? 'status-paused' : 
                      atendimentoHabilitado ? 'status-active' : 'status-inactive'
                    }`}>
                      {atendimentoPausado ? 'Pausado' : 
                       atendimentoHabilitado ? 'Habilitado' : 'Não Habilitado'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="btn-profile" onClick={handleProfileClick}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Editar Perfil
              </button>
              
              <button className="btn-logout" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Perfil */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={handleCloseProfileModal}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Perfil</h3>
              <button className="close-button" onClick={handleCloseProfileModal}>
                ×
              </button>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="modal-body">
              {profileError && (
                <div className="error-message">{profileError}</div>
              )}
              
              <div className="form-group">
                <label htmlFor="nome">Nome:</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={profileForm.nome}
                  onChange={handleProfileFormChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">E-mail:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileFormChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="cpf">CPF:</label>
                <input
                  type="text"
                  id="cpf"
                  name="cpf"
                  value={profileForm.cpf}
                  onChange={handleProfileFormChange}
                />
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleChangePasswordClick}
                >
                  Alterar Senha
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={profileLoading}
                >
                  {profileLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Alteração de Senha */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={handleClosePasswordModal}>
          <div className="password-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Alterar Senha</h3>
              <button className="close-button" onClick={handleClosePasswordModal}>
                ×
              </button>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="modal-body">
              {passwordError && (
                <div className="error-message">{passwordError}</div>
              )}
              
              <div className="form-group">
                <label htmlFor="newPassword">Nova Senha:</label>
                <div className="password-input-container">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordFormChange}
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar Nova Senha:</label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordFormChange}
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={handleClosePasswordModal}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Alterando...' : 'Alterar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;