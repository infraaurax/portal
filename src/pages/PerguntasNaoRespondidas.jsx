import React, { useState, useEffect } from 'react';
import './PageStyles.css';
import './PerguntasNaoRespondidas.css';
import { perguntasNaoRespondidasService } from '../services/perguntasNaoRespondidasService';
import { categoriasService } from '../services/categoriasService';
import operadoresService from '../services/operadoresService';
import { useAuth } from '../context/AuthContext';

const PerguntasNaoRespondidas = () => {
  const { user } = useAuth();
  const [perguntas, setPerguntas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [perguntaSelecionada, setPerguntaSelecionada] = useState(null);
  const [resposta, setResposta] = useState('');
  const [salvandoResposta, setSalvandoResposta] = useState(false);

  // Carregar perguntas do Supabase
  useEffect(() => {
    carregarPerguntas();
  }, []);

  const carregarPerguntas = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const [dadosPerguntas, dadosCategorias, dadosOperadores] = await Promise.all([
        perguntasNaoRespondidasService.listar(),
        categoriasService.listar(),
        operadoresService.buscarTodos()
      ]);
      setPerguntas(dadosPerguntas);
      setCategorias(dadosCategorias);
      setOperadores(dadosOperadores);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setErro('Erro ao carregar dados. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const obterNomeCategoria = (categoriaId) => {
    if (!categoriaId) return 'Sem categoria';
    const categoria = categorias.find(cat => cat.id === categoriaId);
    return categoria ? categoria.nome : 'Categoria não encontrada';
  };

  const obterNomeOperador = (operadorId) => {
    if (!operadorId) return 'Usuário não identificado';
    const operador = operadores.find(op => op.id === operadorId);
    return operador ? operador.nome : 'Operador não encontrado';
  };

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
      // Salvar resposta no Supabase
      await perguntasNaoRespondidasService.marcarComoRespondida(
        perguntaSelecionada.id,
        resposta,
        user?.id
      );
      
      // Recarregar a lista de perguntas
      await carregarPerguntas();
      
      // Fechar modal e limpar formulário
      setModalOpen(false);
      setPerguntaSelecionada(null);
      setResposta('');
      
      alert('Resposta salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar resposta:', error);
      alert('Erro ao salvar resposta. Tente novamente.');
    } finally {
      setSalvandoResposta(false);
    }
  };

  const perguntasPendentes = perguntas.filter(p => p.status === 'pendente' || !p.status);
  const perguntasRespondidas = perguntas.filter(p => p.status === 'respondida');

  // Função para formatar data
  const formatarData = (dataString) => {
    if (!dataString) return 'Data não disponível';
    try {
      const data = new Date(dataString);
      return data.toLocaleString('pt-BR');
    } catch {
      return dataString;
    }
  };

  // Função para calcular tempo sem resposta
  const calcularTempoSemResposta = (dataString) => {
    if (!dataString) return 'Tempo indeterminado';
    try {
      const dataCriacao = new Date(dataString);
      const agora = new Date();
      const diferencaMs = agora - dataCriacao;
      
      const minutos = Math.floor(diferencaMs / (1000 * 60));
      const horas = Math.floor(minutos / 60);
      const dias = Math.floor(horas / 24);
      
      if (dias > 0) {
        return `${dias} dia${dias > 1 ? 's' : ''}`;
      } else if (horas > 0) {
        return `${horas} hora${horas > 1 ? 's' : ''}`;
      } else if (minutos > 0) {
        return `${minutos} minuto${minutos > 1 ? 's' : ''}`;
      } else {
        return 'Menos de 1 minuto';
      }
    } catch {
      return 'Tempo indeterminado';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Perguntas não Respondidas</h1>
        <p className="page-description">Gerencie perguntas que ainda aguardam resposta</p>
      </div>
      
      <div className="page-content">
        {carregando && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Carregando perguntas...</p>
          </div>
        )}

        {erro && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Erro ao carregar perguntas</h3>
            <p>{erro}</p>
            <button className="btn-primary" onClick={carregarPerguntas}>
              🔄 Tentar Novamente
            </button>
          </div>
        )}

        {!carregando && !erro && (
          <>
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
                          <span className="question-user">👤 {obterNomeOperador(pergunta.operador_id)}</span>
                          <span className="question-date">📅 {formatarData(pergunta.created_at || pergunta.data_hora)}</span>
                          <span className="question-category">🏷️ {obterNomeCategoria(pergunta.categoria_id)}</span>
                        </div>
                        <div className="question-time-pending">
                          <span className="time-pending">⏰ Sem resposta há {calcularTempoSemResposta(pergunta.created_at || pergunta.data_hora)}</span>
                        </div>
                      </div>
                      <div className="question-content">
                        <h3>{pergunta.pergunta || pergunta.texto}</h3>
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
                          <span className="question-user">👤 {obterNomeOperador(pergunta.operador_id)}</span>
                          <span className="question-date">📅 {formatarData(pergunta.created_at || pergunta.data_hora)}</span>
                          <span className="question-category">🏷️ {obterNomeCategoria(pergunta.categoria_id)}</span>
                        </div>
                        <div className="question-status">
                          <span className="status-badge answered">✅ Respondida em {formatarData(pergunta.data_resposta)}</span>
                        </div>
                      </div>
                      <div className="question-content">
                        <h3>{pergunta.pergunta || pergunta.texto}</h3>
                        <div className="question-answer">
                          <strong>Resposta:</strong> {pergunta.resposta}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
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
                  <strong>Usuário:</strong> {obterNomeOperador(perguntaSelecionada.operador_id)}
                </div>
                <div className="detail-row">
                  <strong>Telefone do Cliente:</strong> {perguntaSelecionada.usuario_telefone || 'Telefone não informado'}
                </div>
                <div className="detail-row">
                  <strong>Data/Hora:</strong> {formatarData(perguntaSelecionada.created_at || perguntaSelecionada.data_hora)}
                </div>
                <div className="detail-row">
                  <strong>Categoria:</strong> {obterNomeCategoria(perguntaSelecionada.categoria_id)}
                </div>
              </div>
              
              <div className="question-text">
                <h4>Pergunta:</h4>
                <p>{perguntaSelecionada.pergunta || perguntaSelecionada.texto}</p>
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