import { supabase } from '../lib/supabase';

// Funcao utilitaria para verificar se colunas existem na tabela fila_atendimentos
const verificarColunasFilaAtendimentos = async () => {
  try {
    // Tenta fazer uma query simples para verificar quais colunas existem
    const { data, error } = await supabase
      .from('fila_atendimentos')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Erro ao verificar colunas:', error);
      return {};
    }

    // Se conseguiu buscar, verifica quais colunas existem
    const colunas = data && data.length > 0 ? Object.keys(data[0]) : [];
    
    return {
      temTentativasRejeicao: colunas.includes('tentativas_rejeicao'),
      temDataCriacao: colunas.includes('data_criacao'),
      temDataAtualizacao: colunas.includes('data_atualizacao')
    };
  } catch (error) {
    console.error('Erro ao verificar estrutura da tabela:', error);
    return {};
  }
};

const atendimentosService = {
  // Alias para compatibilidade
  async buscarTodos() {
    return this.listarTodos();
  },

  // Buscar novos atendimentos (aguardando)
  async buscarNovosAtendimentos() {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select(`
          *,
          categorias (
            id,
            nome,
            indice
          ),
          usuarios (
            id,
            nome,
            email,
            telefone
          )
        `)
        .eq('status', 'aguardando')
        .order('data_criacao', { ascending: true });

      if (error) {
        console.error('Erro ao buscar novos atendimentos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro no servico buscarNovosAtendimentos:', error);
      throw error;
    }
  },

  // Listar todos os atendimentos
  async listarTodos() {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select(`
          *,
          categorias (
            id,
            nome,
            indice
          ),
          usuarios (
            id,
            nome,
            email
          ),
          operadores (
            id,
            nome,
            email
          )
        `)
        .order('data_criacao', { ascending: false });

      if (error) {
        console.error('Erro ao listar atendimentos:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro no servico listarTodos:', error);
      return { data: null, error };
    }
  },

  // Buscar atendimento por ID
  async buscarPorId(id) {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select(`
          *,
          categorias (
            id,
            nome,
            indice
          ),
          usuarios (
            id,
            nome,
            email,
            telefone
          ),
          operadores (
            id,
            nome,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar atendimento:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro no servico buscarPorId:', error);
      return { data: null, error };
    }
  },

  // Criar novo atendimento
  async criar(dadosAtendimento) {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .insert([dadosAtendimento])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar atendimento:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro no servico criar:', error);
      return { data: null, error };
    }
  },

  // Atualizar atendimento
  async atualizar(id, dadosAtualizacao) {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .update(dadosAtualizacao)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar atendimento:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro no servico atualizar:', error);
      return { data: null, error };
    }
  },

  // Deletar atendimento
  async deletar(id) {
    try {
      const { error } = await supabase
        .from('atendimentos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar atendimento:', error);
        throw error;
      }

      return { error: null };
    } catch (error) {
      console.error('Erro no servico deletar:', error);
      return { error };
    }
  },

  // Buscar atendimentos por status
  async buscarPorStatus(status) {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select(`
          *,
          categorias (
            id,
            nome,
            indice
          ),
          usuarios (
            id,
            nome,
            email
          ),
          operadores (
            id,
            nome,
            email
          )
        `)
        .eq('status', status)
        .order('data_criacao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar atendimentos por status:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro no servico buscarPorStatus:', error);
      return { data: null, error };
    }
  },

  // Buscar atendimentos por operador
  async buscarPorOperador(operadorId) {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select(`
          *,
          categorias (
            id,
            nome,
            indice
          ),
          usuarios (
            id,
            nome,
            email
          ),
          operadores (
            id,
            nome,
            email
          )
        `)
        .eq('operador_id', operadorId)
        .order('data_criacao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar atendimentos por operador:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro no servico buscarPorOperador:', error);
      return { data: null, error };
    }
  },

  // Buscar atendimentos por usuario
  async buscarPorUsuario(usuarioId) {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select(`
          *,
          categorias (
            id,
            nome,
            indice
          ),
          usuarios (
            id,
            nome,
            email
          ),
          operadores (
            id,
            nome,
            email
          )
        `)
        .eq('usuario_id', usuarioId)
        .order('data_criacao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar atendimentos por usuario:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro no servico buscarPorUsuario:', error);
      return { data: null, error };
    }
  },

  // Buscar atendimentos por categoria
  async buscarPorCategoria(categoriaId) {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select(`
          *,
          categorias (
            id,
            nome,
            indice
          ),
          usuarios (
            id,
            nome,
            email
          ),
          operadores (
            id,
            nome,
            email
          )
        `)
        .eq('categoria_id', categoriaId)
        .order('data_criacao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar atendimentos por categoria:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro no servico buscarPorCategoria:', error);
      return { data: null, error };
    }
  },

  // Contar atendimentos por status
  async contarPorStatus() {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select('status')
        .order('status');

      if (error) {
        console.error('Erro ao contar atendimentos por status:', error);
        throw error;
      }

      // Contar manualmente
      const contadores = {};
      data.forEach(item => {
        contadores[item.status] = (contadores[item.status] || 0) + 1;
      });

      return { data: contadores, error: null };
    } catch (error) {
      console.error('Erro no servico contarPorStatus:', error);
      return { data: null, error };
    }
  },

  // Buscar atendimentos aguardando
  async buscarAguardando() {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select(`
          *,
          categorias (
            id,
            nome,
            indice
          ),
          usuarios (
            id,
            nome,
            email,
            telefone
          )
        `)
        .eq('status', 'aguardando')
        .order('data_criacao', { ascending: true });

      if (error) {
        console.error('Erro ao buscar atendimentos aguardando:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro no servico buscarAguardando:', error);
      return { data: null, error };
    }
  },

  // Buscar atendimentos em andamento
  async buscarEmAndamento() {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select(`
          *,
          categorias (
            id,
            nome,
            indice
          ),
          usuarios (
            id,
            nome,
            email,
            telefone
          ),
          operadores (
            id,
            nome,
            email
          )
        `)
        .eq('status', 'em_andamento')
        .order('data_criacao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar atendimentos em andamento:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro no servico buscarEmAndamento:', error);
      return { data: null, error };
    }
  },

  // Buscar atendimentos finalizados
  async buscarFinalizados() {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select(`
          *,
          categorias (
            id,
            nome,
            indice
          ),
          usuarios (
            id,
            nome,
            email,
            telefone
          ),
          operadores (
            id,
            nome,
            email
          )
        `)
        .eq('status', 'finalizado')
        .order('data_finalizacao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar atendimentos finalizados:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro no servico buscarFinalizados:', error);
      return { data: null, error };
    }
  },

  // Aceitar atendimento
  async aceitarAtendimento(atendimentoId, operadorId) {
    try {
      const { data, error } = await supabase.rpc('aceitar_atendimento', {
        p_atendimento_id: atendimentoId,
        p_operador_id: operadorId
      });

      if (error) {
        console.error('Erro ao aceitar atendimento:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro no servico aceitarAtendimento:', error);
      return { data: null, error };
    }
  },

  // Finalizar atendimento
  async finalizarAtendimento(atendimentoId, observacoes = '') {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .update({
          status: 'finalizado',
          data_finalizacao: new Date().toISOString(),
          observacoes: observacoes
        })
        .eq('id', atendimentoId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao finalizar atendimento:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro no servico finalizarAtendimento:', error);
      return { data: null, error };
    }
  },

  // Transferir atendimento
  async transferirAtendimento(atendimentoId, novoOperadorId, motivo = '') {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .update({
          operador_id: novoOperadorId,
          status: 'transferindo',
          observacoes: motivo
        })
        .eq('id', atendimentoId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao transferir atendimento:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro no servico transferirAtendimento:', error);
      return { data: null, error };
    }
  },

  // Buscar estatisticas
  async buscarEstatisticas() {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select('status, data_criacao, data_finalizacao');

      if (error) {
        console.error('Erro ao buscar estatisticas:', error);
        throw error;
      }

      // Calcular estatisticas
      const total = data.length;
      const aguardando = data.filter(a => a.status === 'aguardando').length;
      const emAndamento = data.filter(a => a.status === 'em_andamento').length;
      const finalizados = data.filter(a => a.status === 'finalizado').length;

      // Calcular tempo medio de atendimento
      const atendimentosFinalizados = data.filter(a => 
        a.status === 'finalizado' && a.data_criacao && a.data_finalizacao
      );

      let tempoMedio = 0;
      if (atendimentosFinalizados.length > 0) {
        const tempoTotal = atendimentosFinalizados.reduce((acc, atendimento) => {
          const inicio = new Date(atendimento.data_criacao);
          const fim = new Date(atendimento.data_finalizacao);
          return acc + (fim - inicio);
        }, 0);
        tempoMedio = tempoTotal / atendimentosFinalizados.length;
      }

      const estatisticas = {
        total,
        aguardando,
        emAndamento,
        finalizados,
        tempoMedioAtendimento: Math.round(tempoMedio / (1000 * 60)) // em minutos
      };

      return { data: estatisticas, error: null };
    } catch (error) {
      console.error('Erro no servico buscarEstatisticas:', error);
      return { data: null, error };
    }
  },

  // Buscar atendimentos nao finalizados
  async buscarNaoFinalizados() {
    try {
      const { data, error } = await supabase
        .from('atendimentos')
        .select(`
          *,
          categorias (
            id,
            nome,
            indice
          ),
          usuarios (
            id,
            nome,
            email,
            telefone
          ),
          operadores (
            id,
            nome,
            email
          )
        `)
        .in('status', ['aguardando', 'em_andamento', 'transferindo'])
        .order('data_criacao', { ascending: true });

      if (error) {
        console.error('Erro ao buscar atendimentos nao finalizados:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro no servico buscarNaoFinalizados:', error);
      return { data: null, error };
    }
  },

  // Rejeitar atendimento aguardando com rotacao melhorada
  async rejeitarAtendimentoAguardando(atendimentoId, operadorId) {
    try {
      console.log('Iniciando rejeicao com rotacao para:', { atendimentoId, operadorId });
      
      // Primeiro, tentar usar a nova funcao de rejeicao com rotacao
      const resultadoRotacao = await this.rejeitarComRotacao(atendimentoId, operadorId);
      
      if (resultadoRotacao.success) {
        console.log('Rejeicao com rotacao bem-sucedida');
        return resultadoRotacao;
      }
      
      console.log('Rotacao nao aplicavel, usando metodo tradicional');
      
      // Se nao conseguir usar rotacao, usar metodo tradicional
      return await this.rejeitarAtendimentoTradicional(atendimentoId);
      
    } catch (error) {
      console.error('Erro no servico rejeitarAtendimentoAguardando:', error);
      return { 
        success: false, 
        error: error.message || 'Erro ao rejeitar atendimento' 
      };
    }
  },

  // Funcao de rejeicao com rotacao - ATUALIZADA para mover operador para final da fila
  async rejeitarComRotacao(atendimentoId, operadorId) {
    try {
      console.log('🔄 Iniciando rejeição com rotação:', { atendimentoId, operadorId });

      // 1. Buscar oferta ativa - verificar múltiplas tabelas possíveis
      let oferta = null;
      let tabelaOferta = null;

      // Tentar ofertas_atendimento primeiro
      const { data: ofertas1, error: ofertaError1 } = await supabase
        .from('ofertas_atendimento')
        .select('*')
        .eq('atendimento_id', atendimentoId)
        .eq('operador_id', operadorId)
        .eq('status', 'pendente')
        .order('data_criacao', { ascending: false })
        .limit(1);

      if (!ofertaError1 && ofertas1 && ofertas1.length > 0) {
        oferta = ofertas1[0];
        tabelaOferta = 'ofertas_atendimento';
        console.log('✅ Oferta encontrada em ofertas_atendimento:', oferta.id);
      } else {
        // Tentar fila_atendimentos
        const { data: ofertas2, error: ofertaError2 } = await supabase
          .from('fila_atendimentos')
          .select('*')
          .eq('atendimento_id', atendimentoId)
          .in('status', ['oferecido', 'pendente'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (!ofertaError2 && ofertas2 && ofertas2.length > 0) {
          oferta = ofertas2[0];
          tabelaOferta = 'fila_atendimentos';
          console.log('✅ Oferta encontrada em fila_atendimentos:', oferta.id);
        }
      }

      if (!oferta) {
        console.log('❌ Nenhuma oferta ativa encontrada');
        return { success: false, error: 'Nenhuma oferta ativa encontrada' };
      }

      // 2. Marcar oferta como rejeitada
      console.log('📝 Marcando oferta como rejeitada...');
      const updateData = { 
        status: 'rejeitado',
        updated_at: new Date().toISOString()
      };

      if (tabelaOferta === 'ofertas_atendimento') {
        updateData.data_resposta = new Date().toISOString();
      }

      const { error: updateOfertaError } = await supabase
        .from(tabelaOferta)
        .update(updateData)
        .eq('id', oferta.id);

      if (updateOfertaError) {
        console.error('❌ Erro ao atualizar oferta:', updateOfertaError);
        return { success: false, error: 'Erro ao atualizar oferta' };
      }

      // 3. MOVER OPERADOR PARA ÚLTIMO LUGAR NA FILA
      console.log('🔄 Movendo operador para último lugar...');
      
      // Buscar todos os operadores habilitados com pos_token válido
      const { data: todosOperadores, error: operadoresError } = await supabase
        .from('operadores')
        .select('id, pos_token, nome')
        .eq('habilitado', true)
        .not('pos_token', 'is', null)
        .order('pos_token', { ascending: true });

      if (operadoresError) {
        console.error('❌ Erro ao buscar operadores:', operadoresError);
        return { success: false, error: 'Erro ao buscar operadores' };
      }

      console.log(`📊 Total de operadores habilitados: ${todosOperadores.length}`);
      
      // Encontrar o operador rejeitante
      const operadorRejeitante = todosOperadores.find(op => op.id === operadorId);
      if (!operadorRejeitante) {
        console.error('❌ Operador rejeitante não encontrado');
        return { success: false, error: 'Operador não encontrado' };
      }

      console.log(`📍 Operador ${operadorRejeitante.nome} está na posição ${operadorRejeitante.pos_token}`);

      // Remover o operador rejeitante da lista
      const outrosOperadores = todosOperadores.filter(op => op.id !== operadorId);
      
      // Reordenar: outros operadores mantêm ordem, rejeitante vai para o final
      const novasPosicoesOperadores = [];
      
      // Primeiro, reordenar os outros operadores em sequência
      outrosOperadores.forEach((operador, index) => {
        novasPosicoesOperadores.push({
          id: operador.id,
          pos_token: index + 1,
          nome: operador.nome
        });
      });
      
      // Adicionar o operador rejeitante no final
      const posicaoFinal = outrosOperadores.length + 1;
      novasPosicoesOperadores.push({
        id: operadorRejeitante.id,
        pos_token: posicaoFinal,
        nome: operadorRejeitante.nome
      });

      console.log(`📍 Movendo ${operadorRejeitante.nome} para posição final: ${posicaoFinal}`);

      // Atualizar todas as posições
      for (const operador of novasPosicoesOperadores) {
        const { error: updateError } = await supabase
          .from('operadores')
          .update({ 
            pos_token: operador.pos_token,
            updated_at: new Date().toISOString()
          })
          .eq('id', operador.id);

        if (updateError) {
          console.error(`❌ Erro ao atualizar operador ${operador.nome}:`, updateError);
          return { success: false, error: `Erro ao atualizar operador ${operador.nome}` };
        }
        
        console.log(`✅ ${operador.nome} → posição ${operador.pos_token}`);
      }

      // 4. Voltar atendimento para status aguardando
      console.log('🔄 Voltando atendimento para aguardando...');
      const { error: updateAtendimentoError } = await supabase
        .from('atendimentos')
        .update({ 
          status: 'aguardando',
          operador_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', atendimentoId);

      if (updateAtendimentoError) {
        console.error('❌ Erro ao atualizar atendimento:', updateAtendimentoError);
        return { success: false, error: 'Erro ao atualizar atendimento' };
      }

      // 5. Garantir que atendimento está na fila_atendimentos como aguardando
      console.log('🔄 Verificando fila de atendimentos...');
      const { data: filaExistente, error: filaError } = await supabase
        .from('fila_atendimentos')
        .select('id, status')
        .eq('atendimento_id', atendimentoId)
        .eq('status', 'aguardando');

      if (filaError) {
        console.error('⚠️ Erro ao verificar fila:', filaError);
      }

      // Se não estiver na fila como aguardando, adicionar
      if (!filaExistente || filaExistente.length === 0) {
        console.log('📝 Adicionando atendimento de volta à fila...');
        const { error: insertFilaError } = await supabase
          .from('fila_atendimentos')
          .insert({
            atendimento_id: atendimentoId,
            status: 'aguardando',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertFilaError) {
          console.error('⚠️ Erro ao inserir na fila (pode já existir):', insertFilaError);
        }
      }

      console.log('✅ Rejeição com rotação concluída com sucesso!');
      console.log(`📍 Operador movido para posição ${posicaoFinal}`);
      
      return { 
        success: true, 
        message: 'Atendimento rejeitado e operador movido para último lugar',
        novaPos: posicaoFinal,
        operadorId: operadorId,
        atendimentoId: atendimentoId
      };

    } catch (error) {
      console.error('❌ Erro na função rejeitarComRotacao:', error);
      return { success: false, error: error.message };
    }
  },

  // Funcao de rejeicao tradicional (fallback)
  async rejeitarAtendimentoTradicional(atendimentoId) {
    try {
      console.log('Usando metodo tradicional de rejeicao para:', atendimentoId);
      
      // Verificar estrutura da tabela
      const estrutura = await verificarColunasFilaAtendimentos();
      
      // Preparar dados para atualizacao
      const dadosAtualizacao = {
        status: 'aguardando'
      };
      
      // Adicionar tentativas_rejeicao se a coluna existir
      if (estrutura.temTentativasRejeicao) {
        // Buscar valor atual
        const { data: filaAtual } = await supabase
          .from('fila_atendimentos')
          .select('tentativas_rejeicao')
          .eq('atendimento_id', atendimentoId)
          .single();
        
        const tentativasAtuais = filaAtual?.tentativas_rejeicao || 0;
        dadosAtualizacao.tentativas_rejeicao = tentativasAtuais + 1;
      }
      
      // Atualizar fila_atendimentos
      const { data, error } = await supabase
        .from('fila_atendimentos')
        .update(dadosAtualizacao)
        .eq('atendimento_id', atendimentoId)
        .select();

      if (error) {
        console.error('Erro ao rejeitar atendimento (tradicional):', error);
        throw error;
      }

      console.log('Rejeicao tradicional concluida');
      return { success: true, data, error: null };
      
    } catch (error) {
      console.error('Erro na funcao rejeitarAtendimentoTradicional:', error);
      return { success: false, data: null, error };
    }
  },

  // Executar distribuicao automatica
  async executarDistribuicaoAutomatica() {
    try {
      const { data, error } = await supabase.rpc('distribuir_atendimentos_automatico');
      
      if (error) {
        console.error('Erro ao executar distribuicao automatica:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Erro no servico executarDistribuicaoAutomatica:', error);
      return { data: null, error };
    }
  },

  // Controle de distribuicao automatica
  distribuicaoInterval: null,

  async iniciarDistribuicaoAutomatica(intervalo = 30000) {
    if (this.distribuicaoInterval) {
      console.log('Distribuicao automatica ja esta ativa');
      return;
    }

    console.log('Iniciando distribuicao automatica...');
    this.distribuicaoInterval = setInterval(async () => {
      try {
        await this.executarDistribuicaoAutomatica();
      } catch (error) {
        console.error('Erro na distribuicao automatica:', error);
      }
    }, intervalo);
  },

  async pararDistribuicaoAutomatica() {
    if (this.distribuicaoInterval) {
      clearInterval(this.distribuicaoInterval);
      this.distribuicaoInterval = null;
      console.log('Distribuicao automatica parada');
    }
  },

  isDistribuicaoAutomaticaAtiva() {
    return this.distribuicaoInterval !== null;
  }
};

export { atendimentosService };
export default atendimentosService;