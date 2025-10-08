-- ============================================
-- FUNÇÃO: toggle_operador_habilitacao
-- ============================================
-- Esta função altera a habilitação do operador
-- Ao HABILITAR (TRUE): 
--   ✓ habilitado = true
--   ✓ online = true
--   ✓ Adiciona à fila (pos_token)
-- Ao DESABILITAR (FALSE):
--   ✓ habilitado = false
--   ✓ online = false
--   ✓ Remove da fila (pos_token = NULL)
-- ============================================

-- PRIMEIRO: Remover a função existente (se houver)
DROP FUNCTION IF EXISTS toggle_operador_habilitacao(UUID, BOOLEAN);

-- SEGUNDO: Criar a nova versão da função
CREATE OR REPLACE FUNCTION toggle_operador_habilitacao(
  p_operador_id UUID,
  p_habilitar BOOLEAN
)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  email TEXT,
  cpf TEXT,
  perfil TEXT,
  status TEXT,
  habilitado BOOLEAN,
  online BOOLEAN,
  pos_token INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
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
    
    RAISE NOTICE 'Operador % habilitado com token % na fila', p_operador_id, v_novo_token;
  ELSE
    -- Se estiver desabilitando (FALSE)
    -- Atualizar operador: desabilitar, tirar de online e remover da fila
    UPDATE operadores
    SET 
      habilitado = false,
      online = false,
      pos_token = NULL,
      updated_at = NOW()
    WHERE operadores.id = p_operador_id;
    
    RAISE NOTICE 'Operador % desabilitado e removido da fila', p_operador_id;
  END IF;
  
  -- Retornar os dados atualizados do operador
  RETURN QUERY
  SELECT 
    o.id,
    o.nome,
    o.email,
    o.cpf,
    o.perfil,
    o.status,
    o.habilitado,
    o.online,
    o.pos_token,
    o.created_at,
    o.updated_at
  FROM operadores o
  WHERE o.id = p_operador_id;
END;
$$;

-- ============================================
-- TESTE DA FUNÇÃO
-- ============================================
-- Para testar, execute:
-- SELECT * FROM toggle_operador_habilitacao('seu-uuid-aqui', true);
-- ============================================
