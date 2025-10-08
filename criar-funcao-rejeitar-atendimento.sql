-- ============================================
-- FUNÇÃO: rejeitar_atendimento_aguardando
-- ============================================
-- Esta função rejeita um atendimento aguardando
-- Se houver apenas 1 operador na fila (o que está rejeitando):
--   ✓ Muda status para 'abandonado'
--   ✓ Remove o operador_id do atendimento
-- Se houver mais operadores na fila:
--   ✓ Passa o atendimento para o próximo operador da fila
-- ============================================

-- Remover função existente (se houver)
DROP FUNCTION IF EXISTS rejeitar_atendimento_aguardando(TEXT, UUID);
DROP FUNCTION IF EXISTS rejeitar_atendimento_aguardando(UUID, UUID);

-- Criar nova função
CREATE OR REPLACE FUNCTION rejeitar_atendimento_aguardando(
  p_atendimento_id TEXT,
  p_operador_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_total_operadores INTEGER;
  v_proximo_operador UUID;
  v_atendimento_uuid UUID;
BEGIN
  -- Converter ID do atendimento para UUID
  v_atendimento_uuid := p_atendimento_id::UUID;
  
  -- Log inicial
  RAISE NOTICE 'Rejeitando atendimento % do operador %', p_atendimento_id, p_operador_id;
  
  -- Contar quantos operadores habilitados existem na fila
  SELECT COUNT(*) INTO v_total_operadores
  FROM operadores
  WHERE habilitado = true AND online = true;
  
  RAISE NOTICE 'Total de operadores habilitados na fila: %', v_total_operadores;
  
  -- Se houver apenas 1 operador na fila (o que está rejeitando)
  IF v_total_operadores <= 1 THEN
    RAISE NOTICE 'Apenas 1 operador na fila - marcando atendimento como ABANDONADO';
    
    -- Mudar status para abandonado e remover operador
    UPDATE atendimentos
    SET 
      status = 'abandonado',
      operador_id = NULL,
      updated_at = NOW()
    WHERE id = v_atendimento_uuid;
    
    -- Retornar resultado
    v_result := json_build_object(
      'success', true,
      'action', 'abandoned',
      'message', 'Atendimento marcado como abandonado - apenas 1 operador na fila',
      'total_operadores', v_total_operadores,
      'novo_status', 'abandonado',
      'proximo_operador', NULL
    );
    
  ELSE
    -- Se houver mais operadores, passar para o próximo da fila
    RAISE NOTICE 'Múltiplos operadores na fila - passando para o próximo';
    
    -- Buscar o próximo operador da fila (que não seja o que está rejeitando)
    -- Ordenar por pos_token para respeitar a ordem da fila
    SELECT id INTO v_proximo_operador
    FROM operadores
    WHERE habilitado = true 
      AND online = true 
      AND id != p_operador_id
    ORDER BY pos_token ASC
    LIMIT 1;
    
    IF v_proximo_operador IS NULL THEN
      -- Se não encontrou próximo operador, abandonar
      RAISE NOTICE 'Nenhum próximo operador encontrado - marcando como ABANDONADO';
      
      UPDATE atendimentos
      SET 
        status = 'abandonado',
        operador_id = NULL,
        updated_at = NOW()
      WHERE id = v_atendimento_uuid;
      
      v_result := json_build_object(
        'success', true,
        'action', 'abandoned',
        'message', 'Nenhum operador disponível - atendimento abandonado',
        'total_operadores', v_total_operadores,
        'novo_status', 'abandonado',
        'proximo_operador', NULL
      );
    ELSE
      -- Passar atendimento para o próximo operador
      RAISE NOTICE 'Passando atendimento para o operador %', v_proximo_operador;
      
      UPDATE atendimentos
      SET 
        status = 'aguardando',
        operador_id = v_proximo_operador,
        updated_at = NOW()
      WHERE id = v_atendimento_uuid;
      
      v_result := json_build_object(
        'success', true,
        'action', 'reassigned',
        'message', 'Atendimento passado para o próximo operador da fila',
        'total_operadores', v_total_operadores,
        'novo_status', 'aguardando',
        'proximo_operador', v_proximo_operador
      );
    END IF;
  END IF;
  
  RETURN v_result;
END;
$$;

-- Conceder permissões necessárias
GRANT EXECUTE ON FUNCTION rejeitar_atendimento_aguardando(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION rejeitar_atendimento_aguardando(TEXT, UUID) TO anon;

-- ============================================
-- TESTE DA FUNÇÃO
-- ============================================
-- Para testar com 1 operador (deve abandonar):
-- SELECT rejeitar_atendimento_aguardando('id-do-atendimento', 'id-do-operador'::UUID);

-- ============================================
-- VERIFICAR SE FOI CRIADA
-- ============================================
SELECT 
    proname as function_name,
    proargnames as argument_names,
    proargtypes::regtype[] as argument_types,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'rejeitar_atendimento_aguardando';
