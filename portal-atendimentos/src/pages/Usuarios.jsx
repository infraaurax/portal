import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './PageStyles.css';
import './Usuarios.css';

const Usuarios = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create', 'edit', 'block'
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProfile, setFilterProfile] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data - substituir pela integração com Supabase
  const [usuarios, setUsuarios] = useState([
    
    {
      id: 2,
      nome: 'Maria Santos',
      email: 'maria@aurax.com.br',
      perfil: 'Operador',
      status: 'Ativo',
      dataCriacao: '2024-01-10',
      ultimoAcesso: '2024-01-19'
    },
    {
      id: 3,
      nome: 'Pedro Costa',
      email: 'pedro@aurax.com.br',
      perfil: 'Operador',
      status: 'Bloqueado',
      dataCriacao: '2024-01-05',
      ultimoAcesso: '2024-01-15'
    }
  ]);

  const [formData, setFormData] = useState({
    nome: '',
    email: ''
  });

  const isAdmin = user?.perfil === 'Admin';

  const handleOpenModal = (type, usuario = null) => {
    setModalType(type);
    setSelectedUser(usuario);
    if (type === 'edit' && usuario) {
      setFormData({
        nome: usuario.nome,
        email: usuario.email
      });
    } else {
      setFormData({ nome: '', email: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormData({ nome: '', email: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalType === 'create') {
      const novoUsuario = {
        id: usuarios.length + 1,
        ...formData,
        perfil: 'Operador',
        status: 'Ativo',
        dataCriacao: new Date().toISOString().split('T')[0],
        ultimoAcesso: '-'
      };
      setUsuarios([...usuarios, novoUsuario]);
    } else if (modalType === 'edit') {
      setUsuarios(usuarios.map(u => 
        u.id === selectedUser.id ? { ...u, ...formData } : u
      ));
    }
    handleCloseModal();
  };

  const handleBlockUser = () => {
    setUsuarios(usuarios.map(u => 
      u.id === selectedUser.id 
        ? { ...u, status: u.status === 'Ativo' ? 'Bloqueado' : 'Ativo' }
        : u
    ));
    handleCloseModal();
  };

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProfile = filterProfile === 'all' || usuario.perfil === filterProfile;
    const matchesStatus = filterStatus === 'all' || usuario.status === filterStatus;
    return matchesSearch && matchesProfile && matchesStatus;
  });

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Usuários</h1>
        <p className="page-description">Gerencie usuários do sistema</p>
      </div>
      
      <div className="page-content">
        {/* Barra de Ações */}
        <div className="users-toolbar">
          <div className="search-filters">
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select
              value={filterProfile}
              onChange={(e) => setFilterProfile(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todos os Perfis</option>
              <option value="Admin">Admin</option>
              <option value="Operador">Operador</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todos os Status</option>
              <option value="Ativo">Ativo</option>
              <option value="Bloqueado">Bloqueado</option>
            </select>
          </div>
          {isAdmin && (
            <button
              onClick={() => handleOpenModal('create')}
              className="btn-primary"
            >
              + Novo Usuário
            </button>
          )}
        </div>

        {/* Lista de Usuários */}
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Data Criação</th>
                <th>Último Acesso</th>
                {isAdmin && <th>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {filteredUsuarios.map(usuario => (
                <tr key={usuario.id}>
                  <td className="user-name">{usuario.nome}</td>
                  <td className="user-email">{usuario.email}</td>
                  <td>
                    <span className={`profile-badge ${usuario.perfil.toLowerCase()}`}>
                      {usuario.perfil}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${usuario.status.toLowerCase()}`}>
                      {usuario.status}
                    </span>
                  </td>
                  <td>{new Date(usuario.dataCriacao).toLocaleDateString('pt-BR')}</td>
                  <td>{usuario.ultimoAcesso === '-' ? '-' : new Date(usuario.ultimoAcesso).toLocaleDateString('pt-BR')}</td>
                  {isAdmin && (
                    <td className="actions-cell">
                      <button
                        onClick={() => handleOpenModal('edit', usuario)}
                        className="btn-edit"
                        title="Editar usuário"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleOpenModal('block', usuario)}
                        className={`btn-block ${usuario.status === 'Ativo' ? 'block' : 'unblock'}`}
                        title={usuario.status === 'Ativo' ? 'Bloquear usuário' : 'Desbloquear usuário'}
                      >
                        {usuario.status === 'Ativo' ? '🔒' : '🔓'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsuarios.length === 0 && (
          <div className="no-results">
            <p>Nenhum usuário encontrado com os filtros aplicados.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalType === 'create' && 'Novo Usuário'}
                {modalType === 'edit' && 'Editar Usuário'}
                {modalType === 'block' && (selectedUser?.status === 'Ativo' ? 'Bloquear Usuário' : 'Desbloquear Usuário')}
              </h3>
              <button onClick={handleCloseModal} className="modal-close">×</button>
            </div>
            
            {modalType === 'block' ? (
              <div className="modal-body">
                <p>
                  Tem certeza que deseja {selectedUser?.status === 'Ativo' ? 'bloquear' : 'desbloquear'} o usuário <strong>{selectedUser?.nome}</strong>?
                </p>
                {selectedUser?.status === 'Ativo' && (
                  <div className="warning-message">
                    <strong>Atenção:</strong> O usuário não poderá mais acessar o sistema após o bloqueio.
                  </div>
                )}
                <div className="modal-actions">
                  <button onClick={handleCloseModal} className="btn-secondary">
                    Cancelar
                  </button>
                  <button onClick={handleBlockUser} className="btn-danger">
                    {selectedUser?.status === 'Ativo' ? 'Bloquear' : 'Desbloquear'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-group">
                  <label htmlFor="nome">Nome Completo *</label>
                  <input
                    type="text"
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    className="form-input"
                  />
                </div>
                

                
                {modalType === 'create' && (
                  <div className="password-info">
                    <p><strong>Senha:</strong> Será gerada automaticamente e enviada por email.</p>
                    <p><small>O usuário deverá alterar a senha no primeiro acesso.</small></p>
                  </div>
                )}
                
                <div className="modal-actions">
                  <button type="button" onClick={handleCloseModal} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {modalType === 'create' ? 'Criar Usuário' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;