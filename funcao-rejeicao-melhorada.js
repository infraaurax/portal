
// Função para rejeitar atendimento e mover operador para último lugar
async function rejeitarAtendimentoMelhorado(supabase, ofertaId, operadorId) {
    try {
        console.log(`🔄 Rejeitando oferta ${ofertaId} do operador ${operadorId}`);

        // 1. Buscar dados da oferta
        const { data: oferta, error: ofertaError } = await supabase
            .from('ofertas_operador')
            .select('atendimento_id')
            .eq('id', ofertaId)
            .single();

        if (ofertaError) {
            throw new Error(`Erro ao buscar oferta: ${ofertaError.message}`);
        }

        // 2. Marcar oferta como rejeitada
        const { error: updateOfertaError } = await supabase
            .from('ofertas_operador')
            .update({ 
                status: 'rejeitada',
                updated_at: new Date().toISOString()
            })
            .eq('id', ofertaId);

        if (updateOfertaError) {
            throw new Error(`Erro ao atualizar oferta: ${updateOfertaError.message}`);
        }

        // 3. Mover operador para último lugar
        const { data: maxPosData, error: maxPosError } = await supabase
            .from('operadores')
            .select('pos_token')
            .eq('habilitado', true)
            .order('pos_token', { ascending: false })
            .limit(1);

        if (maxPosError) {
            throw new Error(`Erro ao buscar max posição: ${maxPosError.message}`);
        }

        const maxPos = maxPosData && maxPosData.length > 0 ? maxPosData[0].pos_token : 0;
        const novaPos = maxPos + 1;

        const { error: updateOperadorError } = await supabase
            .from('operadores')
            .update({ pos_token: novaPos })
            .eq('id', operadorId);

        if (updateOperadorError) {
            throw new Error(`Erro ao mover operador: ${updateOperadorError.message}`);
        }

        // 4. Voltar atendimento para aguardando
        const { error: updateAtendimentoError } = await supabase
            .from('atendimentos')
            .update({ status: 'aguardando' })
            .eq('id', oferta.atendimento_id);

        if (updateAtendimentoError) {
            throw new Error(`Erro ao atualizar atendimento: ${updateAtendimentoError.message}`);
        }

        // 5. Adicionar de volta à fila se não estiver
        const { data: filaExiste, error: filaExisteError } = await supabase
            .from('fila_atendimentos')
            .select('id')
            .eq('atendimento_id', oferta.atendimento_id)
            .single();

        if (filaExisteError && filaExisteError.code !== 'PGRST116') {
            throw new Error(`Erro ao verificar fila: ${filaExisteError.message}`);
        }

        if (!filaExiste) {
            const { error: insertFilaError } = await supabase
                .from('fila_atendimentos')
                .insert({
                    atendimento_id: oferta.atendimento_id,
                    status: 'na_fila',
                    created_at: new Date().toISOString()
                });

            if (insertFilaError) {
                throw new Error(`Erro ao inserir na fila: ${insertFilaError.message}`);
            }
        }

        return {
            success: true,
            message: 'Atendimento rejeitado e operador movido para último lugar',
            atendimento_id: oferta.atendimento_id,
            operador_id: operadorId,
            nova_posicao: novaPos
        };

    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = { rejeitarAtendimentoMelhorado };
        