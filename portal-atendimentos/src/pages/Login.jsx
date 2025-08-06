import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('joao.silva@aurax.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    const result = login(email, password);
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-logo-section">
        <div className="logo-container">
          <img src="/logo_xl.jpeg" alt="Logo AURAX" />
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
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Digite sua senha"
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" className="login-button">
              Entrar
            </button>
            
            <a href="#" className="forgot-password-link">
              Esqueceu sua senha?
            </a>
          </form>
          
          <div className="test-credentials">
            <p className="credentials-title">Credenciais de teste:</p>
            <p>Email: joao.silva@aurax.com</p>
            <p>Senha: 123456</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;