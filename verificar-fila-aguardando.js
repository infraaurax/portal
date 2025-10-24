import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarFilaInteligente() {
  try {
    console.log('🔍 Verificando atendimentos com status "aguardando"...');
    
    // Buscar atendimentos aguardando
    const { data: aguardando, error: errorAguardando } = await supabase
      .from('atendimentos')
      .select('*')
      .eq('status', 'aguardando')
      .order('created_at', { ascending: false });
    
    if (errorAguardando) {
      console.error('❌ Erro ao buscar atendimentos aguardando:', errorAguardando);
      return;
    }
    
    console.log(`📊 Atendimentos aguardando: ${aguardando?.length || 0}`);
    
    if (aguardando && aguardando.length > 0) {
      console.log('\n📝 Atendimentos aguardando:');
      aguardando.forEach((atendimento, index) => {
        console.log(`${index + 1}. #${atendimento.codigo} - ${atendimento.cliente_nome} - Operador: ${atendimento.operador_id || 'Nenhum'} - Criado: ${new Date(atendimento.created_at).toLocaleString()}`);
      });
    }
    
    console.log('\n🔍 Verificando estrutura da tabela operadores...');
    
    // Verificar estrutura da tabela operadores
    const { data: operadoresSample, error: errorOperadoresSample } = await supabase
      .from('operadores')
      .select('*')
      .limit(1);
    
    if (errorOperadoresSample) {
      console.error('❌ Erro ao consultar operadores:', errorOperadoresSample);
    } else {
      console.log('📊 Estrutura da tabela operadores:');
      if (operadoresSample && operadoresSample.length > 0) {
        console.log('Colunas encontradas:', Object.keys(operadoresSample[0]));
      } else {
        console.log('Tabela operadores vazia');
      }
    }
    
    console.log('\n🔍 Verificando operadores (usando colunas corretas)...');
    
    // Verificar operadores com colunas que existem
    const { data: operadores, error: errorOperadores } = await supabase
      .from('operadores')
      .select('*')
      .eq('habilitado', true);
    
    if (errorOperadores) {
      console.error('❌ Erro ao buscar operadores habilitados:', errorOperadores);
    } else {
      console.log(`📊 Operadores habilitados: ${operadores?.length || 0}`);
      
      if (operadores && operadores.length > 0) {
        console.log('\n📝 Operadores habilitados:');
        operadores.forEach((operador, index) => {
          console.log(`${index + 1}. ${operador.nome} - ID: ${operador.id} - Status: ${operador.status} - Online: ${operador.online} - Habilitado: ${operador.habilitado}`);
        });
      }
    }
    
    console.log('\n🔍 Verificando fila_atendimentos...');
    
    // Verificar fila_atendimentos
    const { data: fila, error: errorFila } = await supabase
      .from('fila_atendimentos')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (errorFila) {
      console.error('❌ Erro ao buscar fila_atendimentos:', errorFila);
    } else {
      console.log(`📊 Itens na fila: ${fila?.length || 0}`);
      
      if (fila && fila.length > 0) {
        console.log('\n📝 Fila de atendimentos:');
        fila.forEach((item, index) => {
          console.log(`${index + 1}. Atendimento ID: ${item.atendimento_id} - Status: ${item.status} - Operador: ${item.operador_id || 'Nenhum'} - Criado: ${new Date(item.created_at).toLocaleString()}`);
        });
      }
    }
    
    // Verificar se o atendimento aguardando está na fila
    if (aguardando && aguardando.length > 0) {
      console.log('\n🔍 Verificando se atendimentos aguardando estão na fila...');
      
      for (const atendimento of aguardando) {
        const { data: naFila, error: errorNaFila } = await supabase
          .from('fila_atendimentos')
          .select('*')
          .eq('atendimento_id', atendimento.id);
        
        if (errorNaFila) {
          console.error(`❌ Erro ao verificar atendimento ${atendimento.codigo} na fila:`, errorNaFila);
        } else {
          console.log(`📋 Atendimento ${atendimento.codigo} na fila: ${naFila?.length > 0 ? 'SIM' : 'NÃO'}`);
          if (naFila && naFila.length > 0) {
            console.log(`   Status na fila: ${naFila[0].status}`);
            console.log(`   Operador na fila: ${naFila[0].operador_id || 'Nenhum'}`);
          }
        }
      }
    }
    
    console.log('\n🔍 Verificando sistema de distribuição...');
    
    // Verificar se existe função de distribuição automática
    const { data: funcoes, error: errorFuncoes } = await supabase
      .rpc('distribuir_atendimentos_inteligente');
    
    if (errorFuncoes) {
      console.log('⚠️ Função distribuir_atendimentos_inteligente não encontrada ou erro:', errorFuncoes.message);
    } else {
      console.log('✅ Função de distribuição automática executada:', funcoes);
    }
    
    // Verificar triggers automáticos
    console.log('\n🔍 Verificando se atendimento deveria estar na fila automaticamente...');
    
    if (aguardando && aguardando.length > 0) {
      for (const atendimento of aguardando) {
        console.log(`\n📋 Analisando atendimento ${atendimento.codigo}:`);
        console.log(`   Status: ${atendimento.status}`);
        console.log(`   Operador ID: ${atendimento.operador_id || 'Nenhum'}`);
        console.log(`   Criado em: ${new Date(atendimento.created_at).toLocaleString()}`);
        
        // Verificar se deveria estar na fila
        if (atendimento.status === 'aguardando' && atendimento.operador_id) {
          console.log(`   ⚠️ PROBLEMA: Atendimento tem status 'aguardando' mas já tem operador atribuído!`);
          console.log(`   💡 Isso pode indicar que o atendimento foi oferecido mas não aceito.`);
        } else if (atendimento.status === 'aguardando' && !atendimento.operador_id) {
          console.log(`   ⚠️ PROBLEMA: Atendimento tem status 'aguardando' mas não tem operador e não está na fila!`);
          console.log(`   💡 Isso indica falha no sistema de distribuição automática.`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verificarFilaInteligente();