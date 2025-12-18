import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import FilaInteligente from '../components/FilaInteligente';
import AtendimentosAguardando from '../components/AtendimentosAguardando';
import './PageStyles.css';
import './MonitoramentoOperadores.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserCheck, faUserXmark, faUsers } from '@fortawesome/free-solid-svg-icons';

const MonitoramentoOperadores = () => {
  const { user } = useAuth();
  const [operadores, setOperadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('fila');

  // Carregar dados dos operadores
  const carregarOperadores = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('operadores')
        .select('*')
        .eq('perfil', 'Operador')
        .order('pos_token', { ascending: true });

      if (error) {
        console.error('Erro ao carregar operadores:', error);
        throw error;
      }

      setOperadores(data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados dos operadores');
    } finally {
      setLoading(false);
    }
  };

  // Alterar status habilitado do operador
  const alterarStatusHabilitado = async (operadorId, novoStatus) => {
    try {
      let updateData = { 
        habilitado: novoStatus,
        updated_at: new Date().toISOString()
      };

      if (novoStatus === true) {
        const { data: operadorPerfilRow } = await supabase
          .from('operadores')
          .select('perfil')
          .eq('id', operadorId)
          .single();
        const isAdmin = (operadorPerfilRow?.perfil || '').toLowerCase() === 'admin';
        if (isAdmin) {
          updateData.pos_token = null;
        } else {
          // Buscar o maior pos_token atual
          const { data: operadoresComToken, error: tokenError } = await supabase
            .from('operadores')
            .select('pos_token')
            .not('pos_token', 'is', null)
            .order('pos_token', { ascending: false })
            .limit(1);

          if (tokenError) {
            console.error('Erro ao buscar pos_token:', tokenError);
            throw tokenError;
          }

          // Determinar o próximo pos_token
          let proximoPosToken = 1; // Valor padrão se não houver nenhum
          if (operadoresComToken && operadoresComToken.length > 0) {
            proximoPosToken = operadoresComToken[0].pos_token + 1;
          }

          // Adicionar pos_token aos dados de atualização
          updateData.pos_token = proximoPosToken;
          
          console.log(`🎯 Atribuindo pos_token ${proximoPosToken} ao operador ${operadorId}`);
        }
      }

      const { error } = await supabase
        .from('operadores')
        .update(updateData)
        .eq('id', operadorId);

      if (error) {
        console.error('Erro ao alterar status habilitado:', error);
        throw error;
      }

      // Recarregar dados
      await carregarOperadores();
    } catch (error) {
      console.error('Erro ao alterar status habilitado:', error);
      setError('Erro ao alterar status habilitado do operador');
    }
  };

  // Alterar status online do operador
  const alterarStatusOnline = async (operadorId, novoStatus) => {
    try {
      const { error } = await supabase
        .from('operadores')
        .update({ 
          online: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', operadorId);

      if (error) {
        console.error('Erro ao alterar status online:', error);
        throw error;
      }

      // Recarregar dados
      await carregarOperadores();
    } catch (error) {
      console.error('Erro ao alterar status online:', error);
      setError('Erro ao alterar status online do operador');
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    carregarOperadores();
  }, []);

  // Configurar monitoramento realtime do Supabase
  useEffect(() => {
    console.log('🔄 Configurando monitoramento realtime da tabela operadores...');

    const operadoresSubscription = supabase
      .channel('operadores_realtime_monitoring')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'operadores' 
        }, 
        (payload) => {
          console.log('🔔 Mudança na tabela operadores detectada:', payload);
          
          // Recarregar dados quando houver mudanças relevantes
          if (payload.new && (
            payload.new.pos_token !== payload.old?.pos_token ||
            payload.new.online !== payload.old?.online ||
            payload.new.habilitado !== payload.old?.habilitado
          )) {
            console.log('📊 Recarregando dados devido a mudança relevante...');
            carregarOperadores();
          }
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      console.log('🔄 Removendo monitoramento realtime da tabela operadores...');
      supabase.removeChannel(operadoresSubscription);
    };
  }, []);

  // Filtrar operadores online (online=true E habilitado=true)
  const operadoresOnline = operadores.filter(operador => operador.online && operador.habilitado);

  // Filtrar operadores offline (online=false OU habilitado=false)
  const operadoresOffline = operadores.filter(operador => !operador.online || !operador.habilitado);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="loading-icon">⏳</div>
          <h3>Carregando operadores...</h3>
          <p>Buscando dados dos operadores</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Monitoramento da operação</h1>
        <p>Monitore e gerencie operadores online e offline em tempo real</p>
        
        
      </div>

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={carregarOperadores}>Tentar novamente</button>
        </div>
      )}

      <div className="page-content">
        <div style={{ display: 'flex', gap: '8px', margin: '10px 0' }}>
          <button 
            className={activeTab === 'fila' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('fila')}
          >
            Fila de Atendimento
          </button>
          <button 
            className={activeTab === 'status' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('status')}
          >
            Status Operadores
          </button>
        </div>

        {activeTab === 'fila' && (
          <div className="fila-inteligente-section">
            <FilaInteligente />
          </div>
        )}

        {activeTab === 'status' && (
        <div className="operadores-section">
           {/* Estatísticas */}
        <div className="stats-section">
          <div className="stat-card online">
            <h3><FontAwesomeIcon icon={faUserCheck} /> Operadores Online</h3>
            <span className="stat-number">{operadoresOnline.length}</span>
            <p>Online e habilitados</p>
          </div>
          
          <div className="stat-card offline">
            <h3><FontAwesomeIcon icon={faUserXmark} /> Operadores Offline</h3>
            <span className="stat-number">{operadoresOffline.length}</span>
            <p>Offline ou desabilitados</p>
          </div>
          
          <div className="stat-card total">
            <h3><FontAwesomeIcon icon={faUsers} /> Total de Operadores</h3>
            <span className="stat-number">{operadores.length}</span>
            <p>Total cadastrados</p>
          </div>
        </div>
          <div className="operadores-colunas">
            {/* Coluna Online */}
            <div className="coluna-operadores online">
              <h3 className="coluna-titulo">
                <FontAwesomeIcon icon={faUserCheck} /> Operadores Online ({operadoresOnline.length})
              </h3>
              <div className="operadores-lista">
                {operadoresOnline.length === 0 ? (
                  <div className="empty-state">
                    <p>Nenhum operador online no momento</p>
                  </div>
                ) : (
                  operadoresOnline.map((operador) => (
                    <div key={operador.id} className="operador-card">
                      <div className="operador-header">
                        <div className="operador-info">
                          <h4>{operador.nome}</h4>
                          <p>{operador.email}</p>
                          <span className="posicao-fila">
                            Posição na fila: {operador.pos_token || 'N/A'}
                          </span>
                        </div>

                        <div className="status-indicator online">
                          <span className="status-text">Online</span>
                        </div>
                      </div>

                      <div className="operador-stats">
                        <div className="stat">
                          <span className="stat-label">Habilitado:</span>
                          <span className={`stat-value ${operador.habilitado ? 'sim' : 'nao'}`}>
                            {operador.habilitado ? 'Sim' : 'Não'}
                          </span>
                        </div>
                        
                        <div className="stat">
                          <span className="stat-label">Status Geral:</span>
                          <span className="stat-value">{operador.status || 'N/A'}</span>
                        </div>

                        
                      </div>

                      {/* Ações do Operador */}
                      <div className="operador-actions">
                        <button 
                          className="btn-action desabilitar"
                          onClick={() => alterarStatusHabilitado(operador.id, false)}
                          title="Desabilitar operador"
                        >
                          <FontAwesomeIcon icon={faUserXmark} /> Desabilitar
                        </button>
                        
                        <button 
                          className="btn-action offline"
                          onClick={() => alterarStatusOnline(operador.id, false)}
                          title="Colocar offline"
                        >
                          <FontAwesomeIcon icon={faUserXmark} /> Colocar Offline
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Coluna Offline */}
            <div className="coluna-operadores offline">
              <h3 className="coluna-titulo">
                <FontAwesomeIcon icon={faUserXmark} /> Operadores Offline ({operadoresOffline.length})
              </h3>
              <div className="operadores-lista">
                {operadoresOffline.length === 0 ? (
                  <div className="empty-state">
                    <p>Todos os operadores estão online</p>
                  </div>
                ) : (
                  operadoresOffline.map((operador) => (
                    <div key={operador.id} className="operador-card">
                      <div className="operador-header">
                        <div className="operador-info">
                          <h4>{operador.nome}</h4>
                          <p>{operador.email}</p>
                          <span className="posicao-fila">
                            Posição na fila: {operador.pos_token || 'N/A'}
                          </span>
                        </div>

                        <div className="status-indicator offline">
                          <span className="status-text">Offline</span>
                        </div>
                      </div>

                      <div className="operador-stats">
                        <div className="stat">
                          <span className="stat-label">Habilitado:</span>
                          <span className={`stat-value ${operador.habilitado ? 'sim' : 'nao'}`}>
                            {operador.habilitado ? 'Sim' : 'Não'}
                          </span>
                        </div>
                        
                        <div className="stat">
                          <span className="stat-label">Status Geral:</span>
                          <span className="stat-value">{operador.status || 'N/A'}</span>
                        </div>

                      </div>

                      <div className="operador-actions">
                        {!operador.habilitado && (
                          <button
                            className="btn-action habilitar"
                            onClick={() => alterarStatusHabilitado(operador.id, true)}
                            title="Habilitar operador"
                          >
                            <FontAwesomeIcon icon={faUserCheck} /> Habilitar
                          </button>
                        )}
                        {operador.habilitado && (
                          <button
                            className="btn-action desabilitar"
                            onClick={() => alterarStatusHabilitado(operador.id, false)}
                            title="Desabilitar operador"
                          >
                            <FontAwesomeIcon icon={faUserXmark} /> Desabilitar
                          </button>
                        )}
                        {!operador.online && (
                          <button
                            className="btn-action online"
                            onClick={() => alterarStatusOnline(operador.id, true)}
                            title="Colocar online"
                          >
                            <FontAwesomeIcon icon={faUserCheck} /> Online
                          </button>
                        )}
                        {operador.online && (
                          <button
                            className="btn-action offline"
                            onClick={() => alterarStatusOnline(operador.id, false)}
                            title="Colocar offline"
                          >
                            <FontAwesomeIcon icon={faUserXmark} /> Colocar Offline
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default MonitoramentoOperadores;
