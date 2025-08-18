// Script de debug para testar validação de senha
// Cole este código no console do navegador na página do Dashboard

console.log('🔧 SCRIPT DE DEBUG - VALIDAÇÃO DE SENHA');
console.log('=====================================');

// Função para testar a validação de senha diretamente
window.debugValidacao = async function(email, senhaDigitada, senhaGerada) {
  console.log('\n🧪 TESTE DE VALIDAÇÃO DIRETA');
  console.log('Email:', email);
  console.log('Senha digitada:', senhaDigitada);
  console.log('Senha gerada:', senhaGerada);
  console.log('Senhas são iguais?', senhaDigitada === senhaGerada);
  
  try {
    // Importar a função de validação
    const { validarSenhaEHabilitar } = await import('./src/services/operadoresService.js');
    
    const resultado = await validarSenhaEHabilitar(email, senhaDigitada, senhaGerada);
    console.log('✅ Resultado da validação:', resultado);
    return resultado;
  } catch (error) {
    console.error('❌ Erro na validação:', error);
    return { erro: error.message };
  }
};

// Função para testar com dados do usuário atual
window.testarComUsuarioAtual = function() {
  console.log('\n🧪 TESTE COM USUÁRIO ATUAL');
  
  // Tentar obter dados do contexto de autenticação
  const userEmail = window.localStorage.getItem('sb-user-email') || 'infra@auraxcred.com.br';
  const senhaGerada = '123456'; // Senha de teste
  const senhaDigitada = '123456'; // Mesma senha
  
  console.log('Testando com:');
  console.log('- Email:', userEmail);
  console.log('- Senha:', senhaGerada);
  
  return window.debugValidacao(userEmail, senhaDigitada, senhaGerada);
};

// Função para verificar se as funções estão disponíveis
window.verificarFuncoes = function() {
  console.log('\n🔍 VERIFICAÇÃO DE FUNÇÕES DISPONÍVEIS');
  console.log('testarListagemOperadores:', typeof window.testarListagemOperadores);
  console.log('debugValidacao:', typeof window.debugValidacao);
  console.log('testarComUsuarioAtual:', typeof window.testarComUsuarioAtual);
};

console.log('\n📋 FUNÇÕES DISPONÍVEIS:');
console.log('- debugValidacao(email, senhaDigitada, senhaGerada)');
console.log('- testarComUsuarioAtual()');
console.log('- verificarFuncoes()');
console.log('- testarListagemOperadores() [se estiver no Dashboard]');

console.log('\n💡 EXEMPLO DE USO:');
console.log('debugValidacao("infra@auraxcred.com.br", "123456", "123456")');

// Auto-verificar funções
window.verificarFuncoes();