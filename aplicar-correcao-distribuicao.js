import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://bxravbirihbuyfkvhqpr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4cmF2YmlyaWhidXlma3ZocXByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4OTg1NywiZXhwIjoyMDcwMTY1ODU3fQ.wOcOdHfqlietZJrYQeTmbjTpL-d6yw85KJb-bDOlFWU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function aplicarCorrecaoDistribuicao() {
  console.log('🔧 Aplicando correção da função de distribuição...\n');

  try {
    // SQL da função corrigida
    const sqlCorrigido = `
CREATE OR REPLACE FUNCTION distribuir_atendimentos_inteligente()
RETURNS TABLE(
    atendimento_id UUID,
    operador_id UUID,
    operador_email TEXT,
    pos_token INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_operadores_online INTEGER;
    v_atendimentos_na_fila INTEGER;
    v_atendimentos_oferecidos INTEGER;
    v_max_oferecimentos INTEGER;
    rec RECORD;
    v_operador RECORD;
    v_atendimento RECORD;
BEGIN
    -- Contar operadores online e habilitados
    SELECT COUNT(*) INTO v_operadores_online
    FROM operadores
    WHERE habilitado = true
    AND online = true
    AND pos_token IS NOT NULL
    AND pos_token > 0;

    -- Se não há operadores online, não distribuir nada
    IF v_operadores_online = 0 THEN
        RETURN;
    END IF;

    -- Contar atendimentos na fila
    SELECT COUNT(*) INTO v_atendimentos_na_fila
    FROM fila_atendimentos
    WHERE status = 'na_fila';

    -- Contar atendimentos já oferecidos (mas não expirados)
    SELECT COUNT(*) INTO v_atendimentos_oferecidos
    FROM fila_atendimentos
    WHERE status = 'oferecido'
    AND (data_expiracao IS NULL OR data_expiracao > NOW());

    -- Calcular quantos atendimentos podem ser oferecidos simultaneamente
    -- Regra: máximo de operadores online, mas nunca mais que 3 simultaneamente
    v_max_oferecimentos := LEAST(v_operadores_online, 3);

    -- Se já temos o máximo de oferecimentos, não oferecer mais
    IF v_atendimentos_oferecidos >= v_max_oferecimentos THEN
        RETURN;
    END IF;

    -- Buscar atendimentos na fila (sem CROSS JOIN)
    FOR v_atendimento IN (
        SELECT id as fila_id, atendimento_id
        FROM fila_atendimentos
        WHERE status = 'na_fila'
        ORDER BY created_at ASC
        LIMIT (v_max_oferecimentos - v_atendimentos_oferecidos)
    ) LOOP
        
        -- Para cada atendimento, buscar o melhor operador disponível
        SELECT 
            o.id,
            o.email,
            o.pos_token
        INTO v_operador
        FROM operadores o
        WHERE o.habilitado = true
        AND o.online = true
        AND o.pos_token IS NOT NULL
        AND o.pos_token > 0
        AND NOT EXISTS (
            -- Operador não pode ter atendimento já oferecido
            SELECT 1 FROM fila_atendimentos fa2
            WHERE fa2.operador_id = o.id
            AND fa2.status = 'oferecido'
            AND (fa2.data_expiracao IS NULL OR fa2.data_expiracao > NOW())
        )
        AND NOT EXISTS (
            -- NUNCA oferecer para operadores que já rejeitaram este atendimento
            SELECT 1 FROM ofertas_operador oo
            WHERE oo.atendimento_id = v_atendimento.atendimento_id
            AND oo.operador_id = o.id
            AND oo.status = 'rejeitado'
        )
        ORDER BY 
            o.pos_token ASC,
            o.created_at ASC
        LIMIT 1;

        -- Se encontrou um operador disponível, fazer a oferta
        IF v_operador.id IS NOT NULL THEN
            -- Atualizar o registro na fila
            UPDATE fila_atendimentos
            SET 
                operador_id = v_operador.id,
                status = 'oferecido',
                data_expiracao = NOW() + INTERVAL '45 seconds',
                updated_at = NOW()
            WHERE id = v_atendimento.fila_id;

            -- Registrar a oferta
            INSERT INTO ofertas_operador (atendimento_id, operador_id, status, created_at)
            VALUES (v_atendimento.atendimento_id, v_operador.id, 'oferecido', NOW())
            ON CONFLICT (atendimento_id, operador_id) 
            DO UPDATE SET 
                status = 'oferecido',
                created_at = NOW();

            -- Retornar o resultado
            atendimento_id := v_atendimento.atendimento_id;
            operador_id := v_operador.id;
            operador_email := v_operador.email;
            pos_token := v_operador.pos_token;
            
            RETURN NEXT;
        END IF;
    END LOOP;

    RETURN;
END;
$$;
`;

    console.log('📝 Executando SQL da função corrigida...');
    
    // Executar o SQL usando uma query direta
    const { data, error } = await supabase
      .from('_dummy_table_that_does_not_exist')
      .select('*')
      .limit(0);

    // Como a query acima vai falhar, vamos tentar uma abordagem diferente
    // Vamos usar o RPC para executar uma função que executa SQL
    
    console.log('🔄 Tentando aplicar a correção...');
    
    // Primeiro, vamos testar se a função atual funciona
    const { data: testeAntes, error: errorAntes } = await supabase
      .rpc('distribuir_atendimentos_inteligente');

    console.log('📊 Teste antes da correção:');
    if (errorAntes) {
      console.log('❌ Erro confirmado:', errorAntes.message);
    } else {
      console.log('✅ Função funcionou (inesperado):', testeAntes);
    }

    // Como não podemos executar SQL diretamente, vamos criar um arquivo SQL
    // e instruir o usuário a executá-lo manualmente
    console.log('\n📋 INSTRUÇÕES PARA APLICAR A CORREÇÃO:');
    console.log('1. Acesse o painel do Supabase');
    console.log('2. Vá para SQL Editor');
    console.log('3. Execute o seguinte SQL:');
    console.log('\n' + '='.repeat(50));
    console.log(sqlCorrigido);
    console.log('='.repeat(50));
    
    console.log('\n✅ Após executar o SQL, teste novamente a distribuição.');

  } catch (error) {
    console.error('❌ Erro durante aplicação:', error);
  }
}

aplicarCorrecaoDistribuicao();