-- Script para corrigir definitivamente a constraint de status da tabela atendimentos
-- Este script inclui TODOS os status encontrados no sistema

-- 1. Primeiro, vamos verificar se a constraint existe
DO $$
BEGIN
    -- Remover a constraint existente se ela existir
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'atendimentos_status_validos_check' 
        AND table_name = 'atendimentos'
    ) THEN
        ALTER TABLE atendimentos DROP CONSTRAINT atendimentos_status_validos_check;
        RAISE NOTICE 'Constraint atendimentos_status_validos_check removida com sucesso.';
    ELSE
        RAISE NOTICE 'Constraint atendimentos_status_validos_check não encontrada.';
    END IF;
END $$;

-- 2. Criar a nova constraint com TODOS os status válidos encontrados no sistema
ALTER TABLE atendimentos 
ADD CONSTRAINT atendimentos_status_validos_check 
CHECK (status IN (
    'novo',
    'em-andamento', 
    'atendimento_ia',
    'aguardando',
    'transferindo',
    'pausado',
    'finalizado',
    'abandonado',
    'nao_atendido'
));

-- 3. Verificar se a constraint foi criada corretamente
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'atendimentos_status_validos_check';

-- 4. Verificar todos os status únicos atualmente na tabela
SELECT DISTINCT status, COUNT(*) as quantidade
FROM atendimentos 
GROUP BY status 
ORDER BY status;

-- 5. Teste opcional: inserir um registro com status 'transferindo' para verificar
-- DESCOMENTE as linhas abaixo para testar:
/*
INSERT INTO atendimentos (
    titulo, 
    descricao, 
    status, 
    prioridade, 
    operador_id, 
    created_at
) VALUES (
    'Teste Status Transferindo', 
    'Teste para verificar se o status transferindo funciona', 
    'transferindo', 
    'media', 
    1, 
    NOW()
);

-- Remover o registro de teste
DELETE FROM atendimentos 
WHERE titulo = 'Teste Status Transferindo' 
AND descricao = 'Teste para verificar se o status transferindo funciona';
*/

-- Status válidos incluídos nesta constraint:
-- 'novo' - Status inicial dos atendimentos
-- 'em-andamento' - Atendimento sendo processado
-- 'atendimento_ia' - Atendimento sendo processado por IA
-- 'aguardando' - Aguardando resposta ou ação
-- 'transferindo' - Atendimento sendo transferido
-- 'pausado' - Atendimento pausado temporariamente
-- 'finalizado' - Atendimento concluído com sucesso
-- 'abandonado' - Atendimento abandonado
-- 'nao_atendido' - Atendimento não foi atendido

COMMIT;