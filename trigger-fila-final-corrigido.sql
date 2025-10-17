-- ============================================
-- TRIGGER FINAL CORRIGIDO PARA FILA INTELIGENTE
-- ============================================
-- Script para sobrescrever o trigger atual e criar um novo compatível
-- com a estrutura real das tabelas fila_atendimentos e atendimentos

-- ANÁLISE DA ESTRUTURA IDENTIFICADA:
-- Tabela fila_atendimentos tem:
-- - Campo: status (não status_fila como no sistema original)
-- - Constraint permite: 'waiting', 'assigned', 'done', 'dropped' (inglês)
--   E também: 'aguardando', 'aceito', 'finalizado', 'abandonado' (português)
-- - Campos: atendimento_id, operador_id, status, prioridade, data_entrada

-- Tabela atendimentos tem:
-- - Status válidos: 'novo', 'em-andamento', 'atendimento_ia', 'aguardando', 
--   'transferindo', 'pausado', 'finalizado', 'abandonado', 'nao_atendido'

-- ============================================
-- 1. REMOVER TRIGGERS E FUNÇÕES EXISTENTES
-- ============================================

-- Remove todos os triggers relacionados à fila
DROP TRIGGER IF EXISTS trigger_atendimento_para_fila ON atendimentos;
DROP TRIGGER IF EXISTS trigger_atendimento_para_fila_v2 ON atendimentos;
DROP TRIGGER IF EXISTS trigger_adicionar_atendimento_fila ON atendimentos;

-- Remove funções antigas
DROP FUNCTION IF EXISTS adicionar_atendimento_fila_v2();
DROP FUNCTION IF EXISTS adicionar_atendimento_fila();

-- ============================================
-- 2. CRIAR NOVA FUNÇÃO COMPATÍVEL
-- ============================================

CREATE OR REPLACE FUNCTION trigger_adicionar_fila_inteligente()
RETURNS TRIGGER AS $$
DECLARE
    v_existe_na_fila BOOLEAN := FALSE;
    v_proxima_posicao INTEGER := 1;
BEGIN
    -- Log para debug
    RAISE NOTICE 'Trigger executado para atendimento ID: %, Status: %, Operador: %', 
        NEW.id, NEW.status, NEW.operador_id;
    
    -- Verifica se deve adicionar à fila
    -- Condições: status = 'novo' E operador_id IS NULL
    IF NEW.status = 'novo' AND NEW.operador_id IS NULL THEN
        
        -- Verifica se já existe na fila
        SELECT EXISTS(
            SELECT 1 FROM fila_atendimentos 
            WHERE atendimento_id = NEW.id
        ) INTO v_existe_na_fila;
        
        -- Se não existe na fila, adiciona
        IF NOT v_existe_na_fila THEN
            
            -- Calcula próxima posição (se campo existir)
            SELECT COALESCE(MAX(prioridade), 0) + 1 
            INTO v_proxima_posicao
            FROM fila_atendimentos;
            
            -- Insere na fila com campos compatíveis
            INSERT INTO fila_atendimentos (
                atendimento_id,
                operador_id,
                status,
                prioridade,
                data_entrada,
                created_at,
                updated_at
            ) VALUES (
                NEW.id,
                NULL,
                'aguardando', -- Status compatível com a constraint
                v_proxima_posicao,
                NOW(),
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Atendimento % adicionado à fila na posição %', NEW.id, v_proxima_posicao;
        ELSE
            RAISE NOTICE 'Atendimento % já existe na fila', NEW.id;
        END IF;
        
    -- Se atendimento foi atribuído a operador, remove da fila
    ELSIF NEW.operador_id IS NOT NULL AND OLD.operador_id IS NULL THEN
        
        DELETE FROM fila_atendimentos 
        WHERE atendimento_id = NEW.id;
        
        RAISE NOTICE 'Atendimento % removido da fila (atribuído ao operador %)', NEW.id, NEW.operador_id;
        
    -- Se status mudou para finalizado/abandonado, remove da fila
    ELSIF NEW.status IN ('finalizado', 'abandonado', 'nao_atendido') THEN
        
        DELETE FROM fila_atendimentos 
        WHERE atendimento_id = NEW.id;
        
        RAISE NOTICE 'Atendimento % removido da fila (status: %)', NEW.id, NEW.status;
        
    END IF;
    
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Erro no trigger da fila: % - %', SQLSTATE, SQLERRM;
        RETURN NEW; -- Não falha o INSERT/UPDATE principal
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. CRIAR NOVO TRIGGER
-- ============================================

CREATE TRIGGER trigger_fila_inteligente_v3
    AFTER INSERT OR UPDATE ON atendimentos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_adicionar_fila_inteligente();

-- ============================================
-- 4. FUNÇÃO AUXILIAR PARA REORGANIZAR FILA
-- ============================================

CREATE OR REPLACE FUNCTION reorganizar_fila()
RETURNS JSON AS $$
DECLARE
    v_contador INTEGER := 1;
    v_registro RECORD;
    v_total_reorganizado INTEGER := 0;
BEGIN
    -- Reorganiza as prioridades sequencialmente
    FOR v_registro IN 
        SELECT id FROM fila_atendimentos 
        WHERE status = 'aguardando'
        ORDER BY data_entrada ASC
    LOOP
        UPDATE fila_atendimentos 
        SET prioridade = v_contador,
            updated_at = NOW()
        WHERE id = v_registro.id;
        
        v_contador := v_contador + 1;
        v_total_reorganizado := v_total_reorganizado + 1;
    END LOOP;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Fila reorganizada com sucesso',
        'total_reorganizado', v_total_reorganizado
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. MIGRAÇÃO DE DADOS EXISTENTES
-- ============================================

-- Adiciona atendimentos existentes que deveriam estar na fila
INSERT INTO fila_atendimentos (
    atendimento_id,
    operador_id,
    status,
    prioridade,
    data_entrada,
    created_at,
    updated_at
)
SELECT 
    a.id,
    NULL,
    'aguardando',
    ROW_NUMBER() OVER (ORDER BY a.created_at),
    a.created_at,
    NOW(),
    NOW()
FROM atendimentos a
LEFT JOIN fila_atendimentos fa ON fa.atendimento_id = a.id
WHERE a.status = 'novo' 
    AND a.operador_id IS NULL 
    AND fa.id IS NULL; -- apenas os que não estão na fila

-- ============================================
-- 6. SCRIPTS DE VERIFICAÇÃO E TESTE
-- ============================================

-- Verificar estrutura das tabelas
SELECT 
    'VERIFICAÇÃO - Colunas da tabela fila_atendimentos' as info;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'fila_atendimentos' 
ORDER BY ordinal_position;

-- Verificar constraints
SELECT 
    'VERIFICAÇÃO - Constraints da tabela fila_atendimentos' as info;

SELECT tc.constraint_name, tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name = 'fila_atendimentos';

-- Verificar dados na fila
SELECT 
    'VERIFICAÇÃO - Atendimentos na fila' as info;

SELECT 
    fa.id,
    fa.atendimento_id,
    fa.status,
    fa.prioridade,
    fa.data_entrada,
    a.cliente_nome,
    a.status as atendimento_status
FROM fila_atendimentos fa
JOIN atendimentos a ON fa.atendimento_id = a.id
ORDER BY fa.prioridade;

-- Verificar atendimentos que deveriam estar na fila
SELECT 
    'VERIFICAÇÃO - Atendimentos que deveriam estar na fila' as info;

SELECT 
    a.id,
    a.cliente_nome,
    a.status,
    a.operador_id,
    a.created_at,
    CASE 
        WHEN fa.id IS NOT NULL THEN 'JÁ NA FILA'
        ELSE 'FALTANDO NA FILA'
    END as situacao_fila
FROM atendimentos a
LEFT JOIN fila_atendimentos fa ON fa.atendimento_id = a.id
WHERE a.status = 'novo' AND a.operador_id IS NULL;

-- ============================================
-- 7. TESTE MANUAL DO TRIGGER
-- ============================================

-- Para testar, descomente as linhas abaixo:
/*
-- Criar um atendimento de teste
INSERT INTO atendimentos (
    cliente_nome,
    status,
    operador_id,
    created_at
) VALUES (
    'TESTE TRIGGER FILA V3',
    'novo',
    NULL,
    NOW()
);

-- Verificar se foi adicionado à fila
SELECT 
    'TESTE - Resultado do trigger' as info;

SELECT 
    a.cliente_nome,
    a.status as atendimento_status,
    fa.status as fila_status,
    fa.prioridade,
    fa.data_entrada
FROM atendimentos a
LEFT JOIN fila_atendimentos fa ON fa.atendimento_id = a.id
WHERE a.cliente_nome = 'TESTE TRIGGER FILA V3';
*/

-- ============================================
-- 8. REORGANIZAR FILA APÓS MIGRAÇÃO
-- ============================================

SELECT reorganizar_fila() as resultado_reorganizacao;

-- ============================================
-- RESUMO DO QUE FOI IMPLEMENTADO:
-- ============================================
-- ✅ Trigger compatível com estrutura real das tabelas
-- ✅ Função que adiciona atendimentos novos à fila
-- ✅ Função que remove atendimentos atribuídos/finalizados da fila
-- ✅ Migração de dados existentes
-- ✅ Função para reorganizar prioridades da fila
-- ✅ Scripts de verificação e teste
-- ✅ Tratamento de erros para não quebrar operações principais