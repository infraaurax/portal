-- SOLUÇÃO DEFINITIVA: Criar operador Infra e atribuir atendimentos
-- Execute no Supabase SQL Editor

-- Passo 1: CRIAR O OPERADOR INFRA na tabela operadores
INSERT INTO operadores (
    id,
    nome,
    email,
    perfil,
    habilitado,
    created_at,
    updated_at
) VALUES (
    '2652940a-2eb4-4b77-a542-ce3ba355f30e',
    'Infra - AURAX',
    'infra@auraxcred.com.br',
    'Admin',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    perfil = EXCLUDED.perfil,
    habilitado = EXCLUDED.habilitado,
    updated_at = NOW();

-- Passo 2: VERIFICAR SE O OPERADOR FOI CRIADO
SELECT 'OPERADOR CRIADO' as status, * FROM operadores WHERE id = '2652940a-2eb4-4b77-a542-ce3ba355f30e';

-- Passo 3: CRIAR ATENDIMENTOS PARA O OPERADOR INFRA
INSERT INTO atendimentos (
    codigo,
    cliente_nome,
    cliente_telefone,
    cliente_email,
    status,
    operador_id,
    prioridade,
    descricao_atendimento,
    created_at,
    updated_at
) VALUES 
    ('INFRA001', 'Maria Santos', '+5511999001001', 'maria.santos@teste.com', 'pausado', '2652940a-2eb4-4b77-a542-ce3ba355f30e', 'media', 'Atendimento pausado - aguardando retorno', NOW() - INTERVAL '2 hours', NOW()),
    ('INFRA002', 'João Silva', '+5511999001002', 'joao.silva@teste.com', 'aguardando', '2652940a-2eb4-4b77-a542-ce3ba355f30e', 'alta', 'Cliente aguardando resposta sobre proposta', NOW() - INTERVAL '1 hour', NOW()),
    ('INFRA003', 'Ana Oliveira', '+5511999001003', 'ana.oliveira@teste.com', 'abandonado', '2652940a-2eb4-4b77-a542-ce3ba355f30e', 'baixa', 'Cliente não respondeu por mais de 24h', NOW() - INTERVAL '1 day', NOW()),
    ('INFRA004', 'Pedro Costa', '+5511999001004', 'pedro.costa@teste.com', 'nao_atendido', '2652940a-2eb4-4b77-a542-ce3ba355f30e', 'alta', 'Novo cliente - primeira consulta', NOW() - INTERVAL '30 minutes', NOW()),
    ('INFRA005', 'Carla Ferreira', '+5511999001005', 'carla.ferreira@teste.com', 'em-andamento', '2652940a-2eb4-4b77-a542-ce3ba355f30e', 'media', 'Atendimento em progresso - documentação', NOW() - INTERVAL '15 minutes', NOW()),
    ('INFRA006', 'Roberto Lima', '+5511999001006', 'roberto.lima@teste.com', 'pausado', '2652940a-2eb4-4b77-a542-ce3ba355f30e', 'baixa', 'Pausado para consulta interna', NOW() - INTERVAL '3 hours', NOW()),
    ('INFRA007', 'Lucia Mendes', '+5511999001007', 'lucia.mendes@teste.com', 'aguardando', '2652940a-2eb4-4b77-a542-ce3ba355f30e', 'alta', 'Aguardando aprovação de crédito', NOW() - INTERVAL '45 minutes', NOW()),
    ('INFRA008', 'Carlos Souza', '+5511999001008', 'carlos.souza@teste.com', 'abandonado', '2652940a-2eb4-4b77-a542-ce3ba355f30e', 'media', 'Cliente desistiu do processo', NOW() - INTERVAL '2 days', NOW())
ON CONFLICT (codigo) DO UPDATE SET
    operador_id = '2652940a-2eb4-4b77-a542-ce3ba355f30e',
    updated_at = NOW();

-- Passo 4: CRIAR MENSAGENS PARA ALGUNS ATENDIMENTOS (para ter histórico)
INSERT INTO mensagens (
    atendimento_id,
    conteudo,
    role,
    remetente_tipo,
    remetente_id,
    created_at
) 
SELECT 
    a.id as atendimento_id,
    'Olá! Como posso ajudar você hoje?' as conteudo,
    'operador' as role,
    'operador' as remetente_tipo,
    a.operador_id as remetente_id,
    a.created_at as created_at
FROM atendimentos a
WHERE a.operador_id = '2652940a-2eb4-4b77-a542-ce3ba355f30e'
  AND a.codigo LIKE 'INFRA%'
ON CONFLICT DO NOTHING;

-- Passo 5: VERIFICAR RESULTADO FINAL
SELECT 
    'ATENDIMENTOS DO OPERADOR INFRA' as resultado,
    a.codigo,
    a.cliente_nome,
    a.status,
    a.prioridade,
    o.nome as operador_nome,
    o.email as operador_email
FROM atendimentos a
INNER JOIN operadores o ON a.operador_id = o.id
WHERE a.operador_id = '2652940a-2eb4-4b77-a542-ce3ba355f30e'
ORDER BY a.updated_at DESC;

-- Passo 6: CONTAR TOTAL PARA CONFIRMAÇÃO
SELECT 
    'RESUMO FINAL' as info,
    COUNT(*) as total_atendimentos,
    array_agg(DISTINCT status) as status_diferentes,
    '✅ PRONTO PARA O DASHBOARD!' as status_final
FROM atendimentos 
WHERE operador_id = '2652940a-2eb4-4b77-a542-ce3ba355f30e';

-- Passo 7: TESTAR A QUERY EXATA DO DASHBOARD
SELECT 
    'QUERY DO DASHBOARD (RESULTADO FINAL)' as teste,
    COUNT(*) as atendimentos_que_aparecerao
FROM atendimentos a
WHERE a.operador_id = '2652940a-2eb4-4b77-a542-ce3ba355f30e'
  AND a.status IN ('pausado', 'aguardando', 'finalizado', 'abandonado', 'nao_atendido', 'em-andamento');

-- ============================================================================
-- APÓS EXECUTAR ESTE SCRIPT:
-- ============================================================================
-- ✅ Operador Infra será criado na tabela operadores
-- ✅ 8 atendimentos serão criados para o operador
-- ✅ Mensagens básicas serão adicionadas
-- ✅ Dashboard deve mostrar os atendimentos
-- ✅ Login com infra@auraxcred.com.br deve funcionar
-- ============================================================================
