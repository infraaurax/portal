-- SOLUÇÃO RÁPIDA: Usar operador que já existe na tabela users
-- Execute no Supabase SQL Editor

-- 1. VERIFICAR OPERADORES QUE EXISTEM EM AMBAS AS TABELAS
SELECT 
    'OPERADORES VÁLIDOS (EXISTEM EM USERS E OPERADORES)' as info,
    o.id,
    o.nome,
    o.email,
    o.perfil,
    u.email as email_users
FROM operadores o
INNER JOIN users u ON o.id = u.id
WHERE o.habilitado = true
ORDER BY o.nome;

-- 2. ATRIBUIR ATENDIMENTOS A UM OPERADOR VÁLIDO
-- (Vai usar o primeiro operador que existe em ambas as tabelas)
UPDATE atendimentos 
SET 
    operador_id = (
        SELECT o.id
        FROM operadores o
        INNER JOIN users u ON o.id = u.id
        WHERE o.habilitado = true
        ORDER BY o.created_at
        LIMIT 1
    ),
    updated_at = NOW()
WHERE status IN ('pausado', 'aguardando', 'abandonado', 'nao_atendido')
  AND id IN (
    SELECT id 
    FROM atendimentos 
    WHERE status IN ('pausado', 'aguardando', 'abandonado', 'nao_atendido')
    ORDER BY updated_at DESC
    LIMIT 8
  )
RETURNING 
    codigo, 
    cliente_nome, 
    status, 
    operador_id,
    'ATRIBUÍDO A OPERADOR VÁLIDO' as resultado;

-- 3. VERIFICAR RESULTADO
SELECT 
    'RESULTADO DA ATRIBUIÇÃO' as info,
    o.nome as operador_nome,
    o.email,
    COUNT(a.id) as total_atendimentos,
    array_agg(DISTINCT a.status) as status_diferentes
FROM atendimentos a
INNER JOIN operadores o ON a.operador_id = o.id
GROUP BY o.id, o.nome, o.email
ORDER BY total_atendimentos DESC;

-- 4. CRIAR UM NOVO USUÁRIO INFRA TAMBÉM NA TABELA USERS
-- (Para resolver o problema definitivamente)
INSERT INTO users (
    id,
    email,
    created_at,
    updated_at,
    email_confirmed_at,
    confirmation_sent_at
) 
VALUES (
    '2652940a-2eb4-4b77-a542-ce3ba355f30e',
    'infra@auraxcred.com.br',
    NOW(),
    NOW(),
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

-- 5. AGORA ATRIBUIR ALGUNS ATENDIMENTOS AO OPERADOR INFRA ORIGINAL
UPDATE atendimentos 
SET 
    operador_id = '2652940a-2eb4-4b77-a542-ce3ba355f30e',
    updated_at = NOW()
WHERE status IN ('pausado', 'aguardando', 'abandonado', 'nao_atendido')
  AND id IN (
    SELECT id 
    FROM atendimentos 
    WHERE status IN ('pausado', 'aguardando', 'abandonado', 'nao_atendido')
    ORDER BY updated_at DESC
    LIMIT 3
  )
RETURNING 
    codigo, 
    cliente_nome, 
    status,
    'ATRIBUÍDO AO OPERADOR INFRA' as resultado;

-- 6. VERIFICAÇÃO FINAL
SELECT 
    'ATENDIMENTOS DO OPERADOR INFRA' as titulo,
    a.codigo,
    a.cliente_nome,
    a.status,
    a.operador_id
FROM atendimentos a
WHERE a.operador_id = '2652940a-2eb4-4b77-a542-ce3ba355f30e'
ORDER BY a.updated_at DESC;

-- ============================================================================
-- ESTA SOLUÇÃO:
-- ============================================================================
-- 1. Primeiro atribui atendimentos a um operador que já existe corretamente
-- 2. Cria o operador Infra na tabela users para resolver a constraint
-- 3. Depois atribui alguns atendimentos ao operador Infra original
-- 4. Resolve o problema de forma definitiva
-- ============================================================================
