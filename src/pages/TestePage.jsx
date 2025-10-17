import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import './PageStyles.css';
import './TestePage.css';

const TestePage = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // Função para verificar operador atual
  const verificarOperadorAtual = async () => {
    try {
      addLog('🔍 VERIFICANDO OPERADOR ATUAL...', 'info');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        addLog('❌ Usuário não logado', 'error');
        return;
      }
      
      addLog(`👤 Usuário logado: ${user.email}`, 'success');
      
      // Buscar dados do operador
      const { data: operador, error } = await supabase
        .from('operadores')
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (error) {
        addLog(`❌ Erro ao buscar operador: ${error.message}`, 'error');
        return;
      }
      
      addLog(`✅ Dados do operador: ${JSON.stringify(operador, null, 2)}`, 'success');
      
      // Verificar se está disponível
      if (operador.status !== 'disponivel') {
        addLog(`⚠️ PROBLEMA: Operador não está com status "disponivel". Status atual: ${operador.status}`, 'warning');
      }
      
      if (!operador.habilitado) {
        addLog('⚠️ PROBLEMA: Operador não está habilitado', 'warning');
      }
      
      if (!operador.online) {
        addLog('⚠️ PROBLEMA: Operador não está online', 'warning');
      }
      
      if (operador.status === 'disponivel' && operador.habilitado && operador.online) {
        addLog('🎉 SUCESSO: Operador está configurado corretamente para receber atendimentos!', 'success');
      }
      
    } catch (error) {
      addLog(`❌ Erro ao verificar operador: ${error.message}`, 'error');
    }
  };

  // Função para verificar se a função existe
  const verificarFuncaoExiste = async () => {
    try {
      addLog('🔍 Verificando se a função existe...', 'info');
      
      const { data, error } = await supabase
        .rpc('distribuir_atendimentos_inteligente');
      
      if (error) {
        if (error.message.includes('Could not find the function')) {
          addLog('❌ Função NÃO existe no banco de dados', 'error');
          addLog('📝 Siga as instruções abaixo para criar a função', 'warning');
        } else {
          addLog(`❌ Erro ao verificar função: ${error.message}`, 'error');
        }
      } else {
        addLog('✅ Função existe e está funcionando!', 'success');
        addLog(`📊 Dados retornados: ${JSON.stringify(data, null, 2)}`, 'info');
      }
    } catch (err) {
      addLog(`❌ Erro na verificação: ${err.message}`, 'error');
    }
  };

  // Função para testar distribuição
  const testarDistribuicao = async () => {
    try {
      addLog('🔍 INICIANDO TESTE DE DISTRIBUIÇÃO INTELIGENTE', 'info');
      
      addLog('1️⃣ Verificando operadores disponíveis...', 'info');
      
      // Buscar operadores disponíveis
      const { data: operadores, error: errorOp } = await supabase
        .from('operadores')
        .select('*')
        .eq('status', 'disponivel')
        .eq('habilitado', true);
      
      if (errorOp) {
        addLog(`❌ Erro ao buscar operadores: ${errorOp.message}`, 'error');
        return;
      }
      
      addLog(`✅ Operadores disponíveis: ${operadores.length}`, 'success');
      
      if (operadores.length === 0) {
        addLog('⚠️ PROBLEMA: Nenhum operador disponível para distribuição!', 'warning');
        addLog('💡 Verifique se há operadores com status="disponivel" e habilitado=true', 'info');
        return;
      }
      
      addLog('2️⃣ Verificando atendimentos na fila...', 'info');
      
      // Buscar atendimentos na fila
      const { data: atendimentosFila, error: errorFila } = await supabase
        .from('atendimentos')
        .select('*')
        .eq('fila_status', 'na_fila')
        .order('fila_prioridade', { ascending: true })
        .order('created_at', { ascending: true });
      
      if (errorFila) {
        addLog(`❌ Erro ao buscar atendimentos na fila: ${errorFila.message}`, 'error');
        return;
      }
      
      addLog(`✅ Atendimentos na fila: ${atendimentosFila.length}`, 'success');
      
      if (atendimentosFila.length === 0) {
        addLog('⚠️ PROBLEMA: Nenhum atendimento na fila para distribuir!', 'warning');
        addLog('💡 Verifique se há atendimentos com fila_status="na_fila"', 'info');
        return;
      }
      
      addLog('3️⃣ Testando função de distribuição...', 'info');
      
      // Testar a função de distribuição
      const { data: resultado, error: errorDist } = await supabase
        .rpc('distribuir_atendimentos_inteligente');
      
      if (errorDist) {
        addLog(`❌ Erro na distribuição: ${errorDist.message}`, 'error');
        
        if (errorDist.message.includes('Could not find the function')) {
          addLog('⚠️ A função distribuir_atendimentos_inteligente não existe!', 'warning');
          addLog('📝 Veja as instruções abaixo para criar a função.', 'info');
        }
        
        return;
      }
      
      addLog(`✅ Resultado da distribuição: ${JSON.stringify(resultado)}`, 'success');
      
      addLog('4️⃣ Verificando atendimentos aguardando...', 'info');
      
      // Verificar se há atendimentos aguardando
      const { data: atendimentosAguardando, error: errorAguardando } = await supabase
        .from('atendimentos')
        .select('*')
        .eq('status', 'aguardando')
        .order('created_at', { ascending: false });
      
      if (errorAguardando) {
        addLog(`❌ Erro ao buscar atendimentos aguardando: ${errorAguardando.message}`, 'error');
        return;
      }
      
      addLog(`✅ Atendimentos aguardando: ${atendimentosAguardando.length}`, 'success');
      
      if (atendimentosAguardando.length === 0) {
        addLog('⚠️ PROBLEMA: Nenhum atendimento com status "aguardando" após distribuição!', 'warning');
        addLog('💡 A função distribuir_atendimentos_inteligente pode não estar funcionando corretamente', 'info');
      } else {
        addLog('🎉 SUCESSO: Distribuição funcionando! Atendimentos foram distribuídos e estão aguardando.', 'success');
      }
      
    } catch (error) {
      addLog(`❌ Erro geral no teste: ${error.message}`, 'error');
    }
  };

  // Função para testar listener
  const testarListener = async () => {
    try {
      addLog('🔍 TESTANDO LISTENER DO SUPABASE...', 'info');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        addLog('❌ Usuário não logado', 'error');
        return;
      }
      
      // Buscar operador
      const { data: operador, error } = await supabase
        .from('operadores')
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (error) {
        addLog(`❌ Erro ao buscar operador: ${error.message}`, 'error');
        return;
      }
      
      addLog(`✅ Configurando listener para operador: ${operador.nome}`, 'success');
      
      // Configurar listener
      const channel = supabase
        .channel(`atendimento_aguardando_${operador.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'atendimentos',
            filter: `operador_id=eq.${operador.id}`
          },
          (payload) => {
            addLog(`🔔 NOTIFICAÇÃO RECEBIDA: ${JSON.stringify(payload)}`, 'success');
            
            if (payload.new.status === 'aguardando') {
              addLog('🎉 SUCESSO: Listener funcionando! Atendimento aguardando detectado.', 'success');
            }
          }
        )
        .subscribe();
      
      addLog('✅ Listener configurado. Agora execute a distribuição para testar...', 'info');
      
      // Limpar listener após 30 segundos
      setTimeout(() => {
        channel.unsubscribe();
        addLog('🔌 Listener desconectado após 30 segundos', 'info');
      }, 30000);
      
    } catch (error) {
      addLog(`❌ Erro ao testar listener: ${error.message}`, 'error');
    }
  };

  const executarTeste = async (tipoTeste) => {
    setIsLoading(true);
    
    switch (tipoTeste) {
      case 'operador':
        await verificarOperadorAtual();
        break;
      case 'funcao':
        await verificarFuncaoExiste();
        break;
      case 'distribuicao':
        await testarDistribuicao();
        break;
      case 'listener':
        await testarListener();
        break;
      case 'completo':
        await verificarOperadorAtual();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await verificarFuncaoExiste();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await testarDistribuicao();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await testarListener();
        break;
    }
    
    setIsLoading(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🧪 Página de Testes - Distribuição Inteligente</h1>
        <p>Execute os testes de forma segura diretamente na aplicação</p>
      </div>

      <div className="page-content">
        <div className="test-buttons">
          <button 
            onClick={() => executarTeste('operador')} 
            disabled={isLoading}
            className="btn btn-primary"
          >
            🔍 Verificar Operador
          </button>
          
          <button 
            onClick={() => executarTeste('funcao')} 
            disabled={isLoading}
            className="btn btn-secondary"
          >
            ⚙️ Verificar Função
          </button>
          
          <button 
            onClick={() => executarTeste('distribuicao')} 
            disabled={isLoading}
            className="btn btn-secondary"
          >
            🎯 Testar Distribuição
          </button>
          
          <button 
            onClick={() => executarTeste('listener')} 
            disabled={isLoading}
            className="btn btn-info"
          >
            🔔 Testar Listener
          </button>
          
          <button 
            onClick={() => executarTeste('completo')} 
            disabled={isLoading}
            className="btn btn-success"
          >
            🚀 Teste Completo
          </button>
          
          <button 
            onClick={clearLogs} 
            disabled={isLoading}
            className="btn btn-warning"
          >
            🗑️ Limpar Logs
          </button>
        </div>

        <div className="logs-container">
          <h3>📋 Logs de Teste</h3>
          <div className="logs">
            {logs.length === 0 ? (
              <p>Nenhum teste executado ainda. Clique em um botão acima para começar.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`log-entry log-${log.type}`}>
                  <span className="log-timestamp">[{log.timestamp}]</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="instructions">
          <h3>📖 Instruções</h3>
          <ol>
            <li><strong>Verificar Operador:</strong> Confirma se seu operador está configurado corretamente</li>
            <li><strong>Verificar Função:</strong> Testa se a função de distribuição existe no banco</li>
            <li><strong>Testar Distribuição:</strong> Executa o processo de distribuição inteligente</li>
            <li><strong>Testar Listener:</strong> Verifica se as notificações em tempo real funcionam</li>
            <li><strong>Teste Completo:</strong> Executa todos os testes em sequência</li>
          </ol>
          
          <div className="function-instructions">
            <h4>🛠️ Como criar a função de distribuição</h4>
            <p>Se a função não existir, execute este SQL no Supabase:</p>
            <pre>
{`CREATE OR REPLACE FUNCTION distribuir_atendimentos_inteligente()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    atendimento_record RECORD;
    operador_record RECORD;
    distribuicoes_realizadas INTEGER := 0;
    resultado json;
BEGIN
    -- Loop através dos atendimentos na fila
    FOR atendimento_record IN 
        SELECT * FROM atendimentos 
        WHERE fila_status = 'na_fila' 
        ORDER BY fila_prioridade ASC, created_at ASC
    LOOP
        -- Buscar operador disponível
        SELECT * INTO operador_record
        FROM operadores 
        WHERE status = 'disponivel' 
        AND habilitado = true 
        AND online = true
        ORDER BY RANDOM() 
        LIMIT 1;
        
        -- Se encontrou operador disponível
        IF FOUND THEN
            -- Atualizar o atendimento
            UPDATE atendimentos 
            SET 
                operador_id = operador_record.id,
                status = 'aguardando',
                fila_status = 'distribuido',
                updated_at = NOW()
            WHERE id = atendimento_record.id;
            
            -- Incrementar contador
            distribuicoes_realizadas := distribuicoes_realizadas + 1;
        END IF;
    END LOOP;
    
    -- Retornar resultado
    resultado := json_build_object(
        'distribuicoes_realizadas', distribuicoes_realizadas,
        'timestamp', NOW()
    );
    
    RETURN resultado;
END;
$$;`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestePage;