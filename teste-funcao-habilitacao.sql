-- ============================================
-- TESTE E CORREÇÃO DA FUNÇÃO toggle_operador_habilitacao
-- ============================================

-- 1. Verificar se a função existe
SELECT 
    proname as function_name,
    proargnames as argument_names,
    proargtypes::regtype[] as argument_types,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'toggle_operador_habilitacao';

-- 2. Se a função existir, removê-la
DROP FUNCTION IF EXISTS toggle_operador_habilitacao(UUID, BOOLEAN);

-- 3. Criar uma versão mais simples primeiro (para teste)
CREATE OR REPLACE FUNCTION toggle_operador_habilitacao(
  p_operador_id UUID,
  p_habilitar BOOLEAN
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_result JSON;
  v_novo_token INTEGER;
BEGIN
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
    WHERE operadores.id = p_operador_id;
    
    -- Retornar resultado em JSON
    SELECT json_build_object(
      'success', true,
      'message', 'Operador habilitado com sucesso',
      'pos_token', v_novo_token
    ) INTO v_result;
    
  ELSE
    -- Se estiver desabilitando (FALSE)
    UPDATE operadores
    SET 
      habilitado = false,
      online = false,
      pos_token = NULL,
      updated_at = NOW()
    WHERE operadores.id = p_operador_id;
    
    -- Retornar resultado em JSON
    SELECT json_build_object(
      'success', true,
      'message', 'Operador desabilitado com sucesso',
      'pos_token', NULL
    ) INTO v_result;
  END IF;
  
  RETURN v_result;
END;
$$;

-- 4. Testar a função (substitua o UUID por um real)
-- SELECT * FROM toggle_operador_habilitacao('00000000-0000-0000-0000-000000000000'::UUID, true);

-- 5. Verificar se a função foi criada
SELECT 
    proname as function_name,
    proargnames as argument_names,
    proargtypes::regtype[] as argument_types,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'toggle_operador_habilitacao';
