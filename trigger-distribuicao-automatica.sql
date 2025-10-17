-- ============================================
-- TRIGGER PARA DISTRIBUIÇÃO AUTOMÁTICA
-- ============================================
-- Este script cria um trigger que executa distribuição automática
-- sempre que um novo atendimento é criado com status 'novo'

-- 1. REMOVER TRIGGERS EXISTENTES
DROP TRIGGER IF EXISTS trigger_atendimento_novo_fila ON atendimentos;
DROP TRIGGER IF EXISTS trigger_atendimento_para_fila ON atendimentos;
DROP TRIGGER IF EXISTS trigger_atendimento_para_fila_v2 ON atendimentos;
DROP TRIGGER IF EXISTS trigger_adicionar_atendimento_fila ON atendimentos;
DROP TRIGGER IF EXISTS trigger_distribuicao_automatica ON atendimentos;

-- 2. REMOVER FUNÇÕES ANTIGAS
DROP FUNCTION IF EXISTS trigger_adicionar_fila();
DROP FUNCTION IF EXISTS trigger_adicionar_fila_inteligente();
DROP FUNCTION IF EXISTS trigger_adicionar_atendimento_fila();

-- 3. CRIAR NOVA FUNÇÃO DE TRIGGER COM DISTRIBUIÇÃO AUTOMÁTICA
CREATE OR REPLACE FUNCTION trigger_distribuicao_automatica()
RETURNS TRIGGER AS $$
DECLARE
    v_existe_na_fila BOOLEAN := FALSE;
    v_resultado JSON;
    v_operadores_disponiveis INTEGER := 0;
BEGIN
    -- Log para debug
    RAISE NOTICE 'Trigger distribuição automática executado para atendimento ID: %, Status: %, Operador: %', 
        NEW.id, NEW.status, NEW.operador_id;
    
    -- Verifica se deve processar (status = 'novo' E operador_id IS NULL)
    IF NEW.status = 'novo' AND NEW.operador_id IS NULL THEN
        
        -- Verificar se já existe na fila
        SELECT EXISTS(
            SELECT 1 FROM fila_atendimentos 
            WHERE atendimento_id = NEW.id
        ) INTO v_existe_na_fila;
        
        -- Se não existe na fila, adiciona
        IF NOT v_existe_na_fila THEN
            
            RAISE NOTICE 'Adicionando atendimento % à fila...', NEW.id;
            
            -- Inserir na fila com status 'aguardando'
            INSERT INTO fila_atendimentos (
                atendimento_id,
                operador_id,
                status,
                prioridade,
                data_entrada,
                created_at,
                updated_at
            ) VALUES (
                NEW.id,
                NULL,
                'aguardando',
                1,
                NOW(),
                NOW(),
                NOW()
            );
            
            -- Atualizar status do atendimento para 'aguardando'
            UPDATE atendimentos 
            SET 
                status = 'aguardando',
                updated_at = NOW()
            WHERE id = NEW.id;
            
            RAISE NOTICE 'Atendimento % adicionado à fila com status aguardando', NEW.id;
            
            -- Verificar se há operadores disponíveis
            SELECT COUNT(*) INTO v_operadores_disponiveis
            FROM operadores 
            WHERE online = true 
            AND habilitado = true;
            
            RAISE NOTICE 'Operadores disponíveis: %', v_operadores_disponiveis;
            
            -- Se há operadores disponíveis, executar distribuição automática
            IF v_operadores_disponiveis > 0 THEN
                RAISE NOTICE 'Executando distribuição automática...';
                
                -- Executar função de distribuição
                SELECT distribuir_atendimentos_inteligente() INTO v_resultado;
                
                RAISE NOTICE 'Resultado da distribuição automática: %', v_resultado;
            ELSE
                RAISE NOTICE 'Nenhum operador disponível para distribuição automática';
            END IF;
            
        ELSE
            RAISE NOTICE 'Atendimento % já existe na fila', NEW.id;
        END IF;
        
    ELSE
        RAISE NOTICE 'Atendimento % não atende critérios para fila (Status: %, Operador: %)', 
            NEW.id, NEW.status, NEW.operador_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. CRIAR TRIGGER PARA DISTRIBUIÇÃO AUTOMÁTICA
CREATE TRIGGER trigger_distribuicao_automatica
    AFTER INSERT OR UPDATE ON atendimentos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_distribuicao_automatica();

-- 5. VERIFICAÇÃO FINAL
SELECT 'Trigger de distribuição automática criado com sucesso!' as status;

-- 6. INSTRUÇÕES DE TESTE
/*
Para testar o trigger:

1. Criar um novo atendimento:
INSERT INTO atendimentos (
    cliente_nome,
    cliente_email,
    cliente_telefone,
    assunto,
    descricao,
    status,
    prioridade
) VALUES (
    'Teste Distribuição Automática',
    'teste@automatico.com',
    '11999999999',
    'Teste Automático',
    'Este atendimento deve ser distribuído automaticamente',
    'novo',
    'normal'
);

2. Verificar se foi adicionado à fila e distribuído:
SELECT 
    a.id,
    a.cliente_nome,
    a.status,
    a.operador_id,
    fa.status as fila_status
FROM atendimentos a
LEFT JOIN fila_atendimentos fa ON fa.atendimento_id = a.id
WHERE a.cliente_nome = 'Teste Distribuição Automática';

3. Verificar logs no console do Supabase para debug
*/