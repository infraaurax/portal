-- ============================================
-- TRIGGER PARA REORGANIZAR FILA DE OPERADORES
-- ============================================
-- Este trigger reorganiza automaticamente a fila (pos_token)
-- quando um operador muda status habilitado ou online para false
-- ============================================

-- 1. Função que reorganiza a fila quando operador sai
CREATE OR REPLACE FUNCTION reorganizar_fila_operadores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    pos_token_removido INTEGER;
BEGIN
    -- Verificar se o operador estava na fila (pos_token > 0) e agora saiu
    IF (OLD.pos_token > 0) AND 
       ((OLD.habilitado = true AND NEW.habilitado = false) OR 
        (OLD.online = true AND NEW.online = false)) THEN
        
        -- Armazenar a posição que foi liberada
        pos_token_removido := OLD.pos_token;
        
        -- Remover o operador da fila (pos_token = NULL para indicar fora da fila)
        NEW.pos_token := NULL;
        
        -- Reorganizar a fila: mover todos os operadores com posição maior para cima
        UPDATE public.operadores 
        SET pos_token = pos_token - 1,
            updated_at = NOW()
        WHERE pos_token > pos_token_removido 
          AND pos_token > 0
          AND habilitado = true 
          AND online = true;
        
        RAISE NOTICE 'Fila reorganizada: operador % removido da posição %, demais operadores movidos para cima', OLD.nome, pos_token_removido;
        
    -- Verificar se o operador voltou para a fila (habilitado e online = true)
    ELSIF ((OLD.habilitado = false AND NEW.habilitado = true) OR 
           (OLD.online = false AND NEW.online = true)) AND
          NEW.habilitado = true AND NEW.online = true AND
          (OLD.pos_token IS NULL OR OLD.pos_token = 0) THEN
        
        -- Encontrar a próxima posição disponível na fila (sempre >= 1)
        SELECT COALESCE(MAX(pos_token), 0) + 1 
        INTO NEW.pos_token
        FROM public.operadores 
        WHERE habilitado = true 
          AND online = true 
          AND pos_token > 0
          AND id != NEW.id;
        
        -- Garantir que pos_token seja pelo menos 1
        IF NEW.pos_token IS NULL OR NEW.pos_token < 1 THEN
            NEW.pos_token := 1;
        END IF;
        
        RAISE NOTICE 'Operador % adicionado à fila na posição %', NEW.nome, NEW.pos_token;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 2. Criar o trigger
DROP TRIGGER IF EXISTS trigger_reorganizar_fila ON public.operadores;

CREATE TRIGGER trigger_reorganizar_fila
    BEFORE UPDATE ON public.operadores
    FOR EACH ROW
    EXECUTE FUNCTION reorganizar_fila_operadores();

-- 3. Conceder permissões necessárias
GRANT EXECUTE ON FUNCTION reorganizar_fila_operadores() TO postgres;
GRANT EXECUTE ON FUNCTION reorganizar_fila_operadores() TO service_role;
GRANT EXECUTE ON FUNCTION reorganizar_fila_operadores() TO authenticated;

-- ============================================
-- FUNÇÃO AUXILIAR PARA REORGANIZAR FILA MANUALMENTE
-- ============================================
-- Esta função pode ser chamada manualmente para reorganizar toda a fila
CREATE OR REPLACE FUNCTION reorganizar_fila_completa()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    operador_record RECORD;
    nova_posicao INTEGER := 1;
BEGIN
    -- Primeiro, remover todas as posições (NULL para fora da fila)
    UPDATE public.operadores 
    SET pos_token = NULL, updated_at = NOW()
    WHERE pos_token > 0;
    
    -- Reorganizar operadores habilitados e online em ordem de criação
    FOR operador_record IN 
        SELECT id, nome
        FROM public.operadores 
        WHERE habilitado = true 
          AND online = true 
        ORDER BY created_at ASC
    LOOP
        UPDATE public.operadores 
        SET pos_token = nova_posicao, updated_at = NOW()
        WHERE id = operador_record.id;
        
        nova_posicao := nova_posicao + 1;
    END LOOP;
    
    RAISE NOTICE 'Fila reorganizada completamente. Total de operadores na fila: %', nova_posicao - 1;
END;
$$;

-- 4. Conceder permissões para a função auxiliar
GRANT EXECUTE ON FUNCTION reorganizar_fila_completa() TO postgres;
GRANT EXECUTE ON FUNCTION reorganizar_fila_completa() TO service_role;
GRANT EXECUTE ON FUNCTION reorganizar_fila_completa() TO authenticated;

-- ============================================
-- VERIFICAR SE O TRIGGER FOI CRIADO
-- ============================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_reorganizar_fila';

-- ============================================
-- EXEMPLO DE TESTE
-- ============================================
-- Para testar o trigger:
-- 1. Certifique-se de que há operadores com pos_token > 0 (1, 2, 3...)
-- 2. Execute: UPDATE operadores SET habilitado = false WHERE id = 'id_do_operador';
-- 3. Verifique se a fila foi reorganizada automaticamente (pos_token sempre sequencial: 1, 2, 3...)

-- Exemplo prático:
-- Estado inicial: Fernando (pos_token=1), Enzo (pos_token=2), João (pos_token=3)
-- Após Fernando sair: Enzo (pos_token=1), João (pos_token=2), Fernando (pos_token=NULL)

-- Para reorganizar manualmente toda a fila:
-- SELECT reorganizar_fila_completa();