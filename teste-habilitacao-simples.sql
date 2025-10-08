-- ============================================
-- TESTE SIMPLES DE HABILITAÇÃO
-- ============================================
-- Este teste verifica se a habilitação está funcionando
-- sem depender de funções SQL complexas
-- ============================================

-- 1. Verificar operador específico
SELECT 
    id,
    nome,
    email,
    status,
    habilitado,
    online,
    pos_token,
    updated_at
FROM operadores 
WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- 2. Testar habilitação manual (simular o que o código faz)
UPDATE operadores
SET 
    habilitado = true,
    online = true,
    pos_token = 1,
    updated_at = NOW()
WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- 3. Verificar se a atualização funcionou
SELECT 
    id,
    nome,
    email,
    status,
    habilitado,
    online,
    pos_token,
    updated_at
FROM operadores 
WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- 4. Testar desabilitação
UPDATE operadores
SET 
    habilitado = false,
    online = false,
    pos_token = NULL,
    updated_at = NOW()
WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- 5. Verificar resultado final
SELECT 
    id,
    nome,
    email,
    status,
    habilitado,
    online,
    pos_token,
    updated_at
FROM operadores 
WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- ============================================
-- VERIFICAR ESTRUTURA DA TABELA
-- ============================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'operadores' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
