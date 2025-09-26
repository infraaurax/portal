-- CRIAR ATENDIMENTOS DIRETAMENTE PARA O OPERADOR INFRA
-- Execute no Supabase SQL Editor

-- Passo 1: VERIFICAR SE O OPERADOR EXISTE
SELECT 'OPERADOR INFRA' as verificacao, * FROM operadores WHERE id = '2652940a-2eb4-4b77-a542-ce3ba355f30e';

-- Passo 2: INSERIR ATENDIMENTOS DIRETAMENTE (não UPDATE - INSERT direto)
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
    ('INFRA001', 'Cliente Teste A', '+5511999001001', 'clienteA@teste.com', 'pausado', '2652940a-2eb4-4b77-a542-ce3ba355f30e', 'media', 'Atendimento de teste A', NOW(), NOW()),
    ('INFRA002', 'Cliente Teste B', '+5511999001002', 'clienteB@teste.com', 'aguardando', '2652940a-2eb4-4b77-a542-ce3ba355f30e', 'alta', 'Atendimento de teste B', NOW(), NOW()),
    ('INFRA003', 'Cliente Teste C', '+5511999001003', 'clienteC@teste.com', 'abandonado', '2652940a-2eb4-4b77-a542-ce3ba355f30e', 'baixa', 'Atendimento de teste C', NOW(), NOW()),
    ('INFRA004', 'Cliente Teste D', '+5511999001004', 'clienteD@teste.com', 'nao_atendido', '2652940a-2eb4-4b77-a542-ce3ba355f30e', 'alta', 'Atendimento de teste D', NOW(), NOW()),
    ('INFRA005', 'Cliente Teste E', '+5511999001005', 'clienteE@teste.com', 'em-andamento', '2652940a-2eb4-4b77-a542-ce3ba355f30e', 'media', 'Atendimento de teste E', NOW(), NOW())
ON CONFLICT (codigo) DO UPDATE SET
    operador_id = '2652940a-2eb4-4b77-a542-ce3ba355f30e',
    updated_at = NOW();

-- Passo 3: VERIFICAR SE FORAM CRIADOS
SELECT 
    'ATENDIMENTOS CRIADOS' as resultado,
    codigo,
    cliente_nome,
    status,
    operador_id
FROM atendimentos 
WHERE operador_id = '2652940a-2eb4-4b77-a542-ce3ba355f30e'
ORDER BY codigo;

-- Passo 4: TESTAR A QUERY DO DASHBOARD
SELECT 
    'QUERY DO DASHBOARD' as teste,
    COUNT(*) as total_que_aparecera_no_dashboard
FROM atendimentos a
WHERE a.operador_id = '2652940a-2eb4-4b77-a542-ce3ba355f30e'
  AND a.status IN ('pausado', 'aguardando', 'finalizado', 'abandonado', 'nao_atendido', 'em-andamento');
