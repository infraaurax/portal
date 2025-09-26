-- Script para inserir dados de exemplo na tabela atendimentos
-- Execute no Supabase SQL Editor para testar a funcionalidade

-- Limpar dados de exemplo anteriores (opcional)
-- DELETE FROM mensagens WHERE atendimento_id IN (SELECT id FROM atendimentos WHERE codigo LIKE 'EX-%');
-- DELETE FROM atendimentos WHERE codigo LIKE 'EX-%';

-- Inserir atendimentos de exemplo com diferentes status
INSERT INTO atendimentos (
    codigo,
    cliente_nome,
    cliente_telefone,
    cliente_email,
    status,
    prioridade,
    descricao_atendimento,
    operador_id,
    operador_nome,
    data_inicio,
    created_at,
    updated_at
) VALUES 
    -- Atendimento não atendido (alta prioridade)
    (
        'EX-001',
        'Carlos Silva',
        '+55 11 99999-8888',
        'carlos.silva@email.com',
        'nao_atendido',
        'alta',
        'Cliente solicitou informações sobre seguro de vida',
        null,
        null,
        NOW() - INTERVAL '3 hours',
        NOW() - INTERVAL '3 hours',
        NOW() - INTERVAL '2 hours'
    ),
    
    -- Atendimento pausado (deve ficar como pausado, menos de 40min)
    (
        'EX-002',
        'Ana Costa',
        '+55 11 98888-7777',
        'ana.costa@email.com',
        'pausado',
        'media',
        'Aguardando documentos do cliente para análise',
        gen_random_uuid(),
        'Maria Santos',
        NOW() - INTERVAL '2 hours',
        NOW() - INTERVAL '2 hours',
        NOW() - INTERVAL '30 minutes'
    ),
    
    -- Atendimento pausado (deve virar abandonado, mais de 40min)
    (
        'EX-003',
        'Roberto Lima',
        '+55 11 97777-6666',
        'roberto.lima@email.com',
        'pausado',
        'baixa',
        'Cliente não respondeu após várias tentativas',
        gen_random_uuid(),
        'João Silva',
        NOW() - INTERVAL '5 hours',
        NOW() - INTERVAL '5 hours',
        NOW() - INTERVAL '2 hours'
    ),
    
    -- Atendimento não atendido (alta prioridade - recente)
    (
        'EX-004',
        'Fernanda Oliveira',
        '+55 11 96666-5555',
        'fernanda.oliveira@email.com',
        'nao_atendido',
        'alta',
        'Cliente quer cancelar apólice',
        null,
        null,
        NOW() - INTERVAL '30 minutes',
        NOW() - INTERVAL '30 minutes',
        NOW() - INTERVAL '15 minutes'
    ),
    
    -- Atendimento abandonado (já marcado como abandonado)
    (
        'EX-005',
        'Pedro Santos',
        '+55 11 95555-4444',
        'pedro.santos@email.com',
        'abandonado',
        'baixa',
        'Cliente não retornou contato após 3 tentativas',
        gen_random_uuid(),
        'Pedro Costa',
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '1 day',
        NOW() - INTERVAL '8 hours'
    ),
    
    -- Atendimento pausado (recente, não deve virar abandonado)
    (
        'EX-006',
        'Mariana Silva',
        '+55 11 94444-3333',
        'mariana.silva@email.com',
        'pausado',
        'media',
        'Aguardando aprovação interna',
        gen_random_uuid(),
        'Ana Ferreira',
        NOW() - INTERVAL '1 hour',
        NOW() - INTERVAL '1 hour',
        NOW() - INTERVAL '20 minutes'
    );

-- Inserir mensagens de exemplo para os atendimentos
DO $$
DECLARE
    atendimento_record RECORD;
BEGIN
    -- Para cada atendimento de exemplo, inserir algumas mensagens
    FOR atendimento_record IN 
        SELECT id, codigo, cliente_nome FROM atendimentos WHERE codigo LIKE 'EX-%'
    LOOP
        -- Inserir primeira mensagem do cliente
        INSERT INTO mensagens (
            atendimento_id,
            remetente_tipo,
            remetente_nome,
            conteudo,
            created_at
        ) VALUES (
            atendimento_record.id,
            'cliente',
            atendimento_record.cliente_nome,
            CASE atendimento_record.codigo
                WHEN 'EX-001' THEN 'Olá, gostaria de saber sobre os planos de seguro de vida disponíveis.'
                WHEN 'EX-002' THEN 'Enviei os documentos por email. Quando terão o retorno?'
                WHEN 'EX-003' THEN 'Preciso de uma resposta urgente sobre minha solicitação.'
                WHEN 'EX-004' THEN 'Quero cancelar minha apólice. Como procedo?'
                WHEN 'EX-005' THEN 'Tentei ligar várias vezes mas não consegui falar com ninguém.'
                WHEN 'EX-006' THEN 'Quando vocês terão uma resposta sobre minha solicitação?'
                ELSE 'Mensagem de exemplo'
            END,
            NOW() - INTERVAL '3 hours' + (INTERVAL '30 minutes' * (CASE WHEN atendimento_record.codigo = 'EX-001' THEN 0
                                                                          WHEN atendimento_record.codigo = 'EX-002' THEN 1
                                                                          WHEN atendimento_record.codigo = 'EX-003' THEN 2
                                                                          WHEN atendimento_record.codigo = 'EX-004' THEN 3
                                                                          WHEN atendimento_record.codigo = 'EX-005' THEN 4
                                                                          ELSE 5 END))
        );
        
        -- Para alguns atendimentos, inserir resposta do operador
        IF atendimento_record.codigo IN ('EX-002', 'EX-003', 'EX-005', 'EX-006') THEN
            INSERT INTO mensagens (
                atendimento_id,
                remetente_tipo,
                remetente_nome,
                conteudo,
                created_at
            ) VALUES (
                atendimento_record.id,
                'operador',
                CASE atendimento_record.codigo
                    WHEN 'EX-002' THEN 'Maria Santos'
                    WHEN 'EX-003' THEN 'João Silva'
                    WHEN 'EX-005' THEN 'Pedro Costa'
                    WHEN 'EX-006' THEN 'Ana Ferreira'
                    ELSE 'Operador'
                END,
                CASE atendimento_record.codigo
                    WHEN 'EX-002' THEN 'Recebemos os documentos. Estamos analisando e retornaremos em breve.'
                    WHEN 'EX-003' THEN 'Aguardando retorno do cliente sobre os documentos solicitados.'
                    WHEN 'EX-005' THEN 'Tentamos contato várias vezes. Aguardando retorno do cliente.'
                    WHEN 'EX-006' THEN 'Sua solicitação está em análise. Retornaremos em até 48h.'
                    ELSE 'Mensagem do operador'
                END,
                NOW() - INTERVAL '2 hours' + (INTERVAL '20 minutes' * (CASE WHEN atendimento_record.codigo = 'EX-002' THEN 0
                                                                           WHEN atendimento_record.codigo = 'EX-003' THEN 1
                                                                           WHEN atendimento_record.codigo = 'EX-005' THEN 2
                                                                           ELSE 3 END))
            );
        END IF;
    END LOOP;
END $$;

-- Verificar os dados inseridos
SELECT 
    codigo,
    cliente_nome,
    status,
    prioridade,
    operador_nome,
    EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as minutos_desde_ultima_atualizacao,
    created_at,
    updated_at
FROM atendimentos 
WHERE codigo LIKE 'EX-%'
ORDER BY codigo;

-- Verificar mensagens inseridas
SELECT 
    a.codigo,
    m.remetente_tipo,
    m.remetente_nome,
    m.conteudo,
    m.created_at
FROM mensagens m
JOIN atendimentos a ON m.atendimento_id = a.id
WHERE a.codigo LIKE 'EX-%'
ORDER BY a.codigo, m.created_at;

-- Comentário de uso:
-- Este script criará 6 atendimentos de exemplo:
-- EX-001: Não atendido (alta prioridade, 2h atrás)
-- EX-002: Pausado (média prioridade, 30min atrás - deve permanecer pausado)
-- EX-003: Pausado (baixa prioridade, 2h atrás - deve virar abandonado)
-- EX-004: Não atendido (alta prioridade, 15min atrás)
-- EX-005: Abandonado (baixa prioridade, já abandonado)
-- EX-006: Pausado (média prioridade, 20min atrás - deve permanecer pausado)
--
-- Para remover os dados de exemplo posteriormente:
-- DELETE FROM mensagens WHERE atendimento_id IN (SELECT id FROM atendimentos WHERE codigo LIKE 'EX-%');
-- DELETE FROM atendimentos WHERE codigo LIKE 'EX-%';
