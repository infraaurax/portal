import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
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
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="atendimentos-nao-finalizados" element={<AtendimentosNaoFinalizados />} />
            <Route path="perguntas-nao-respondidas" element={<PerguntasNaoRespondidas />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="categorias" element={<Categorias />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App
