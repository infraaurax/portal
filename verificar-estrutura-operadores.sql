-- ============================================
-- VERIFICAR ESTRUTURA DA TABELA OPERADORES
-- ============================================

-- 1. Verificar estrutura da tabela operadores
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'operadores' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar dados de exemplo
SELECT 
    id,
    nome,
    email,
    status,
    habilitado,
    online,
    pos_token,
    created_at,
    updated_at
FROM operadores 
LIMIT 5;

-- 3. Verificar se existe campo 'ativo'
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'operadores' 
  AND table_schema = 'public'
  AND column_name = 'ativo';

-- 4. Verificar valores únicos do campo status
SELECT DISTINCT status, COUNT(*) as quantidade
FROM operadores
GROUP BY status
ORDER BY quantidade DESC;
