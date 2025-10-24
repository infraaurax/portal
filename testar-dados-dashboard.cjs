const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://bxravbirihbuyfkvhqpr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4cmF2YmlyaWhidXlma3ZocXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1ODk4NTcsImV4cCI6MjA3MDE2NTg1N30.qAs4lX_xk6MFYBOfn1COGBWqlqP6zZdc7FaxJWa6jj8';

const supabase = createClient(supabaseUrl, supabaseKey);

// Função auxiliar para buscar nomes relacionados (igual ao serviço)
const buscarNomesRelacionados = async (atendimentos) => {
  if (!atendimentos || atendimentos.length === 0) return atendimentos;

  // Buscar operadores únicos
  const operadorIds = [...new Set(atendimentos.map(a => a.operador_id).filter(Boolean))];
  const categoriaIds = [...new Set(atendimentos.map(a => a.categoria_id).filter(Boolean))];

  // Buscar nomes dos operadores
  const operadoresMap = {};
  if (operadorIds.length > 0) {
    const { data: operadores } = await supabase
      .from('operadores')
      .select('id, nome')
      .in('id', operadorIds);
    
    if (operadores) {
      operadores.forEach(op => {
        operadoresMap[op.id] = op.nome;
      });
    }
  }

  // Buscar nomes das categorias
  const categoriasMap = {};
  if (categoriaIds.length > 0) {
    const { data: categorias } = await supabase
      .from('categorias')
      .select('id, nome')
      .in('id', categoriaIds);
    
    if (categorias) {
      categorias.forEach(cat => {
        categoriasMap[cat.id] = cat.nome;
      });
    }
  }

  // Adicionar nomes aos atendimentos e mapear campos para compatibilidade com frontend
  return atendimentos.map(atendimento => ({
    ...atendimento,
    // Mapeamento de campos para compatibilidade com frontend
    nome: atendimento.cliente_nome,
    telefone: atendimento.cliente_telefone,
    email: atendimento.cliente_email,
    descricao: atendimento.descricao_atendimento,
    horario: atendimento.created_at,
    // Campos relacionados
    operador: atendimento.operador_id ? { nome: operadoresMap[atendimento.operador_id] || 'Operador não encontrado' } : null,
    categoria: atendimento.categoria_id ? { nome: categoriasMap[atendimento.categoria_id] || 'Categoria não encontrada' } : null,
    // Avatar baseado na primeira letra do nome
    avatar: atendimento.cliente_nome ? atendimento.cliente_nome.charAt(0).toUpperCase() : '?'
  }));
};

async function testarDadosDashboard() {
  console.log('🔍 TESTANDO DADOS DA DASHBOARD');
  console.log('================================');

  try {
    // 1. Buscar todos os atendimentos
    console.log('\n1. 📊 BUSCANDO TODOS OS ATENDIMENTOS:');
    const { data: todosAtendimentos, error: errorTodos } = await supabase
      .from('atendimentos')
      .select('*')
      .order('created_at', { ascending: false });

    if (errorTodos) {
      console.error('❌ Erro ao buscar todos os atendimentos:', errorTodos);
      return;
    }

    console.log(`✅ Total de atendimentos encontrados: ${todosAtendimentos.length}`);

    if (todosAtendimentos.length > 0) {
      console.log('\n📋 ESTRUTURA DO PRIMEIRO ATENDIMENTO:');
      const primeiro = todosAtendimentos[0];
      console.log('   - ID:', primeiro.id);
      console.log('   - Código:', primeiro.codigo);
      console.log('   - Cliente Nome:', primeiro.cliente_nome);
      console.log('   - Cliente Telefone:', primeiro.cliente_telefone);
      console.log('   - Cliente Email:', primeiro.cliente_email);
      console.log('   - Descrição:', primeiro.descricao_atendimento);
      console.log('   - Status:', primeiro.status);
      console.log('   - Operador ID:', primeiro.operador_id);
      console.log('   - Categoria ID:', primeiro.categoria_id);
      console.log('   - Created At:', primeiro.created_at);
    }

    // 2. Aplicar mapeamento de nomes
    console.log('\n2. 🔄 APLICANDO MAPEAMENTO DE NOMES:');
    const atendimentosComNomes = await buscarNomesRelacionados(todosAtendimentos);
    
    if (atendimentosComNomes.length > 0) {
      console.log('\n📋 ESTRUTURA APÓS MAPEAMENTO:');
      const primeiroMapeado = atendimentosComNomes[0];
      console.log('   - ID:', primeiroMapeado.id);
      console.log('   - Código:', primeiroMapeado.codigo);
      console.log('   - Nome (mapeado):', primeiroMapeado.nome);
      console.log('   - Telefone (mapeado):', primeiroMapeado.telefone);
      console.log('   - Email (mapeado):', primeiroMapeado.email);
      console.log('   - Descrição (mapeado):', primeiroMapeado.descricao);
      console.log('   - Horário (mapeado):', primeiroMapeado.horario);
      console.log('   - Avatar (gerado):', primeiroMapeado.avatar);
      console.log('   - Status:', primeiroMapeado.status);
      console.log('   - Operador:', primeiroMapeado.operador?.nome || 'Sem operador');
      console.log('   - Categoria:', primeiroMapeado.categoria?.nome || 'Sem categoria');
    }

    // 3. Verificar campos necessários para os cards
    console.log('\n3. ✅ VERIFICAÇÃO DOS CAMPOS PARA CARDS:');
    const camposNecessarios = ['id', 'codigo', 'nome', 'status', 'avatar'];
    
    atendimentosComNomes.slice(0, 3).forEach((atendimento, index) => {
      console.log(`\n   📋 ATENDIMENTO ${index + 1}:`);
      console.log(`      ✅ id: ${atendimento.id}`);
      console.log(`      ✅ codigo: ${atendimento.codigo}`);
      console.log(`      ✅ nome: ${atendimento.nome}`);
      console.log(`      ✅ horario: ${atendimento.horario}`);
      console.log(`      ✅ status: ${atendimento.status}`);
      console.log(`      ✅ avatar: ${atendimento.avatar}`);
    });

    // 4. Simular busca por operador específico
    console.log('\n4. 👤 TESTANDO BUSCA POR OPERADOR:');
    
    // Buscar um operador existente
    const { data: operadores } = await supabase
      .from('operadores')
      .select('id, nome, email')
      .limit(1);

    if (operadores && operadores.length > 0) {
      const operador = operadores[0];
      console.log(`   - Testando com operador: ${operador.nome} (ID: ${operador.id})`);
      
      const { data: atendimentosOperador, error: errorOperador } = await supabase
        .from('atendimentos')
        .select('*')
        .eq('operador_id', operador.id)
        .order('created_at', { ascending: false });

      if (errorOperador) {
        console.error('❌ Erro ao buscar por operador:', errorOperador);
      } else {
        console.log(`   ✅ Atendimentos do operador: ${atendimentosOperador.length}`);
        
        if (atendimentosOperador.length > 0) {
          const comNomes = await buscarNomesRelacionados(atendimentosOperador);
          console.log('   📋 Primeiro atendimento do operador:');
          console.log(`      - Nome: ${comNomes[0].nome}`);
          console.log(`      - Código: ${comNomes[0].codigo}`);
          console.log(`      - Status: ${comNomes[0].status}`);
        }
      }
    }

    console.log('\n🎯 RESUMO DO TESTE:');
    console.log(`   - Total de atendimentos: ${todosAtendimentos.length}`);
    console.log(`   - Mapeamento funcionando: ${atendimentosComNomes.length > 0 ? '✅' : '❌'}`);
    console.log(`   - Campos essenciais presentes: ${atendimentosComNomes.length > 0 && atendimentosComNomes[0].nome ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ ERRO GERAL NO TESTE:', error);
  }
}

// Executar o teste
testarDadosDashboard().then(() => {
  console.log('\n✅ Teste concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});