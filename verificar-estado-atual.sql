-- =====================================================
-- VERIFICAÇÃO DO ESTADO ATUAL DO SISTEMA
-- =====================================================

-- 1. OPERADORES ONLINE
SELECT 
    '=== OPERADORES ONLINE ===' as secao,
    id,
    nome,
    email,
    habilitado,
    online,
    pos_token,
    updated_at
FROM operadores 
WHERE habilitado = true 
AND online = true
ORDER BY pos_token;

-- 2. ATENDIMENTOS AGUARDANDO
SELECT 
    '=== ATENDIMENTOS AGUARDANDO ===' as secao,
    id,
    codigo,
    cliente_nome,
    status,
    prioridade,
    created_at
FROM atendimentos 
WHERE status IN ('novo', 'aguardando') 
AND operador_id IS NULL
ORDER BY created_at;

-- 3. OFERTAS ATIVAS NA FILA
SELECT 
    '=== OFERTAS ATIVAS NA FILA ===' as secao,
    fa.id,
    fa.atendimento_id,
    fa.operador_id,
    fa.status,
    fa.data_oferecimento,
    fa.data_expiracao,
    a.codigo as atendimento_codigo,
    a.cliente_nome,
    o.nome as operador_nome,
    EXTRACT(EPOCH FROM (fa.data_expiracao - NOW())) as segundos_restantes
FROM fila_atendimentos fa
LEFT JOIN atendimentos a ON fa.atendimento_id = a.id
LEFT JOIN operadores o ON fa.operador_id = o.id
WHERE fa.status = 'oferecido'
AND fa.data_expiracao > NOW()
ORDER BY fa.data_oferecimento DESC;

-- 4. OFERTAS REGISTRADAS
SELECT 
    '=== OFERTAS REGISTRADAS ===' as secao,
    oo.id,
    oo.atendimento_id,
    oo.operador_id,
    oo.status,
    oo.data_oferecimento,
    oo.data_expiracao,
    a.codigo as atendimento_codigo,
    a.cliente_nome,
    o.nome as operador_nome,
    EXTRACT(EPOCH FROM (oo.data_expiracao - NOW())) as segundos_restantes
FROM ofertas_operador oo
LEFT JOIN atendimentos a ON oo.atendimento_id = a.id
LEFT JOIN operadores o ON oo.operador_id = o.id
WHERE oo.data_expiracao > NOW()
ORDER BY oo.data_oferecimento DESC;

-- 5. CONFIGURAÇÃO DE DISTRIBUIÇÃO AUTOMÁTICA
SELECT 
    '=== CONFIGURAÇÃO DISTRIBUIÇÃO ===' as secao,
    chave,
    valor,
    descricao
FROM configuracoes 
WHERE chave LIKE '%distribuicao%' 
OR chave LIKE '%automatica%'
OR chave LIKE '%tempo%';

-- 6. ÚLTIMAS ATIVIDADES
SELECT 
    '=== ÚLTIMAS ATIVIDADES ===' as secao,
    'Últimos atendimentos criados' as tipo,
    COUNT(*) as quantidade
FROM atendimentos 
WHERE created_at > NOW() - INTERVAL '1 hour';

SELECT 
    '=== ÚLTIMAS ATIVIDADES ===' as secao,
    'Últimas ofertas criadas' as tipo,
    COUNT(*) as quantidade
FROM fila_atendimentos 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- 7. TESTE RÁPIDO DE DISTRIBUIÇÃO
SELECT '=== TESTE DISTRIBUIÇÃO ===' as secao;
SELECT distribuir_atendimentos_inteligente() as resultado_teste;