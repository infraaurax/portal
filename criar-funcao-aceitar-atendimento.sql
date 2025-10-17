-- =====================================================
-- FUNÇÃO PARA ACEITAR ATENDIMENTO (SEM FILA_ATENDIMENTOS)
-- =====================================================
-- Esta função aceita um atendimento diretamente na tabela atendimentos
-- sem depender da tabela fila_atendimentos que não existe

-- Primeiro, remover a função existente se ela existir
DROP FUNCTION IF EXISTS aceitar_atendimento_fila(UUID, UUID);

CREATE OR REPLACE FUNCTION aceitar_atendimento_fila(
    p_atendimento_id UUID,
    p_operador_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_atendimento RECORD;
    v_operador RECORD;
    v_result JSONB;
BEGIN
    -- Verificar se o atendimento existe e está aguardando
    SELECT 
        id, 
        cliente_nome, 
        status, 
        operador_id,
        created_at
    INTO v_atendimento
    FROM atendimentos 
    WHERE id = p_atendimento_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Atendimento não encontrado',
            'atendimento_id', p_atendimento_id
        );
    END IF;
    
    -- Verificar se o atendimento está disponível para aceitar
    IF v_atendimento.status NOT IN ('aguardando', 'novo') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Atendimento não está disponível para aceitar',
            'status_atual', v_atendimento.status,
            'atendimento_id', p_atendimento_id
        );
    END IF;
    
    -- Verificar se o operador existe
    SELECT 
        id, 
        nome, 
        email,
        status
    INTO v_operador
    FROM operadores 
    WHERE id = p_operador_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Operador não encontrado',
            'operador_id', p_operador_id
        );
    END IF;
    
    -- Verificar se o operador está disponível
    IF v_operador.status != 'disponivel' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Operador não está disponível',
            'status_operador', v_operador.status,
            'operador_id', p_operador_id
        );
    END IF;
    
    -- Aceitar o atendimento
    UPDATE atendimentos
    SET 
        status = 'em-andamento',
        operador_id = p_operador_id,
        data_inicio = NOW(),
        updated_at = NOW()
    WHERE id = p_atendimento_id;
    
    -- Nota: Status do operador não é alterado para 'ocupado' automaticamente
    -- O operador permanece 'disponivel' para aceitar outros atendimentos
    
    -- Log da ação
    RAISE NOTICE 'Atendimento % aceito pelo operador % (%)', 
        p_atendimento_id, v_operador.nome, v_operador.email;
    
    -- Retornar resultado de sucesso
    v_result := jsonb_build_object(
        'success', true,
        'message', 'Atendimento aceito com sucesso',
        'atendimento_id', p_atendimento_id,
        'operador_id', p_operador_id,
        'operador_nome', v_operador.nome,
        'cliente_nome', v_atendimento.cliente_nome,
        'status_anterior', v_atendimento.status,
        'status_novo', 'em-andamento',
        'data_aceitacao', NOW()
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Erro interno ao aceitar atendimento',
            'details', SQLERRM,
            'atendimento_id', p_atendimento_id,
            'operador_id', p_operador_id
        );
END;
$$;