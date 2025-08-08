import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { buscarPorEmail } from '../services/operadoresService';
import { supabase } from '../lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import packageJson from '../../package.json';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginStep, setLoginStep] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [modalStep, setModalStep] = useState('email'); // 'email', 'code', 'password'
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [reauthToken, setReauthToken] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      setLoginStep('Validando credenciais...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Pequena pausa para UX
      
      setLoginStep('Verificando permissões...');
      const result = await login(email, password);
      
      if (!result.success) {
        setError(result.message);
      } else {
        setLoginStep('Login realizado com sucesso!');
        await new Promise(resolve => setTimeout(resolve, 800)); // Mostrar sucesso
      }
    } catch (err) {
      setError('Erro inesperado durante o login');
    } finally {
      setIsLoading(false);
      setLoginStep('');
    }
  };

  const handleForgotPassword = () => {
    setShowPasswordModal(true);
    setModalStep('email');
    setForgotPasswordEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setModalError('');
  };



  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);
    
    try {
      // Verificar se o email existe na tabela operadores
      const operador = await buscarPorEmail(forgotPasswordEmail);
      
      if (!operador) {
        setModalError('Email não encontrado no sistema.');
        return;
      }
      
      if (operador.status === 'inativo') {
        setModalError('Usuário inativo. Entre em contato com o administrador.');
        return;
      }
      
      // Enviar email de reset de senha
      const { data, error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        console.error('Erro ao enviar email de reset:', error);
        setModalError('Erro ao enviar email de reset. Tente novamente.');
        return;
      }
      
      // Avançar para a etapa de código
      setModalStep('code');
      
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      setModalError('Erro ao verificar email. Tente novamente.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);
    
    try {
      // Juntar os dígitos do código
      const fullCode = verificationCode.join('');
      
      // Validar o código de 6 dígitos
      if (fullCode.length !== 6) {
        setModalError('O código deve ter 6 dígitos.');
        return;
      }
      
      // Verificar o código com o Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: forgotPasswordEmail,
        token: fullCode,
        type: 'recovery'
      });
      
      if (error) {
        console.error('Erro ao verificar código:', error);
        setModalError('Código de verificação inválido.');
        return;
      }
      
      // Armazenar a sessão temporariamente para usar na alteração de senha
      if (data.session) {
        setReauthToken(data.session.access_token);
      }
      
      // Avançar para a etapa de alteração de senha
      setModalStep('password');
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      setModalError('Erro ao verificar código. Tente novamente.');
    } finally {
      setModalLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);
    
    try {
      // Validar senhas
      if (newPassword.length < 6) {
        setModalError('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        setModalError('As senhas não coincidem.');
        return;
      }
      
      // Verificar se temos o token de recovery
      if (!reauthToken) {
        setModalError('Sessão expirada. Reinicie o processo.');
        return;
      }
      
      // Usar o token de recovery para atualizar a senha
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        console.error('Erro ao alterar senha:', error);
        setModalError('Erro ao alterar senha. Tente novamente.');
        return;
      }
      
      // Fazer logout da sessão de recovery
      await supabase.auth.signOut();
      
      // Sucesso
      alert('Senha alterada com sucesso! Faça login com sua nova senha.');
      closeModal();
      
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setModalError('Erro ao alterar senha. Tente novamente.');
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setShowPasswordModal(false);
    setModalStep('email');
    setForgotPasswordEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setVerificationCode(['', '', '', '', '', '']);
    setReauthToken('');
    setModalError('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="login-container">
      <div className="login-logo-section">
        <div className="logo-container">
          <img src="/img_login.png" alt="Logo AURAX" />

        </div>
      </div>
      
      <div className="login-form-section">
        <div className="login-form-container">
          <h1 className="login-title">Portal de Atendimentos</h1>
          <p className="login-subtitle">Faça login para continuar</p>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Digite seu email"
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Digite sua senha"
                  disabled={isLoading}
                />
                <button
                   type="button"
                   className="password-toggle"
                   onClick={() => setShowPassword(!showPassword)}
                   disabled={isLoading}
                 >
                   <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                 </button>
              </div>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            {loginStep && (
              <div className={`loading-message ${loginStep.includes('sucesso') ? 'success' : ''}`}>
                {loginStep}
              </div>
            )}
            
            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
            
            <a href="#" className="forgot-password-link" onClick={(e) => { e.preventDefault(); handleForgotPassword(); }}>
              Esqueceu sua senha?
            </a>
          </form>
          
         
          
          <div className="login-version">
            <span className="version-label">v{packageJson.version}</span>
          </div>
        </div>
      </div>
      
      {/* Modal Esqueci Minha Senha */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Esqueci Minha Senha</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            
            {modalStep === 'email' && (
              <form onSubmit={handleEmailSubmit} className="modal-form">
                <div className="form-group">
                  <label htmlFor="forgot-email">Email</label>
                  <input
                    type="email"
                    id="forgot-email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required
                    placeholder="Digite seu email"
                    disabled={modalLoading}
                  />
                </div>
                
                <div className="info-message">
                  <p>Após confirmar seu email, enviaremos um link de reset de senha e um código de 6 dígitos para verificação.</p>
                </div>
                
                {modalError && <div className="error-message">{modalError}</div>}
                
                <div className="modal-buttons">
                  <button type="button" className="btn-secondary" onClick={closeModal} disabled={modalLoading}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={modalLoading}>
                    {modalLoading ? 'Verificando...' : 'Verificar Email'}
                  </button>
                </div>
              </form>
            )}
            
            {modalStep === 'code' && (
              <form onSubmit={handleCodeSubmit} className="modal-form">
                <div className="form-group">
                  <label>Código de Verificação</label>
                  <div className="code-inputs-container">
                    {verificationCode.map((digit, index) => (
                      <input
                        key={index}
                        type="text"
                        value={digit}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 1) {
                            const newCode = [...verificationCode];
                            newCode[index] = value;
                            setVerificationCode(newCode);
                            
                            // Auto-focus próximo input
                            if (value && index < 5) {
                              const nextInput = e.target.parentElement.children[index + 1];
                              if (nextInput) nextInput.focus();
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          // Backspace para voltar ao input anterior
                          if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
                            const prevInput = e.target.parentElement.children[index - 1];
                            if (prevInput) prevInput.focus();
                          }
                        }}
                        maxLength="1"
                        className="code-digit-input"
                        disabled={modalLoading}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="info-message">
                  <p>Um email de reset de senha foi enviado para: <strong>{forgotPasswordEmail}</strong></p>
                  <p>Digite o código de 6 dígitos enviado por email.</p>
                </div>
                
                {modalError && <div className="error-message">{modalError}</div>}
                
                <div className="modal-buttons">
                  <button type="button" className="btn-secondary" onClick={() => setModalStep('email')} disabled={modalLoading}>
                    Voltar
                  </button>
                  <button type="submit" className="btn-primary" disabled={modalLoading}>
                    {modalLoading ? 'Verificando...' : 'Verificar Código'}
                  </button>
                </div>
              </form>
            )}
            
            {modalStep === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="modal-form">
                <div className="form-group">
                  <label htmlFor="new-password">Nova Senha</label>
                  <div className="password-input-container">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Digite a nova senha"
                      disabled={modalLoading}
                    />
                    <button
                       type="button"
                       className="password-toggle"
                       onClick={() => setShowNewPassword(!showNewPassword)}
                       disabled={modalLoading}
                     >
                       <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                     </button>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirm-password">Confirmar Senha</label>
                  <div className="password-input-container">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirm-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirme a nova senha"
                      disabled={modalLoading}
                    />
                    <button
                       type="button"
                       className="password-toggle"
                       onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                       disabled={modalLoading}
                     >
                       <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                     </button>
                  </div>
                </div>
                
                {modalError && <div className="error-message">{modalError}</div>}
                
                <div className="modal-buttons">
                  <button type="button" className="btn-secondary" onClick={() => setModalStep('code')} disabled={modalLoading}>
                    Voltar
                  </button>
                  <button type="submit" className="btn-primary" disabled={modalLoading}>
                    {modalLoading ? 'Alterando...' : 'Alterar Senha'}
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

export default Login;