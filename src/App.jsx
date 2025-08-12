import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import AtendimentosNaoFinalizados from './pages/AtendimentosNaoFinalizados';
import PerguntasNaoRespondidas from './pages/PerguntasNaoRespondidas';
import Usuarios from './pages/Usuarios';
import Categorias from './pages/Categorias';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={
              <RoleProtectedRoute allowedProfiles={['Admin', 'Operador']}>
                <Dashboard />
              </RoleProtectedRoute>
            } />
            <Route path="atendimentos-nao-finalizados" element={
              <RoleProtectedRoute allowedProfiles={['Admin', 'Operador']}>
                <AtendimentosNaoFinalizados />
              </RoleProtectedRoute>
            } />
            <Route path="perguntas-nao-respondidas" element={
              <RoleProtectedRoute allowedProfiles={['Admin']}>
                <PerguntasNaoRespondidas />
              </RoleProtectedRoute>
            } />
            <Route path="usuarios" element={
              <RoleProtectedRoute allowedProfiles={['Admin']}>
                <Usuarios />
              </RoleProtectedRoute>
            } />
            <Route path="categorias" element={
              <RoleProtectedRoute allowedProfiles={['Admin']}>
                <Categorias />
              </RoleProtectedRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App
