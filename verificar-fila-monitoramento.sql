-- ========================================
-- DIAGNÓSTICO: FILA DE MONITORAMENTO
-- ========================================
-- Verificar por que atendimentos não aparecem na página de monitoramento

-- 1. VERIFICAR TODOS OS ATENDIMENTOS NA FILA
SELECT 
    'TODOS OS ATENDIMENTOS NA FILA' as secao,
    COUNT(*) as total
FROM fila_atendimentos;

-- 2. VERIFICAR ATENDIMENTOS POR STATUS
SELECT 
    'ATENDIMENTOS POR STATUS' as secao,
    status,
    COUNT(*) as quantidade
FROM fila_atendimentos
GROUP BY status
ORDER BY status;

-- 3. LISTAR ATENDIMENTOS DETALHADOS
SELECT 
    'DETALHES DOS ATENDIMENTOS' as secao,
    fa.id,
    fa.atendimento_id,
    fa.operador_id,
    fa.status,
    fa.data_entrada,
    fa.data_oferecimento,
    fa.data_expiracao,
    a.codigo,
    a.cliente_nome,
    a.status as status_atendimento
FROM fila_atendimentos fa
LEFT JOIN atendimentos a ON fa.atendimento_id = a.id
ORDER BY fa.data_entrada DESC;

-- 4. VERIFICAR ATENDIMENTOS AGUARDANDO
SELECT 
    'ATENDIMENTOS AGUARDANDO' as secao,
    fa.id,
    fa.atendimento_id,
    fa.status,
    a.codigo,
    a.cliente_nome,
    fa.data_entrada
FROM fila_atendimentos fa
LEFT JOIN atendimentos a ON fa.atendimento_id = a.id
WHERE fa.status = 'aguardando'
ORDER BY fa.data_entrada ASC;

-- 5. VERIFICAR ATENDIMENTOS OFERECIDOS
SELECT 
    'ATENDIMENTOS OFERECIDOS' as secao,
    fa.id,
    fa.atendimento_id,
    fa.operador_id,
    fa.status,
    fa.data_oferecimento,
    fa.data_expiracao,
    a.codigo,
    a.cliente_nome,
    o.nome as operador_nome
FROM fila_atendimentos fa
LEFT JOIN atendimentos a ON fa.atendimento_id = a.id
LEFT JOIN operadores o ON fa.operador_id = o.id
WHERE fa.status = 'oferecido'
ORDER BY fa.data_oferecimento DESC;

-- 6. VERIFICAR TABELA ATENDIMENTOS
SELECT 
    'ATENDIMENTOS PRINCIPAIS' as secao,
    id,
    codigo,
    cliente_nome,
    status,
    created_at
FROM atendimentos
WHERE status IN ('aguardando', 'em-andamento')
ORDER BY created_at DESC;

-- 7. VERIFICAR SE HÁ INCONSISTÊNCIAS
SELECT 
    'INCONSISTÊNCIAS' as secao,
    'Atendimentos sem entrada na fila' as problema,
    COUNT(*) as quantidade
FROM atendimentos a
WHERE a.status = 'aguardando'
AND NOT EXISTS (
    SELECT 1 FROM fila_atendimentos fa 
    WHERE fa.atendimento_id = a.id
);

-- 8. VERIFICAR OPERADORES DISPONÍVEIS
SELECT 
    'OPERADORES DISPONÍVEIS' as secao,
    id,
    nome,
    email,
    perfil,
    status,
    habilitado,
    online
FROM operadores
WHERE status = 'disponivel'
AND perfil = 'Operador'
ORDER BY pos_token ASC;