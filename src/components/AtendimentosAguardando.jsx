import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import filaSimplificadaService from '../services/filaSimplificadaService';
import './AtendimentosAguardando.css';

const AtendimentosAguardando = () => {
  const [atendimentosAguardando, setAtendimentosAguardando] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFila, setStatusFila] = useState(null);

  // Carregar atendimentos aguardando
  const carregarAtendimentosAguardando = async () => {
    try {
      setError(null);

      console.log('🔍 [Monitoramento] Carregando atendimentos aguardando...');
      
      const atendimentos = await filaSimplificadaService.buscarAtendimentosAguardando();
      
      // Só atualizar se os dados realmente mudaram
      const novosIds = (atendimentos || []).map(a => a.id).sort();
      const idsAtuais = atendimentosAguardando.map(a => a.id).sort();
      
      if (JSON.stringify(novosIds) !== JSON.stringify(idsAtuais)) {
        setAtendimentosAguardando(atendimentos || []);
        console.log('✅ [Monitoramento] Atendimentos atualizados:', atendimentos?.length || 0);
      } else {
        console.log('ℹ️ [Monitoramento] Nenhuma mudança nos atendimentos');
      }
      
    } catch (error) {
      console.error('❌ [Monitoramento] Erro ao carregar atendimentos:', error);
      setError('Erro ao carregar atendimentos aguardando');
    } finally {
      setLoading(false);
    }
  };

  // Carregar status da fila
  const carregarStatusFila = async () => {
    try {
      const status = await filaSimplificadaService.verificarStatusFila();
      setStatusFila(status);
    } catch (error) {
      console.error('❌ [Monitoramento] Erro ao carregar status da fila:', error);
    }
  };

  // Forçar distribuição
  const forcarDistribuicao = async () => {
    try {
      console.log('🚀 [Monitoramento] Forçando distribuição...');
      const resultado = await filaSimplificadaService.forcarDistribuicao();
      
      if (resultado.success) {
        console.log('✅ [Monitoramento] Distribuição forçada com sucesso');
        await carregarAtendimentosAguardando();
        await carregarStatusFila();
      } else {
        console.error('❌ [Monitoramento] Erro na distribuição:', resultado.error);
      }
    } catch (error) {
      console.error('❌ [Monitoramento] Erro ao forçar distribuição:', error);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      setLoading(true);
      await carregarAtendimentosAguardando();
      await carregarStatusFila();
      setLoading(false);
    };
    
    carregarDadosIniciais();
  }, []);

  // Configurar monitoramento em tempo real
  useEffect(() => {
    console.log('🔄 [Monitoramento] Configurando monitoramento realtime...');

    // Criar um debounce para evitar múltiplas chamadas
    let timeoutId = null;
    
    const debouncedReload = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        carregarAtendimentosAguardando();
      }, 1000); // Aguarda 1 segundo antes de recarregar
    };

    // Monitorar mudanças na tabela atendimentos
    const atendimentosSubscription = supabase
      .channel('atendimentos_aguardando_monitoring')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'atendimentos',
          filter: 'status=eq.aguardando'
        }, 
        (payload) => {
          console.log('🔔 [Monitoramento] Mudança em atendimento aguardando:', payload);
          debouncedReload();
        }
      )
      .subscribe();

    // Monitorar mudanças na tabela operadores (para pos_token)
    const operadoresSubscription = supabase
      .channel('operadores_pos_token_monitoring')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'operadores'
        }, 
        (payload) => {
          // Só recarregar se pos_token mudou
          if (payload.new?.pos_token !== payload.old?.pos_token) {
            console.log('🔔 [Monitoramento] Mudança em pos_token:', payload);
            carregarStatusFila();
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      console.log('🔄 [Monitoramento] Removendo monitoramento realtime...');
      if (timeoutId) clearTimeout(timeoutId);
      supabase.removeChannel(atendimentosSubscription);
      supabase.removeChannel(operadoresSubscription);
    };
  }, []);

  // Formatar tempo de espera
  const formatarTempoEspera = (dataCreated) => {
    const agora = new Date();
    const criado = new Date(dataCreated);
    const diffMs = agora - criado;
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutos < 1) return 'Agora mesmo';
    if (diffMinutos < 60) return `${diffMinutos} min`;
    
    const diffHoras = Math.floor(diffMinutos / 60);
    const minutosRestantes = diffMinutos % 60;
    
    if (diffHoras < 24) {
      return minutosRestantes > 0 ? `${diffHoras}h ${minutosRestantes}min` : `${diffHoras}h`;
    }
    
    const diffDias = Math.floor(diffHoras / 24);
    return `${diffDias} dias`;
  };

  if (loading) {
    return (
      <div className="atendimentos-aguardando-container">
        <div className="loading-state">
          <div className="loading-spinner">⏳</div>
          <p>Carregando atendimentos aguardando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="atendimentos-aguardando-container">
      <div className="section-header">
       
        <div className="header-actions">
          <button 
            className="btn-refresh" 
            onClick={carregarAtendimentosAguardando}
            title="Atualizar lista"
          >
            🔄 Atualizar
          </button>
          <button 
            className="btn-distribute" 
            onClick={forcarDistribuicao}
            title="Forçar distribuição"
          >
            🚀 Distribuir
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={carregarAtendimentosAguardando}>Tentar novamente</button>
        </div>
      )}

      {/* Status da Fila */}
      {statusFila && (
        <div className="status-fila">
          <div className="status-card">
            <h4>📊 Status da Fila</h4>
            <div className="status-grid">
              <div className="status-item">
                <span className="status-label">Aguardando:</span>
                <span className="status-value">{statusFila.atendimentos_aguardando || 0}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Operadores Online:</span>
                <span className="status-value">{statusFila.operadores_disponiveis || 0}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Próximo na Fila:</span>
                <span className="status-value">{statusFila.proximo_operador || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Atendimentos */}
      <div className="atendimentos-lista">
        {atendimentosAguardando.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>Nenhum atendimento aguardando</h3>
            <p>Todos os atendimentos estão sendo processados ou não há novos atendimentos.</p>
          </div>
        ) : (
          <div className="atendimentos-grid">
            {atendimentosAguardando.map((atendimento) => (
              <div key={atendimento.id} className="atendimento-card">
                <div className="atendimento-header">
                  <div className="cliente-avatar">
                    {atendimento.cliente_nome?.substring(0, 2).toUpperCase() || 'AT'}
                  </div>
                  <div className="atendimento-info">
                    <h4>{atendimento.cliente_nome || 'Cliente não informado'}</h4>
                    <p className="codigo">#{atendimento.codigo}</p>
                    <p className="telefone">{atendimento.cliente_telefone || 'Telefone não informado'}</p>
                  </div>
                  <div className="status-badge aguardando">
                    Aguardando
                  </div>
                </div>
                
                <div className="atendimento-detalhes">
                  <div className="tempo-espera">
                    <span className="tempo-label">⏱️ Aguardando há:</span>
                    <span className="tempo-valor">{formatarTempoEspera(atendimento.created_at)}</span>
                  </div>
                  
                  {atendimento.descricao && (
                    <div className="descricao">
                      <span className="descricao-label">📝 Descrição:</span>
                      <p className="descricao-texto">{atendimento.descricao}</p>
                    </div>
                  )}
                  
                  <div className="timestamps">
                    <small>Criado: {new Date(atendimento.created_at).toLocaleString('pt-BR')}</small>
                    {atendimento.updated_at !== atendimento.created_at && (
                      <small>Atualizado: {new Date(atendimento.updated_at).toLocaleString('pt-BR')}</small>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AtendimentosAguardando;