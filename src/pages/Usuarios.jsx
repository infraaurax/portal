import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { buscarTodos, criar, atualizar, alterarStatus } from '../services/operadoresService';
import { supabase } from '../lib/supabase';
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
  const [statusMessage, setStatusMessage] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carregar operadores da tabela
  useEffect(() => {
    const carregarOperadores = async () => {
      try {
        setLoading(true);
        const operadores = await buscarTodos();
        
        // Mapear dados dos operadores para o formato esperado pela interface
        const usuariosMapeados = operadores.map(operador => ({
          id: operador.id,
          nome: operador.nome,
          email: operador.email,
          cpf: operador.cpf || '-',
          perfil: operador.perfil || operador.tipo || 'Operador',
          status: operador.habilitado ? 'Ativo' : 'Bloqueado',
          dataCriacao: operador.data_criacao || operador.created_at,
          ultimoAcesso: operador.ultimo_acesso || '-'
        }));
        
        setUsuarios(usuariosMapeados);
      } catch (error) {
        console.error('Erro ao carregar operadores:', error);
        setStatusMessage('Erro ao carregar lista de usuários');
      } finally {
        setLoading(false);
      }
    };

    carregarOperadores();
  }, []);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: ''
  });



  // Função para aplicar máscara de CPF
  const applyCpfMask = (value) => {
    // Remove tudo que não é dígito
    const cleanValue = value.replace(/\D/g, '');
    
    // Aplica a máscara XXX.XXX.XXX-XX
    if (cleanValue.length <= 11) {
      return cleanValue
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  const handleOpenModal = (type, usuario = null) => {
    setModalType(type);
    setSelectedUser(usuario);
    if (type === 'edit' && usuario) {
      setFormData({
        nome: usuario.nome,
        email: usuario.email,
        cpf: usuario.cpf || ''
      });
    } else {
      setFormData({ nome: '', email: '', cpf: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormData({ nome: '', email: '', cpf: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (modalType === 'create') {
      try {
        setStatusMessage('Criando usuário...');
        
        // Criar usuário no Auth + tabela operadores
        const novoOperador = await criar({
          nome: formData.nome,
          email: formData.email,
          cpf: formData.cpf,
          perfil: 'Operador'
        });
        
        // Mapear para o formato da interface
        const novoUsuario = {
          id: novoOperador.id,
          nome: novoOperador.nome,
          email: novoOperador.email,
          cpf: novoOperador.cpf || '-',
          perfil: novoOperador.perfil || 'Operador',
          status: novoOperador.habilitado ? 'Ativo' : 'Bloqueado',
          dataCriacao: novoOperador.created_at,
          ultimoAcesso: '-'
        };
        
        setUsuarios([...usuarios, novoUsuario]);
        setStatusMessage(`Usuário criado com sucesso! Senha temporária: ${novoOperador.senhaTemporaria}`);
        
        // Limpar mensagem após 10 segundos (tempo para copiar a senha)
        setTimeout(() => setStatusMessage(''), 10000);
        
      } catch (error) {
        console.error('Erro ao criar usuário:', error);
        setStatusMessage('Erro ao criar usuário: ' + error.message);
        setTimeout(() => setStatusMessage(''), 5000);
      }
    } else if (modalType === 'edit') {
      try {
        setStatusMessage('Atualizando usuário...');
        
        // Atualizar usuário na tabela operadores
        const operadorAtualizado = await atualizar(selectedUser.id, {
          nome: formData.nome,
          email: formData.email,
          cpf: formData.cpf
        });
        
        // Atualizar o estado local com os dados atualizados
        setUsuarios(usuarios.map(u => 
          u.id === selectedUser.id ? {
            ...u,
            nome: operadorAtualizado.nome,
            email: operadorAtualizado.email,
            cpf: operadorAtualizado.cpf || '-'
          } : u
        ));
        
        setStatusMessage('Usuário atualizado com sucesso!');
        setTimeout(() => setStatusMessage(''), 3000);
        
      } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        setStatusMessage('Erro ao atualizar usuário: ' + error.message);
        setTimeout(() => setStatusMessage(''), 5000);
      }
    }
    
    handleCloseModal();
  };

  const handleBlockUser = async () => {
    try {
      setStatusMessage('Atualizando status do usuário...');
      
      // Determinar novo status
      const novoStatus = selectedUser.status === 'Ativo' ? 'inativo' : 'ativo';
      const novoStatusInterface = selectedUser.status === 'Ativo' ? 'Bloqueado' : 'Ativo';
      
      // Atualizar status na tabela operadores
      await alterarStatus(selectedUser.id, novoStatus);
      
      // Atualizar estado local
      setUsuarios(usuarios.map(u => 
        u.id === selectedUser.id 
          ? { ...u, status: novoStatusInterface }
          : u
      ));
      
      setStatusMessage(`Usuário ${novoStatusInterface.toLowerCase()} com sucesso!`);
      setTimeout(() => setStatusMessage(''), 3000);
      
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      setStatusMessage('Erro ao alterar status do usuário: ' + error.message);
      setTimeout(() => setStatusMessage(''), 5000);
    }
    
    handleCloseModal();
  };

  const handleResendPassword = async (usuario) => {
    try {
      setStatusMessage('Enviando email de reset de senha...');
      
      const { error } = await supabase.auth.resetPasswordForEmail(usuario.email, {
        redirectTo: `${window.location.origin}/change-password`
      });
      
      if (error) {
        console.error('Erro ao enviar email de reset:', error);
        setStatusMessage(`Erro ao enviar email: ${error.message}`);
      } else {
        setStatusMessage(`Email de reset de senha enviado para ${usuario.email}!`);
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
      setStatusMessage('Erro inesperado ao enviar email de reset.');
    }
    
    setTimeout(() => setStatusMessage(''), 5000);
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
      
      {statusMessage && (
        <div className="status-message success">
          {statusMessage}
        </div>
      )}
      
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
          <button
            onClick={() => handleOpenModal('create')}
            className="btn-primary"
          >
            + Novo Usuário
          </button>
        </div>

        {/* Lista de Usuários */}
        {loading ? (
          <div className="loading-container">
            <p>Carregando usuários...</p>
          </div>
        ) : (
          <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>CPF</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Data Criação</th>
                <th>Último Acesso</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsuarios.map(usuario => (
                <tr key={usuario.id}>
                  <td className="user-name">{usuario.nome}</td>
                  <td className="user-email">{usuario.email}</td>
                  <td className="user-cpf">{usuario.cpf || '-'}</td>
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
                  <td className="actions-cell">
                    <button
                      onClick={() => handleOpenModal('edit', usuario)}
                      className="btn-edit"
                      title="Editar usuário"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleResendPassword(usuario)}
                      className={`btn-resend ${usuario.ultimoAcesso === '-' ? 'enabled' : 'disabled'}`}
                      disabled={usuario.ultimoAcesso !== '-'}
                      title={usuario.ultimoAcesso === '-' ? 'Reenviar primeira senha' : 'Usuário já acessou o sistema'}
                    >
                      📧
                    </button>
                    <button
                      onClick={() => handleOpenModal('block', usuario)}
                      className={`btn-block ${usuario.status === 'Ativo' ? 'block' : 'unblock'}`}
                      title={usuario.status === 'Ativo' ? 'Bloquear usuário' : 'Desbloquear usuário'}
                    >
                      {usuario.status === 'Ativo' ? '🔒' : '🔓'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsuarios.length === 0 && !loading && (
            <div className="no-results">
              <p>Nenhum usuário encontrado com os filtros aplicados.</p>
            </div>
          )}
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
                
                <div className="form-group">
                  <label htmlFor="cpf">CPF *</label>
                  <input
                    type="text"
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => {
                      const maskedValue = applyCpfMask(e.target.value);
                      setFormData({...formData, cpf: maskedValue});
                    }}
                    required
                    className="form-input"
                    placeholder="000.000.000-00"
                    maxLength="14"
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