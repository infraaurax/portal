-- ============================================
-- VERIFICAR TIPOS DE DADOS DA TABELA ATENDIMENTOS
-- ============================================

-- Verificar estrutura completa da tabela atendimentos
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'atendimentos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar estrutura da tabela operadores também
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'operadores' 
AND table_schema = 'public'
ORDER BY ordinal_position;