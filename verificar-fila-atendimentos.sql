-- =====================================================
-- VERIFICAR DADOS NA TABELA FILA_ATENDIMENTOS
-- =====================================================

-- Verificar se a tabela existe
SELECT 
    'VERIFICANDO EXISTÊNCIA DA TABELA FILA_ATENDIMENTOS' as info;

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'fila_atendimentos'
) as tabela_existe;

-- Verificar estrutura da tabela
SELECT 
    'ESTRUTURA DA TABELA FILA_ATENDIMENTOS' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'fila_atendimentos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar total de registros
SELECT 
    'TOTAL DE REGISTROS NA FILA_ATENDIMENTOS' as info;

SELECT COUNT(*) as total_registros 
FROM fila_atendimentos;

-- Verificar registros por status
SELECT 
    'REGISTROS POR STATUS' as info;

SELECT 
    status,
    COUNT(*) as quantidade
FROM fila_atendimentos 
GROUP BY status
ORDER BY quantidade DESC;

-- Verificar últimos 10 registros
SELECT 
    'ÚLTIMOS 10 REGISTROS' as info;

SELECT 
    id,
    atendimento_id,
    operador_id,
    status,
    created_at
FROM fila_atendimentos 
ORDER BY created_at DESC 
LIMIT 10;

-- Verificar se há atendimentos aguardando
SELECT 
    'ATENDIMENTOS COM STATUS AGUARDANDO' as info;

SELECT 
    id,
    atendimento_id,
    operador_id,
    status,
    created_at
FROM fila_atendimentos 
WHERE status = 'aguardando'
ORDER BY created_at ASC;

-- Verificar se há atendimentos na tabela principal com status novo
SELECT 
    'ATENDIMENTOS NOVOS NA TABELA PRINCIPAL' as info;

SELECT 
    id,
    nome_cliente,
    telefone_cliente,
    status,
    created_at
FROM atendimentos 
WHERE status = 'novo'
ORDER BY created_at ASC
LIMIT 5;