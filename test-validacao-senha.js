/**
 * Script de teste para validar a funcionalidade de habilitação de atendimento
 * Este script deve ser executado no console do navegador na página do Dashboard
 */

// Função de teste que pode ser executada no console do navegador
window.testarValidacaoSenha = async function() {
  console.log('🧪 ========================================');
  console.log('🧪 INICIANDO TESTES DE VALIDAÇÃO DE SENHA');
  console.log('🧪 ========================================');
  
  // Verificar se estamos na página correta
  if (!window.location.pathname.includes('dashboard') && !window.location.pathname === '/') {
    console.error('❌ Execute este teste na página do Dashboard');
    return;
  }
  
  // Verificar se as funções estão disponíveis
  if (typeof validarSenhaEHabilitar === 'undefined') {
    console.error('❌ Função validarSenhaEHabilitar não encontrada');
    console.log('💡 Certifique-se de que o serviço foi importado corretamente');
    return;
  }
  
  try {
    console.log('\n🧪 Teste 1: Verificando usuário logado...');
    const userEmail = 'joao.silva@aurax.com'; // Email de teste
    console.log('✅ Email do usuário:', userEmail);
    
    console.log('\n🧪 Teste 2: Testando validação com senha correta...');
    const senhaGerada = '123456';
    const senhaCorreta = '123456';
    
    console.log('🔐 Senha gerada:', senhaGerada);
    console.log('🔐 Senha digitada:', senhaCorreta);
    
    // Este teste seria executado quando o usuário clicar em "Habilitar"
    console.log('✅ Teste preparado - clique no botão "Habilitar Atendimento" para testar');
    
    console.log('\n🧪 Teste 3: Instruções para teste manual...');
    console.log('1. Execute testarListagem() para verificar políticas do Supabase');
    console.log('2. Clique no botão "Habilitar Atendimento"');
    console.log('3. Digite a senha exibida na modal');
    console.log('4. Clique em "Habilitar"');
    console.log('5. Verifique os logs no console');
    console.log('6. Teste com senha incorreta para validar rejeição');
    console.log('7. Verifique se o atendimento foi habilitado (mesmo com operador inativo)');
    
    console.log('\n✅ ========================================');
    console.log('✅ SCRIPT DE TESTE CARREGADO COM SUCESSO');
    console.log('✅ Execute os testes manuais conforme instruções');
    console.log('✅ ========================================');
    
  } catch (error) {
    console.error('❌ ========================================');
    console.error('❌ ERRO DURANTE EXECUÇÃO DOS TESTES');
    console.error('❌ ========================================');
    console.error(error);
  }
};

// Função para testar listagem de operadores
window.testarListagem = function() {
  console.log('\n=== TESTE DE LISTAGEM DE OPERADORES ===');
  
  if (typeof window.testarListagemOperadores === 'function') {
    console.log('🔄 Executando listagem de operadores...');
    window.testarListagemOperadores()
      .then(operadores => {
        console.log('✅ LISTAGEM CONCLUÍDA:');
        console.log('📊 Total de operadores:', operadores?.length || 0);
        operadores?.forEach(op => {
          console.log(`👤 ${op.nome} (${op.email}) - Status: ${op.status} - Habilitado: ${op.habilitado}`);
        });
      })
      .catch(error => {
        console.error('❌ ERRO NA LISTAGEM:', error);
      });
  } else {
    console.log('❌ Função testarListagemOperadores não encontrada. Certifique-se de estar no Dashboard.');
  }
};

// Função para simular teste de validação (para uso no console)
window.simularValidacao = function(senhaDigitada, senhaGerada = '123456') {
  console.log('🧪 Simulando validação de senha...');
  console.log('🔐 Senha digitada:', senhaDigitada);
  console.log('🔐 Senha gerada:', senhaGerada);
  
  if (senhaDigitada === senhaGerada) {
    console.log('✅ Senha correta - validação passaria');
    console.log('ℹ️ NOTA: Status do operador NÃO é mais verificado aqui (será no login)');
    return true;
  } else {
    console.log('❌ Senha incorreta - validação falharia');
    return false;
  }
};

// Função para verificar logs de validação
window.verificarLogs = function() {
  console.log('🔍 Verificando logs de validação...');
  console.log('📋 Procure por logs com os seguintes prefixos:');
  console.log('   🔐 [Dashboard] - Logs do componente Dashboard');
  console.log('   🔐 [operadoresService] - Logs do serviço de operadores');
  console.log('   ⏰ [AuthContext] - Logs do contexto de autenticação');
  console.log('   ℹ️ [operadoresService] Status será verificado no login');
  console.log('   ✅ - Operações bem-sucedidas');
  console.log('   ❌ - Erros e falhas');
  console.log('   🔄 - Operações em andamento');
};

// Instruções de uso
console.log('📋 ========================================');
console.log('📋 SCRIPT DE TESTE CARREGADO');
console.log('📋 ========================================');
console.log('📋 Funções disponíveis no console:');
console.log('📋 - testarValidacaoSenha() - Executa testes básicos');
console.log('📋 - testarListagem() - Lista todos os operadores');
console.log('📋 - simularValidacao(senha) - Simula validação');
console.log('📋 - verificarLogs() - Mostra guia de logs');
console.log('📋 ========================================');
console.log('🔍 IMPORTANTE: Agora apenas a senha é validada, status será verificado no login.');

// Auto-executar teste básico
if (typeof window !== 'undefined') {
  setTimeout(() => {
    window.testarValidacaoSenha();
    window.testarListagem();
  }, 1000);
}