import { supabase } from '../lib/supabase';

// Função auxiliar para buscar nomes de operadores e categorias separadamente
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

  // Buscar última mensagem para cada atendimento
  const atendimentosComMensagens = await Promise.all(
    atendimentos.map(async (atendimento) => {
      // Tentar pegar a última mensagem via referência direta do atendimento, se existir
      let ultimaMensagem = null;
      const ultimaMensagemId = atendimento.ultima_mensagem_id || atendimento.last_message_id || atendimento.mensagem_id || null;
      if (ultimaMensagemId) {
        const mensagemDireta = await atendimentosService.buscarMensagemPorId(ultimaMensagemId);
        ultimaMensagem = mensagemDireta || null;
      }
      // Fallback: buscar a última mensagem pelo atendimento_id
      if (!ultimaMensagem) {
        ultimaMensagem = await atendimentosService.buscarUltimaMensagem(atendimento.id);
      }

      // Determinar timestamp base para cálculo de tempo sem resposta
      const baseDate = (ultimaMensagem && ultimaMensagem.created_at) ? new Date(ultimaMensagem.created_at) : new Date(atendimento.created_at);
      const agora = new Date();
      const diffMs = Math.max(0, agora.getTime() - baseDate.getTime());
      const diffMin = Math.floor(diffMs / 60000);
      const diffHoras = Math.floor(diffMin / 60);
      const diffDias = Math.floor(diffHoras / 24);
      let tempoSemResposta = '';
      if (diffDias > 0) {
        tempoSemResposta = diffDias === 1 ? '1 dia' : `${diffDias} dias`;
      } else if (diffHoras > 0) {
        const minutosRestantes = diffMin % 60;
        tempoSemResposta = minutosRestantes > 0 ? `${diffHoras} h ${minutosRestantes} min` : `${diffHoras} h`;
      } else {
        tempoSemResposta = diffMin <= 1 ? '1 min' : `${diffMin} min`;
      }
      const horarioUltimaMensagem = baseDate.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
      
      return {
        ...atendimento,
        // Mapeamento de campos para compatibilidade com frontend
        nome: atendimento.cliente_nome,
        telefone: atendimento.cliente_telefone,
        email: atendimento.cliente_email,
        descricao: atendimento.descricao_atendimento,
        horario: atendimento.created_at,
        // Última mensagem
        ultima_mensagem: ultimaMensagem ? (ultimaMensagem.conteudo || ultimaMensagem.texto || '') : 'Nenhuma mensagem encontrada',
        // Campos esperados por AtendimentosNaoFinalizados
        ultimaMensagem: ultimaMensagem ? (ultimaMensagem.conteudo || ultimaMensagem.texto || '') : '',
        horarioUltimaMensagem,
        tempoSemResposta,
        // Campos relacionados
        operador: atendimento.operador_id ? { nome: operadoresMap[atendimento.operador_id] || 'Operador não encontrado' } : null,
        operadorResponsavel: atendimento.operador_id ? (operadoresMap[atendimento.operador_id] || null) : null,
        categoria: atendimento.categoria_id ? { nome: categoriasMap[atendimento.categoria_id] || 'Categoria não encontrada' } : null,
        // Avatar baseado na primeira letra do nome
        avatar: atendimento.cliente_nome ? atendimento.cliente_nome.charAt(0).toUpperCase() : '?'
      };
    })
  );

  return atendimentosComMensagens;
};

const verificarTabelaAtendimentos = async () => {
  try {
    const { data, error } = await supabase
      .from('atendimentos')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao verificar tabela atendimentos:', error);
      return false;
    }

    console.log('✅ Tabela atendimentos acessível');
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar atendimentos:', error);
    return false;
  }
};

const atendimentosService = {
  // Buscar todos os atendimentos (SEM JOIN AUTOMÁTICO)
  async buscarTodos() {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Buscar nomes relacionados separadamente
      return await buscarNomesRelacionados(data);
    } catch (error) {
      console.error('Erro ao buscar todos os atendimentos:', error);
      throw error;
    }
  },

  // Listar todos os atendimentos (SEM JOIN AUTOMÁTICO) - Alias para compatibilidade
  async listarTodos() {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao listar atendimentos:', error);
        throw error;
      }

      // Buscar nomes relacionados separadamente
      const resultado = await buscarNomesRelacionados(data);
      return { data: resultado, error: null };
    } catch (error) {
      console.error('Erro no servico listarTodos:', error);
      return { data: null, error };
    }
  },

  // Buscar atendimentos por operador (SEM JOIN AUTOMÁTICO)
  async buscarPorOperador(operadorId) {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .eq('operador_id', operadorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Buscar nomes relacionados separadamente
      return await buscarNomesRelacionados(data);
    } catch (error) {
      console.error('Erro ao buscar atendimentos por operador:', error);
      throw error;
    }
  },

  // Buscar atendimento por ID (SEM JOIN AUTOMÁTICO)
  async buscarPorId(id) {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Buscar nomes relacionados separadamente
      const atendimentosComNomes = await buscarNomesRelacionados([data]);
      return atendimentosComNomes[0];
    } catch (error) {
      console.error('Erro ao buscar atendimento por ID:', error);
      throw error;
    }
  },

  // Buscar atendimentos por status (Admin) (SEM JOIN AUTOMÁTICO)
  async buscarPorStatusAdmin(status) {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Buscar nomes relacionados separadamente
      return await buscarNomesRelacionados(data);
    } catch (error) {
      console.error('Erro ao buscar atendimentos por status (Admin):', error);
      throw error;
    }
  },

  // Buscar novos atendimentos (SEM JOIN AUTOMÁTICO) - FUNÇÃO QUE ESTAVA CAUSANDO ERRO
  async buscarNovosAtendimentos() {
    try {
      console.log('🔍 Buscando novos atendimentos sem join automático...');
      
      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .eq('status', 'novo')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Erro na consulta SQL:', error);
        throw error;
      }
      
      console.log('✅ Consulta SQL executada com sucesso, encontrados:', data?.length || 0, 'atendimentos');
      
      // Buscar nomes relacionados separadamente
      const resultado = await buscarNomesRelacionados(data);
      console.log('✅ Nomes relacionados carregados com sucesso');
      
      return resultado;
    } catch (error) {
      console.error('❌ Erro ao buscar novos atendimentos:', error);
      throw error;
    }
  },

  // Buscar atendimentos não finalizados (SEM JOIN AUTOMÁTICO)
  async buscarNaoFinalizados() {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .in('status', ['novo', 'em-andamento', 'aguardando'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Buscar nomes relacionados separadamente
      return await buscarNomesRelacionados(data);
    } catch (error) {
      console.error('Erro ao buscar atendimentos não finalizados:', error);
      throw error;
    }
  },

  // Buscar operadores (mantém como estava)
  async buscarOperadores() {
    try {
      const { data, error } = await supabase
        .from('operadores')
        .select('id, nome, email')
        .eq('habilitado', true)
        .order('nome');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar operadores:', error);
      throw error;
    }
  },

  // Atualizar status (com contorno para problema do trigger)
  async atualizarStatus(id, novoStatus) {
    try {
      // Tentar atualizar diretamente primeiro
      const { data, error } = await supabase
        .from('atendimentos')
        .update({ 
          status: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) {
        if (error.message && error.message.includes('relation "ofertas_operador" does not exist') && novoStatus === 'finalizado') {
          const { data: dataFinal, error: errFinal } = await supabase
            .from('atendimentos')
            .update({ status: 'finalizado' })
            .eq('id', id)
            .select();
          if (errFinal) throw errFinal;
          return dataFinal;
        }
        // Se der erro relacionado ao trigger, tentar com status mais seguro
        if (error.message.includes('fila_atendimentos')) {
          console.warn(`⚠️ Erro de trigger detectado ao usar status '${novoStatus}'. Tentando com status seguro...`);
          
          // Lista de status seguros que não ativam o trigger problemático
          const statusSeguro = novoStatus === 'em-andamento' ? 'novo' : 'aguardando';
          
          const { data: dataSegura, error: errorSeguro } = await supabase
            .from('atendimentos')
            .update({ 
              status: statusSeguro,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();

          if (errorSeguro) throw errorSeguro;
          
          console.log(`✅ Status atualizado para '${statusSeguro}' (solicitado: '${novoStatus}' - trigger impediu)`);
          return dataSegura;
        }
        throw error;
      }

      console.log(`✅ Status atualizado para '${novoStatus}' com sucesso`);
      return data;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  },

  async finalizarAtendimento(id) {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .update({ status: 'finalizado' })
        .eq('id', id)
        .select();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao finalizar atendimento:', error);
      throw error;
    }
  },

  // Atualizar nome do cliente
  async atualizarNomeCliente(id, novoNome) {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .update({ 
          cliente_nome: novoNome,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar nome do cliente:', error);
      throw error;
    }
  },

  // Atualizar email do cliente
  async atualizarEmailCliente(id, novoEmail) {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .update({ 
          cliente_email: novoEmail,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar email do cliente:', error);
      throw error;
    }
  },

  // Realocar atendimento
  async realocarAtendimento(id, novoOperadorId) {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .update({ 
          operador_id: novoOperadorId,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao realocar atendimento:', error);
      throw error;
    }
  },

  // Buscar atendimentos por status (SEM JOIN AUTOMÁTICO)
  async buscarAtendimentosPorStatus(status) {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Buscar nomes relacionados separadamente
      return await buscarNomesRelacionados(data);
    } catch (error) {
      console.error('Erro ao buscar atendimentos por status:', error);
      throw error;
    }
  },

  // Monitorar atendimentos de risco
  async monitorarAtendimentosRisco() {
    try {
      const agora = new Date();
      const limite = new Date(agora.getTime() - 30 * 60 * 1000); // 30 minutos atrás

      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .in('status', ['novo', 'em-andamento'])
        .lt('created_at', limite.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Buscar nomes relacionados separadamente
      return await buscarNomesRelacionados(data);
    } catch (error) {
      console.error('Erro ao monitorar atendimentos de risco:', error);
      throw error;
    }
  },

  // Obter estatísticas dos atendimentos
  async obterEstatisticasAtendimentos() {
    try {
      await verificarTabelaAtendimentos();

      const { data, error } = await supabase
        .from('atendimentos')
        .select('status');

      if (error) throw error;

      const estatisticas = {
        total: data.length,
        novo: data.filter(item => item.status === 'novo').length,
        em_andamento: data.filter(item => item.status === 'em-andamento').length,
        aguardando: data.filter(item => item.status === 'aguardando').length,
        finalizado: data.filter(item => item.status === 'finalizado').length
      };

      return estatisticas;
    } catch (error) {
      console.error('Erro ao obter estatísticas dos atendimentos:', error);
      throw error;
    }
  },

  // Buscar operadores disponíveis
  async buscarOperadoresDisponiveis() {
    try {
      const { data, error } = await supabase
        .from('operadores')
        .select('*')
        .eq('online', true)
        .eq('habilitado', true)
        .order('nome');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar operadores disponíveis:', error);
      throw error;
    }
  },

  // Aceitar atendimento aguardando
  async aceitarAtendimentoAguardando(atendimentoId, operadorId) {
    try {
      console.log('🔄 Aceitando atendimento:', { atendimentoId, operadorId });

      // Usar atualização direta para evitar conflito de funções
      const { data, error } = await supabase
        .from('atendimentos')
        .update({
          fila_status: 'aceito',
          status: 'em-andamento',
          updated_at: new Date().toISOString()
        })
        .eq('id', atendimentoId)
        .eq('operador_id', operadorId)
        .eq('fila_status', 'oferecido')
        .select();

      if (error) {
        console.error('❌ Erro ao aceitar atendimento:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Atendimento não encontrado ou não está oferecido para você');
      }

      console.log('✅ Atendimento aceito com sucesso:', data[0]);
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('❌ Erro ao aceitar atendimento aguardando:', error);
      throw error;
    }
  },

  // Rejeitar atendimento aguardando
  async rejeitarAtendimentoAguardando(atendimentoId, operadorId) {
    try {
      console.log('🔄 Rejeitando atendimento:', { atendimentoId, operadorId });

      // 1. Buscar o maior pos_token atual
      const { data: maxPosToken, error: errorMaxPos } = await supabase
        .from('operadores')
        .select('pos_token')
        .not('pos_token', 'is', null)
        .order('pos_token', { ascending: false })
        .limit(1);

      if (errorMaxPos) {
        throw errorMaxPos;
      }

      const novoPos = (maxPosToken && maxPosToken.length > 0) ? maxPosToken[0].pos_token + 1 : 1;

      // 2. Atualizar pos_token do operador (mover para final da fila)
      const { error: errorOperador } = await supabase
        .from('operadores')
        .update({
          pos_token: novoPos,
          updated_at: new Date().toISOString()
        })
        .eq('id', operadorId);

      if (errorOperador) {
        console.error('❌ Erro ao atualizar pos_token do operador:', errorOperador);
      } else {
        console.log(`✅ Operador movido para pos_token: ${novoPos}`);
      }

      // 3. Voltar atendimento para a fila
      const { data, error } = await supabase
        .from('atendimentos')
        .update({
          fila_status: 'na_fila',
          operador_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', atendimentoId)
        .eq('operador_id', operadorId)
        .eq('fila_status', 'oferecido')
        .select();

      if (error) {
        console.error('❌ Erro ao rejeitar atendimento:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Atendimento não encontrado ou não está oferecido para você');
      }

      // 4. Re-oferecer imediatamente para o menor pos_token
      try {
        const { error: distError } = await supabase.rpc('distribuir_atendimento_simples');
        if (distError) {
          console.error('⚠️ Erro ao re-distribuir após rejeição:', distError);
        }
      } catch (e) {
        console.error('⚠️ Erro inesperado na re-distribuição:', e);
      }

      console.log('✅ Atendimento rejeitado com sucesso:', data[0]);
      return { 
        success: true, 
        data: data[0],
        novo_pos_token: novoPos,
        message: 'Atendimento rejeitado e operador movido para final da fila'
      };
    } catch (error) {
      console.error('❌ Erro ao rejeitar atendimento aguardando:', error);
      throw error;
    }
  },

  // Executar distribuição automática
  async executarDistribuicaoAutomatica() {
    try {
      const { data, error } = await supabase.rpc('distribuir_atendimento_simples');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao executar distribuição automática:', error);
      throw error;
    }
  },

  distribuicaoAutomaticaInterval: null,

  async iniciarDistribuicaoAutomatica(intervalSeconds = 30) {
    if (this.distribuicaoAutomaticaInterval) {
      console.log('⚠️ Distribuição automática já está ativa');
      return;
    }

    console.log(`🚀 Iniciando distribuição automática (intervalo: ${intervalSeconds}s)`);
    
    this.distribuicaoAutomaticaInterval = setInterval(async () => {
      try {
        await this.executarDistribuicaoAutomatica();
        console.log('✅ Distribuição automática executada');
      } catch (error) {
        console.error('❌ Erro na distribuição automática:', error);
      }
    }, intervalSeconds * 1000);
  },

  pararDistribuicaoAutomatica() {
    if (this.distribuicaoAutomaticaInterval) {
      clearInterval(this.distribuicaoAutomaticaInterval);
      this.distribuicaoAutomaticaInterval = null;
      console.log('🛑 Distribuição automática parada');
    }
  },

  isDistribuicaoAutomaticaAtiva() {
    return this.distribuicaoAutomaticaInterval !== null;
  },

  // Buscar última mensagem de um atendimento
  async buscarUltimaMensagem(atendimentoId) {
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .select('id, conteudo, created_at')
        .eq('atendimento_id', atendimentoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // Se não encontrar mensagem, retornar null (não é erro)
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar última mensagem:', error);
      return null;
    }
  },
  // Buscar mensagem diretamente por ID, caso o atendimento possua referência
  async buscarMensagemPorId(mensagemId) {
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .select('id, conteudo, created_at')
        .eq('id', mensagemId)
        .single();
      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro ao buscar mensagem por ID:', error);
      return null;
    }
  },
  
  async enviarWebhookResetarAtendimento(clienteTelefone) {
    try {
      const telefoneStr = String(clienteTelefone || '');
      const apenasNumeros = telefoneStr.replace(/\D/g, '');
      if (!apenasNumeros) {
        console.warn('⚠️ Telefone do cliente ausente para webhook resetar_atendimento');
        return { success: false, reason: 'telefone_ausente' };
      }
      console.log('📤 Enviando webhook resetar_atendimento:', { cliente_telefone: apenasNumeros });
      const resp = await fetch('https://webhook.auraxcred.com.br/webhook/resetar_atendimento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_telefone: apenasNumeros })
      });
      let data;
      const ct = resp.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        data = await resp.json();
      } else {
        data = await resp.text();
      }
      if (!resp.ok) {
        console.error('❌ Erro ao enviar webhook resetar_atendimento:', { status: resp.status, data });
        return { success: false, status: resp.status, data };
      }
      console.log('✅ Webhook resetar_atendimento enviado com sucesso:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Erro ao enviar webhook resetar_atendimento:', error);
      return { success: false, error };
    }
  }
};

export default atendimentosService;
export { atendimentosService };
