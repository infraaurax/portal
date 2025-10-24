-- =====================================================
-- VERIFICAR ESTRUTURA DAS TABELAS PRINCIPAIS
-- =====================================================

-- 1. ESTRUTURA DA TABELA ATENDIMENTOS
SELECT 
    'ESTRUTURA TABELA ATENDIMENTOS' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'atendimentos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. ESTRUTURA DA TABELA OPERADORES
SELECT 
    'ESTRUTURA TABELA OPERADORES' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'operadores' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VERIFICAR DADOS ATUAIS DOS OPERADORES
SELECT 
    'OPERADORES ATUAIS' as info;

SELECT 
    id,
    nome,
    email,
    perfil,
    status,
    habilitado,
    online,
    pos_token
FROM operadores
ORDER BY pos_token ASC NULLS LAST;

-- 4. VERIFICAR ATENDIMENTOS ATUAIS
SELECT 
    'ATENDIMENTOS ATUAIS' as info;

SELECT 
    id,
    codigo,
    cliente_nome,
    status,
    operador_id,
    created_at
FROM atendimentos
ORDER BY created_at DESC
LIMIT 10;