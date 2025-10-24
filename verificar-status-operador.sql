-- =====================================================
-- VERIFICAR STATUS DO OPERADOR ESPECÍFICO
-- =====================================================

-- Substitua 'SEU_EMAIL_AQUI' pelo email do operador logado
-- ou use o ID do operador se souber

-- 1. VERIFICAR POR EMAIL (substitua pelo email do operador logado)
SELECT 
    'OPERADOR POR EMAIL' as tipo,
    id,
    nome,
    email,
    habilitado,
    online,
    pos_token,
    status,
    created_at,
    updated_at
FROM operadores 
WHERE email = 'SEU_EMAIL_AQUI';  -- SUBSTITUA AQUI

-- 2. VERIFICAR TODOS OS OPERADORES ONLINE E HABILITADOS
SELECT 
    'TODOS OPERADORES ONLINE' as tipo,
    id,
    nome,
    email,
    habilitado,
    online,
    pos_token,
    status
FROM operadores 
WHERE habilitado = true 
AND online = true 
AND pos_token IS NOT NULL
ORDER BY pos_token ASC;

-- 3. VERIFICAR SE HÁ ALGUM OPERADOR DISPONÍVEL
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'SIM - ' || COUNT(*) || ' operador(es) disponível(eis)'
        ELSE 'NÃO - Nenhum operador disponível'
    END as operadores_disponiveis
FROM operadores 
WHERE habilitado = true 
AND online = true 
AND pos_token IS NOT NULL;

-- 4. FORÇAR OPERADOR ONLINE (se necessário)
-- Descomente e substitua o email para forçar um operador online:
/*
UPDATE operadores 
SET 
    habilitado = true,
    online = true,
    pos_token = COALESCE((SELECT MAX(pos_token) FROM operadores WHERE habilitado = true AND online = true), 0) + 1,
    updated_at = NOW()
WHERE email = 'SEU_EMAIL_AQUI'  -- SUBSTITUA AQUI
RETURNING id, nome, email, habilitado, online, pos_token;
*/