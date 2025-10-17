-- =====================================================
-- SISTEMA DE FILA INTELIGENTE PARA ATENDIMENTOS
-- =====================================================
-- Este script implementa um sistema que:
-- 1. Cria a tabela fila_atendimentos para gerenciar a distribuição
-- 2. Evita oferecer todos os atendimentos simultaneamente
-- 3. Controla rejeições para evitar abandono prematuro
-- 4. Distribui atendimentos de forma inteligente baseado no número de operadores online

-- =====================================================
-- 1. CRIAR TABELA FILA_ATENDIMENTOS
-- =====================================================

-- Verificar se a tabela já existe e removê-la se necessário
DROP TABLE IF EXISTS fila_atendimentos CASCADE;

-- Criar tabela para gerenciar a fila de atendimentos
CREATE TABLE fila_atendimentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    atendimento_id UUID NOT NULL REFERENCES atendimentos(id) ON DELETE CASCADE,
    operador_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'na_fila', -- na_fila, oferecido, aceito, rejeitado, expirado
    tentativas_rejeicao INTEGER DEFAULT 0,
    data_entrada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_oferecimento TIMESTAMP WITH TIME ZONE,
    data_expiracao TIMESTAMP WITH TIME ZONE,
    prioridade INTEGER DEFAULT 1, -- 1 = normal, 2 = alta, 3 = urgente
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_fila_atendimentos_status ON fila_atendimentos(status);
CREATE INDEX idx_fila_atendimentos_operador ON fila_atendimentos(operador_id);
CREATE INDEX idx_fila_atendimentos_prioridade ON fila_atendimentos(prioridade DESC, data_entrada ASC);
CREATE INDEX idx_fila_atendimentos_data_expiracao ON fila_atendimentos(data_expiracao);

-- =====================================================
-- 2. FUNÇÃO PARA ADICIONAR ATENDIMENTO À FILA
-- =====================================================

CREATE OR REPLACE FUNCTION adicionar_atendimento_fila(
    p_atendimento_id UUID,
    p_prioridade INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o atendimento já está na fila
    IF EXISTS (
        SELECT 1 FROM fila_atendimentos 
        WHERE atendimento_id = p_atendimento_id 
        AND status IN ('na_fila', 'oferecido')
    ) THEN
        RETURN FALSE; -- Já está na fila
    END IF;

    -- Adicionar à fila
    INSERT INTO fila_atendimentos (atendimento_id, prioridade)
    VALUES (p_atendimento_id, p_prioridade);

    RETURN TRUE;
END;
$$;

-- =====================================================
-- 3. FUNÇÃO PARA DISTRIBUIR ATENDIMENTOS INTELIGENTEMENTE
-- =====================================================

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
    rec RECORD;
BEGIN
    -- Contar operadores online e habilitados
    SELECT COUNT(*) INTO v_operadores_online
    FROM auth.users u
    WHERE u.raw_user_meta_data->>'habilitado' = 'true'
    AND u.raw_user_meta_data->>'status_geral' = 'ativo'
    AND u.last_sign_in_at > NOW() - INTERVAL '5 minutes'; -- Considerado online se logou nos últimos 5 minutos

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

    -- Calcular quantos atendimentos podem ser oferecidos simultaneamente
    -- Regra: máximo de operadores online, mas nunca mais que 3 simultaneamente
    v_max_oferecimentos := LEAST(v_operadores_online, 3);

    -- Se já temos o máximo de oferecimentos, não oferecer mais
    IF v_atendimentos_oferecidos >= v_max_oferecimentos THEN
        RETURN;
    END IF;

    -- Distribuir atendimentos para operadores disponíveis
    FOR rec IN (
        SELECT 
            fa.id as fila_id,
            fa.atendimento_id,
            u.id as operador_id,
            u.email as operador_email,
            COALESCE((u.raw_user_meta_data->>'pos_token')::INTEGER, 999) as pos_token
        FROM fila_atendimentos fa
        CROSS JOIN auth.users u
        WHERE fa.status = 'na_fila'
        AND u.raw_user_meta_data->>'habilitado' = 'true'
        AND u.raw_user_meta_data->>'status_geral' = 'ativo'
        AND u.last_sign_in_at > NOW() - INTERVAL '5 minutes'
        AND NOT EXISTS (
            -- Operador não pode ter atendimento já oferecido
            SELECT 1 FROM fila_atendimentos fa2
            WHERE fa2.operador_id = u.id
            AND fa2.status = 'oferecido'
            AND (fa2.data_expiracao IS NULL OR fa2.data_expiracao > NOW())
        )
        ORDER BY fa.prioridade DESC, fa.data_entrada ASC, pos_token ASC
        LIMIT (v_max_oferecimentos - v_atendimentos_oferecidos)
    ) LOOP
        -- Atualizar o registro na fila
        UPDATE fila_atendimentos
        SET 
            operador_id = rec.operador_id,
            status = 'oferecido',
            data_oferecimento = NOW(),
            data_expiracao = NOW() + INTERVAL '45 seconds',
            updated_at = NOW()
        WHERE id = rec.fila_id;

        -- Atualizar o atendimento para status aguardando (SEM atribuir operador_id)
        -- O operador_id só será atribuído quando o operador aceitar pela modal
        UPDATE atendimentos
        SET 
            status = 'aguardando',
            updated_at = NOW()
        WHERE id = rec.atendimento_id;

        -- Retornar dados para notificação
        atendimento_id := rec.atendimento_id;
        operador_id := rec.operador_id;
        operador_email := rec.operador_email;
        pos_token := rec.pos_token;
        
        RETURN NEXT;
    END LOOP;

    RETURN;
END;
$$;

-- =====================================================
-- 4. FUNÇÃO PARA PROCESSAR REJEIÇÃO
-- =====================================================

CREATE OR REPLACE FUNCTION processar_rejeicao_fila(
    p_atendimento_id UUID,
    p_operador_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tentativas INTEGER;
    v_operadores_disponiveis INTEGER;
    v_resultado JSONB;
BEGIN
    -- Atualizar registro na fila
    UPDATE fila_atendimentos
    SET 
        status = 'rejeitado',
        tentativas_rejeicao = tentativas_rejeicao + 1,
        updated_at = NOW()
    WHERE atendimento_id = p_atendimento_id
    AND operador_id = p_operador_id
    RETURNING tentativas_rejeicao INTO v_tentativas;

    -- Contar operadores disponíveis
    SELECT COUNT(*) INTO v_operadores_disponiveis
    FROM auth.users u
    WHERE u.raw_user_meta_data->>'habilitado' = 'true'
    AND u.raw_user_meta_data->>'status_geral' = 'ativo'
    AND u.last_sign_in_at > NOW() - INTERVAL '5 minutes';

    -- Se tentativas >= operadores disponíveis, marcar como abandonado
    IF v_tentativas >= v_operadores_disponiveis THEN
        UPDATE atendimentos
        SET 
            status = 'abandonado',
            operador_id = NULL,
            updated_at = NOW()
        WHERE id = p_atendimento_id;

        -- Remover da fila
        DELETE FROM fila_atendimentos
        WHERE atendimento_id = p_atendimento_id;

        v_resultado := jsonb_build_object(
            'status', 'abandonado',
            'tentativas', v_tentativas,
            'operadores_disponiveis', v_operadores_disponiveis
        );
    ELSE
        -- Recolocar na fila para nova tentativa
        INSERT INTO fila_atendimentos (atendimento_id, tentativas_rejeicao, prioridade)
        VALUES (p_atendimento_id, v_tentativas, 2) -- Prioridade alta para rejeições
        ON CONFLICT (atendimento_id) DO UPDATE SET
            status = 'na_fila',
            operador_id = NULL,
            tentativas_rejeicao = v_tentativas,
            prioridade = 2,
            data_oferecimento = NULL,
            data_expiracao = NULL,
            updated_at = NOW();

        -- Resetar status do atendimento
        UPDATE atendimentos
        SET 
            status = 'novo',
            operador_id = NULL,
            updated_at = NOW()
        WHERE id = p_atendimento_id;

        v_resultado := jsonb_build_object(
            'status', 'recolocado_na_fila',
            'tentativas', v_tentativas,
            'operadores_disponiveis', v_operadores_disponiveis
        );
    END IF;

    RETURN v_resultado;
END;
$$;

-- =====================================================
-- 5. FUNÇÃO PARA ACEITAR ATENDIMENTO
-- =====================================================

-- Remover função existente se houver conflito de tipo de retorno
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
    v_fila_updated INTEGER;
    v_atendimento_updated INTEGER;
BEGIN
    -- Atualizar registro na fila
    UPDATE fila_atendimentos
    SET 
        status = 'aceito',
        updated_at = NOW()
    WHERE atendimento_id = p_atendimento_id
    AND operador_id = p_operador_id;
    
    GET DIAGNOSTICS v_fila_updated = ROW_COUNT;
    
    IF v_fila_updated = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Atendimento não encontrado na fila ou não está oferecido para este operador'
        );
    END IF;

    -- Atualizar atendimento e atribuir operador
    UPDATE atendimentos
    SET 
        status = 'em-andamento',
        operador_id = p_operador_id,
        data_inicio = NOW(),
        updated_at = NOW()
    WHERE id = p_atendimento_id;
    
    GET DIAGNOSTICS v_atendimento_updated = ROW_COUNT;
    
    IF v_atendimento_updated = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Atendimento não encontrado'
        );
    END IF;

    -- Remover da fila (atendimento aceito)
    DELETE FROM fila_atendimentos
    WHERE atendimento_id = p_atendimento_id;

    RETURN jsonb_build_object(
        'success', true,
        'status', 'aceito',
        'atendimento_id', p_atendimento_id,
        'operador_id', p_operador_id
    );
END;
$$;

-- =====================================================
-- 6. FUNÇÃO PARA LIMPAR OFERECIMENTOS EXPIRADOS
-- =====================================================

CREATE OR REPLACE FUNCTION limpar_oferecimentos_expirados()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Contar registros expirados
    SELECT COUNT(*) INTO v_count
    FROM fila_atendimentos
    WHERE status = 'oferecido'
    AND data_expiracao IS NOT NULL
    AND data_expiracao <= NOW();

    -- Recolocar atendimentos expirados na fila
    UPDATE fila_atendimentos
    SET 
        status = 'na_fila',
        operador_id = NULL,
        tentativas_rejeicao = tentativas_rejeicao + 1,
        data_oferecimento = NULL,
        data_expiracao = NULL,
        updated_at = NOW()
    WHERE status = 'oferecido'
    AND data_expiracao IS NOT NULL
    AND data_expiracao <= NOW();

    -- Resetar status dos atendimentos expirados
    UPDATE atendimentos
    SET 
        status = 'novo',
        operador_id = NULL,
        updated_at = NOW()
    WHERE id IN (
        SELECT atendimento_id
        FROM fila_atendimentos
        WHERE status = 'na_fila'
        AND tentativas_rejeicao > 0
    );

    RETURN v_count;
END;
$$;

-- =====================================================
-- 7. TRIGGER PARA ADICIONAR NOVOS ATENDIMENTOS À FILA
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_adicionar_atendimento_fila()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Adicionar à fila apenas se status for 'novo' e não tiver operador
    IF NEW.status = 'novo' AND NEW.operador_id IS NULL THEN
        PERFORM adicionar_atendimento_fila(NEW.id, 1);
    END IF;

    RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_atendimento_para_fila ON atendimentos;
CREATE TRIGGER trigger_atendimento_para_fila
    AFTER INSERT OR UPDATE ON atendimentos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_adicionar_atendimento_fila();

-- =====================================================
-- 8. FUNÇÃO PARA EXECUTAR DISTRIBUIÇÃO AUTOMÁTICA
-- =====================================================

CREATE OR REPLACE FUNCTION executar_distribuicao_automatica()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_limpeza INTEGER;
    v_distribuicoes INTEGER := 0;
    rec RECORD;
    v_resultado JSONB;
BEGIN
    -- Primeiro, limpar oferecimentos expirados
    SELECT limpar_oferecimentos_expirados() INTO v_limpeza;

    -- Depois, distribuir novos atendimentos
    FOR rec IN (
        SELECT * FROM distribuir_atendimentos_inteligente()
    ) LOOP
        v_distribuicoes := v_distribuicoes + 1;
    END LOOP;

    v_resultado := jsonb_build_object(
        'oferecimentos_expirados_limpos', v_limpeza,
        'novos_oferecimentos', v_distribuicoes,
        'timestamp', NOW()
    );

    RETURN v_resultado;
END;
$$;

-- =====================================================
-- 9. POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS na tabela
ALTER TABLE fila_atendimentos ENABLE ROW LEVEL SECURITY;

-- Política para operadores verem apenas seus próprios registros na fila
CREATE POLICY "Operadores podem ver seus registros na fila"
ON fila_atendimentos
FOR ALL
TO authenticated
USING (operador_id = auth.uid() OR operador_id IS NULL);

-- =====================================================
-- 10. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE fila_atendimentos IS 'Tabela para gerenciar a fila inteligente de distribuição de atendimentos';
COMMENT ON FUNCTION adicionar_atendimento_fila IS 'Adiciona um atendimento à fila de distribuição';
COMMENT ON FUNCTION distribuir_atendimentos_inteligente IS 'Distribui atendimentos de forma inteligente baseado no número de operadores online';
COMMENT ON FUNCTION processar_rejeicao_fila IS 'Processa a rejeição de um atendimento e decide se recoloca na fila ou abandona';
COMMENT ON FUNCTION aceitar_atendimento_fila IS 'Processa a aceitação de um atendimento da fila';
COMMENT ON FUNCTION limpar_oferecimentos_expirados IS 'Remove oferecimentos expirados e recoloca na fila';
COMMENT ON FUNCTION executar_distribuicao_automatica IS 'Executa o ciclo completo de limpeza e distribuição';

-- =====================================================
-- SCRIPT CONCLUÍDO
-- =====================================================
-- Para testar o sistema:
-- 1. Execute este script no Supabase SQL Editor
-- 2. Crie alguns atendimentos com status 'novo'
-- 3. Execute: SELECT executar_distribuicao_automatica();
-- 4. Verifique a tabela fila_atendimentos para ver a distribuição
-- =====================================================