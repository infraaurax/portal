-- ============================================
-- CORREÇÃO SIMPLES DA FUNÇÃO toggle_operador_habilitacao
-- ============================================

-- 1. Remover função existente (se houver)
DROP FUNCTION IF EXISTS toggle_operador_habilitacao(UUID, BOOLEAN);

-- 2. Criar versão mais simples e robusta
CREATE OR REPLACE FUNCTION toggle_operador_habilitacao(
  p_operador_id UUID,
  p_habilitar BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_novo_token INTEGER;
  v_operador_exists BOOLEAN;
BEGIN
  -- Verificar se o operador existe
  SELECT EXISTS(SELECT 1 FROM operadores WHERE id = p_operador_id) INTO v_operador_exists;
  
  IF NOT v_operador_exists THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Operador não encontrado',
      'error', 'OPERADOR_NOT_FOUND'
    );
  END IF;
  
  -- Se estiver habilitando (TRUE)
  IF p_habilitar THEN
    -- Buscar o próximo token na fila (max + 1)
    SELECT COALESCE(MAX(pos_token), 0) + 1 INTO v_novo_token
    FROM operadores
    WHERE habilitado = true;
    
    -- Atualizar operador: habilitar, colocar online e adicionar à fila
    UPDATE operadores
    SET 
      habilitado = true,
      online = true,
      pos_token = v_novo_token,
      updated_at = NOW()
    WHERE id = p_operador_id;
    
    -- Verificar se a atualização foi bem-sucedida
    IF FOUND THEN
      v_result := json_build_object(
        'success', true,
        'message', 'Operador habilitado com sucesso',
        'pos_token', v_novo_token,
        'habilitado', true,
        'online', true
      );
    ELSE
      v_result := json_build_object(
        'success', false,
        'message', 'Falha ao habilitar operador',
        'error', 'UPDATE_FAILED'
      );
    END IF;
    
  ELSE
    -- Se estiver desabilitando (FALSE)
    UPDATE operadores
    SET 
      habilitado = false,
      online = false,
      pos_token = NULL,
      updated_at = NOW()
    WHERE id = p_operador_id;
    
    -- Verificar se a atualização foi bem-sucedida
    IF FOUND THEN
      v_result := json_build_object(
        'success', true,
        'message', 'Operador desabilitado com sucesso',
        'pos_token', NULL,
        'habilitado', false,
        'online', false
      );
    ELSE
      v_result := json_build_object(
        'success', false,
        'message', 'Falha ao desabilitar operador',
        'error', 'UPDATE_FAILED'
      );
    END IF;
  END IF;
  
  RETURN v_result;
END;
$$;

-- 3. Conceder permissões necessárias
GRANT EXECUTE ON FUNCTION toggle_operador_habilitacao(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_operador_habilitacao(UUID, BOOLEAN) TO anon;

-- 4. Testar a função (substitua por um UUID real de um operador)
-- SELECT toggle_operador_habilitacao('seu-uuid-aqui'::UUID, true);

-- 5. Verificar se foi criada corretamente
SELECT 
    proname as function_name,
    proargnames as argument_names,
    proargtypes::regtype[] as argument_types,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'toggle_operador_habilitacao';
