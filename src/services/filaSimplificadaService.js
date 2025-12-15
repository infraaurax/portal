import { supabase } from '../lib/supabase';

/**
 * Serviço para gerenciar a fila simplificada de atendimentos
 * Baseado apenas nas tabelas 'atendimentos' e 'operadores'
 * Sem tabelas de controle adicionais
 */
const filaSimplificadaService = {
  
  /**
   * Aceitar um atendimento aguardando
   * @param {string} atendimentoId - ID do atendimento
   * @param {string} operadorId - ID do operador
   * @returns {Promise<Object>} Resultado da operação
   */
  async aceitarAtendimento(atendimentoId, operadorId) {
    try {
      console.log('✅ [Fila Simplificada] Aceitando atendimento:', { atendimentoId, operadorId });
      
      // Usar atualização direta para evitar conflito de funções
      const { data, error } = await supabase
        .from('atendimentos')
        .update({
          fila_status: 'aceito',
          status: 'em-andamento',
          updated_at: new Date().toISOString()
        })
        .eq('id', atendimentoId)
        .eq('operador_id', operadorId)
        .eq('fila_status', 'oferecido')
        .select();

      if (error) {
        console.error('❌ Erro ao aceitar atendimento:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Atendimento não encontrado ou não está oferecido para você');
      }

      console.log('✅ Atendimento aceito com sucesso:', data[0]);
      const { data: maxPosToken } = await supabase
        .from('operadores')
        .select('pos_token')
        .not('pos_token', 'is', null)
        .order('pos_token', { ascending: false })
        .limit(1);
      const novoPos = (maxPosToken && maxPosToken.length > 0) ? maxPosToken[0].pos_token + 1 : 1;
      await supabase
        .from('operadores')
        .update({ pos_token: novoPos, updated_at: new Date().toISOString() })
        .eq('id', operadorId);
      return { success: true, data: data[0] };
      
    } catch (error) {
      console.error('❌ Erro no serviço aceitarAtendimento:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao aceitar atendimento' 
      };
    }
  },

  /**
   * Recusar um atendimento aguardando
   * @param {string} atendimentoId - ID do atendimento
   * @param {string} operadorId - ID do operador
   * @returns {Promise<Object>} Resultado da operação
   */
  async recusarAtendimento(atendimentoId, operadorId) {
    try {
      console.log('❌ [Fila Simplificada] Recusando atendimento:', { atendimentoId, operadorId });
      
      // 1. Buscar o maior pos_token atual
      const { data: maxPosToken, error: errorMaxPos } = await supabase
        .from('operadores')
        .select('pos_token')
        .not('pos_token', 'is', null)
        .order('pos_token', { ascending: false })
        .limit(1);

      if (errorMaxPos) {
        throw errorMaxPos;
      }

      const novoPos = (maxPosToken && maxPosToken.length > 0) ? maxPosToken[0].pos_token + 1 : 1;

      // 2. Atualizar pos_token do operador (mover para final da fila)
      const { error: errorOperador } = await supabase
        .from('operadores')
        .update({
          pos_token: novoPos,
          updated_at: new Date().toISOString()
        })
        .eq('id', operadorId);

      if (errorOperador) {
        console.error('❌ Erro ao atualizar pos_token do operador:', errorOperador);
      } else {
        console.log(`✅ Operador movido para pos_token: ${novoPos}`);
      }

      // 3. Voltar atendimento para a fila
      const { data, error } = await supabase
        .from('atendimentos')
        .update({
          fila_status: 'na_fila',
          operador_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', atendimentoId)
        .eq('operador_id', operadorId)
        .eq('fila_status', 'oferecido')
        .select();

      if (error) {
        console.error('❌ Erro ao recusar atendimento:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Atendimento não encontrado ou não está oferecido para você');
      }

      console.log('✅ Atendimento recusado com sucesso:', data[0]);
      return { 
        success: true, 
        data: data[0],
        novo_pos_token: novoPos,
        message: 'Atendimento recusado e operador movido para final da fila'
      };
      
    } catch (error) {
      console.error('❌ Erro no serviço recusarAtendimento:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao recusar atendimento' 
      };
    }
  },

  /**
   * Buscar atendimentos aguardando
   * @returns {Promise<Array>} Lista de atendimentos aguardando
   */
  async buscarAtendimentosAguardando() {
    try {
      console.log('🔍 [Fila Simplificada] Buscando atendimentos aguardando...');
      
      // Buscar diretamente na tabela atendimentos com fila_status = 'oferecido'
      const { data, error } = await supabase
        .from('atendimentos')
        .select(`
          id,
          codigo,
          cliente_nome,
          cliente_telefone,
          cliente_email,
          descricao_atendimento,
          operador_id,
          created_at,
          updated_at
        `)
        .eq('fila_status', 'oferecido')
        .order('updated_at', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar atendimentos aguardando:', error);
        throw error;
      }

      // Transformar os dados para o formato esperado
      const atendimentosFormatados = (data || []).map(atendimento => ({
        id: atendimento.id,
        codigo: atendimento.codigo,
        cliente_nome: atendimento.cliente_nome,
        cliente_telefone: atendimento.cliente_telefone,
        cliente_email: atendimento.cliente_email,
        descricao_atendimento: atendimento.descricao_atendimento,
        operador_id: atendimento.operador_id,
        operador_nome: null, // Será buscado separadamente se necessário
        tempo_aguardando: null, // Será calculado no frontend se necessário
        created_at: atendimento.created_at
      }));

      console.log('✅ Atendimentos aguardando encontrados:', atendimentosFormatados?.length || 0);
      if (atendimentosFormatados.length > 0) {
        console.log('📋 Primeiro atendimento:', atendimentosFormatados[0]);
      }
      
      return atendimentosFormatados || [];
      
    } catch (error) {
      console.error('❌ Erro no serviço buscarAtendimentosAguardando:', error);
      return [];
    }
  },

  /**
   * Verificar status da fila
   * @returns {Promise<Object>} Status da fila
   */
  async verificarStatusFila() {
    try {
      console.log('📊 [Fila Simplificada] Verificando status da fila...');
      const [aguardandoRes, naFilaRes, oferecidoRes, emRiscoRes] = await Promise.all([
        supabase.from('atendimentos').select('*', { count: 'exact', head: true }).eq('status', 'aguardando'),
        supabase.from('atendimentos').select('*', { count: 'exact', head: true }).eq('status', 'aguardando').is('operador_id', null).or('fila_status.is.null,fila_status.eq.na_fila'),
        supabase.from('atendimentos').select('*', { count: 'exact', head: true }).eq('status', 'aguardando').eq('fila_status', 'oferecido'),
        supabase.from('atendimentos').select('*', { count: 'exact', head: true }).eq('status', 'aguardando').lt('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      ]);
      const status = {
        aguardando: aguardandoRes.count || 0,
        na_fila: naFilaRes.count || 0,
        oferecido: oferecidoRes.count || 0,
        em_risco: emRiscoRes.count || 0,
        media_rejeicoes: 0,
        timestamp: new Date().toISOString()
      };
      console.log('✅ Status da fila:', status);
      return status;
    } catch (error) {
      console.error('❌ Erro no serviço verificarStatusFila:', error);
      return null;
    }
  },

  /**
   * Forçar distribuição de atendimentos aguardando
   * @returns {Promise<Object>} Resultado da distribuição
   */
  async forcarDistribuicao() {
    try {
      console.log('🚀 [Fila Simplificada] Forçando distribuição...');
      
      // Normalizar fila: limpar oferecidos expirados e garantir 'na_fila' para aguardando sem operador
      try {
        await supabase
          .from('atendimentos')
          .update({
            operador_id: null,
            fila_status: 'na_fila',
            updated_at: new Date().toISOString()
          })
          .eq('status', 'aguardando')
          .is('operador_id', null)
          .or('fila_status.is.null,fila_status.eq.oferecido');
      } catch (normErr) {
        console.warn('⚠️ [Fila Simplificada] Falha ao normalizar fila:', normErr?.message);
      }
      
      const { data, error } = await supabase.rpc('distribuir_atendimento_simples');

      if (error) {
        console.error('❌ Erro ao forçar distribuição:', error);
        throw error;
      }

      console.log('✅ Distribuição forçada:', data);
      const success = !!(data && data.success === true);
      return { success, data, message: data?.message };
      
    } catch (error) {
      console.error('❌ Erro no serviço forcarDistribuicao:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao forçar distribuição' 
      };
    }
  },

  async setAutoDistribuicao(ativo) {
    try {
      const { error } = await supabase.rpc('set_auto_distribuicao', { p_ativo: !!ativo });
      if (error) throw error;
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  async getAutoDistribuicao() {
    try {
      const { data, error } = await supabase.rpc('get_auto_distribuicao');
      if (error) throw error;
      return !!data;
    } catch {
      return true;
    }
  }
};

export default filaSimplificadaService;
