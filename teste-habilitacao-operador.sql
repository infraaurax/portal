-- ============================================
-- TESTE ESPECÍFICO PARA OPERADOR: fe66e131-e679-4efe-af22-e33d3b533e18
-- ============================================

-- 1. Verificar se o operador existe
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
WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- 2. Verificar estado atual antes do teste
SELECT 
    'ANTES DO TESTE' as momento,
    id,
    nome,
    habilitado,
    online,
    pos_token
FROM operadores 
WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- 3. Testar HABILITAÇÃO (habilitar = true)
SELECT 
    'TESTE HABILITAR' as acao,
    toggle_operador_habilitacao('fe66e131-e679-4efe-af22-e33d3b533e18'::UUID, true) as resultado;

-- 4. Verificar estado após habilitação
SELECT 
    'APÓS HABILITAR' as momento,
    id,
    nome,
    habilitado,
    online,
    pos_token
FROM operadores 
WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- 5. Testar DESABILITAÇÃO (habilitar = false)
SELECT 
    'TESTE DESABILITAR' as acao,
    toggle_operador_habilitacao('fe66e131-e679-4efe-af22-e33d3b533e18'::UUID, false) as resultado;

-- 6. Verificar estado após desabilitação
SELECT 
    'APÓS DESABILITAR' as momento,
    id,
    nome,
    habilitado,
    online,
    pos_token
FROM operadores 
WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- 7. Testar HABILITAÇÃO novamente (para confirmar que funciona)
SELECT 
    'TESTE HABILITAR NOVAMENTE' as acao,
    toggle_operador_habilitacao('fe66e131-e679-4efe-af22-e33d3b533e18'::UUID, true) as resultado;

-- 8. Estado final
SELECT 
    'ESTADO FINAL' as momento,
    id,
    nome,
    habilitado,
    online,
    pos_token,
    updated_at
FROM operadores 
WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- ============================================
-- RESUMO DO TESTE
-- ============================================
-- Este teste vai mostrar:
-- 1. Se o operador existe
-- 2. Estado inicial
-- 3. Resultado da habilitação
-- 4. Estado após habilitação (deve ter habilitado=true, online=true, pos_token=numero)
-- 5. Resultado da desabilitação
-- 6. Estado após desabilitação (deve ter habilitado=false, online=false, pos_token=null)
-- 7. Resultado da habilitação novamente
-- 8. Estado final (deve ter habilitado=true, online=true, pos_token=numero)
-- ============================================
