-- Script para corrigir a atribuição de atendimentos ao operador logado
-- Execute no Supabase SQL Editor

-- 1. CONFIRMAR O PROBLEMA - Operador atual vs atendimentos
SELECT 
    '=== OPERADOR ATUAL ===' as info,
    id,
    nome, 
    email,
    'ID: ' || id as operador_id_completo
FROM operadores 
WHERE email = 'infra@auraxcred.com.br';

-- 2. VERIFICAR ATENDIMENTOS EXISTENTES E SEUS OPERADORES
SELECT 
    '=== ATENDIMENTOS EXISTENTES ===' as info,
    a.codigo,
    a.cliente_nome,
    a.status,
    a.operador_id,
    o.nome as operador_atual
FROM atendimentos a
LEFT JOIN operadores o ON a.operador_id = o.id
WHERE a.status IN ('pausado', 'aguardando', 'abandonado', 'nao_atendido')
ORDER BY a.updated_at DESC
LIMIT 10;

-- 3. ATRIBUIR 5 ATENDIMENTOS AO OPERADOR LOGADO (infra@auraxcred.com.br)
UPDATE atendimentos 
SET 
    operador_id = (
        SELECT id 
        FROM operadores 
        WHERE email = 'infra@auraxcred.com.br' 
        LIMIT 1
    ),
    updated_at = NOW()
WHERE id IN (
    SELECT id 
    FROM atendimentos 
    WHERE status IN ('pausado', 'aguardando', 'abandonado', 'nao_atendido')
    ORDER BY updated_at DESC
    LIMIT 5
)
RETURNING 
    codigo, 
    cliente_nome, 
    status, 
    operador_id,
    'ATRIBUÍDO AO OPERADOR INFRA' as acao;

-- 4. VERIFICAR RESULTADO - Atendimentos do operador Infra
SELECT 
    '=== RESULTADO FINAL ===' as info,
    a.codigo,
    a.cliente_nome,
    a.status,
    a.operador_id,
    o.nome as operador_nome,
    o.email as operador_email
FROM atendimentos a
INNER JOIN operadores o ON a.operador_id = o.id
WHERE o.email = 'infra@auraxcred.com.br'
ORDER BY a.updated_at DESC;

-- 5. CONFIRMAR QUE A BUSCA FUNCIONARÁ
SELECT 
    '=== TESTE DA BUSCA (SIMULAÇÃO) ===' as info,
    COUNT(*) as total_atendimentos_encontrados
FROM atendimentos a
INNER JOIN operadores o ON a.operador_id = o.id
WHERE o.email = 'infra@auraxcred.com.br'
  AND a.status IN ('pausado', 'aguardando', 'finalizado', 'abandonado', 'nao_atendido', 'em-andamento');

-- ============================================================================
-- INSTRUÇÕES:
-- ============================================================================
-- 1. Execute este script completo no Supabase SQL Editor
-- 2. Verifique se os atendimentos foram atribuídos corretamente  
-- 3. Volte ao Dashboard e pressione F5 para recarregar
-- 4. Os atendimentos devem aparecer agora!
--
-- IMPORTANTE: Este script atribui os últimos 5 atendimentos não finalizados 
-- ao operador 'infra@auraxcred.com.br' para que apareçam no dashboard.
-- ============================================================================
