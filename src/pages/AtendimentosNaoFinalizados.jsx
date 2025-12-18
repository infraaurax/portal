import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { atendimentosService } from '../services/atendimentosService';
import './PageStyles.css';
import './AtendimentosNaoFinalizados.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faPause, faPen } from '@fortawesome/free-solid-svg-icons';

const AtendimentosNaoFinalizados = () => {
  console.log('🚀 [Component] AtendimentosNaoFinalizados renderizado');

  const { user } = useAuth();
  const [modalRealocacao, setModalRealocacao] = useState(false);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState(null);
  const [operadorSelecionado, setOperadorSelecionado] = useState('');
  const [modalEditarNome, setModalEditarNome] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [novoNome, setNovoNome] = useState('');
  const [atendimentosNaoFinalizados, setAtendimentosNaoFinalizados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalFinalizarOpen, setModalFinalizarOpen] = useState(false);
  const [atendimentoParaFinalizar, setAtendimentoParaFinalizar] = useState(null);

  // Carregar atendimentos não finalizados do Supabase
  useEffect(() => {
    carregarAtendimentosNaoFinalizados();
  }, []);

  const carregarAtendimentosNaoFinalizados = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Carregando atendimentos não finalizados...');
      const atendimentos = await atendimentosService.buscarNaoFinalizados();
      console.log('📋 Atendimentos carregados:', atendimentos);
      console.log('📊 Total de atendimentos:', atendimentos?.length || 0);

      setAtendimentosNaoFinalizados(atendimentos);
      console.log('✅ Atendimentos não finalizados carregados:', atendimentos);
    } catch (err) {
      console.error('❌ Erro ao carregar atendimentos não finalizados:', err);
      setError('Erro ao carregar atendimentos não finalizados');
    } finally {
      setLoading(false);
    }
  };


  // Estados para operadores
  const [operadoresDisponiveis, setOperadoresDisponiveis] = useState([]);
  const [loadingOperadores, setLoadingOperadores] = useState(false);

  // Carregar operadores quando o modal for aberto
  useEffect(() => {
    if (modalRealocacao) {
      carregarOperadores();
    }
  }, [modalRealocacao]);

  const carregarOperadores = async () => {
    try {
      setLoadingOperadores(true);
      const operadores = await atendimentosService.buscarOperadores();
      setOperadoresDisponiveis(operadores);
      console.log('👥 Operadores carregados:', operadores);
    } catch (error) {
      console.error('❌ Erro ao carregar operadores:', error);
      alert('Erro ao carregar lista de operadores');
    } finally {
      setLoadingOperadores(false);
    }
  };

  // Função para retomar atendimento
  const retomarAtendimento = async (atendimento) => {
    try {
      console.log('Retomando atendimento:', atendimento.id);
      await atendimentosService.atualizarStatus(atendimento.id, 'em-andamento');
      alert('Atendimento retomado com sucesso!');
      await carregarAtendimentosNaoFinalizados(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao retomar atendimento:', error);
      alert('Erro ao retomar atendimento');
    }
  };

  // Função para abrir modal de realocação
  const abrirModalRealocacao = (atendimento) => {
    setAtendimentoSelecionado(atendimento);
    setModalRealocacao(true);
  };

  // Função para realocar atendimento
  const realocarAtendimento = async () => {
    if (operadorSelecionado && atendimentoSelecionado) {
      try {
        const operadorEscolhido = operadoresDisponiveis.find(op => op.id === operadorSelecionado);

        console.log('🔄 Realocando atendimento:', {
          atendimento: atendimentoSelecionado.codigo,
          deOperador: atendimentoSelecionado.operadorResponsavel,
          paraOperador: operadorEscolhido?.nome,
          operadorId: operadorSelecionado
        });

        // Realocar atendimento (atualiza operador_id e status para aguardando)
        await atendimentosService.realocarAtendimento(atendimentoSelecionado.id, operadorSelecionado);

        alert(`Atendimento de ${atendimentoSelecionado.nome} realocado com sucesso para ${operadorEscolhido?.nome}!`);

        // Fechar modal e limpar seleções
        setModalRealocacao(false);
        setAtendimentoSelecionado(null);
        setOperadorSelecionado('');

        // Recarregar dados
        await carregarAtendimentosNaoFinalizados();
      } catch (error) {
        console.error('❌ Erro ao realocar atendimento:', error);
        alert(`Erro ao realocar atendimento: ${error.message || 'Erro desconhecido'}`);
      }
    }
  };

  // Função para abrir modal de edição de nome
  const editarNomeCliente = (atendimento) => {
    setClienteEditando(atendimento);
    setNovoNome(atendimento.nome);
    setModalEditarNome(true);
  };

  // Função para salvar novo nome
  const salvarNovoNome = () => {
    if (novoNome.trim() && clienteEditando) {
      console.log('Alterando nome do cliente', clienteEditando.id, 'para', novoNome);
      // Aqui seria a lógica para salvar o novo nome na API
      setModalEditarNome(false);
      setClienteEditando(null);
      setNovoNome('');
    }
  };

  // Função para cancelar edição de nome
  const cancelarEdicaoNome = () => {
    setModalEditarNome(false);
    setClienteEditando(null);
    setNovoNome('');
  };

  // Função para finalizar atendimento
  const abrirModalFinalizar = (atendimento) => {
    setAtendimentoParaFinalizar(atendimento);
    setModalFinalizarOpen(true);
  };

  const cancelarFinalizacao = () => {
    setModalFinalizarOpen(false);
    setAtendimentoParaFinalizar(null);
  };

  const confirmarFinalizacao = async () => {
    if (!atendimentoParaFinalizar) return;
    try {
      await atendimentosService.finalizarAtendimento(atendimentoParaFinalizar.id);
      await atendimentosService.enviarWebhookResetarAtendimento(atendimentoParaFinalizar.telefone);
      setModalFinalizarOpen(false);
      setAtendimentoParaFinalizar(null);
      await carregarAtendimentosNaoFinalizados();
    } catch (error) {
      console.error('❌ Erro ao finalizar atendimento:', error);
      setModalFinalizarOpen(false);
      setAtendimentoParaFinalizar(null);
    }
  };

  // Função para verificar se o usuário é responsável pelo atendimento
  const isResponsavel = (atendimento) => {
    return user?.email === atendimento.operadorId;
  };

  // Função para obter classe de prioridade
  const getPrioridadeClass = (prioridade) => {
    switch (prioridade) {
      case 'alta': return 'prioridade-alta';
      case 'media': return 'prioridade-media';
      case 'baixa': return 'prioridade-baixa';
      default: return '';
    }
  };
  
  const tempoEmMinutos = (texto) => {
    const s = (texto || '').toLowerCase();
    let total = 0;
    const dias = s.match(/(\d+)\s*dias?/);
    if (dias) total += parseInt(dias[1], 10) * 1440;
    const horas = s.match(/(\d+)\s*h/);
    if (horas) total += parseInt(horas[1], 10) * 60;
    const mins = s.match(/(\d+)\s*min/);
    if (mins) total += parseInt(mins[1], 10);
    return total;
  };

  const getTempoClasse = (atendimento) => {
    const minutos = tempoEmMinutos(atendimento?.tempoSemResposta);
    if (minutos <= 30) return 'tempo-verde';
    if (minutos <= 60) return 'tempo-laranja';
    return 'tempo-vermelho';
  };

  // Função para agrupar atendimentos por status
  const agruparPorStatus = () => {
    const grupos = {
      novo: [],
      'em-andamento': [],
      aguardando: []
    };

    console.log('🔄 Agrupando atendimentos por status...');
    console.log('📋 Atendimentos para agrupar:', atendimentosNaoFinalizados);

    atendimentosNaoFinalizados.forEach(atendimento => {
      console.log(`📌 Processando atendimento ${atendimento.id} com status: ${atendimento.status}`);
      if (grupos[atendimento.status]) {
        grupos[atendimento.status].push(atendimento);
        console.log(`✅ Atendimento adicionado ao grupo ${atendimento.status}`);
      } else {
        console.log(`⚠️ Status ${atendimento.status} não encontrado nos grupos disponíveis:`, Object.keys(grupos));
      }
    });

    console.log('📊 Grupos finais:', grupos);
    return grupos;
  };

  const atendimentosAgrupados = agruparPorStatus();

  const [activeTab, setActiveTab] = useState('em-andamento');
  const emAndamentoList = atendimentosNaoFinalizados.filter(a => a.status === 'em-andamento');
  const aguardandoList = atendimentosNaoFinalizados.filter(a => a.status === 'aguardando');

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Atendimentos Não Finalizados</h1>
        <p>Gerencie atendimentos que precisam de atenção</p>
      </div>

      <div className="page-content">
        <div className="atendimentos-nao-finalizados">
          {loading ? (
            <div className="loading-state">
              <div className="loading-icon">⏳</div>
              <h3>Carregando atendimentos...</h3>
              <p>Buscando atendimentos não finalizados</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">❌</div>
              <h3>Erro ao carregar</h3>
              <p>{error}</p>
              <button
                className="btn-retry"
                onClick={carregarAtendimentosNaoFinalizados}
              >
                Tentar novamente
              </button>
            </div>
          ) : atendimentosNaoFinalizados.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <h3>Nenhum atendimento pendente</h3>
              <p>Todos os atendimentos estão em dia!</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: '8px', margin: '10px 0' }}>
                <button
                  className={activeTab === 'em-andamento' ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => setActiveTab('em-andamento')}
                >
                  Em Andamento
                </button>
                <button
                  className={activeTab === 'aguardando' ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => setActiveTab('aguardando')}
                >
                  Aguardando
                </button>
              </div>
              <div className="grupo-status">
                <div className="status-header">
                  <span className="status-icon">
                    <FontAwesomeIcon icon={activeTab === 'em-andamento' ? faClock : faPause} />
                  </span>
                  <h2 className="status-titulo">{activeTab === 'em-andamento' ? 'Em Andamento' : 'Aguardando'}</h2>
                  <span className="status-contador">({activeTab === 'em-andamento' ? emAndamentoList.length : aguardandoList.length})</span>
                </div>
                <div className="atendimentos-grid">
                  {(activeTab === 'em-andamento' ? emAndamentoList : aguardandoList).map((atendimento) => (
                        <div key={atendimento.id} className={`atendimento-card ${getTempoClasse(atendimento)}`}>
                          <div className="card-header">
                            <div className="cliente-info">
                              <div className="cliente-avatar">{atendimento.avatar}</div>
                              <div className="cliente-dados">
                                <div className="nome-container">
                                  <h4>{atendimento.nome}</h4>
                                  <button
                                    className="btn-edit-nome-cliente"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      editarNomeCliente(atendimento);
                                    }}
                                    title="Editar nome do cliente"
                                  >
                                    <FontAwesomeIcon icon={faPen} />
                                  </button>
                                </div>
                                <div className="atendimento-codigo">#{atendimento.codigo}</div>
                                <p>{atendimento.telefone}</p>
                                <p>Responsável: {atendimento.operador_id ? (atendimento.operadorResponsavel || (atendimento.operador && atendimento.operador.nome) || '-') : 'Sem operador atribuido'}</p>

                              </div>
                            </div>
                            <div className="status-info">
                              <span className={`status-badge ${atendimento.status}`}>
                                {atendimento.statusTexto}
                              </span>
                              <div className="tempo-sem-resposta">
                                <span className="tempo-label">Sem resposta há:</span>
                                <span className="tempo-valor">{atendimento.tempoSemResposta}</span>
                              </div>
                            </div>
                          </div>

                          <div className="card-body">
                            <div className="operador-responsavel">
                            </div>
                            <div className="ultima-mensagem">
                              <strong>Última mensagem:</strong>
                              <p>"{atendimento.ultimaMensagem}"</p>
                              <span className="horario">{atendimento.horarioUltimaMensagem}</span>
                            </div>
                          </div>

                          <div className="card-actions">
                            {isResponsavel(atendimento) ? (
                              <button
                                className="btn-retomar"
                                onClick={() => retomarAtendimento(atendimento)}
                              >
                                Retomar Atendimento
                              </button>
                            ) : (
                              <button
                                className="btn-realocar"
                                onClick={() => abrirModalRealocacao(atendimento)}
                              >
                                Realocar Atendimento
                              </button>
                            )}
                            <button
                              className="btn-finalizar"
                              onClick={() => abrirModalFinalizar(atendimento)}
                            >
                              Finalizar Atendimento
                            </button>
                          </div>
                        </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de Realocação */}
      {modalRealocacao && atendimentoSelecionado && (
        <div className="modal-overlay">
          <div className="modal-realocacao">
            <div className="modal-header">
              <h3>Realocar Atendimento</h3>
             
            </div>

            <div className="modal-body">
              <div className="atendimento-info">
                <h4>Atendimento: {atendimentoSelecionado.nome}</h4>
                <p>ID: {atendimentoSelecionado.id}</p>
                <p>Responsável atual: {atendimentoSelecionado.operador_id ? (atendimentoSelecionado.operadorResponsavel || (atendimentoSelecionado.operador && atendimentoSelecionado.operador.nome) || '-') : 'Sem operador atribuido'}</p>
              </div>

              <div className="operador-selection">
                <label htmlFor="operador-select">Selecionar novo operador:</label>
                {loadingOperadores ? (
                  <div className="loading-operadores">
                    <span>⏳ Carregando operadores...</span>
                  </div>
                ) : (
                  <select
                    id="operador-select"
                    value={operadorSelecionado}
                    onChange={(e) => setOperadorSelecionado(e.target.value)}
                    disabled={operadoresDisponiveis.length === 0}
                  >
                    <option value="">
                      {operadoresDisponiveis.length === 0
                        ? 'Nenhum operador disponível'
                        : 'Selecione um operador...'
                      }
                    </option>
                    {operadoresDisponiveis.map((operador) => (
                      <option key={operador.id} value={operador.id}>
                        {operador.nome} ({operador.perfil})
                      </option>
                    ))}
                  </select>
                )}
                {operadoresDisponiveis.length === 0 && !loadingOperadores && (
                  <div className="operadores-error">
                    <small style={{ color: '#ef4444' }}>
                      ⚠️ Nenhum operador ativo encontrado
                    </small>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setModalRealocacao(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={realocarAtendimento} disabled={!operadorSelecionado || loadingOperadores}>
                {loadingOperadores ? 'Carregando...' : 'Realocar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalFinalizarOpen && atendimentoParaFinalizar && (
        <div className="modal-overlay">
          <div className="modal-finalizar">
            <div className="modal-header">
              <h3>Finalizar Atendimento</h3>
              <button
                className="btn-close"
                onClick={cancelarFinalizacao}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="finalizar-info">
                <div className="finalizar-row"><strong>Cliente:</strong> {atendimentoParaFinalizar.nome}</div>
                <div className="finalizar-row"><strong>Código:</strong> {atendimentoParaFinalizar.codigo}</div>
                <div className="finalizar-row"><strong>Telefone:</strong> {atendimentoParaFinalizar.telefone}</div>
                <div className="finalizar-row"><strong>Status Atual:</strong> {atendimentoParaFinalizar.statusTexto || atendimentoParaFinalizar.status}</div>
              </div>
              <div className="finalizar-warning">
                <div className="finalizar-warning-title">Atenção</div>
                <div className="finalizar-warning-text">
                  Esta ação irá finalizar o atendimento e não poderá ser desfeita.
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={cancelarFinalizacao}>
                Cancelar
              </button>
              <button className="btn-danger" onClick={confirmarFinalizacao}>
                Finalizar Atendimento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Nome */}
      {modalEditarNome && clienteEditando && (
        <div className="modal-overlay">
          <div className="modal-editar-nome">
            <div className="modal-header">
              <h3>Editar Nome do Cliente</h3>
              <button
                className="btn-close"
                onClick={cancelarEdicaoNome}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="cliente-info">
                <p><strong>Código:</strong> {clienteEditando.codigo}</p>
                <p><strong>Telefone:</strong> {clienteEditando.telefone}</p>
              </div>

              <div className="form-group">
                <label htmlFor="novoNome">Nome do Cliente:</label>
                <input
                  type="text"
                  id="novoNome"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Digite o novo nome"
                  autoFocus
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={cancelarEdicaoNome}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={salvarNovoNome} disabled={!novoNome.trim()}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AtendimentosNaoFinalizados;
