-- Função para mover operador para último lugar da fila
CREATE OR REPLACE FUNCTION mover_operador_ultimo_lugar(operador_id_param UUID)
RETURNS void AS $$
DECLARE
    max_pos_token INTEGER;
BEGIN
    -- Buscar o maior pos_token atual
    SELECT COALESCE(MAX(pos_token), 0) + 1 
    INTO max_pos_token 
    FROM operadores 
    WHERE habilitado = true AND online = true;
    
    -- Atualizar o pos_token do operador para o último lugar
    UPDATE operadores 
    SET pos_token = max_pos_token
    WHERE id = operador_id_param;
    
    RAISE NOTICE 'Operador % movido para posição %', operador_id_param, max_pos_token;
END;
$$ LANGUAGE plpgsql;

-- Função melhorada para rejeitar atendimento
CREATE OR REPLACE FUNCTION rejeitar_atendimento_melhorado(
    oferta_id_param UUID,
    operador_id_param UUID
)
RETURNS json AS $$
DECLARE
    atendimento_id_var UUID;
    resultado json;
BEGIN
    -- Buscar o atendimento_id da oferta
    SELECT atendimento_id INTO atendimento_id_var
    FROM ofertas_operador 
    WHERE id = oferta_id_param;
    
    -- Atualizar status da oferta para rejeitada
    UPDATE ofertas_operador 
    SET status = 'rejeitada', 
        updated_at = NOW()
    WHERE id = oferta_id_param;
    
    -- Mover operador para último lugar da fila
    PERFORM mover_operador_ultimo_lugar(operador_id_param);
    
    -- Voltar atendimento para status aguardando
    UPDATE atendimentos 
    SET status = 'aguardando'
    WHERE id = atendimento_id_var;
    
    -- Adicionar de volta à fila se não estiver
    INSERT INTO fila_atendimentos (atendimento_id, status, created_at)
    SELECT atendimento_id_var, 'na_fila', NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM fila_atendimentos 
        WHERE atendimento_id = atendimento_id_var
    );
    
    resultado := json_build_object(
        'success', true,
        'message', 'Atendimento rejeitado e operador movido para último lugar',
        'atendimento_id', atendimento_id_var,
        'operador_id', operador_id_param
    );
    
    RETURN resultado;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql;