-- Script para adicionar o status 'transferindo' à constraint da tabela atendimentos
-- Execute no Supabase SQL Editor

-- 1. Primeiro, vamos verificar a constraint atual
SELECT 
    conname as constraint_name,
    consrc as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'atendimentos'::regclass 
  AND contype = 'c'
  AND conname LIKE '%status%';

-- 2. Remover a constraint existente (se existir)
ALTER TABLE atendimentos 
DROP CONSTRAINT IF EXISTS atendimentos_status_validos_check;

-- 3. Criar nova constraint incluindo 'transferindo'
ALTER TABLE atendimentos 
ADD CONSTRAINT atendimentos_status_validos_check 
CHECK (status IN (
    'novo',
    'em-andamento', 
    'aguardando',
    'transferindo',
    'pausado',
    'finalizado',
    'abandonado',
    'nao_atendido'
));

-- 4. Verificar se a constraint foi criada corretamente
SELECT 
    conname as constraint_name,
    consrc as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'atendimentos'::regclass 
  AND contype = 'c'
  AND conname = 'atendimentos_status_validos_check';

-- 5. Testar inserindo um registro com status 'transferindo'
-- (Este teste será removido após confirmação)
/*
INSERT INTO atendimentos (
    codigo,
    cliente_nome,
    cliente_telefone,
    status,
    prioridade,
    descricao_atendimento,
    created_at,
    updated_at
) VALUES (
    'TEST-TRANSFERINDO',
    'Teste Transferindo',
    '+5511999999999',
    'transferindo',
    'media',
    'Teste do status transferindo',
    NOW(),
    NOW()
);

-- Remover o registro de teste
DELETE FROM atendimentos WHERE codigo = 'TEST-TRANSFERINDO';
*/

-- 6. Verificar status válidos na tabela
SELECT DISTINCT status, COUNT(*) as quantidade
FROM atendimentos 
GROUP BY status
ORDER BY status;

COMMIT;