import React from 'react';
import './PageStyles.css';

const AtendimentosNaoFinalizados = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Atendimentos não Finalizados</h1>
        <p className="page-description">Visualize e gerencie atendimentos pendentes de finalização</p>
      </div>
      
      <div className="page-content">
        <div className="content-placeholder">
          <div className="placeholder-icon">⏳</div>
          <h3>Página em Desenvolvimento</h3>
          <p>Esta página será implementada em breve com todas as funcionalidades para gerenciar atendimentos não finalizados.</p>
        </div>
      </div>
    </div>
  );
};

export default AtendimentosNaoFinalizados;