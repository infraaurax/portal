import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { buscarPorEmail } from '../services/operadoresService';
 
import packageJson from '../../package.json';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
 
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginStep, setLoginStep] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [modalStep, setModalStep] = useState('code');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState('');
  
  
  
  const { loginMagic, verifyMagic, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (cooldown > 0) {
        setError(`Por segurança, aguarde ${cooldown}s antes de solicitar novamente.`);
        return;
      }
      const operador = await buscarPorEmail(email);
      if (operador && operador.status && operador.status.toLowerCase() === 'inativo') {
        setBlockedMessage('Sua conta está inativa, consulte o Administrador do sistema');
        setShowBlockedModal(true);
        setIsLoading(false);
        return;
      }
      const result = await loginMagic(email);
      if (!result.success) {
        setError(result.error || 'Falha ao enviar código');
      } else {
        setForgotPasswordEmail(email);
        setShowPasswordModal(true);
        setModalStep('code');
        setLoginStep('Código enviado!');
        setCooldown(10);
      }
    } catch {
      setError('Erro inesperado durante o login');
    } finally {
      setIsLoading(false);
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
      
      const result = await verifyMagic(forgotPasswordEmail, fullCode);
      if (!result.success) {
        const message = result.error || 'Código de verificação inválido.';
        if (message.toLowerCase().includes('inativo') || message.toLowerCase().includes('inativa')) {
          setBlockedMessage(message);
          setShowBlockedModal(true);
          setShowPasswordModal(false);
          setVerificationCode(['', '', '', '', '', '']);
          setError('');
        } else {
          setModalError(message);
          setError(message);
          setShowPasswordModal(false);
          setVerificationCode(['', '', '', '', '', '']);
        }
        return;
      }
      setShowPasswordModal(false);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Erro ao verificar código:', error);
      setModalError('Erro ao verificar código. Tente novamente.');
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  

  const closeModal = () => {
    setShowPasswordModal(false);
    setModalStep('code');
    setForgotPasswordEmail('');
    setVerificationCode(['', '', '', '', '', '']);
    setModalError('');
  };
  const closeBlockedModal = () => {
    setShowBlockedModal(false);
    setBlockedMessage('');
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
            
            {/* Fluxo magic login não utiliza senha */}
            
            {error && <div className="error-message">{error}</div>}
            {loginStep && (
              <div className={`loading-message ${loginStep.includes('sucesso') ? 'success' : ''}`}>
                {loginStep}
              </div>
            )}
            
            <button type="submit" className="login-button" disabled={isLoading || cooldown > 0}>
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Entrando...
                </>
              ) : (
                cooldown > 0 ? `Aguardar ${cooldown}s` : 'Entrar'
              )}
            </button>
           
            
            {/* Botão secundário não é necessário no magic login */}
          </form>
          
         
          
          <div className="login-version">
            <span className="version-label">v{packageJson.version}</span>
          </div>
        </div>
      </div>
      
      {/* Modal de Verificação de Acesso (Magic Login) */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Acessar via MagicLogin</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            
            
            
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
                        onPaste={(e) => {
                          e.preventDefault();
                          const text = (e.clipboardData || window.clipboardData).getData('text');
                          const digits = text.replace(/\D/g, '').slice(0, 6).split('');
                          const next = [...verificationCode];
                          for (let i = 0; i < digits.length; i++) {
                            const pos = index + i;
                            if (pos < 6) next[pos] = digits[i];
                          }
                          setVerificationCode(next);
                          const lastFilled = Math.min(index + digits.length - 1, 5);
                          const nextInput = e.target.parentElement.children[lastFilled];
                          if (nextInput) nextInput.focus();
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
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="info-message">
                  <p>Digite o código de 6 dígitos enviado para: <strong>{forgotPasswordEmail}</strong></p>
                </div>
                
                {modalError && <div className="error-message">{modalError}</div>}
                
                <div className="modal-buttons">
                  <button type="button" className="btn-secondary" onClick={closeModal} disabled={modalLoading}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={modalLoading}>
                    {modalLoading ? 'Validando...' : 'Validar Código'}
                  </button>
                </div>
              </form>
            )}
            
            
          </div>
        </div>
      )}
      {showBlockedModal && (
        <div className="modal-overlay" onClick={closeBlockedModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Acesso bloqueado</h2>
              <button className="modal-close" onClick={closeBlockedModal}>&times;</button>
            </div>
            <div className="modal-form">
              <div className="error-message">{blockedMessage || 'Sua conta está inativa, consulte o Administrador do sistema'}</div>
              <div className="modal-buttons">
                <button className="btn-primary" onClick={closeBlockedModal}>Entendi</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      
    </div>
  );
};

export default Login;
