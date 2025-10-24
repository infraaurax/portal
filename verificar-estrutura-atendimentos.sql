-- =====================================================
-- VERIFICAR ESTRUTURA DA TABELA ATENDIMENTOS
-- =====================================================

-- Verificar todas as colunas da tabela atendimentos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'atendimentos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar alguns registros de exemplo
SELECT *
FROM atendimentos
LIMIT 3;