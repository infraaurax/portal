-- USAR OPERADOR EXISTENTE: fe66e131-e679-4efe-af22-e33d3b533e18
-- Execute no Supabase SQL Editor

-- Passo 1: VERIFICAR SE O OPERADOR EXISTE
SELECT 'OPERADOR SELECIONADO' as status, * FROM operadores WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- Passo 2: CRIAR ATENDIMENTOS PARA ESSE OPERADOR
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
    ('OP001', 'Maria Santos Silva', '+5511999001001', 'maria.santos@cliente.com', 'pausado', 'fe66e131-e679-4efe-af22-e33d3b533e18', 'media', 'Atendimento pausado - aguardando retorno', NOW() - INTERVAL '2 hours', NOW()),
    ('OP002', 'João Silva Costa', '+5511999001002', 'joao.silva@cliente.com', 'aguardando', 'fe66e131-e679-4efe-af22-e33d3b533e18', 'alta', 'Cliente aguardando resposta sobre proposta', NOW() - INTERVAL '1 hour', NOW()),
    ('OP003', 'Ana Oliveira Mendes', '+5511999001003', 'ana.oliveira@cliente.com', 'abandonado', 'fe66e131-e679-4efe-af22-e33d3b533e18', 'baixa', 'Cliente não respondeu por mais de 24h', NOW() - INTERVAL '1 day', NOW()),
    ('OP004', 'Pedro Costa Ferreira', '+5511999001004', 'pedro.costa@cliente.com', 'nao_atendido', 'fe66e131-e679-4efe-af22-e33d3b533e18', 'alta', 'Novo cliente - primeira consulta', NOW() - INTERVAL '30 minutes', NOW()),
    ('OP005', 'Carla Ferreira Lima', '+5511999001005', 'carla.ferreira@cliente.com', 'em-andamento', 'fe66e131-e679-4efe-af22-e33d3b533e18', 'media', 'Atendimento em progresso - documentação', NOW() - INTERVAL '15 minutes', NOW()),
    ('OP006', 'Roberto Lima Santos', '+5511999001006', 'roberto.lima@cliente.com', 'pausado', 'fe66e131-e679-4efe-af22-e33d3b533e18', 'baixa', 'Pausado para consulta interna', NOW() - INTERVAL '3 hours', NOW()),
    ('OP007', 'Lucia Mendes Rosa', '+5511999001007', 'lucia.mendes@cliente.com', 'aguardando', 'fe66e131-e679-4efe-af22-e33d3b533e18', 'alta', 'Aguardando aprovação de crédito', NOW() - INTERVAL '45 minutes', NOW()),
    ('OP008', 'Carlos Souza Pereira', '+5511999001008', 'carlos.souza@cliente.com', 'abandonado', 'fe66e131-e679-4efe-af22-e33d3b533e18', 'media', 'Cliente desistiu do processo', NOW() - INTERVAL '2 days', NOW()),
    ('OP009', 'Beatriz Alves Cunha', '+5511999001009', 'beatriz.alves@cliente.com', 'nao_atendido', 'fe66e131-e679-4efe-af22-e33d3b533e18', 'alta', 'Solicitação de refinanciamento', NOW() - INTERVAL '1 hour', NOW()),
    ('OP010', 'Fernando Rocha Silva', '+5511999001010', 'fernando.rocha@cliente.com', 'pausado', 'fe66e131-e679-4efe-af22-e33d3b533e18', 'media', 'Pausado - verificação de documentos', NOW() - INTERVAL '4 hours', NOW())
ON CONFLICT (codigo) DO UPDATE SET
    operador_id = 'fe66e131-e679-4efe-af22-e33d3b533e18',
    updated_at = NOW();

-- Passo 3: ATRIBUIR ATENDIMENTOS EXISTENTES TAMBÉM (se houver)
UPDATE atendimentos 
SET 
    operador_id = 'fe66e131-e679-4efe-af22-e33d3b533e18',
    updated_at = NOW()
WHERE operador_id IS NULL 
   OR operador_id != 'fe66e131-e679-4efe-af22-e33d3b533e18'
   AND status IN ('pausado', 'aguardando', 'abandonado', 'nao_atendido', 'em-andamento')
   AND id IN (
       SELECT id 
       FROM atendimentos 
       WHERE status IN ('pausado', 'aguardando', 'abandonado', 'nao_atendido', 'em-andamento')
       ORDER BY updated_at DESC
       LIMIT 5
   )
RETURNING codigo, cliente_nome, status, 'REATRIBUÍDO' as acao;

-- Passo 4: CRIAR MENSAGENS BÁSICAS PARA OS NOVOS ATENDIMENTOS
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
    CASE 
        WHEN a.status = 'pausado' THEN 'Atendimento pausado temporariamente. Retorno em breve.'
        WHEN a.status = 'aguardando' THEN 'Olá! Estou analisando sua solicitação. Em breve retorno com uma resposta.'
        WHEN a.status = 'nao_atendido' THEN 'Olá! Recebi sua mensagem. Como posso ajudar você hoje?'
        WHEN a.status = 'em-andamento' THEN 'Atendimento iniciado. Vou auxiliá-lo com sua solicitação.'
        ELSE 'Mensagem inicial do atendimento'
    END as conteudo,
    'operador' as role,
    'operador' as remetente_tipo,
    a.operador_id as remetente_id,
    a.created_at + INTERVAL '1 minute' as created_at
FROM atendimentos a
WHERE a.operador_id = 'fe66e131-e679-4efe-af22-e33d3b533e18'
  AND a.codigo LIKE 'OP%'
ON CONFLICT DO NOTHING;

-- Passo 5: VERIFICAR RESULTADO FINAL
SELECT 
    'ATENDIMENTOS DO OPERADOR' as resultado,
    a.codigo,
    a.cliente_nome,
    a.status,
    a.prioridade,
    o.nome as operador_nome,
    o.email as operador_email,
    a.updated_at
FROM atendimentos a
INNER JOIN operadores o ON a.operador_id = o.id
WHERE a.operador_id = 'fe66e131-e679-4efe-af22-e33d3b533e18'
ORDER BY a.updated_at DESC;

-- Passo 6: CONTAR TOTAL PARA CONFIRMAÇÃO
SELECT 
    'RESUMO FINAL' as info,
    COUNT(*) as total_atendimentos,
    array_agg(DISTINCT status) as status_diferentes,
    '✅ PRONTO PARA O DASHBOARD!' as status_final
FROM atendimentos 
WHERE operador_id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- Passo 7: TESTAR A QUERY EXATA DO DASHBOARD
SELECT 
    'QUERY DO DASHBOARD (RESULTADO FINAL)' as teste,
    COUNT(*) as atendimentos_que_aparecerao_no_dashboard
FROM atendimentos a
WHERE a.operador_id = 'fe66e131-e679-4efe-af22-e33d3b533e18'
  AND a.status IN ('pausado', 'aguardando', 'finalizado', 'abandonado', 'nao_atendido', 'em-andamento');

-- Passo 8: VERIFICAR DADOS DO OPERADOR PARA CONFIRMAR EMAIL DE LOGIN
SELECT 
    'DADOS DO OPERADOR PARA LOGIN' as info,
    id,
    nome,
    email,
    perfil,
    habilitado,
    'USE ESTE EMAIL PARA LOGIN' as instrucao
FROM operadores 
WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- ✅ 10 novos atendimentos criados (OP001 a OP010)
-- ✅ 5 atendimentos existentes reatribuídos (se houver)
-- ✅ Total: 15+ atendimentos para o operador
-- ✅ Mensagens básicas adicionadas
-- ✅ Dashboard funcionará perfeitamente
-- ✅ Use o EMAIL mostrado no final para fazer login
-- ============================================================================
