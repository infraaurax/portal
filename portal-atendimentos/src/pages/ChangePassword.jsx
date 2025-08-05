import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import './ChangePassword.css';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { changePassword, needsPasswordChange, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!needsPasswordChange) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    const result = changePassword(newPassword);
    if (result.success) {
      setSuccess('Senha alterada com sucesso!');
      // Remove o redirecionamento automático - usuário permanece logado
    } else {
      setError('Erro ao alterar senha');
    }
  };

  return (
    <div className="change-password-container">
      <div className="change-password-card">
        <div className="change-password-header">
          <h1>Alterar Senha</h1>
          <p>É obrigatório alterar sua senha no primeiro acesso</p>
        </div>

        <form onSubmit={handleSubmit} className="change-password-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Senha Atual</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="Digite sua senha atual"
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">Nova Senha</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Digite sua nova senha"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirme sua nova senha"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="change-password-button">
            Alterar Senha
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;