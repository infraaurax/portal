-- TRIGGER CORRIGIDO PARA FILA DE ATENDIMENTOS
-- Compatível com o schema atual da tabela fila_atendimentos

-- 1. Função para adicionar atendimento à fila
CREATE OR REPLACE FUNCTION adicionar_atendimento_fila_v2()
RETURNS TRIGGER AS $$
BEGIN
    -- Verifica se o atendimento tem status 'novo' e operador_id é NULL
    IF NEW.status = 'novo' AND NEW.operador_id IS NULL THEN
        -- Insere na fila de atendimentos
        INSERT INTO fila_atendimentos (
            atendimento_id,
            operador_id,
            status,
            prioridade,
            data_entrada
        ) VALUES (
            NEW.id,
            NULL,
            'aguardando', -- valor correto conforme constraint da tabela
            1, -- prioridade padrão
            NOW()
        );
        
        RAISE NOTICE 'Atendimento % adicionado à fila', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Remove trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_atendimento_para_fila ON atendimentos;

-- 3. Cria o novo trigger
CREATE TRIGGER trigger_atendimento_para_fila_v2
    AFTER INSERT OR UPDATE ON atendimentos
    FOR EACH ROW
    EXECUTE FUNCTION adicionar_atendimento_fila_v2();

-- 4. Teste do trigger
-- Primeiro, vamos verificar se há atendimentos que deveriam estar na fila
SELECT 
    'Atendimentos que deveriam estar na fila:' as info,
    COUNT(*) as total
FROM atendimentos 
WHERE status = 'novo' AND operador_id IS NULL;

-- Verificar se esses atendimentos já estão na fila
SELECT 
    'Atendimentos já na fila:' as info,
    COUNT(*) as total
FROM fila_atendimentos fa
JOIN atendimentos a ON fa.atendimento_id = a.id
WHERE a.status = 'novo' AND a.operador_id IS NULL;

-- 5. Script para adicionar atendimentos existentes à fila (se necessário)
-- Execute apenas se houver atendimentos que deveriam estar na fila mas não estão
INSERT INTO fila_atendimentos (
    atendimento_id,
    operador_id,
    status,
    prioridade,
    data_entrada
)
SELECT 
    a.id,
    NULL,
    'aguardando',
    1,
    a.created_at
FROM atendimentos a
LEFT JOIN fila_atendimentos fa ON fa.atendimento_id = a.id
WHERE a.status = 'novo' 
    AND a.operador_id IS NULL 
    AND fa.id IS NULL; -- apenas os que não estão na fila

-- 6. Verificação final
SELECT 
    'Verificação final - Total na fila:' as info,
    COUNT(*) as total
FROM fila_atendimentos;

-- 7. Teste manual - criar um novo atendimento para testar o trigger
-- (Descomente as linhas abaixo para testar)
/*
INSERT INTO atendimentos (
    cliente_nome,
    status,
    operador_id,
    created_at
) VALUES (
    'Teste Trigger Fila',
    'novo',
    NULL,
    NOW()
);

-- Verificar se foi adicionado à fila
SELECT 
    a.cliente_nome,
    a.status as atendimento_status,
    fa.status as fila_status,
    fa.data_entrada
FROM atendimentos a
JOIN fila_atendimentos fa ON fa.atendimento_id = a.id
WHERE a.cliente_nome = 'Teste Trigger Fila';
*/