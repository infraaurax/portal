-- ============================================
-- TESTE DA FUNÇÃO DE ALTERAR STATUS DO OPERADOR
-- ============================================

-- 1. Verificar operador específico antes do teste
SELECT 
    id,
    nome,
    email,
    status,
    habilitado,
    online,
    updated_at
FROM operadores 
WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- 2. Testar alteração de status para 'inativo' (bloquear)
UPDATE operadores
SET 
    status = 'inativo',
    updated_at = NOW()
WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- 3. Verificar se a alteração foi aplicada
SELECT 
    id,
    nome,
    email,
    status,
    habilitado,
    online,
    updated_at
FROM operadores 
WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- 4. Testar alteração de status para 'ativo' (desbloquear)
UPDATE operadores
SET 
    status = 'ativo',
    updated_at = NOW()
WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- 5. Verificar se a alteração foi aplicada
SELECT 
    id,
    nome,
    email,
    status,
    habilitado,
    online,
    updated_at
FROM operadores 
WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- ============================================
-- VERIFICAR TODOS OS STATUS POSSÍVEIS
-- ============================================
SELECT DISTINCT status, COUNT(*) as quantidade
FROM operadores
GROUP BY status
ORDER BY quantidade DESC;

-- ============================================
-- TESTE DE INTEGRIDADE
-- ============================================
-- Verificar se há operadores com status inválido
SELECT 
    id,
    nome,
    email,
    status
FROM operadores
WHERE status NOT IN ('ativo', 'inativo', 'Ativo', 'Inativo', 'BLOQUEADO')
ORDER BY status;
