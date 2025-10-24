const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://bxravbirihbuyfkvhqpr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4cmF2YmlyaWhidXlma3ZocXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1ODk4NTcsImV4cCI6MjA3MDE2NTg1N30.qAs4lX_xk6MFYBOfn1COGBWqlqP6zZdc7FaxJWa6jj8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDashboard() {
  console.log('🔍 DEBUG DASHBOARD - VERIFICANDO CARREGAMENTO DE DADOS');
  console.log('='.repeat(60));

  try {
    // 1. Verificar conexão
    console.log('\n1. 🔗 TESTANDO CONEXÃO COM SUPABASE:');
    const { data: testData, error: testError } = await supabase
      .from('atendimentos')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Erro de conexão:', testError);
      return;
    }
    console.log('✅ Conexão OK');

    // 2. Verificar operadores
    console.log('\n2. 👥 VERIFICANDO OPERADORES:');
    const { data: operadores, error: opError } = await supabase
      .from('operadores')
      .select('*');
    
    if (opError) {
      console.log('❌ Erro ao buscar operadores:', opError);
    } else {
      console.log('✅ Operadores encontrados:', operadores.length);
      operadores.forEach(op => {
        console.log(`   - ${op.nome} (${op.email}) - Perfil: ${op.perfil} - Habilitado: ${op.habilitado}`);
      });
    }

    // 3. Verificar atendimentos
    console.log('\n3. 📋 VERIFICANDO ATENDIMENTOS:');
    const { data: atendimentos, error: atError } = await supabase
      .from('atendimentos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (atError) {
      console.log('❌ Erro ao buscar atendimentos:', atError);
    } else {
      console.log('✅ Atendimentos encontrados:', atendimentos.length);
      
      // Mostrar primeiros 5 atendimentos
      console.log('\n📊 PRIMEIROS 5 ATENDIMENTOS:');
      atendimentos.slice(0, 5).forEach((at, index) => {
        console.log(`   ${index + 1}. ${at.codigo} - ${at.cliente_nome} - Status: ${at.status}`);
        console.log(`      Operador ID: ${at.operador_id || 'Não atribuído'}`);
        console.log(`      Categoria ID: ${at.categoria_id || 'Sem categoria'}`);
        console.log(`      Created: ${at.created_at}`);
        console.log('');
      });

      // Verificar distribuição por status
      console.log('\n📈 DISTRIBUIÇÃO POR STATUS:');
      const statusCount = {};
      atendimentos.forEach(at => {
        statusCount[at.status] = (statusCount[at.status] || 0) + 1;
      });
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });

      // Verificar distribuição por operador
      console.log('\n👤 DISTRIBUIÇÃO POR OPERADOR:');
      const operadorCount = {};
      atendimentos.forEach(at => {
        const opId = at.operador_id || 'Não atribuído';
        operadorCount[opId] = (operadorCount[opId] || 0) + 1;
      });
      Object.entries(operadorCount).forEach(([opId, count]) => {
        console.log(`   - ${opId}: ${count}`);
      });
    }

    // 4. Simular busca como admin
    console.log('\n4. 🔍 SIMULANDO BUSCA COMO ADMIN:');
    const { data: todosAtendimentos, error: adminError } = await supabase
      .from('atendimentos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (adminError) {
      console.log('❌ Erro na busca admin:', adminError);
    } else {
      console.log('✅ Admin - Total encontrado:', todosAtendimentos.length);
    }

    // 5. Simular busca por operador específico
    console.log('\n5. 👤 SIMULANDO BUSCA POR OPERADOR:');
    if (operadores && operadores.length > 0) {
      const primeiroOperador = operadores[0];
      console.log(`   Testando com operador: ${primeiroOperador.nome} (ID: ${primeiroOperador.id})`);
      
      const { data: atendimentosOperador, error: opAtError } = await supabase
        .from('atendimentos')
        .select('*')
        .eq('operador_id', primeiroOperador.id)
        .order('created_at', { ascending: false });
      
      if (opAtError) {
        console.log('❌ Erro na busca por operador:', opAtError);
      } else {
        console.log('✅ Operador - Total encontrado:', atendimentosOperador.length);
      }
    }

    // 6. Verificar estrutura dos dados
    console.log('\n6. 🏗️ VERIFICANDO ESTRUTURA DOS DADOS:');
    if (atendimentos && atendimentos.length > 0) {
      const primeiroAtendimento = atendimentos[0];
      console.log('   Campos disponíveis no primeiro atendimento:');
      Object.keys(primeiroAtendimento).forEach(campo => {
        console.log(`   - ${campo}: ${primeiroAtendimento[campo]}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral no debug:', error);
  }

  console.log('\n✅ Debug concluído!');
}

debugDashboard();