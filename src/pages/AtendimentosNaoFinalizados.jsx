import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './PageStyles.css';
import './AtendimentosNaoFinalizados.css';

const AtendimentosNaoFinalizados = () => {
  const { user } = useAuth();
  const [modalRealocacao, setModalRealocacao] = useState(false);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState(null);
  const [operadorSelecionado, setOperadorSelecionado] = useState('');
  const [modalEditarNome, setModalEditarNome] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [novoNome, setNovoNome] = useState('');

  // Mock de atendimentos não finalizados
  const atendimentosNaoFinalizados = [
    {
      id: 'ATD-2024-011',
      nome: 'Carlos Silva',
      telefone: '+55 11 99999-8888',
      avatar: 'CS',
      status: 'nao_atendido',
      statusTexto: 'Não Atendido',
      operadorResponsavel: 'João Silva',
      operadorId: 'operador@exemplo.com',
      ultimaMensagem: 'Preciso de informações sobre meu seguro de vida',
      tempoSemResposta: '2h 15min',
      horarioUltimaMensagem: '13:45',
      prioridade: 'alta'
    },
    {
      id: 'ATD-2024-012',
      nome: 'Ana Costa',
      telefone: '+55 11 98888-7777',
      avatar: 'AC',
      status: 'pausado',
      statusTexto: 'Pausado',
      operadorResponsavel: 'Maria Santos',
      operadorId: 'maria.santos@exemplo.com',
      ultimaMensagem: 'Aguardando documentos para análise',
      tempoSemResposta: '45min',
      horarioUltimaMensagem: '14:30',
      prioridade: 'media'
    },
    {
      id: 'ATD-2024-013',
      nome: 'Roberto Lima',
      telefone: '+55 11 97777-6666',
      avatar: 'RL',
      status: 'abandonado',
      statusTexto: 'Abandonado',
      operadorResponsavel: 'João Silva',
      operadorId: 'operador@exemplo.com',
      ultimaMensagem: 'Cliente não respondeu após várias tentativas',
      tempoSemResposta: '1 dia 3h',
      horarioUltimaMensagem: '10:20',
      prioridade: 'baixa'
    },
    {
      id: 'ATD-2024-014',
      nome: 'Fernanda Oliveira',
      telefone: '+55 11 96666-5555',
      avatar: 'FO',
      status: 'nao_atendido',
      statusTexto: 'Não Atendido',
      operadorResponsavel: 'Pedro Costa',
      operadorId: 'pedro.costa@exemplo.com',
      ultimaMensagem: 'Quero cancelar minha apólice',
      tempoSemResposta: '30min',
      horarioUltimaMensagem: '15:00',
      prioridade: 'alta'
    }
  ];

  // Mock de operadores disponíveis
  const operadoresDisponiveis = [
    { id: 'operador@exemplo.com', nome: 'Operador Exemplo' },
    { id: 'maria.santos@exemplo.com', nome: 'Maria Santos' },
    { id: 'pedro.costa@exemplo.com', nome: 'Pedro Costa' },
    { id: 'ana.ferreira@exemplo.com', nome: 'Ana Ferreira' }
  ];

  // Função para retomar atendimento
  const retomarAtendimento = (atendimento) => {
    console.log('Retomando atendimento:', atendimento.id);
    // Aqui seria a lógica para retomar o atendimento
  };

  // Função para abrir modal de realocação
  const abrirModalRealocacao = (atendimento) => {
    setAtendimentoSelecionado(atendimento);
    setModalRealocacao(true);
  };

  // Função para realocar atendimento
  const realocarAtendimento = () => {
    if (operadorSelecionado && atendimentoSelecionado) {
      console.log('Realocando atendimento', atendimentoSelecionado.id, 'para', operadorSelecionado);
      setModalRealocacao(false);
      setAtendimentoSelecionado(null);
      setOperadorSelecionado('');
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
  const finalizarAtendimento = (atendimento) => {
    console.log('Finalizando atendimento:', atendimento.id);
    // Aqui seria a lógica para finalizar o atendimento
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

  // Função para agrupar atendimentos por status
  const agruparPorStatus = () => {
    const grupos = {
      nao_atendido: [],
      pausado: [],
      abandonado: []
    };
    
    atendimentosNaoFinalizados.forEach(atendimento => {
      if (grupos[atendimento.status]) {
        grupos[atendimento.status].push(atendimento);
      }
    });
    
    return grupos;
  };

  const atendimentosAgrupados = agruparPorStatus();

  // Configuração dos status
  const statusConfig = {
    nao_atendido: {
      titulo: 'Não Atendidos',
      cor: '#ef4444'
    },
    pausado: {
      titulo: 'Pausados',
      cor: '#f59e0b'
    },
    abandonado: {
      titulo: 'Abandonados',
      cor: '#6b7280'
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Atendimentos Não Finalizados</h1>
        <p>Gerencie atendimentos que precisam de atenção</p>
      </div>
      
      <div className="page-content">
        <div className="atendimentos-nao-finalizados">
          {atendimentosNaoFinalizados.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <h3>Nenhum atendimento pendente</h3>
              <p>Todos os atendimentos estão em dia!</p>
            </div>
          ) : (
            <div className="atendimentos-por-status">
              {Object.entries(statusConfig).map(([status, config]) => {
                const atendimentosDoStatus = atendimentosAgrupados[status];
                
                if (atendimentosDoStatus.length === 0) return null;
                
                return (
                  <div key={status} className="grupo-status">
                    <div className="status-header">
                      <span className="status-icon">{config.icon}</span>
                      <h2 className="status-titulo">{config.titulo}</h2>
                      <span className="status-contador">({atendimentosDoStatus.length})</span>
                    </div>
                    
                    <div className="atendimentos-linha">
                      {atendimentosDoStatus.map((atendimento) => (
                        <div key={atendimento.id} className={`atendimento-card ${getPrioridadeClass(atendimento.prioridade)}`}>
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
                                    ✏️
                                  </button>
                                </div>
                                <p>{atendimento.telefone}</p>
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
                              <strong>Responsável:</strong> {atendimento.operadorResponsavel}
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
                              onClick={() => finalizarAtendimento(atendimento)}
                            >
                              Finalizar Atendimento
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Realocação */}
      {modalRealocacao && atendimentoSelecionado && (
        <div className="modal-overlay">
          <div className="modal-realocacao">
            <div className="modal-header">
              <h3>Realocar Atendimento</h3>
              <button 
                className="btn-close"
                onClick={() => setModalRealocacao(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="atendimento-info">
                <h4>Atendimento: {atendimentoSelecionado.nome}</h4>
                <p>ID: {atendimentoSelecionado.id}</p>
                <p>Responsável atual: {atendimentoSelecionado.operadorResponsavel}</p>
              </div>
              
              <div className="operador-selection">
                <label htmlFor="operador-select">Selecionar novo operador:</label>
                <select 
                  id="operador-select"
                  value={operadorSelecionado}
                  onChange={(e) => setOperadorSelecionado(e.target.value)}
                >
                  <option value="">Selecione um operador...</option>
                  {operadoresDisponiveis.map((operador) => (
                    <option key={operador.id} value={operador.id}>
                      {operador.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-cancelar"
                onClick={() => setModalRealocacao(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar"
                onClick={realocarAtendimento}
                disabled={!operadorSelecionado}
              >
                Realocar
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
                <p><strong>Atendimento:</strong> {clienteEditando.id}</p>
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
              <button 
                className="btn-cancelar"
                onClick={cancelarEdicaoNome}
              >
                Cancelar
              </button>
              <button 
                className="btn-salvar"
                onClick={salvarNovoNome}
                disabled={!novoNome.trim()}
              >
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