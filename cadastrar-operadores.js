import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bxravbirihbuyfkvhqpr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4cmF2YmlyaWhidXlma3ZocXByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU4OTg1NywiZXhwIjoyMDcwMTY1ODU3fQ.wOcOdHfqlietZJrYQeTmbjTpL-d6yw85KJb-bDOlFWU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cadastrarOperadores() {
  console.log('🔧 === CADASTRANDO OPERADORES NO SISTEMA ===\n');

  try {
    // Verificar se já existem operadores
    const { data: operadoresExistentes, error: checkError } = await supabase
      .from('operadores')
      .select('*');

    if (checkError) {
      console.error('❌ Erro ao verificar operadores existentes:', checkError);
      return;
    }

    if (operadoresExistentes && operadoresExistentes.length > 0) {
      console.log('⚠️  Já existem operadores cadastrados:');
      operadoresExistentes.forEach((op, index) => {
        console.log(`   ${index + 1}. ${op.nome} (${op.email}) - ${op.perfil}`);
      });
      console.log('\n❓ Deseja continuar mesmo assim? (Este script irá adicionar mais operadores)');
      console.log('💡 Se quiser apenas habilitar operadores existentes, use o script de habilitação.');
      return;
    }

    // Lista de operadores para cadastrar
    const operadoresParaCadastrar = [
      {
        nome: 'Operador Teste 1',
        email: 'operador1@aurax.com.br',
        perfil: 'Operador',
        habilitado: true,
        online: true,
        pos_token: 1,
        status: 'ativo'
      },
      {
        nome: 'Operador Teste 2', 
        email: 'operador2@aurax.com.br',
        perfil: 'Operador',
        habilitado: true,
        online: true,
        pos_token: 2,
        status: 'ativo'
      },
      {
        nome: 'Supervisor Teste',
        email: 'supervisor@aurax.com.br',
        perfil: 'Admin',
        habilitado: true,
        online: true,
        pos_token: 3,
        status: 'ativo'
      }
    ];

    console.log('📝 Cadastrando operadores...\n');

    for (const operador of operadoresParaCadastrar) {
      console.log(`🔄 Cadastrando: ${operador.nome} (${operador.email})`);
      
      const { data, error } = await supabase
        .from('operadores')
        .insert([{
          ...operador,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error(`❌ Erro ao cadastrar ${operador.nome}:`, error);
      } else {
        console.log(`✅ ${operador.nome} cadastrado com sucesso! ID: ${data[0].id}`);
      }
    }

    // Verificar resultado final
    console.log('\n🔍 Verificando operadores cadastrados...');
    const { data: operadoresFinal, error: finalError } = await supabase
      .from('operadores')
      .select('*')
      .order('pos_token');

    if (finalError) {
      console.error('❌ Erro ao verificar resultado:', finalError);
    } else {
      console.log(`\n✅ Total de operadores cadastrados: ${operadoresFinal.length}`);
      console.log('\n📋 Lista final de operadores:');
      operadoresFinal.forEach((op, index) => {
        console.log(`   ${index + 1}. ${op.nome} (${op.email})`);
        console.log(`      - Perfil: ${op.perfil}`);
        console.log(`      - Habilitado: ${op.habilitado ? '✅' : '❌'}`);
        console.log(`      - Online: ${op.online ? '🟢' : '🔴'}`);
        console.log(`      - Pos Token: ${op.pos_token}`);
        console.log('');
      });

      // Verificar operadores ativos
      const operadoresAtivos = operadoresFinal.filter(op => op.habilitado && op.online);
      console.log(`🟢 Operadores ativos: ${operadoresAtivos.length}`);
      
      if (operadoresAtivos.length > 0) {
        console.log('✅ Sistema pronto para receber atendimentos!');
        console.log('💡 Próximo passo: Verificar se os atendimentos aguardando são distribuídos automaticamente');
      }
    }

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

  } catch (error) {
    console.error('❌ Erro geral no cadastro:', error);
  }
}

// Executar cadastro
cadastrarOperadores()
  .then(() => {
    console.log('\n✅ Processo de cadastro concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });