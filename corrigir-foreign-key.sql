-- Script para corrigir o problema de Foreign Key
-- Execute DEPOIS de executar investigar-estrutura-banco.sql
-- Execute no Supabase SQL Editor

-- OPÇÃO 1: CORRIGIR FOREIGN KEY PARA APONTAR PARA OPERADORES
-- (Execute apenas se a constraint estiver apontando para 'users' incorretamente)

-- Remover constraint incorreta
ALTER TABLE atendimentos 
DROP CONSTRAINT IF EXISTS atendimentos_operador_id_fkey;

-- Recriar constraint correta apontando para operadores
ALTER TABLE atendimentos
ADD CONSTRAINT atendimentos_operador_id_fkey 
FOREIGN KEY (operador_id) 
REFERENCES operadores(id)
ON DELETE SET NULL;

-- ============================================================================

-- OPÇÃO 2: CRIAR REGISTRO NA TABELA USERS (se ela for necessária)
-- (Execute apenas se a tabela users for obrigatória para autenticação)

INSERT INTO users (
    id,
    email,
    created_at,
    updated_at
) 
SELECT 
    o.id,
    o.email,
    o.created_at,
    o.updated_at
FROM operadores o
WHERE o.id = '2652940a-2eb4-4b77-a542-ce3ba355f30e'
  AND NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = o.id
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================

-- OPÇÃO 3: REMOVER CONSTRAINT TEMPORARIAMENTE E ATRIBUIR ATENDIMENTOS
-- (Use como último recurso)

-- Desabilitar constraint temporariamente
ALTER TABLE atendimentos DISABLE TRIGGER ALL;

-- Atribuir atendimentos
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
    LIMIT 5
  );

-- Reabilitar constraint
ALTER TABLE atendimentos ENABLE TRIGGER ALL;

-- ============================================================================

-- VERIFICAÇÃO FINAL
SELECT 
    'ATENDIMENTOS ATRIBUÍDOS AO OPERADOR INFRA' as resultado,
    COUNT(*) as total,
    array_agg(DISTINCT status) as status_diferentes
FROM atendimentos 
WHERE operador_id = '2652940a-2eb4-4b77-a542-ce3ba355f30e';

-- TESTE DA BUSCA
SELECT 
    a.codigo,
    a.cliente_nome,
    a.status,
    o.nome as operador_nome
FROM atendimentos a
INNER JOIN operadores o ON a.operador_id = o.id
WHERE a.operador_id = '2652940a-2eb4-4b77-a542-ce3ba355f30e'
  AND a.status IN ('pausado', 'aguardando', 'finalizado', 'abandonado', 'nao_atendido', 'em-andamento')
ORDER BY a.updated_at DESC;

-- ============================================================================
-- INSTRUÇÕES:
-- ============================================================================
-- 1. PRIMEIRO: Execute investigar-estrutura-banco.sql
-- 2. Com base no resultado, escolha uma das OPÇÕES acima:
--    - OPÇÃO 1: Se constraint aponta para tabela errada
--    - OPÇÃO 2: Se operador precisa existir na tabela users
--    - OPÇÃO 3: Como último recurso
-- 3. Execute apenas UMA das opções
-- 4. Verifique o resultado final
-- 5. Volte ao Dashboard e teste
-- ============================================================================
