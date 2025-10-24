// Teste de conexão com Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bxravbirihbuyfkvhqpr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4cmF2YmlyaWhidXlma3ZocXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1ODk4NTcsImV4cCI6MjA3MDE2NTg1N30.qAs4lX_xk6MFYBOfn1COGBWqlqP6zZdc7FaxJWa6jj8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔍 Testando conexão com Supabase...');
  
  try {
    // Teste 1: Verificar se consegue conectar
    console.log('📊 Teste 1: Verificando conexão básica...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('atendimentos')
      .select('count', { count: 'exact', head: true });
    
    if (healthError) {
      console.error('❌ Erro na conexão:', healthError);
      return;
    }
    
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log('📊 Total de registros na tabela atendimentos:', healthCheck);
    
    // Teste 2: Buscar dados específicos
    console.log('📊 Teste 2: Buscando atendimentos não finalizados...');
    const { data, error } = await supabase
      .from('atendimentos')
      .select('*')
      .in('status', ['novo', 'em-andamento', 'aguardando'])
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar dados:', error);
      return;
    }
    
    console.log('✅ Dados encontrados:', data?.length || 0);
    console.log('📋 Primeiros 3 registros:', data?.slice(0, 3));
    
    // Teste 3: Verificar estrutura da tabela
    console.log('📊 Teste 3: Verificando estrutura da tabela...');
    if (data && data.length > 0) {
      console.log('🔍 Colunas disponíveis:', Object.keys(data[0]));
      console.log('📊 Status encontrados:', [...new Set(data.map(item => item.status))]);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testConnection();