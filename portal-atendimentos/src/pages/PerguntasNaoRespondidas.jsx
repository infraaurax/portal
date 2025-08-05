import React from 'react';
import './PageStyles.css';

const PerguntasNaoRespondidas = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Perguntas não Respondidas</h1>
        <p className="page-description">Gerencie perguntas que ainda aguardam resposta</p>
      </div>
      
      <div className="page-content">
        <div className="content-placeholder">
          <div className="placeholder-icon">❓</div>
          <h3>Página em Desenvolvimento</h3>
          <p>Esta página será implementada em breve com todas as funcionalidades para gerenciar perguntas não respondidas.</p>
        </div>
      </div>
    </div>
  );
};

export default PerguntasNaoRespondidas;