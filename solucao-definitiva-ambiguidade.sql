-- =====================================================
-- SOLUÇÃO DEFINITIVA PARA TODOS OS ERROS DE AMBIGUIDADE
-- =====================================================
-- Este script resolve TODOS os problemas de ambiguidade
-- e recria TODAS as funções necessárias

-- 1. REMOVER TODAS AS FUNÇÕES EXISTENTES
DROP FUNCTION IF EXISTS public.distribuir_atendimentos_inteligente() CASCADE;
DROP FUNCTION IF EXISTS public.executar_manutencao_fila() CASCADE;
DROP FUNCTION IF EXISTS public.validar_sincronizacao_fila() CASCADE;
DROP FUNCTION IF EXISTS public.limpar_ofertas_expiradas() CASCADE;

-- 2. FUNÇÃO DE VALIDAÇÃO (SEM AMBIGUIDADE)
CREATE OR REPLACE FUNCTION public.validar_sincronizacao_fila()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    dessinc_count INTEGER;
    acao_realizada TEXT := 'NENHUMA_ACAO';
BEGIN
    -- Verificar dessincronizações usando aliases explícitos
    SELECT COUNT(*)
    INTO dessinc_count
    FROM fila_atendimento fa
    JOIN atendimentos a ON fa.atendimento_id = a.id
    WHERE fa.status != a.status;
    
    IF dessinc_count > 0 THEN
        -- Sincronizar status da fila com atendimentos
        UPDATE fila_atendimento 
        SET status = a.status,
            updated_at = NOW()
        FROM atendimentos a
        WHERE fila_atendimento.atendimento_id = a.id
        AND fila_atendimento.status != a.status;
        
        acao_realizada := 'SINCRONIZADO: ' || dessinc_count || ' registros';
    ELSE
        acao_realizada := 'NENHUMA_ACAO: Fila sincronizada corretamente';
    END IF;
    
    RETURN acao_realizada;
END;
$$;

-- 3. FUNÇÃO DE LIMPEZA DE OFERTAS (SEM AMBIGUIDADE)
CREATE OR REPLACE FUNCTION public.limpar_ofertas_expiradas()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    ofertas_removidas INTEGER;
BEGIN
    -- Remover ofertas expiradas usando aliases explícitos
    DELETE FROM ofertas_atendimento oa
    WHERE oa.status = 'pendente'
    AND oa.created_at < NOW() - INTERVAL '5 minutes';
    
    GET DIAGNOSTICS ofertas_removidas = ROW_COUNT;
    
    IF ofertas_removidas > 0 THEN
        RETURN 'LIMPEZA: ' || ofertas_removidas || ' ofertas expiradas removidas';
    ELSE
        RETURN 'LIMPEZA: Nenhuma oferta expirada encontrada';
    END IF;
END;
$$;

-- 4. FUNÇÃO DE DISTRIBUIÇÃO INTELIGENTE (SEM AMBIGUIDADE)
CREATE OR REPLACE FUNCTION public.distribuir_atendimentos_inteligente()
RETURNS TABLE(
    atendimento_id UUID,
    operador_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    atendimento_record RECORD;
    operador_record RECORD;
    ofertas_criadas INTEGER := 0;
BEGIN
    -- Buscar atendimentos aguardando usando aliases explícitos
    FOR atendimento_record IN
        SELECT fa.atendimento_id as id
        FROM fila_atendimento fa
        WHERE fa.status = 'aguardando'
        AND NOT EXISTS (
            SELECT 1 FROM ofertas_atendimento oa 
            WHERE oa.atendimento_id = fa.atendimento_id 
            AND oa.status = 'pendente'
        )
        ORDER BY fa.created_at ASC
        LIMIT 10
    LOOP
        -- Buscar operador disponível usando aliases explícitos
        SELECT op.id, op.email, op.pos_token
        INTO operador_record
        FROM operadores op
        WHERE op.status = 'disponivel'
        AND (
            SELECT COUNT(*) 
            FROM ofertas_atendimento oa2 
            WHERE oa2.operador_id = op.id 
            AND oa2.status = 'pendente'
        ) < 1
        ORDER BY op.pos_token ASC
        LIMIT 1;
        
        -- Se encontrou operador, criar oferta
        IF operador_record.id IS NOT NULL THEN
            INSERT INTO ofertas_atendimento (
                atendimento_id,
                operador_id,
                status,
                created_at
            ) VALUES (
                atendimento_record.id,
                operador_record.id,
                'pendente',
                NOW()
            );
            
            -- Atualizar status na fila
            UPDATE fila_atendimento 
            SET status = 'oferecido',
                operador_id = operador_record.id,
                updated_at = NOW()
            WHERE atendimento_id = atendimento_record.id;
            
            ofertas_criadas := ofertas_criadas + 1;
            
            -- Retornar resultado
            atendimento_id := atendimento_record.id;
            operador_id := operador_record.id;
            RETURN NEXT;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$;

-- 5. FUNÇÃO DE MANUTENÇÃO COMPLETA (SEM AMBIGUIDADE)
CREATE OR REPLACE FUNCTION public.executar_manutencao_fila()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    resultado_validacao TEXT;
    resultado_limpeza TEXT;
    resultado_distribuicao TEXT;
    ofertas_criadas INTEGER := 0;
    resultado_final TEXT;
BEGIN
    -- 1. Validar sincronização
    SELECT validar_sincronizacao_fila() INTO resultado_validacao;
    
    -- 2. Limpar ofertas expiradas
    SELECT limpar_ofertas_expiradas() INTO resultado_limpeza;
    
    -- 3. Distribuir atendimentos
    SELECT COUNT(*)
    INTO ofertas_criadas
    FROM distribuir_atendimentos_inteligente();
    
    IF ofertas_criadas > 0 THEN
        resultado_distribuicao := 'DISTRIBUICAO: ' || ofertas_criadas || ' ofertas criadas';
    ELSE
        resultado_distribuicao := 'DISTRIBUICAO: Nenhuma oferta criada';
    END IF;
    
    -- Compilar resultado final
    resultado_final := resultado_validacao || ' | ' || resultado_limpeza || ' | ' || resultado_distribuicao;
    
    RETURN resultado_final;
END;
$$;

-- 6. VERIFICAR SE TODAS AS FUNÇÕES FORAM CRIADAS
SELECT 
    'distribuir_atendimentos_inteligente' as funcao,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'distribuir_atendimentos_inteligente'
    ) THEN 'CRIADA' ELSE 'ERRO' END as status
UNION ALL
SELECT 
    'executar_manutencao_fila' as funcao,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'executar_manutencao_fila'
    ) THEN 'CRIADA' ELSE 'ERRO' END as status
UNION ALL
SELECT 
    'validar_sincronizacao_fila' as funcao,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'validar_sincronizacao_fila'
    ) THEN 'CRIADA' ELSE 'ERRO' END as status
UNION ALL
SELECT 
    'limpar_ofertas_expiradas' as funcao,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'limpar_ofertas_expiradas'
    ) THEN 'CRIADA' ELSE 'ERRO' END as status;