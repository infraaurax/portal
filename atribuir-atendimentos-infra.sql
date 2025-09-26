-- Script ESPECÍFICO para atribuir atendimentos ao operador Infra - AURAX
-- ID do operador: 2652940a-2eb4-4b77-a542-ce3ba355f30e
-- Execute no Supabase SQL Editor

-- 1. VERIFICAR SE O OPERADOR EXISTE
SELECT 
    'OPERADOR INFRA ENCONTRADO' as status,
    id,
    nome,
    email,
    perfil,
    habilitado
FROM operadores 
WHERE id = '2652940a-2eb4-4b77-a542-ce3ba355f30e';

-- 2. ATRIBUIR ATENDIMENTOS ESPECÍFICOS AO OPERADOR INFRA
-- Usando o ID exato visto nos logs
UPDATE atendimentos 
SET 
    operador_id = '2652940a-2eb4-4b77-a542-ce3ba355f30e',
    updated_at = NOW()
WHERE id IN (
    -- Pegar os IDs específicos que vi nos logs de debug
    SELECT id FROM (
        VALUES 
            ('45387c43-2c10-4c51-b9d5-24fb0903a717'::uuid),
            ('c876a512-0e71-4f11-9a76-266b0b8c2b72'::uuid),
            ('085e6a9a-0e76-4e56-982a-28424f2bafac'::uuid),
            ('eca69421-462f-4980-a6e2-0933f07716d8'::uuid),
            ('de4a0899-1fa6-4035-8d38-ec2b70c47c30'::uuid)
    ) as atendimento_ids(id)
    WHERE EXISTS (
        SELECT 1 FROM atendimentos a 
        WHERE a.id = atendimento_ids.id 
        AND a.status IN ('pausado', 'aguardando', 'abandonado', 'nao_atendido')
    )
)
RETURNING 
    id,
    codigo, 
    cliente_nome, 
    status, 
    'ATRIBUÍDO AO INFRA' as resultado;

-- 3. SE A QUERY ACIMA NÃO FUNCIONAR, USAR ESTA ALTERNATIVA
-- Atribuir qualquer atendimento disponível
UPDATE atendimentos 
SET 
    operador_id = '2652940a-2eb4-4b77-a542-ce3ba355f30e',
    updated_at = NOW()
WHERE operador_id IS NULL 
   OR operador_id != '2652940a-2eb4-4b77-a542-ce3ba355f30e'
   AND status IN ('pausado', 'aguardando', 'abandonado', 'nao_atendido')
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
    'REATRIBUÍDO PARA INFRA' as acao;

-- 4. VERIFICAR RESULTADO FINAL
SELECT 
    '=== ATENDIMENTOS DO OPERADOR INFRA ===' as titulo,
    a.codigo,
    a.cliente_nome,
    a.cliente_telefone,
    a.status,
    a.prioridade,
    a.created_at,
    a.updated_at
FROM atendimentos a
WHERE a.operador_id = '2652940a-2eb4-4b77-a542-ce3ba355f30e'
  AND a.status IN ('pausado', 'aguardando', 'finalizado', 'abandonado', 'nao_atendido', 'em-andamento')
ORDER BY a.updated_at DESC;

-- 5. CONTAR TOTAL
SELECT 
    'TOTAL DE ATENDIMENTOS PARA O OPERADOR INFRA' as info,
    COUNT(*) as total,
    array_agg(DISTINCT status) as status_diferentes
FROM atendimentos 
WHERE operador_id = '2652940a-2eb4-4b77-a542-ce3ba355f30e';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- Após executar este script:
-- 1. O operador Infra (2652940a-2eb4-4b77-a542-ce3ba355f30e) terá atendimentos atribuídos
-- 2. Recarregue o Dashboard (F5) 
-- 3. Os atendimentos devem aparecer na lista "Meus Atendimentos"
-- 4. Os logs do console mostrarão "Total encontrado: X" (onde X > 0)
-- ============================================================================
