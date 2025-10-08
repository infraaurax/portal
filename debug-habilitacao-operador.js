// ============================================
// SCRIPT DE DEBUG PARA HABILITAÇÃO
// ============================================
// Cole este código no console do navegador (F12)
// para testar a habilitação diretamente
// ============================================

// 1. Testar conexão com Supabase
console.log('🔍 Testando conexão com Supabase...');
console.log('Supabase URL:', window.supabase?.supabaseUrl);
console.log('Supabase Key:', window.supabase?.supabaseKey ? 'Configurado' : 'Não configurado');

// 2. Testar busca de operador
async function testarBuscaOperador() {
  try {
    console.log('🔍 Buscando operador fe66e131-e679-4efe-af22-e33d3b533e18...');
    
    const { data, error } = await window.supabase
      .from('operadores')
      .select('*')
      .eq('id', 'fe66e131-e679-4efe-af22-e33d3b533e18')
      .single();
    
    if (error) {
      console.error('❌ Erro ao buscar operador:', error);
      return null;
    }
    
    console.log('✅ Operador encontrado:', data);
    return data;
  } catch (err) {
    console.error('❌ Erro na busca:', err);
    return null;
  }
}

// 3. Testar atualização simples
async function testarAtualizacaoSimples() {
  try {
    console.log('🔄 Testando atualização simples...');
    
    const { data, error } = await window.supabase
      .from('operadores')
      .update({ 
        habilitado: true,
        online: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'fe66e131-e679-4efe-af22-e33d3b533e18')
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro na atualização:', error);
      console.error('Detalhes:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return null;
    }
    
    console.log('✅ Atualização bem-sucedida:', data);
    return data;
  } catch (err) {
    console.error('❌ Erro na atualização:', err);
    return null;
  }
}

// 4. Testar função completa
async function testarHabilitacaoCompleta() {
  try {
    console.log('🔄 Testando habilitação completa...');
    
    // Primeiro buscar o operador
    const operador = await testarBuscaOperador();
    if (!operador) return;
    
    // Depois testar atualização
    const resultado = await testarAtualizacaoSimples();
    if (!resultado) return;
    
    console.log('✅ Teste completo bem-sucedido!');
    return resultado;
  } catch (err) {
    console.error('❌ Erro no teste completo:', err);
  }
}

// 5. Executar todos os testes
async function executarTodosTestes() {
  console.log('🚀 Iniciando testes de habilitação...');
  console.log('=====================================');
  
  await testarHabilitacaoCompleta();
  
  console.log('=====================================');
  console.log('🏁 Testes concluídos!');
}

// Executar automaticamente
executarTodosTestes();

// ============================================
// COMANDOS MANUAIS (cole no console)
// ============================================

// Para testar apenas a busca:
// testarBuscaOperador()

// Para testar apenas a atualização:
// testarAtualizacaoSimples()

// Para executar todos os testes:
// executarTodosTestes()
