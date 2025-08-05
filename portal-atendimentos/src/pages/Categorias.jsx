import React from 'react';
import './PageStyles.css';

const Categorias = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Categorias</h1>
        <p className="page-description">Gerencie categorias de atendimento</p>
      </div>
      
      <div className="page-content">
        <div className="content-placeholder">
          <div className="placeholder-icon">📂</div>
          <h3>Página em Desenvolvimento</h3>
          <p>Esta página será implementada em breve com todas as funcionalidades para gerenciar categorias de atendimento.</p>
        </div>
      </div>
    </div>
  );
};

export default Categorias;