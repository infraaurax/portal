
// Função para rejeitar atendimento e mover operador para último lugar
async function rejeitarAtendimentoComReordenacao(supabase, ofertaId, operadorId) {
  try {
    console.log(`🔄 Rejeitando oferta ${ofertaId} do operador ${operadorId}`);
    
    // Chamar função SQL que faz tudo
    const { data, error } = await supabase.rpc('rejeitar_atendimento_com_reordenacao', {
      oferta_id_param: ofertaId,
      operador_id_param: operadorId
    });
    
    if (error) {
      console.error('❌ Erro na rejeição:', error);
      return { success: false, error: error.message };
    }
    
    if (data && data.success) {
      console.log('✅ Rejeição processada com sucesso:', data);
      return data;
    } else {
      console.error('❌ Falha na rejeição:', data);
      return data || { success: false, error: 'Resposta inválida' };
    }
    
  } catch (error) {
    console.error('❌ Erro geral na rejeição:', error);
    return { success: false, error: error.message };
  }
}

// Função alternativa usando apenas JavaScript (caso as funções SQL não funcionem)
async function rejeitarAtendimentoJavaScript(supabase, ofertaId, operadorId) {
  try {
    console.log(`🔄 Rejeitando oferta ${ofertaId} do operador ${operadorId} (método JS)`);
    
    // 1. Buscar dados da oferta
    const { data: oferta, error: ofertaError } = await supabase
      .from('fila_atendimentos')
      .select('atendimento_id')
      .eq('id', ofertaId)
      .single();
    
    if (ofertaError || !oferta) {
      throw new Error(`Oferta não encontrada: ${ofertaError?.message}`);
    }
    
    // 2. Marcar oferta como rejeitada
    const { error: updateOfertaError } = await supabase
      .from('fila_atendimentos')
      .update({ 
        status: 'rejeitado',
        updated_at: new Date().toISOString()
      })
      .eq('id', ofertaId);
    
    if (updateOfertaError) {
      throw new Error(`Erro ao atualizar oferta: ${updateOfertaError.message}`);
    }
    
    // 3. Mover operador para último lugar
    const { data: operadores, error: operadoresError } = await supabase
      .from('operadores')
      .select('pos_token')
      .eq('habilitado', true)
      .order('pos_token', { ascending: false })
      .limit(1);
    
    if (operadoresError) {
      throw new Error(`Erro ao buscar operadores: ${operadoresError.message}`);
    }
    
    const maiorPosToken = operadores.length > 0 ? operadores[0].pos_token : 0;
    const novaPosicao = maiorPosToken + 1;
    
    const { error: updateOperadorError } = await supabase
      .from('operadores')
      .update({ 
        pos_token: novaPosicao,
        updated_at: new Date().toISOString()
      })
      .eq('id', operadorId);
    
    if (updateOperadorError) {
      throw new Error(`Erro ao mover operador: ${updateOperadorError.message}`);
    }
    
    // 4. Voltar atendimento para aguardando
    const { error: updateAtendimentoError } = await supabase
      .from('atendimentos')
      .update({ 
        status: 'aguardando',
        operador_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', oferta.atendimento_id);
    
    if (updateAtendimentoError) {
      throw new Error(`Erro ao atualizar atendimento: ${updateAtendimentoError.message}`);
    }
    
    // 5. Adicionar de volta à fila
    const { error: insertFilaError } = await supabase
      .from('fila_atendimentos')
      .insert({
        atendimento_id: oferta.atendimento_id,
        status: 'aguardando',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    // Ignorar erro se já existe (constraint)
    
    console.log(`✅ Operador movido para posição ${novaPosicao}`);
    
    return {
      success: true,
      message: 'Atendimento rejeitado e operador movido para último lugar',
      atendimento_id: oferta.atendimento_id,
      operador_id: operadorId,
      nova_posicao: novaPosicao
    };
    
  } catch (error) {
    console.error('❌ Erro na rejeição JavaScript:', error);
    return { success: false, error: error.message };
  }
}

// Exportar para uso
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    rejeitarAtendimentoComReordenacao,
    rejeitarAtendimentoJavaScript
  };
}
