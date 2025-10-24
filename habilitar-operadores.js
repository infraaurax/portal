import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bxravbirihbuyfkvhqpr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4cmF2YmlyaWhidXlma3ZocXByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4OTg1NywiZXhwIjoyMDcwMTY1ODU3fQ.wOcOdHfqlietZJrYQeTmbjTpL-d6yw85KJb-bDOlFWU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function habilitarOperadores() {
  console.log('🔧 === HABILITANDO OPERADORES EXISTENTES ===\n');

  try {
    // Buscar todos os operadores
    const { data: operadores, error: fetchError } = await supabase
      .from('operadores')
      .select('*')
      .order('id');

    if (fetchError) {
      console.error('❌ Erro ao buscar operadores:', fetchError);
      return;
    }

    console.log(`📊 Total de operadores encontrados: ${operadores.length}\n`);

    // Mostrar status atual
    console.log('📋 Status atual dos operadores:');
    operadores.forEach((op, index) => {
      console.log(`   ${index + 1}. ${op.nome} (${op.email})`);
      console.log(`      - Perfil: ${op.perfil}`);
      console.log(`      - Habilitado: ${op.habilitado ? '✅' : '❌'}`);
      console.log(`      - Online: ${op.online ? '🟢' : '🔴'}`);
      console.log(`      - Pos Token: ${op.pos_token || 'N/A'}`);
      console.log('');
    });

    // Filtrar operadores que precisam ser habilitados
    const operadoresParaHabilitar = operadores.filter(op => 
      op.perfil === 'Operador' && (!op.habilitado || !op.online)
    );

    if (operadoresParaHabilitar.length === 0) {
      console.log('✅ Todos os operadores já estão habilitados e online!');
      
      // Verificar se há operadores ativos
      const operadoresAtivos = operadores.filter(op => op.habilitado && op.online);
      console.log(`🟢 Operadores ativos: ${operadoresAtivos.length}`);
      
      if (operadoresAtivos.length > 0) {
        console.log('✅ Sistema pronto para distribuir atendimentos!');
      }
      return;
    }

    console.log(`🔄 Habilitando ${operadoresParaHabilitar.length} operadores...\n`);

    // Habilitar operadores
    for (let i = 0; i < operadoresParaHabilitar.length; i++) {
      const operador = operadoresParaHabilitar[i];
      console.log(`🔄 Habilitando: ${operador.nome}`);

      // Calcular pos_token se não existir
      let posToken = operador.pos_token;
      if (!posToken) {
        posToken = i + 1;
      }

      const { error: updateError } = await supabase
        .from('operadores')
        .update({
          habilitado: true,
          online: true,
          pos_token: posToken,
          status: 'ativo',
          updated_at: new Date().toISOString()
        })
        .eq('id', operador.id);

      if (updateError) {
        console.error(`❌ Erro ao habilitar ${operador.nome}:`, updateError);
      } else {
        console.log(`✅ ${operador.nome} habilitado com sucesso! Pos Token: ${posToken}`);
      }
    }

    // Verificar resultado final
    console.log('\n🔍 Verificando resultado final...');
    const { data: operadoresFinal, error: finalError } = await supabase
      .from('operadores')
      .select('*')
      .order('pos_token');

    if (finalError) {
      console.error('❌ Erro ao verificar resultado:', finalError);
    } else {
      console.log(`\n✅ Status final dos operadores:`);
      operadoresFinal.forEach((op, index) => {
        console.log(`   ${index + 1}. ${op.nome} (${op.email})`);
        console.log(`      - Perfil: ${op.perfil}`);
        console.log(`      - Habilitado: ${op.habilitado ? '✅' : '❌'}`);
        console.log(`      - Online: ${op.online ? '🟢' : '🔴'}`);
        console.log(`      - Pos Token: ${op.pos_token || 'N/A'}`);
        console.log('');
      });

      // Verificar operadores ativos
      const operadoresAtivos = operadoresFinal.filter(op => op.habilitado && op.online);
      console.log(`🟢 Operadores ativos: ${operadoresAtivos.length}`);
      
      if (operadoresAtivos.length > 0) {
        console.log('✅ Sistema pronto para distribuir atendimentos!');
        
        // Tentar executar distribuição automática
        console.log('\n🎯 Testando distribuição automática...');
        try {
          const { data: distribuicaoResult, error: distribuicaoError } = await supabase
            .rpc('distribuir_atendimentos_inteligente');

          if (distribuicaoError) {
            console.error('❌ Erro na distribuição automática:', distribuicaoError);
            console.log('💡 Será necessário corrigir a função de distribuição');
          } else {
            console.log('✅ Distribuição automática executada com sucesso!');
            console.log('📊 Resultado:', distribuicaoResult);
          }
        } catch (error) {
          console.error('❌ Erro ao testar distribuição:', error);
        }
      } else {
        console.log('⚠️  Nenhum operador ativo encontrado');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral na habilitação:', error);
  }
}

// Executar habilitação
habilitarOperadores()
  .then(() => {
    console.log('\n✅ Processo de habilitação concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });