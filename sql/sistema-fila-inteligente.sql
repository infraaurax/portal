-- ============================================
-- SISTEMA DE FILA INTELIGENTE DE ATENDIMENTOS
-- ============================================
-- Este script implementa um sistema de fila que distribui atendimentos
-- de forma inteligente baseado no número de operadores online

-- 1. CRIAR TABELA FILA_ATENDIMENTOS (se não existir)
CREATE TABLE IF NOT EXISTS fila_atendimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atendimento_id UUID NOT NULL REFERENCES atendimentos(id) ON DELETE CASCADE,
    operador_id UUID REFERENCES operadores(id) ON DELETE SET NULL,
    posicao_fila INTEGER NOT NULL,
    status_fila VARCHAR(20) NOT NULL DEFAULT 'aguardando', -- aguardando, oferecido, aceito, rejeitado
    tentativas_rejeicao INTEGER DEFAULT 0,
    max_tentativas INTEGER DEFAULT 3,
    oferecido_em TIMESTAMPTZ,
    aceito_em TIMESTAMPTZ,
    rejeitado_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fila_atendimentos_status_check 
    CHECK (status_fila IN ('aguardando', 'oferecido', 'aceito', 'rejeitado', 'abandonado')),
    
    -- Índices para performance
    UNIQUE(atendimento_id, operador_id)
);

-- Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_fila_atendimentos_status ON fila_atendimentos(status_fila);
CREATE INDEX IF NOT EXISTS idx_fila_atendimentos_posicao ON fila_atendimentos(posicao_fila);
CREATE INDEX IF NOT EXISTS idx_fila_atendimentos_operador ON fila_atendimentos(operador_id);
CREATE INDEX IF NOT EXISTS idx_fila_atendimentos_atendimento ON fila_atendimentos(atendimento_id);

-- 2. FUNÇÃO PARA ADICIONAR ATENDIMENTO À FILA
CREATE OR REPLACE FUNCTION adicionar_atendimento_fila(p_atendimento_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_proxima_posicao INTEGER;
BEGIN
    -- Verificar se o atendimento já está na fila
    IF EXISTS (SELECT 1 FROM fila_atendimentos WHERE atendimento_id = p_atendimento_id) THEN
        v_result := json_build_object(
            'success', false,
            'message', 'Atendimento já está na fila',
            'atendimento_id', p_atendimento_id
        );
        RETURN v_result;
    END IF;
    
    -- Obter próxima posição na fila
    SELECT COALESCE(MAX(posicao_fila), 0) + 1 INTO v_proxima_posicao
    FROM fila_atendimentos
    WHERE status_fila = 'aguardando';
    
    -- Adicionar à fila
    INSERT INTO fila_atendimentos (
        atendimento_id,
        posicao_fila,
        status_fila
    ) VALUES (
        p_atendimento_id,
        v_proxima_posicao,
        'aguardando'
    );
    
    v_result := json_build_object(
        'success', true,
        'message', 'Atendimento adicionado à fila',
        'atendimento_id', p_atendimento_id,
        'posicao_fila', v_proxima_posicao
    );
    
    RETURN v_result;
END;
$$;

-- 3. FUNÇÃO PARA DISTRIBUIR ATENDIMENTOS INTELIGENTEMENTE
CREATE OR REPLACE FUNCTION distribuir_atendimentos_inteligente()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_operadores_online INTEGER;
    v_atendimentos_oferecidos INTEGER;
    v_atendimentos_distribuidos INTEGER := 0;
    v_operador RECORD;
    v_atendimento RECORD;
    v_max_distribuicoes INTEGER;
BEGIN
    -- Contar operadores online e habilitados
    SELECT COUNT(*) INTO v_operadores_online
    FROM operadores
    WHERE online = true AND habilitado = true;
    
    -- Se não há operadores online, não distribuir nada
    IF v_operadores_online = 0 THEN
        v_result := json_build_object(
            'success', true,
            'message', 'Nenhum operador online - aguardando operadores',
            'operadores_online', v_operadores_online,
            'atendimentos_distribuidos', 0
        );
        RETURN v_result;
    END IF;
    
    -- Contar quantos atendimentos já estão oferecidos
    SELECT COUNT(*) INTO v_atendimentos_oferecidos
    FROM fila_atendimentos
    WHERE status_fila = 'oferecido';
    
    -- Calcular quantos atendimentos podemos distribuir
    -- Regra: máximo de 1 atendimento por operador online
    v_max_distribuicoes := v_operadores_online - v_atendimentos_oferecidos;
    
    -- Se já temos atendimentos suficientes oferecidos, não distribuir mais
    IF v_max_distribuicoes <= 0 THEN
        v_result := json_build_object(
            'success', true,
            'message', 'Já existem atendimentos suficientes oferecidos',
            'operadores_online', v_operadores_online,
            'atendimentos_oferecidos', v_atendimentos_oferecidos,
            'atendimentos_distribuidos', 0
        );
        RETURN v_result;
    END IF;
    
    -- Distribuir atendimentos para operadores disponíveis
    FOR v_operador IN 
        SELECT id, nome, pos_token
        FROM operadores
        WHERE online = true 
          AND habilitado = true
          AND id NOT IN (
              SELECT operador_id 
              FROM fila_atendimentos 
              WHERE status_fila = 'oferecido' 
                AND operador_id IS NOT NULL
          )
        ORDER BY pos_token ASC
        LIMIT v_max_distribuicoes
    LOOP
        -- Buscar próximo atendimento na fila
        SELECT fa.*, a.cliente_nome, a.status as atendimento_status
        INTO v_atendimento
        FROM fila_atendimentos fa
        INNER JOIN atendimentos a ON fa.atendimento_id = a.id
        WHERE fa.status_fila = 'aguardando'
          AND fa.tentativas_rejeicao < fa.max_tentativas
          AND a.status IN ('novo', 'aguardando')
        ORDER BY fa.posicao_fila ASC
        LIMIT 1;
        
        -- Se encontrou atendimento, oferecer ao operador
        IF FOUND THEN
            -- Atualizar fila
            UPDATE fila_atendimentos
            SET 
                operador_id = v_operador.id,
                status_fila = 'oferecido',
                oferecido_em = NOW(),
                updated_at = NOW()
            WHERE id = v_atendimento.id;
            
            -- Atualizar atendimento
            UPDATE atendimentos
            SET 
                operador_id = v_operador.id,
                status = 'aguardando',
                updated_at = NOW()
            WHERE id = v_atendimento.atendimento_id;
            
            v_atendimentos_distribuidos := v_atendimentos_distribuidos + 1;
            
            RAISE NOTICE 'Atendimento % oferecido ao operador %', 
                v_atendimento.atendimento_id, v_operador.nome;
        END IF;
    END LOOP;
    
    v_result := json_build_object(
        'success', true,
        'message', 'Distribuição inteligente concluída',
        'operadores_online', v_operadores_online,
        'atendimentos_oferecidos_antes', v_atendimentos_oferecidos,
        'atendimentos_distribuidos', v_atendimentos_distribuidos,
        'max_distribuicoes_permitidas', v_max_distribuicoes
    );
    
    RETURN v_result;
END;
$$;

-- 4. FUNÇÃO PARA PROCESSAR REJEIÇÃO INTELIGENTE
CREATE OR REPLACE FUNCTION processar_rejeicao_inteligente(
    p_atendimento_id UUID,
    p_operador_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_fila_record RECORD;
    v_operadores_online INTEGER;
    v_proximo_operador UUID;
BEGIN
    -- Buscar registro na fila
    SELECT * INTO v_fila_record
    FROM fila_atendimentos
    WHERE atendimento_id = p_atendimento_id
      AND operador_id = p_operador_id
      AND status_fila = 'oferecido';
    
    IF NOT FOUND THEN
        v_result := json_build_object(
            'success', false,
            'message', 'Atendimento não encontrado na fila ou não está oferecido',
            'atendimento_id', p_atendimento_id,
            'operador_id', p_operador_id
        );
        RETURN v_result;
    END IF;
    
    -- Incrementar tentativas de rejeição
    UPDATE fila_atendimentos
    SET 
        tentativas_rejeicao = tentativas_rejeicao + 1,
        status_fila = 'rejeitado',
        rejeitado_em = NOW(),
        operador_id = NULL,
        updated_at = NOW()
    WHERE id = v_fila_record.id;
    
    -- Verificar se excedeu máximo de tentativas
    IF v_fila_record.tentativas_rejeicao + 1 >= v_fila_record.max_tentativas THEN
        -- Marcar como abandonado
        UPDATE fila_atendimentos
        SET status_fila = 'abandonado'
        WHERE id = v_fila_record.id;
        
        UPDATE atendimentos
        SET 
            status = 'abandonado',
            operador_id = NULL,
            updated_at = NOW()
        WHERE id = p_atendimento_id;
        
        v_result := json_build_object(
            'success', true,
            'action', 'abandoned',
            'message', 'Atendimento abandonado - máximo de tentativas excedido',
            'tentativas', v_fila_record.tentativas_rejeicao + 1,
            'max_tentativas', v_fila_record.max_tentativas
        );
    ELSE
        -- Voltar para aguardando na fila
        UPDATE fila_atendimentos
        SET status_fila = 'aguardando'
        WHERE id = v_fila_record.id;
        
        UPDATE atendimentos
        SET 
            operador_id = NULL,
            status = 'novo',
            updated_at = NOW()
        WHERE id = p_atendimento_id;
        
        v_result := json_build_object(
            'success', true,
            'action', 'returned_to_queue',
            'message', 'Atendimento retornado à fila',
            'tentativas', v_fila_record.tentativas_rejeicao + 1,
            'max_tentativas', v_fila_record.max_tentativas
        );
    END IF;
    
    -- Tentar redistribuir imediatamente
    PERFORM distribuir_atendimentos_inteligente();
    
    RETURN v_result;
END;
$$;

-- 5. FUNÇÃO PARA ACEITAR ATENDIMENTO DA FILA
CREATE OR REPLACE FUNCTION aceitar_atendimento_fila(
    p_atendimento_id UUID,
    p_operador_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Atualizar fila
    UPDATE fila_atendimentos
    SET 
        status_fila = 'aceito',
        aceito_em = NOW(),
        updated_at = NOW()
    WHERE atendimento_id = p_atendimento_id
      AND operador_id = p_operador_id
      AND status_fila = 'oferecido';
    
    IF NOT FOUND THEN
        v_result := json_build_object(
            'success', false,
            'message', 'Atendimento não encontrado na fila ou não está oferecido'
        );
        RETURN v_result;
    END IF;
    
    -- Atualizar atendimento
    UPDATE atendimentos
    SET 
        status = 'em-andamento',
        updated_at = NOW()
    WHERE id = p_atendimento_id;
    
    v_result := json_build_object(
        'success', true,
        'message', 'Atendimento aceito com sucesso',
        'atendimento_id', p_atendimento_id,
        'operador_id', p_operador_id
    );
    
    -- Tentar redistribuir outros atendimentos
    PERFORM distribuir_atendimentos_inteligente();
    
    RETURN v_result;
END;
$$;

-- 6. FUNÇÃO PARA MONITORAR E LIMPAR FILA
CREATE OR REPLACE FUNCTION limpar_fila_expirada()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
    v_expirados INTEGER := 0;
BEGIN
    -- Marcar atendimentos oferecidos há mais de 45 segundos como rejeitados
    UPDATE fila_atendimentos
    SET 
        status_fila = 'rejeitado',
        tentativas_rejeicao = tentativas_rejeicao + 1,
        operador_id = NULL,
        updated_at = NOW()
    WHERE status_fila = 'oferecido'
      AND oferecido_em < NOW() - INTERVAL '45 seconds';
    
    GET DIAGNOSTICS v_expirados = ROW_COUNT;
    
    -- Processar atendimentos que excederam tentativas
    UPDATE fila_atendimentos
    SET status_fila = 'abandonado'
    WHERE status_fila = 'rejeitado'
      AND tentativas_rejeicao >= max_tentativas;
    
    UPDATE atendimentos
    SET 
        status = 'abandonado',
        operador_id = NULL,
        updated_at = NOW()
    WHERE id IN (
        SELECT atendimento_id
        FROM fila_atendimentos
        WHERE status_fila = 'abandonado'
    );
    
    -- Retornar atendimentos rejeitados para aguardando
    UPDATE fila_atendimentos
    SET status_fila = 'aguardando'
    WHERE status_fila = 'rejeitado'
      AND tentativas_rejeicao < max_tentativas;
    
    UPDATE atendimentos
    SET 
        operador_id = NULL,
        status = 'novo',
        updated_at = NOW()
    WHERE id IN (
        SELECT atendimento_id
        FROM fila_atendimentos
        WHERE status_fila = 'aguardando'
    );
    
    v_result := json_build_object(
        'success', true,
        'message', 'Limpeza da fila concluída',
        'atendimentos_expirados', v_expirados
    );
    
    -- Redistribuir após limpeza
    PERFORM distribuir_atendimentos_inteligente();
    
    RETURN v_result;
END;
$$;

-- 7. TRIGGER PARA ADICIONAR NOVOS ATENDIMENTOS À FILA AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION trigger_adicionar_fila()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Se é um novo atendimento (status 'novo' e sem operador)
    IF NEW.status = 'novo' AND NEW.operador_id IS NULL THEN
        -- Adicionar à fila
        PERFORM adicionar_atendimento_fila(NEW.id);
        
        -- Tentar distribuir imediatamente
        PERFORM distribuir_atendimentos_inteligente();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_atendimento_novo_fila ON atendimentos;
CREATE TRIGGER trigger_atendimento_novo_fila
    AFTER INSERT OR UPDATE ON atendimentos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_adicionar_fila();

-- 8. FUNÇÃO PARA VISUALIZAR STATUS DA FILA
CREATE OR REPLACE FUNCTION visualizar_status_fila()
RETURNS TABLE (
    atendimento_id UUID,
    cliente_nome TEXT,
    operador_nome TEXT,
    posicao_fila INTEGER,
    status_fila VARCHAR(20),
    tentativas_rejeicao INTEGER,
    oferecido_em TIMESTAMPTZ,
    tempo_na_fila INTERVAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fa.atendimento_id,
        a.cliente_nome,
        o.nome as operador_nome,
        fa.posicao_fila,
        fa.status_fila,
        fa.tentativas_rejeicao,
        fa.oferecido_em,
        NOW() - fa.created_at as tempo_na_fila
    FROM fila_atendimentos fa
    INNER JOIN atendimentos a ON fa.atendimento_id = a.id
    LEFT JOIN operadores o ON fa.operador_id = o.id
    ORDER BY fa.posicao_fila ASC;
END;
$$;

-- 9. EXECUTAR LIMPEZA E DISTRIBUIÇÃO INICIAL
SELECT limpar_fila_expirada();
SELECT distribuir_atendimentos_inteligente();

-- 10. VERIFICAR RESULTADO
SELECT 'STATUS DA FILA APÓS CONFIGURAÇÃO' as info;
SELECT * FROM visualizar_status_fila();

COMMIT;