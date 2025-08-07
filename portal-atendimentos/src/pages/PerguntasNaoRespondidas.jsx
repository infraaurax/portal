import React, { useState } from 'react';
import './PageStyles.css';
import './PerguntasNaoRespondidas.css';

const PerguntasNaoRespondidas = () => {
  // Mock data para perguntas não respondidas
  const [perguntas, setPerguntas] = useState([
    {
      id: 1,
      pergunta: "Qual é a diferença entre seguro de vida e seguro de acidentes pessoais?",
      usuario: "5515981250815",
      dataHora: "2024-01-15 14:30",
      categoria: "Seguros",
      status: "pendente",
      tentativasIA: 3
    },
    {
      id: 2,
      pergunta: "Como funciona o cálculo de juros em precatórios alimentares?",
      usuario: "5515981250815",
      dataHora: "2024-01-15 10:15",
      categoria: "Precatório",
      status: "pendente",
      tentativasIA: 2
    },
    {
      id: 3,
      pergunta: "Posso usar meu FGTS como garantia para crédito consignado?",
      usuario: "5515981250815",
      dataHora: "2024-01-14 16:45",
      categoria: "Créditos",
      status: "pendente",
      tentativasIA: 1
    },
    {
      id: 4,
      pergunta: "Qual documentação necessária para cessão de precatório federal?",
      usuario: "5515981250815",
      dataHora: "2024-01-14 09:20",
      categoria: "Precatório",
      status: "pendente",
      tentativasIA: 4
    },
    {
      id: 5,
      pergunta: "Como funciona o seguro prestamista em financiamentos imobiliários?",
      usuario: "5515981250815",
      dataHora: "2024-01-13 13:10",
      categoria: "Seguros",
      status: "pendente",
      tentativasIA: 2
    },
    {
      id: 6,
      pergunta: "Qual a taxa de juros atual para crédito com garantia de imóvel?",
      usuario: "5515981250815",
      dataHora: "2024-01-13 08:45",
      categoria: "Créditos",
      status: "pendente",
      tentativasIA: 3
    },
    {
      id: 7,
      pergunta: "É possível antecipar o recebimento de precatório estadual?",
      usuario: "",
      dataHora: "2024-01-12 15:20",
      categoria: "Precatório",
      status: "pendente",
      tentativasIA: 1
    }
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [perguntaSelecionada, setPerguntaSelecionada] = useState(null);
  const [resposta, setResposta] = useState('');
  const [salvandoResposta, setSalvandoResposta] = useState(false);

  const abrirModalResposta = (pergunta) => {
    setPerguntaSelecionada(pergunta);
    setResposta('');
    setModalOpen(true);
  };

  const fecharModal = () => {
    setModalOpen(false);
    setPerguntaSelecionada(null);
    setResposta('');
  };

  const salvarResposta = async (e) => {
    e.preventDefault();
    
    if (!resposta.trim()) {
      alert('Por favor, digite uma resposta.');
      return;
    }

    setSalvandoResposta(true);
    
    try {
      // Simular delay de salvamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Atualizar a pergunta como respondida
      setPerguntas(prev => prev.map(p => 
        p.id === perguntaSelecionada.id 
          ? { ...p, status: 'respondida', resposta: resposta.trim(), dataResposta: new Date().toLocaleString('pt-BR') }
          : p
      ));
      
      alert(`Resposta salva com sucesso!\n\nPergunta: ${perguntaSelecionada.pergunta}\n\nResposta: ${resposta.trim()}\n\nNota: Esta é uma implementação mock. Em produção, a resposta seria salva no banco de dados.`);
      fecharModal();
    } catch (error) {
      alert('Erro ao salvar resposta. Tente novamente.');
    } finally {
      setSalvandoResposta(false);
    }
  };

  const perguntasPendentes = perguntas.filter(p => p.status === 'pendente');
  const perguntasRespondidas = perguntas.filter(p => p.status === 'respondida');

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Perguntas não Respondidas</h1>
        <p className="page-description">Gerencie perguntas que ainda aguardam resposta</p>
      </div>
      
      <div className="page-content">
        

        <div className="questions-section">
          <h2>Perguntas Pendentes</h2>
          {perguntasPendentes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <h3>Todas as perguntas foram respondidas!</h3>
              <p>Não há perguntas pendentes no momento.</p>
            </div>
          ) : (
            <div className="questions-list">
              {perguntasPendentes.map(pergunta => (
                <div key={pergunta.id} className="question-card">
                  <div className="question-header">
                    <div className="question-meta">
                      <span className="question-user">👤 {pergunta.usuario}</span>
                      <span className="question-date">📅 {pergunta.dataHora}</span>
                      <span className="question-category">🏷️ {pergunta.categoria}</span>
                    </div>
                    
                  </div>
                  <div className="question-content">
                    <h3>{pergunta.pergunta}</h3>
                  </div>
                  <div className="question-actions">
                    <button 
                      className="btn-primary"
                      onClick={() => abrirModalResposta(pergunta)}
                    >
                      📝 Responder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {perguntasRespondidas.length > 0 && (
          <div className="questions-section">
            <h2>Perguntas Respondidas Recentemente</h2>
            <div className="questions-list">
              {perguntasRespondidas.slice(0, 3).map(pergunta => (
                <div key={pergunta.id} className="question-card answered">
                  <div className="question-header">
                    <div className="question-meta">
                      <span className="question-user">👤 {pergunta.usuario}</span>
                      <span className="question-date">📅 {pergunta.dataHora}</span>
                      <span className="question-category">🏷️ {pergunta.categoria}</span>
                    </div>
                    <div className="question-status">
                      <span className="status-badge answered">✅ Respondida em {pergunta.dataResposta}</span>
                    </div>
                  </div>
                  <div className="question-content">
                    <h3>{pergunta.pergunta}</h3>
                    <div className="question-answer">
                      <strong>Resposta:</strong> {pergunta.resposta}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal para Responder Pergunta */}
      {modalOpen && perguntaSelecionada && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Responder Pergunta</h3>
              <button className="modal-close" onClick={fecharModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="question-details">
                <div className="detail-row">
                  <strong>Usuário:</strong> {perguntaSelecionada.usuario}
                </div>
                <div className="detail-row">
                  <strong>Data/Hora:</strong> {perguntaSelecionada.dataHora}
                </div>
                <div className="detail-row">
                  <strong>Categoria:</strong> {perguntaSelecionada.categoria}
                </div>
               
              </div>
              
              <div className="question-text">
                <h4>Pergunta:</h4>
                <p>{perguntaSelecionada.pergunta}</p>
              </div>

              <form onSubmit={salvarResposta}>
                <div className="form-group">
                  <label htmlFor="resposta">Sua Resposta *</label>
                  <textarea
                    id="resposta"
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    placeholder="Digite aqui a resposta para esta pergunta..."
                    rows={6}
                    required
                    disabled={salvandoResposta}
                  />
                </div>
                
                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={fecharModal}
                    disabled={salvandoResposta}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={salvandoResposta}
                  >
                    {salvandoResposta ? '💾 Salvando...' : '💾 Salvar Resposta'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerguntasNaoRespondidas;