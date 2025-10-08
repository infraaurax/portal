-- ============================================
-- CORRIGIR STATUS DOS OPERADORES
-- ============================================

-- 1. Verificar status atual de todos os operadores
SELECT 
    id,
    nome,
    email,
    status,
    habilitado,
    online
FROM operadores
ORDER BY nome;

-- 2. Padronizar todos os status para 'ativo' ou 'inativo'
-- (ajustar conforme necessário)

-- Se houver operadores com status 'Ativo' (maiúsculo), converter para 'ativo'
UPDATE operadores
SET status = 'ativo'
WHERE status = 'Ativo';

-- Se houver operadores com status 'BLOQUEADO', converter para 'inativo'
UPDATE operadores
SET status = 'inativo'
WHERE status = 'BLOQUEADO';

-- Se houver operadores com status 'Inativo' (maiúsculo), converter para 'inativo'
UPDATE operadores
SET status = 'inativo'
WHERE status = 'Inativo';

-- 3. Verificar se ainda há status inconsistentes
SELECT DISTINCT status, COUNT(*) as quantidade
FROM operadores
GROUP BY status
ORDER BY quantidade DESC;

-- 4. Verificar resultado final
SELECT 
    id,
    nome,
    email,
    status,
    habilitado,
    online,
    CASE 
        WHEN status = 'ativo' THEN 'ATIVO (verde)'
        WHEN status = 'inativo' THEN 'BLOQUEADO (vermelho)'
        ELSE 'STATUS INVÁLIDO: ' || status
    END as status_interface
FROM operadores
ORDER BY nome;
