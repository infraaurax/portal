-- ATRIBUIR ATENDIMENTOS EXISTENTES AO OPERADOR
-- Execute no Supabase SQL Editor

-- Passo 1: VERIFICAR OPERADOR
SELECT 'OPERADOR SELECIONADO' as verificacao, * FROM operadores WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- Passo 2: VER STATUS VÁLIDOS QUE EXISTEM NA TABELA
SELECT 'STATUS VÁLIDOS' as info, DISTINCT status FROM atendimentos WHERE status IS NOT NULL ORDER BY status;

-- Passo 3: ATRIBUIR ATENDIMENTOS EXISTENTES AO OPERADOR
-- Pega os últimos 15 atendimentos e atribui ao operador
UPDATE atendimentos 
SET 
    operador_id = 'fe66e131-e679-4efe-af22-e33d3b533e18',
    updated_at = NOW()
WHERE id IN (
    SELECT id 
    FROM atendimentos 
    WHERE operador_id IS NULL OR operador_id != 'fe66e131-e679-4efe-af22-e33d3b533e18'
    ORDER BY created_at DESC
    LIMIT 15
)
RETURNING codigo, cliente_nome, status, 'ATRIBUÍDO' as acao;

-- Passo 4: VERIFICAR RESULTADO
SELECT 
    'ATENDIMENTOS DO OPERADOR' as resultado,
    a.codigo,
    a.cliente_nome,
    a.status,
    o.nome as operador_nome,
    a.updated_at
FROM atendimentos a
INNER JOIN operadores o ON a.operador_id = o.id
WHERE a.operador_id = 'fe66e131-e679-4efe-af22-e33d3b533e18'
ORDER BY a.updated_at DESC;

-- Passo 5: CONTAR TOTAL
SELECT 
    'TOTAL ATENDIMENTOS' as info,
    COUNT(*) as total_atendimentos_do_operador
FROM atendimentos 
WHERE operador_id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- Passo 6: VERIFICAR EMAIL DO OPERADOR PARA LOGIN
SELECT 
    'EMAIL PARA LOGIN' as info,
    email,
    nome,
    perfil,
    '👆 USE ESTE EMAIL PARA FAZER LOGIN' as instrucao
FROM operadores 
WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';
