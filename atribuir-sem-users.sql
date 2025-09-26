-- Script SIMPLES - trabalha apenas com a tabela OPERADORES
-- Ignora completamente a tabela "users" que não existe
-- Execute no Supabase SQL Editor

-- 1. CONFIRMAR QUE A TABELA OPERADORES EXISTE E TEM DADOS
SELECT 
    'OPERADORES DISPONÍVEIS' as info,
    id,
    nome,
    email,
    perfil,
    habilitado
FROM operadores 
WHERE habilitado = true
ORDER BY nome;

-- 2. VERIFICAR ATENDIMENTOS DISPONÍVEIS
SELECT 
    'ATENDIMENTOS DISPONÍVEIS' as info,
    id,
    codigo,
    cliente_nome,
    status,
    operador_id,
    created_at
FROM atendimentos
WHERE status IN ('pausado', 'aguardando', 'abandonado', 'nao_atendido')
ORDER BY updated_at DESC
LIMIT 10;

-- 3. REMOVER TEMPORARIAMENTE A CONSTRAINT PROBLEMÁTICA
-- (Para conseguir atribuir os atendimentos)
ALTER TABLE atendimentos 
DROP CONSTRAINT IF EXISTS atendimentos_operador_id_fkey;

-- 4. ATRIBUIR ATENDIMENTOS AO OPERADOR INFRA
-- Usando o ID exato que vimos nos logs
UPDATE atendimentos 
SET 
    operador_id = '2652940a-2eb4-4b77-a542-ce3ba355f30e',
    updated_at = NOW()
WHERE status IN ('pausado', 'aguardando', 'abandonado', 'nao_atendido')
  AND id IN (
    SELECT id 
    FROM atendimentos 
    WHERE status IN ('pausado', 'aguardando', 'abandonado', 'nao_atendido')
    ORDER BY updated_at DESC
    LIMIT 8
  )
RETURNING 
    codigo, 
    cliente_nome, 
    status,
    operador_id,
    'ATRIBUÍDO COM SUCESSO' as resultado;

-- 5. RECRIAR A CONSTRAINT APONTANDO PARA OPERADORES (não users)
ALTER TABLE atendimentos
ADD CONSTRAINT atendimentos_operador_id_fkey 
FOREIGN KEY (operador_id) 
REFERENCES operadores(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- 6. VERIFICAR RESULTADO FINAL
SELECT 
    'ATENDIMENTOS DO OPERADOR INFRA' as titulo,
    a.codigo,
    a.cliente_nome,
    a.cliente_telefone,
    a.status,
    a.prioridade,
    o.nome as operador_nome,
    o.email as operador_email
FROM atendimentos a
INNER JOIN operadores o ON a.operador_id = o.id
WHERE a.operador_id = '2652940a-2eb4-4b77-a542-ce3ba355f30e'
  AND a.status IN ('pausado', 'aguardando', 'finalizado', 'abandonado', 'nao_atendido', 'em-andamento')
ORDER BY a.updated_at DESC;

-- 7. CONTAR TOTAL
SELECT 
    'RESUMO FINAL' as info,
    COUNT(*) as total_atendimentos,
    array_agg(DISTINCT status) as status_diferentes,
    '✅ PRONTO PARA O DASHBOARD' as status_final
FROM atendimentos a
WHERE a.operador_id = '2652940a-2eb4-4b77-a542-ce3ba355f30e';

-- ============================================================================
-- ESTE SCRIPT:
-- ============================================================================
-- ✅ NÃO tenta acessar tabela "users" (que não existe)
-- ✅ Trabalha apenas com "operadores" (que existe)
-- ✅ Remove constraint problemática temporariamente
-- ✅ Atribui atendimentos ao operador Infra
-- ✅ Recria constraint correta apontando para "operadores"
-- ✅ Verifica o resultado
-- ============================================================================

-- APÓS EXECUTAR:
-- 1. Volte ao Dashboard
-- 2. Pressione F5 para recarregar
-- 3. Os atendimentos devem aparecer!
-- ============================================================================
