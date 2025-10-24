-- =====================================================
-- VERIFICAR ESTRUTURA DAS TABELAS EXISTENTES
-- =====================================================
-- Este script verifica quais tabelas existem e suas estruturas

-- 1. LISTAR TODAS AS TABELAS DO SCHEMA PUBLIC
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. VERIFICAR COLUNAS DAS TABELAS RELACIONADAS A ATENDIMENTOS
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('atendimentos', 'fila_atendimento', 'fila_atendimentos', 'operadores', 'ofertas_atendimento')
ORDER BY table_name, ordinal_position;

-- 3. VERIFICAR SE EXISTE ALGUMA TABELA COM NOME SIMILAR A FILA
SELECT 
    table_name,
    column_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND (table_name LIKE '%fila%' OR table_name LIKE '%atendimento%')
ORDER BY table_name, ordinal_position;

-- 4. VERIFICAR CONSTRAINTS E FOREIGN KEYS
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
AND (tc.table_name LIKE '%fila%' OR tc.table_name LIKE '%atendimento%')
ORDER BY tc.table_name, tc.constraint_name;