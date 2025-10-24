import React, { useState, useEffect } from 'react';
import atendimentosService from '../services/atendimentosService';
import filaSimplificadaService from '../services/filaSimplificadaService';
import './FilaInteligente.css';

const FilaInteligente = () => {
  const [atendimentosAguardando, setAtendimentosAguardando] = useState([]);
  const [atendimentosRisco, setAtendimentosRisco] = useState([]);
  const [estatisticas, setEstatisticas] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const [modalAtribuir, setModalAtribuir] = useState(false);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState(null);
  const [operadoresDisponiveis, setOperadoresDisponiveis] = useState([]);
  const [distribuicaoAutomaticaAtiva, setDistribuicaoAutomaticaAtiva] = useState(() => {
    // Recuperar estado salvo do localStorage
    const saved = localStorage.getItem('distribuicaoAutomaticaAtiva');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Buscar atendimentos aguardando
  const carregarAtendimentosAguardando = async () => {
    try {
      setLoading(true);
      console.log('🔍 Carregando atendimentos aguardando...');
      
      // Buscar atendimentos com status "aguardando" (não por fila_status)
      const atendimentos = await atendimentosService.buscarAtendimentosPorStatus('aguardando');
      console.log('📋 Atendimentos encontrados:', atendimentos);
      console.log('📊 Quantidade de atendimentos:', atendimentos?.length || 0);
      
      // Buscar estatísticas e atendimentos de risco
      const risco = await atendimentosService.monitorarAtendimentosRisco();
      const stats = await atendimentosService.obterEstatisticasAtendimentos();
      
      setAtendimentosAguardando(atendimentos);
      setAtendimentosRisco(risco);
      setEstatisticas(stats);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Erro ao carregar atendimentos aguardando:', error);
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal de atribuição
  const abrirModalAtribuir = async (atendimento) => {
    try {
      console.log('🎯 Abrindo modal para atendimento:', atendimento);
      setAtendimentoSelecionado(atendimento);
      
      // Buscar operadores online e habilitados
      console.log('🔍 Buscando operadores disponíveis...');
      const operadores = await atendimentosService.buscarOperadoresDisponiveis();
      console.log('✅ Operadores encontrados:', operadores.length);
      setOperadoresDisponiveis(operadores);
      
      console.log('🖼️ Abrindo modal...');
      setModalAtribuir(true);
      console.log('✅ Modal aberta com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao carregar operadores disponíveis:', error);
      alert('Erro ao carregar operadores: ' + error.message);
    }
  };

  // Atribuir atendimento a operador
  const atribuirAtendimento = async (operadorId) => {
    try {
      if (!atendimentoSelecionado || !operadorId) return;
      
      await atendimentosService.aceitarAtendimentoAguardando(atendimentoSelecionado.id, operadorId);
      
      // Fechar modal e recarregar
      setModalAtribuir(false);
      setAtendimentoSelecionado(null);
      await carregarAtendimentosAguardando();
      
      alert('Atendimento atribuído com sucesso!');
    } catch (error) {
      console.error('Erro ao atribuir atendimento:', error);
      alert(`Erro ao atribuir atendimento: ${error.message}`);
    }
  };

  // Executar distribuição automática
  const executarDistribuicao = async () => {
    try {
      setLoading(true);
      const resultado = await filaSimplificadaService.forcarDistribuicao();
      await carregarAtendimentosAguardando();
      if (resultado.success) {
        alert('Distribuição automática executada com sucesso!');
      } else {
        alert('Nenhuma distribuição necessária no momento.');
      }
    } catch (error) {
      console.error('Erro ao executar distribuição:', error);
      alert(`Erro na distribuição: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Iniciar distribuição automática contínua
  const iniciarDistribuicaoAutomatica = async () => {
    try {
      console.log('🚀 Iniciando distribuição automática contínua...');
      await atendimentosService.iniciarDistribuicaoAutomatica(30); // A cada 30 segundos
      setDistribuicaoAutomaticaAtiva(true);
      console.log('✅ Distribuição automática contínua iniciada!');
    } catch (error) {
      console.error('❌ Erro ao iniciar distribuição automática:', error);
      alert(`Erro ao iniciar distribuição automática: ${error.message}`);
    }
  };

  // Parar distribuição automática contínua
  const pararDistribuicaoAutomatica = () => {
    try {
      console.log('⏹️ Parando distribuição automática contínua...');
      atendimentosService.pararDistribuicaoAutomatica();
      setDistribuicaoAutomaticaAtiva(false);
      console.log('✅ Distribuição automática contínua parada!');
    } catch (error) {
      console.error('❌ Erro ao parar distribuição automática:', error);
      alert(`Erro ao parar distribuição automática: ${error.message}`);
    }
  };

  // Toggle distribuição automática
  const toggleDistribuicaoAutomatica = () => {
    if (distribuicaoAutomaticaAtiva) {
      pararDistribuicaoAutomatica();
    } else {
      iniciarDistribuicaoAutomatica();
    }
  };

  // Salvar estado da distribuição automática no localStorage
  useEffect(() => {
    localStorage.setItem('distribuicaoAutomaticaAtiva', JSON.stringify(distribuicaoAutomaticaAtiva));
  }, [distribuicaoAutomaticaAtiva]);



  // Buscar dados iniciais e iniciar distribuição automática se estava ativa
  useEffect(() => {
    console.log('🚀 Componente FilaInteligente montado');
    carregarAtendimentosAguardando();
    
    // Iniciar distribuição automática após 2 segundos apenas se estava ativa
    if (distribuicaoAutomaticaAtiva) {
      const timer = setTimeout(() => {
        console.log('🤖 Iniciando distribuição automática (estado salvo)...');
        iniciarDistribuicaoAutomatica();
      }, 2000);
      
      return () => clearTimeout(timer);
    }

    // Cleanup: parar distribuição automática quando componente for desmontado
    return () => {
      if (atendimentosService.isDistribuicaoAutomaticaAtiva()) {
        console.log('🧹 Limpando distribuição automática...');
        atendimentosService.pararDistribuicaoAutomatica();
      }
    };
  }, [distribuicaoAutomaticaAtiva]);

  // Log quando atendimentos são carregados
  useEffect(() => {
    console.log('📋 Atendimentos aguardando atualizados:', atendimentosAguardando.length);
  }, [atendimentosAguardando]);

  // Log quando modal muda
  useEffect(() => {
    console.log('🖼️ Estado da modal mudou:', modalAtribuir);
    console.log('📋 Atendimento selecionado:', atendimentoSelecionado?.nome);
    console.log('👥 Operadores disponíveis:', operadoresDisponiveis.length);
  }, [modalAtribuir, atendimentoSelecionado, operadoresDisponiveis]);

  // Formatar tempo de espera
  const formatarTempoEspera = (dataCriacao) => {
    const agora = new Date();
    const criacao = new Date(dataCriacao);
    const diffMs = agora - criacao;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    
    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `${diffMin} min`;
    const diffHoras = Math.floor(diffMin / 60);
    return `${diffHoras}h ${diffMin % 60}min`;
  };

  // Obter cor baseada no tempo de espera
  const getCorTempoEspera = (dataCriacao) => {
    const agora = new Date();
    const criacao = new Date(dataCriacao);
    const diffMs = agora - criacao;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    
    if (diffMin < 5) return 'text-green-500';
    if (diffMin < 15) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Função de teste para verificar dados na fila
  const testarDadosFila = async () => {
    try {
      console.log('🧪 INICIANDO TESTE DE DADOS NA FILA...');
      
      // Teste 1: Verificar função buscarAtendimentosPorStatus
      console.log('🔍 Teste 1: Chamando buscarAtendimentosPorStatus...');
      const resultado = await atendimentosService.buscarAtendimentosPorStatus('aguardando');
      console.log('📊 Resultado da busca:', resultado);
      
      // Teste 2: Verificar se há dados na tabela atendimentos
      console.log('🔍 Teste 2: Verificando tabela atendimentos...');
      const todosAtendimentos = await atendimentosService.buscarTodos();
      console.log('📋 Total de atendimentos:', todosAtendimentos?.length || 0);
      
      // Teste 3: Verificar estatísticas
      console.log('🔍 Teste 3: Verificando estatísticas...');
      const stats = await atendimentosService.obterEstatisticasFila();
      console.log('📊 Estatísticas:', stats);
      
      alert(`Teste concluído! Verifique o console para detalhes.\nAtendimentos aguardando: ${resultado?.length || 0}\nTotal de atendimentos: ${todosAtendimentos?.length || 0}`);
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      alert('Erro no teste: ' + error.message);
    }
  };

  return (
    <div className="fila-inteligente-container">
      {/* Header */}
      <div className="fila-header">
        <div className="fila-title-section">
          <h2 className="fila-title">📋 Fila Inteligente</h2>
          <p className="fila-subtitle">Atendimentos aguardando distribuição</p>
        </div>
        
        <div className="fila-actions">


          <div className="distribuicao-automatica-toggle">
            <label className="switch">
              <input
                type="checkbox"
                checked={distribuicaoAutomaticaAtiva}
                onChange={toggleDistribuicaoAutomatica}
              />
              <span className="slider"></span>
            </label>
            <span>Distribuição Automática</span>
          </div>
          
          <button 
            className="btn-distribuir"
            onClick={executarDistribuicao}
            disabled={loading}
          >
            {loading ? '🔄' : '⚡'} Distribuir Agora
          </button>
          
          <button 
            className="btn-teste"
            onClick={testarDadosFila}
            style={{
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              marginLeft: '8px'
            }}
          >
            🧪 Testar Fila
          </button>
          
        
          
        
        </div>
      </div>

      {/* Estatísticas */}
      <div className="fila-estatisticas">
        <div className="estatistica-card">
          <div className="estatistica-numero">{atendimentosAguardando.length}</div>
          <div className="estatistica-label">Aguardando</div>
        </div>
        <div className="estatistica-card">
          <div className="estatistica-numero">{atendimentosRisco.length}</div>
          <div className="estatistica-label">Em Risco</div>
        </div>
        <div className="estatistica-card">
          <div className="estatistica-numero">{estatisticas.media_rejeicoes || 0}</div>
          <div className="estatistica-label">Rejeições Médias</div>
        </div>
        <div className="estatistica-card">
          <div className="estatistica-numero">{estatisticas.na_fila || 0}</div>
          <div className="estatistica-label">Na Fila</div>
        </div>
      </div>

      {/* Lista de Atendimentos */}
      <div className="fila-atendimentos">
       
        
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando atendimentos...</p>
          </div>
        )}
        
        {!loading && atendimentosAguardando.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h4>Nenhum atendimento aguardando</h4>
            <p>Todos os atendimentos estão sendo atendidos ou a fila está vazia.</p>
          </div>
        )}
        
        {!loading && atendimentosAguardando.length > 0 && (
          <div className="atendimentos-grid">
            {atendimentosAguardando.map((atendimento) => (
              <div 
                key={atendimento.id} 
                className="atendimento-card"
                onClick={() => abrirModalAtribuir(atendimento)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-header">
                  <div className="cliente-info">
                    <div className="cliente-avatar">{atendimento.avatar}</div>
                    <div className="cliente-detalhes">
                      <h4 className="cliente-nome">{atendimento.nome}</h4>
                      <p className="cliente-contato">{atendimento.telefone || atendimento.email}</p>
                    </div>
                  </div>
                  <div className={`tempo-espera ${getCorTempoEspera(atendimento.created_at)}`}>
                    ⏱️ {formatarTempoEspera(atendimento.created_at)}
                  </div>
                </div>
                
                <div className="card-body">
                  <p className="ultima-mensagem">{atendimento.ultima_mensagem}</p>
                  <div className="atendimento-meta">
                    <span className="codigo">#{atendimento.codigo}</span>
                    <span className={`prioridade prioridade-${atendimento.prioridade}`}>
                      {atendimento.prioridade}
                    </span>
                  </div>
                </div>
                
                <div className="card-footer">
                  <button 
                    className="btn-atribuir"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('🎯 Botão clicado! Atendimento:', atendimento);
                      abrirModalAtribuir(atendimento);
                    }}
                  >
                    👤 Atribuir Operador
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Atribuição */}
      {modalAtribuir && atendimentoSelecionado && (
        <div className="modal-overlay">
          <div className="modal-realocacao">
            <div className="modal-header">
              <h3>Atribuir Atendimento</h3>
              <button 
                className="btn-close"
                onClick={() => setModalAtribuir(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="atendimento-info">
                <h4>Atendimento: {atendimentoSelecionado.nome}</h4>
                <p>ID: {atendimentoSelecionado.id}</p>
                <p>Código: #{atendimentoSelecionado.codigo}</p>
                <p>Telefone: {atendimentoSelecionado.telefone}</p>
                <p>Email: {atendimentoSelecionado.email}</p>
              </div>
              
              <div className="operador-selection">
                <label htmlFor="operador-select">Selecionar operador:</label>
                {operadoresDisponiveis.length === 0 ? (
                  <div className="loading-operadores">
                    <span>⏳ Carregando operadores...</span>
                  </div>
                ) : (
                  <select 
                    id="operador-select"
                    onChange={(e) => {
                      if (e.target.value) {
                        atribuirAtendimento(e.target.value);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="">
                      Selecione um operador...
                    </option>
                    {operadoresDisponiveis.map((operador) => (
                      <option key={operador.id} value={operador.id}>
                        {operador.nome} ({operador.email})
                      </option>
                    ))}
                  </select>
                )}
                {operadoresDisponiveis.length === 0 && (
                  <div className="operadores-error">
                    <small style={{color: '#ef4444'}}>
                      ⚠️ Nenhum operador online encontrado
                    </small>
                  </div>
                )}
              </div>
              
              <div className="atendimento-detalhes">
                <strong>Descrição:</strong>
                <p>{atendimentoSelecionado.ultima_mensagem}</p>
                <small>Tempo aguardando: {formatarTempoEspera(atendimentoSelecionado.created_at)}</small>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-cancelar"
                onClick={() => setModalAtribuir(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Última atualização */}
      <div className="last-update">
        Última atualização: {lastUpdate ? lastUpdate.toLocaleTimeString('pt-BR') : 'Nunca'}
      </div>
    </div>
  );
};

export default FilaInteligente;