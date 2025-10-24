-- ========================================
-- SOLUÇÃO COMPLETA PARA OS 3 PROBLEMAS
-- ========================================

-- 1. CORREÇÃO DA FUNÇÃO DE DISTRIBUIÇÃO (remove ambiguidade pos_token)
-- 2. FUNÇÃO DE VALIDAÇÃO PERIÓDICA (sincroniza status)
-- 3. SUPORTE A MÚLTIPLOS ATENDIMENTOS NA FILA

-- ========================================
-- 1. FUNÇÃO DE DISTRIBUIÇÃO CORRIGIDA
-- ========================================

CREATE OR REPLACE FUNCTION distribuir_atendimentos_inteligente()
RETURNS TABLE(
    atendimento_id UUID,
    operador_id UUID,
    operador_email TEXT,
    pos_token INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_operadores_online INTEGER;
    v_atendimentos_na_fila INTEGER;
    v_atendimentos_oferecidos INTEGER;
    v_max_oferecimentos INTEGER;
    v_operador RECORD;
    v_atendimento RECORD;
BEGIN
    -- Contar operadores online e habilitados
    SELECT COUNT(*) INTO v_operadores_online
    FROM operadores
    WHERE habilitado = true
    AND online = true
    AND pos_token IS NOT NULL
    AND pos_token > 0;

    -- Se não há operadores online, não distribuir nada
    IF v_operadores_online = 0 THEN
        RETURN;
    END IF;

    -- Contar atendimentos na fila
    SELECT COUNT(*) INTO v_atendimentos_na_fila
    FROM fila_atendimentos
    WHERE status = 'na_fila';

    -- Contar atendimentos já oferecidos (mas não expirados)
    SELECT COUNT(*) INTO v_atendimentos_oferecidos
    FROM fila_atendimentos
    WHERE status = 'oferecido'
    AND (data_expiracao IS NULL OR data_expiracao > NOW());

    -- MODIFICAÇÃO: Permitir múltiplos atendimentos na fila
    -- Calcular quantos atendimentos podem ser oferecidos simultaneamente
    -- Regra: máximo igual ao número de operadores online, mas nunca mais que 5
    v_max_oferecimentos := LEAST(v_operadores_online, 5);

    -- Se já temos o máximo de oferecimentos, não oferecer mais
    IF v_atendimentos_oferecidos >= v_max_oferecimentos THEN
        RETURN;
    END IF;

    -- Buscar atendimentos na fila para distribuir
    FOR v_atendimento IN (
        SELECT id as fila_id, atendimento_id
        FROM fila_atendimentos
        WHERE status = 'na_fila'
        ORDER BY created_at ASC
        LIMIT (v_max_oferecimentos - v_atendimentos_oferecidos)
    ) LOOP
        
        -- Para cada atendimento, buscar o melhor operador disponível
        -- CORREÇÃO: Remove alias ambíguo do pos_token
        SELECT 
            o.id,
            o.email,
            o.pos_token
        INTO v_operador
        FROM operadores o
        WHERE o.habilitado = true
        AND o.online = true
        AND o.pos_token IS NOT NULL
        AND o.pos_token > 0
        AND NOT EXISTS (
            -- Operador não pode ter atendimento já oferecido
            SELECT 1 FROM fila_atendimentos fa2
            WHERE fa2.operador_id = o.id
            AND fa2.status = 'oferecido'
            AND (fa2.data_expiracao IS NULL OR fa2.data_expiracao > NOW())
        )
        AND NOT EXISTS (
            -- NUNCA oferecer para operadores que já rejeitaram este atendimento
            SELECT 1 FROM ofertas_operador oo
            WHERE oo.atendimento_id = v_atendimento.atendimento_id
            AND oo.operador_id = o.id
            AND oo.status = 'rejeitado'
        )
        ORDER BY 
            o.pos_token ASC,
            o.created_at ASC
        LIMIT 1;

        -- Se encontrou um operador disponível, fazer a oferta
        IF v_operador.id IS NOT NULL THEN
            -- Atualizar o registro na fila
            UPDATE fila_atendimentos
            SET 
                operador_id = v_operador.id,
                status = 'oferecido',
                data_expiracao = NOW() + INTERVAL '45 seconds',
                updated_at = NOW()
            WHERE id = v_atendimento.fila_id;

            -- Registrar a oferta
            INSERT INTO ofertas_operador (atendimento_id, operador_id, status, created_at)
            VALUES (v_atendimento.atendimento_id, v_operador.id, 'oferecido', NOW())
            ON CONFLICT (atendimento_id, operador_id) 
            DO UPDATE SET 
                status = 'oferecido',
                created_at = NOW();

            -- Retornar o resultado
            atendimento_id := v_atendimento.atendimento_id;
            operador_id := v_operador.id;
            operador_email := v_operador.email;
            pos_token := v_operador.pos_token;
            
            RETURN NEXT;
        END IF;
    END LOOP;

    RETURN;
END;
$$;

-- ========================================
-- 2. FUNÇÃO DE VALIDAÇÃO PERIÓDICA
-- ========================================

CREATE OR REPLACE FUNCTION validar_sincronizacao_fila()
RETURNS TABLE(
    acao TEXT,
    atendimento_id UUID,
    status_atendimento TEXT,
    status_fila TEXT,
    detalhes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_record RECORD;
    v_count INTEGER := 0;
BEGIN
    -- Buscar atendimentos na fila que não deveriam estar lá
    FOR v_record IN (
        SELECT 
            fa.id as fila_id,
            fa.atendimento_id,
            fa.status as status_fila,
            a.status as status_atendimento
        FROM fila_atendimentos fa
        INNER JOIN atendimentos a ON fa.atendimento_id = a.id
        WHERE a.status NOT IN ('aguardando', 'em_andamento')
    ) LOOP
        
        -- Remover da fila atendimentos que foram finalizados
        DELETE FROM fila_atendimentos 
        WHERE id = v_record.fila_id;
        
        v_count := v_count + 1;
        
        -- Retornar informação sobre a ação
        acao := 'REMOVIDO_DA_FILA';
        atendimento_id := v_record.atendimento_id;
        status_atendimento := v_record.status_atendimento;
        status_fila := v_record.status_fila;
        detalhes := 'Atendimento com status ' || v_record.status_atendimento || ' removido da fila';
        
        RETURN NEXT;
    END LOOP;
    
    -- Buscar atendimentos que deveriam estar na fila mas não estão
    FOR v_record IN (
        SELECT 
            a.id as atendimento_id,
            a.status as status_atendimento
        FROM atendimentos a
        WHERE a.status = 'aguardando'
        AND NOT EXISTS (
            SELECT 1 FROM fila_atendimentos fa 
            WHERE fa.atendimento_id = a.id
        )
    ) LOOP
        
        -- Adicionar à fila atendimentos que estão aguardando
        INSERT INTO fila_atendimentos (atendimento_id, status, created_at, updated_at)
        VALUES (v_record.atendimento_id, 'na_fila', NOW(), NOW());
        
        v_count := v_count + 1;
        
        -- Retornar informação sobre a ação
        acao := 'ADICIONADO_NA_FILA';
        atendimento_id := v_record.atendimento_id;
        status_atendimento := v_record.status_atendimento;
        status_fila := 'na_fila';
        detalhes := 'Atendimento aguardando adicionado à fila';
        
        RETURN NEXT;
    END LOOP;
    
    -- Se nenhuma ação foi necessária
    IF v_count = 0 THEN
        acao := 'NENHUMA_ACAO';
        atendimento_id := NULL;
        status_atendimento := NULL;
        status_fila := NULL;
        detalhes := 'Fila sincronizada corretamente';
        
        RETURN NEXT;
    END IF;
    
    RETURN;
END;
$$;

-- ========================================
-- 3. FUNÇÃO PARA LIMPAR OFERTAS EXPIRADAS
-- ========================================

CREATE OR REPLACE FUNCTION limpar_ofertas_expiradas()
RETURNS TABLE(
    acao TEXT,
    atendimento_id UUID,
    operador_email TEXT,
    detalhes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_record RECORD;
    v_count INTEGER := 0;
BEGIN
    -- Buscar ofertas expiradas
    FOR v_record IN (
        SELECT 
            fa.id as fila_id,
            fa.atendimento_id,
            fa.operador_id,
            o.email as operador_email,
            fa.data_expiracao
        FROM fila_atendimentos fa
        INNER JOIN operadores o ON fa.operador_id = o.id
        WHERE fa.status = 'oferecido'
        AND fa.data_expiracao IS NOT NULL
        AND fa.data_expiracao <= NOW()
    ) LOOP
        
        -- Retornar oferta à fila
        UPDATE fila_atendimentos
        SET 
            operador_id = NULL,
            status = 'na_fila',
            data_expiracao = NULL,
            updated_at = NOW()
        WHERE id = v_record.fila_id;
        
        -- Marcar oferta como expirada
        UPDATE ofertas_operador
        SET status = 'expirado', updated_at = NOW()
        WHERE atendimento_id = v_record.atendimento_id
        AND operador_id = v_record.operador_id
        AND status = 'oferecido';
        
        v_count := v_count + 1;
        
        -- Retornar informação sobre a ação
        acao := 'OFERTA_EXPIRADA';
        atendimento_id := v_record.atendimento_id;
        operador_email := v_record.operador_email;
        detalhes := 'Oferta expirada em ' || v_record.data_expiracao || ', retornada à fila';
        
        RETURN NEXT;
    END LOOP;
    
    -- Se nenhuma ação foi necessária
    IF v_count = 0 THEN
        acao := 'NENHUMA_ACAO';
        atendimento_id := NULL;
        operador_email := NULL;
        detalhes := 'Nenhuma oferta expirada encontrada';
        
        RETURN NEXT;
    END IF;
    
    RETURN;
END;
$$;

-- ========================================
-- 4. FUNÇÃO PRINCIPAL DE MANUTENÇÃO
-- ========================================

CREATE OR REPLACE FUNCTION executar_manutencao_fila()
RETURNS TABLE(
    etapa TEXT,
    acao TEXT,
    atendimento_id UUID,
    detalhes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_record RECORD;
BEGIN
    -- Etapa 1: Validar sincronização
    FOR v_record IN (SELECT * FROM validar_sincronizacao_fila()) LOOP
        etapa := 'SINCRONIZACAO';
        acao := v_record.acao;
        atendimento_id := v_record.atendimento_id;
        detalhes := v_record.detalhes;
        RETURN NEXT;
    END LOOP;
    
    -- Etapa 2: Limpar ofertas expiradas
    FOR v_record IN (SELECT * FROM limpar_ofertas_expiradas()) LOOP
        etapa := 'LIMPEZA_OFERTAS';
        acao := v_record.acao;
        atendimento_id := v_record.atendimento_id;
        detalhes := v_record.detalhes;
        RETURN NEXT;
    END LOOP;
    
    -- Etapa 3: Executar distribuição
    FOR v_record IN (SELECT * FROM distribuir_atendimentos_inteligente()) LOOP
        etapa := 'DISTRIBUICAO';
        acao := 'OFERTA_CRIADA';
        atendimento_id := v_record.atendimento_id;
        detalhes := 'Oferta criada para ' || v_record.operador_email || ' (token: ' || v_record.pos_token || ')';
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$;