import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

  // Mock de usuário para teste
  // firstLogin alterado para false para evitar redirecionamento obrigatório para mudança de senha
  const mockUser = {
    email: 'admin@aurax.com',
    password: '123456',
    firstLogin: false
  };

  const login = (email, password) => {
    if (email === mockUser.email && password === mockUser.password) {
      setUser({ email });
      setIsAuthenticated(true);
      setNeedsPasswordChange(mockUser.firstLogin);
      return { success: true };
    }
    return { success: false, message: 'Credenciais inválidas' };
  };

  const changePassword = (newPassword) => {
    // Mock da mudança de senha
    mockUser.firstLogin = false;
    setNeedsPasswordChange(false);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setNeedsPasswordChange(false);
  };

  const value = {
    user,
    isAuthenticated,
    needsPasswordChange,
    login,
    changePassword,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};