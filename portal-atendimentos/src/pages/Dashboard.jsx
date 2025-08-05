import React from 'react';
import './PageStyles.css';

const Dashboard = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Atendimentos</h1>
        <p className="page-description">Gerencie todos os atendimentos do sistema</p>
      </div>
      
      <div className="page-content">
        <div className="content-placeholder">
          <div className="placeholder-icon">📞</div>
          <h3>Página em Desenvolvimento</h3>
          <p>Esta página será implementada em breve com todas as funcionalidades de atendimento.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;