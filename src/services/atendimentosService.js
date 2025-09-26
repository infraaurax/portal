import { supabase } from '../lib/supabase';
// etapasService removido - funcionalidade de Gerenciamento de Etapas foi removida

export const atendimentosService = {
  // Buscar todos os atendimentos com dados relacionados
  async buscarTodos() {
    try {
      console.log('🔍 Buscando atendimentos no banco de dados...');
      
      // Buscar atendimentos sem JOIN com operadores (tabela não existe)
      // Filtrar apenas os status permitidos no dashboard: pausado, aguardando, finalizado, abandonado, nao_atendido, em-andamento
      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .in('status', ['pausado', 'aguardando', 'finalizado', 'abandonado', 'nao_atendido', 'em-andamento'])
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar atendimentos via tabela:', error);
        console.error('📋 Detalhes do erro SQL:', error.message);
        throw error;
      }

      console.log('📊 Dados brutos do banco:', data);
      console.log('📈 Quantidade de registros encontrados:', data?.length || 0);

      // Para cada atendimento, buscar a última mensagem
      const atendimentosComMensagens = await Promise.all(
        (data || []).map(async (atendimento) => {
          console.log('🔄 Processando atendimento:', atendimento.id);
          
          // Buscar última mensagem do atendimento
          const { data: ultimaMensagem } = await supabase
            .from('mensagens')
            .select('conteudo, created_at')
            .eq('atendimento_id', atendimento.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            id: atendimento.id,
            codigo: atendimento.codigo,
            nome: atendimento.cliente_nome || `Cliente ${atendimento.codigo}`,
            telefone: atendimento.cliente_telefone || '',
            email: atendimento.cliente_email || '',
            avatar: this.gerarAvatar(atendimento.cliente_nome || `Cliente ${atendimento.codigo}`),
            ultima_mensagem: ultimaMensagem?.conteudo || atendimento.ultima_mensagem || 'Sem mensagens',
            horario: ultimaMensagem?.created_at 
              ? new Date(ultimaMensagem.created_at).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
              : new Date(atendimento.created_at).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }),
            status: atendimento.status,
            status_texto: this.formatarStatusTexto(atendimento.status),
            prioridade: atendimento.prioridade,
            online: false, // Campo não disponível, assumir offline
            ativo: !!atendimento.operador_id,
            operador_id: atendimento.operador_id,
            operador_nome: null, // Tabela operadores não existe
            categoria_id: atendimento.categoria_id,
            data_inicio: atendimento.data_inicio,
            data_fim: atendimento.data_fim,
            descricao: atendimento.descricao_atendimento,
            created_at: atendimento.created_at,
            updated_at: atendimento.updated_at
          };
        })
      );

      console.log('✅ Atendimentos formatados com mensagens:', atendimentosComMensagens);
      return atendimentosComMensagens;
    } catch (error) {
      console.error('❌ Erro no serviço buscarTodos:', error);
      console.error('📋 Stack trace:', error.stack);
      throw error;
    }
  },

  // Função auxiliar para gerar avatar
  gerarAvatar(nome) {
    if (!nome) return 'C';
    const palavras = nome.split(' ');
    if (palavras.length >= 2) {
      return (palavras[0][0] + palavras[1][0]).toUpperCase();
    }
    return nome[0].toUpperCase();
  },

  // Função auxiliar para formatar status
  formatarStatusTexto(status) {
    const statusMap = {
      'novo': 'Novo',
      'em-andamento': 'Em andamento',
      'aguardando': 'Aguardando',
      'pausado': 'Pausado',
      'finalizado': 'Finalizado',
      'abandonado': 'Abandonado',
      'nao_atendido': 'Não Atendido'
    };
    return statusMap[status] || 'Desconhecido';
  },

  // Buscar atendimento por ID com dados relacionados
  async buscarPorId(id) {
    try {
      const { data, error } = await supabase
        .rpc('get_atendimento_by_id', { p_id: id });

      if (error) {
        console.error('Erro ao buscar atendimento por ID via SQL:', error);
        throw error;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Erro no serviço buscarPorId:', error);
      throw error;
    }
  },

  // Buscar atendimentos por status
  async buscarPorStatus(status) {
    try {
      const { data, error } = await supabase
        .rpc('get_atendimentos_by_status', { p_status: status });

      if (error) {
        console.error('Erro ao buscar atendimentos por status via SQL:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro no serviço buscarPorStatus:', error);
      throw error;
    }
  },

  // Buscar atendimentos por status específico (para Admin)
  async buscarPorStatusAdmin(status) {
    try {
      console.log(`🔍 [Admin] Buscando atendimentos com status: ${status}`);
      
      // Buscar atendimentos com o status específico, independente do operador
      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .eq('status', status)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar atendimentos por status (Admin):', error);
        throw error;
      }

      console.log(`📊 [Admin] Atendimentos encontrados com status "${status}":`, data?.length || 0);

      // Para cada atendimento, buscar a última mensagem
      const atendimentosComMensagens = await Promise.all(
        (data || []).map(async (atendimento) => {
          console.log('🔄 [Admin] Processando atendimento:', atendimento.id);
          
          // Buscar última mensagem do atendimento
          const { data: ultimaMensagem } = await supabase
            .from('mensagens')
            .select('conteudo, created_at')
            .eq('atendimento_id', atendimento.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            id: atendimento.id,
            codigo: atendimento.codigo,
            nome: atendimento.cliente_nome || `Cliente ${atendimento.codigo}`,
            telefone: atendimento.cliente_telefone || '',
            email: atendimento.cliente_email || '',
            avatar: this.gerarAvatar(atendimento.cliente_nome || `Cliente ${atendimento.codigo}`),
            ultima_mensagem: ultimaMensagem?.conteudo || atendimento.ultima_mensagem || 'Sem mensagens',
            horario: ultimaMensagem?.created_at 
              ? new Date(ultimaMensagem.created_at).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
              : new Date(atendimento.created_at).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }),
            status: atendimento.status,
            status_texto: this.formatarStatusTexto(atendimento.status),
            prioridade: atendimento.prioridade,
            online: false, // Campo não disponível, assumir offline
            ativo: !!atendimento.operador_id,
            operador_id: atendimento.operador_id,
            operador_nome: null, // Tabela operadores não existe
            categoria_id: atendimento.categoria_id,
            data_inicio: atendimento.data_inicio,
            data_fim: atendimento.data_fim,
            descricao: atendimento.descricao_atendimento,
            created_at: atendimento.created_at,
            updated_at: atendimento.updated_at
          };
        })
      );

      console.log(`✅ [Admin] Atendimentos processados com status "${status}":`, atendimentosComMensagens.length);
      return atendimentosComMensagens;
    } catch (error) {
      console.error('❌ Erro no serviço buscarPorStatusAdmin:', error);
      throw error;
    }
  },


  // Buscar conversas de um atendimento
  async buscarConversas(atendimentoId) {
    try {
      const { data, error } = await supabase
        .rpc('get_conversas_atendimento', { p_atendimento_id: atendimentoId });

      if (error) {
        console.error('Erro ao buscar conversas via SQL:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro no serviço buscarConversas:', error);
      throw error;
    }
  },

  // Buscar atendimentos não finalizados (nao_atendido, pausado, abandonado)
  async buscarNaoFinalizados() {
    try {
      console.log('🔍 Buscando atendimentos não finalizados...');
      
      // Buscar atendimentos com status de não finalizados (sem JOIN)
      const { data: atendimentos, error } = await supabase
        .from('atendimentos')
        .select('*')
        .in('status', ['nao_atendido', 'pausado', 'abandonado'])
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar atendimentos não finalizados:', error);
        throw error;
      }

      console.log('📊 Atendimentos não finalizados encontrados:', atendimentos?.length || 0);

      if (!atendimentos || atendimentos.length === 0) {
        console.log('ℹ️ Nenhum atendimento não finalizado encontrado');
        return [];
      }

      // Processar cada atendimento e verificar se pausados devem ser marcados como abandonados
      const atendimentosProcessados = await Promise.all(
        atendimentos.map(async (atendimento) => {
          let statusFinal = atendimento.status;
          
          console.log(`🔄 Processando atendimento ${atendimento.codigo} (${atendimento.status})`);
          
          // Verificar se atendimento pausado deve ser marcado como abandonado (>40min)
          if (atendimento.status === 'pausado') {
            const agora = new Date();
            const ultimaAtualizacao = new Date(atendimento.updated_at);
            const diferencaMinutos = (agora - ultimaAtualizacao) / (1000 * 60);
            
            console.log(`⏱️ Atendimento ${atendimento.codigo} pausado há ${Math.round(diferencaMinutos)} minutos`);
            
            if (diferencaMinutos > 40) {
              console.log(`⏰ Atendimento ${atendimento.codigo} pausado há ${Math.round(diferencaMinutos)} min - marcando como abandonado`);
              statusFinal = 'abandonado';
              
              // Atualizar no banco de dados
              try {
                await this.atualizarStatus(atendimento.id, 'abandonado');
              } catch (updateError) {
                console.error(`❌ Erro ao atualizar status do atendimento ${atendimento.codigo}:`, updateError);
                // Continuar mesmo se não conseguir atualizar o status
              }
            }
          }

          // Buscar última mensagem separadamente para evitar problemas de JOIN
          let ultimaMensagem = null;
          let dataParaCalculoTempo = atendimento.updated_at; // Fallback para updated_at
          
          try {
            const { data: mensagens, error: mensagemError } = await supabase
              .from('mensagens')
              .select('id, conteudo, created_at, remetente_tipo')
              .eq('atendimento_id', atendimento.id)
              .order('created_at', { ascending: false })
              .limit(1);

            if (mensagemError) {
              console.warn(`⚠️ Erro ao buscar mensagens para atendimento ${atendimento.codigo}:`, mensagemError);
            } else if (mensagens && mensagens.length > 0) {
              ultimaMensagem = mensagens[0];
              // Usar a data/hora da última mensagem para calcular tempo sem resposta
              dataParaCalculoTempo = ultimaMensagem.created_at;
              console.log(`📧 Última mensagem do atendimento ${atendimento.codigo}:`, {
                id: ultimaMensagem.id,
                tipo: ultimaMensagem.remetente_tipo,
                data: ultimaMensagem.created_at,
                conteudo: ultimaMensagem.conteudo?.substring(0, 50) + '...'
              });
            } else {
              console.log(`📭 Nenhuma mensagem encontrada para atendimento ${atendimento.codigo}, usando updated_at do atendimento`);
            }
          } catch (msgError) {
            console.warn(`⚠️ Erro ao buscar mensagens para atendimento ${atendimento.codigo}:`, msgError);
          }

          // Calcular tempo sem resposta baseado na última mensagem (ou updated_at como fallback)
          const tempoSemResposta = this.calcularTempoSemResposta(dataParaCalculoTempo);
          
          console.log(`⏰ Tempo sem resposta para ${atendimento.codigo}:`, {
            baseadoEm: ultimaMensagem ? 'última mensagem' : 'updated_at do atendimento',
            dataReferencia: dataParaCalculoTempo,
            tempoCalculado: tempoSemResposta.texto,
            minutos: tempoSemResposta.minutos
          });

          // Usar prioridade do banco ou determinar baseada no tempo
          const prioridade = atendimento.prioridade || this.determinarPrioridade(tempoSemResposta.minutos);

          const atendimentoProcessado = {
            id: atendimento.id,
            codigo: atendimento.codigo,
            nome: atendimento.cliente_nome || `Cliente ${atendimento.codigo}`,
            telefone: atendimento.cliente_telefone || '',
            email: atendimento.cliente_email || '',
            avatar: this.gerarAvatar(atendimento.cliente_nome || `Cliente ${atendimento.codigo}`),
            status: statusFinal,
            statusTexto: this.formatarStatusTexto(statusFinal),
            operadorResponsavel: 'Não atribuído', // Removido operador_nome que não existe
            operadorId: atendimento.operador_id,
            ultimaMensagem: ultimaMensagem?.conteudo || 'Sem mensagens',
            tempoSemResposta: tempoSemResposta.texto,
            tempoSemRespostaminutos: tempoSemResposta.minutos,
            horarioUltimaMensagem: ultimaMensagem?.created_at 
              ? new Date(ultimaMensagem.created_at).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
              : new Date(atendimento.updated_at).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }),
            prioridade,
            created_at: atendimento.created_at,
            updated_at: atendimento.updated_at
          };

          console.log(`✅ Atendimento ${atendimento.codigo} processado:`, {
            status: atendimentoProcessado.status,
            tempoSemResposta: atendimentoProcessado.tempoSemResposta,
            prioridade: atendimentoProcessado.prioridade
          });

          return atendimentoProcessado;
        })
      );

      console.log('✅ Atendimentos não finalizados processados:', atendimentosProcessados.length);
      return atendimentosProcessados;
    } catch (error) {
      console.error('❌ Erro no serviço buscarNaoFinalizados:', error);
      throw error;
    }
  },

  // Função auxiliar para calcular tempo sem resposta
  calcularTempoSemResposta(dataUltimaAtividade) {
    const agora = new Date();
    const ultimaAtividade = new Date(dataUltimaAtividade);
    const diferencaMs = agora - ultimaAtividade;
    const minutos = Math.floor(diferencaMs / (1000 * 60));
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    console.log(`🕐 Cálculo de tempo sem resposta:`, {
      agora: agora.toISOString(),
      ultimaAtividade: ultimaAtividade.toISOString(),
      diferencaMs,
      minutosCalculados: minutos,
      horasCalculadas: horas,
      diasCalculados: dias
    });

    let texto;
    if (dias > 0) {
      const horasRestantes = horas % 24;
      if (horasRestantes > 0) {
        texto = `${dias} dia${dias > 1 ? 's' : ''} ${horasRestantes}h`;
      } else {
        texto = `${dias} dia${dias > 1 ? 's' : ''}`;
      }
    } else if (horas > 0) {
      const minutosRestantes = minutos % 60;
      if (minutosRestantes > 0) {
        texto = `${horas}h ${minutosRestantes}min`;
      } else {
        texto = `${horas}h`;
      }
    } else if (minutos > 0) {
      texto = `${minutos}min`;
    } else {
      texto = 'agora';
    }

    return { minutos, texto };
  },

  // Função auxiliar para determinar prioridade baseada no tempo
  determinarPrioridade(minutosSemResposta) {
    if (minutosSemResposta > 120) { // mais de 2 horas
      return 'alta';
    } else if (minutosSemResposta > 60) { // mais de 1 hora
      return 'media';
    } else {
      return 'baixa';
    }
  },

  // Atualizar status do atendimento
  async atualizarStatus(id, novoStatus) {
    try {
      console.log(`🔄 Atualizando status do atendimento ${id} para: ${novoStatus}`);
      
      // UPDATE direto na tabela atendimentos
      const { data, error } = await supabase
        .from('atendimentos')
        .update({ 
          status: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(); // Retorna os dados atualizados

      if (error) {
        console.error('❌ Erro ao atualizar status do atendimento:', error);
        throw error;
      }

      console.log(`✅ Status atualizado com sucesso:`, data);
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('❌ Erro no serviço atualizarStatus:', error);
      throw error;
    }
  },

  // Buscar todos os operadores ativos
  async buscarOperadores() {
    try {
      console.log('👥 Buscando operadores...');
      
      const { data, error } = await supabase
        .from('operadores')
        .select('id, nome, email, perfil, habilitado')
        .eq('habilitado', true) // Apenas operadores ativos
        .order('nome', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar operadores:', error);
        throw error;
      }

      console.log('✅ Operadores encontrados:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Erro no serviço buscarOperadores:', error);
      throw error;
    }
  },

  // Buscar atendimentos de um operador específico
  async buscarPorOperador(operadorId) {
    try {
      console.log('🔍 === INÍCIO BUSCA ATENDIMENTOS POR OPERADOR ===');
      console.log('📋 Parâmetros da busca:');
      console.log('   - Operador ID:', operadorId);
      console.log('   - Tipo do ID:', typeof operadorId);
      console.log('   - Status permitidos:', ['pausado', 'aguardando', 'finalizado', 'abandonado', 'nao_atendido', 'em-andamento']);
      
      // Buscar atendimentos com status permitidos no dashboard que pertencem ao operador
      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .eq('operador_id', operadorId)
        .in('status', ['pausado', 'aguardando', 'finalizado', 'abandonado', 'nao_atendido', 'em-andamento'])
        .order('updated_at', { ascending: false });

      console.log('📊 RESULTADO DA QUERY SUPABASE:');
      console.log('   - Error:', error);
      console.log('   - Data length:', data?.length || 0);
      console.log('   - Data completa:', data);

      if (error) {
        console.error('❌ Erro ao buscar atendimentos do operador:', error);
        throw error;
      }

      console.log('📊 Atendimentos brutos encontrados:', data?.length || 0);

      // Se não há dados, fazer uma busca mais ampla para debug
      if (!data || data.length === 0) {
        console.log('🔍 FAZENDO BUSCA DE DEBUG - TODOS OS ATENDIMENTOS:');
        const { data: todosAtendimentos } = await supabase
          .from('atendimentos')
          .select('id, codigo, cliente_nome, operador_id, status')
          .order('updated_at', { ascending: false })
          .limit(10);
        
        console.log('🔍 Amostra de todos os atendimentos no banco:');
        todosAtendimentos?.forEach(att => {
          console.log(`   - ID: ${att.id} | Código: ${att.codigo} | Status: ${att.status} | Operador: ${att.operador_id} | Match: ${att.operador_id === operadorId}`);
        });

        console.log('🔍 FAZENDO BUSCA ESPECÍFICA DO OPERADOR (sem filtro de status):');
        const { data: atendimentosOperador } = await supabase
          .from('atendimentos')
          .select('id, codigo, cliente_nome, operador_id, status')
          .eq('operador_id', operadorId)
          .order('updated_at', { ascending: false });
        
        console.log('📊 Atendimentos do operador (todos os status):');
        console.log('   - Total:', atendimentosOperador?.length || 0);
        atendimentosOperador?.forEach(att => {
          console.log(`   - Código: ${att.codigo} | Status: ${att.status}`);
        });
      }

      // Para cada atendimento, buscar a última mensagem
      const atendimentosComMensagens = await Promise.all(
        (data || []).map(async (atendimento) => {
          console.log('🔄 Processando atendimento:', atendimento.id);
          
          // Buscar última mensagem do atendimento
          const { data: ultimaMensagem } = await supabase
            .from('mensagens')
            .select('conteudo, created_at')
            .eq('atendimento_id', atendimento.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            id: atendimento.id,
            codigo: atendimento.codigo,
            nome: atendimento.cliente_nome || `Cliente ${atendimento.codigo}`,
            telefone: atendimento.cliente_telefone || '',
            email: atendimento.cliente_email || '',
            avatar: this.gerarAvatar(atendimento.cliente_nome || `Cliente ${atendimento.codigo}`),
            ultima_mensagem: ultimaMensagem?.conteudo || atendimento.ultima_mensagem || 'Sem mensagens',
            horario: ultimaMensagem?.created_at 
              ? new Date(ultimaMensagem.created_at).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
              : new Date(atendimento.created_at).toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }),
            status: atendimento.status,
            status_texto: this.formatarStatusTexto(atendimento.status),
            prioridade: atendimento.prioridade,
            online: false, // Campo não disponível, assumir offline
            ativo: !!atendimento.operador_id,
            operador_id: atendimento.operador_id,
            operador_nome: null, // Tabela operadores não existe
            categoria_id: atendimento.categoria_id,
            data_inicio: atendimento.data_inicio,
            data_fim: atendimento.data_fim,
            descricao: atendimento.descricao_atendimento,
            created_at: atendimento.created_at,
            updated_at: atendimento.updated_at
          };
        })
      );

      console.log('✅ === RESULTADO FINAL ===');
      console.log('📊 Atendimentos processados e formatados:');
      console.log('   - Total final:', atendimentosComMensagens.length);
      console.log('   - Lista completa:', atendimentosComMensagens);
      atendimentosComMensagens.forEach(att => {
        console.log(`   - ${att.codigo}: ${att.nome} (${att.status}) - ID: ${att.id}`);
      });
      console.log('🔍 === FIM BUSCA ATENDIMENTOS POR OPERADOR ===');
      
      return atendimentosComMensagens;
    } catch (error) {
      console.error('❌ Erro no serviço buscarPorOperador:', error);
      throw error;
    }
  },

  // Realocar atendimento para um novo operador
  async realocarAtendimento(atendimentoId, novoOperadorId) {
    try {
      console.log(`🔄 Realocando atendimento ${atendimentoId} para operador ${novoOperadorId}`);
      
      // UPDATE direto na tabela atendimentos
      const { data, error } = await supabase
        .from('atendimentos')
        .update({ 
          operador_id: novoOperadorId,
          status: 'aguardando', // Status muda para aguardando
          updated_at: new Date().toISOString()
        })
        .eq('id', atendimentoId)
        .select(); // Retorna os dados atualizados

      if (error) {
        console.error('❌ Erro ao realocar atendimento:', error);
        throw error;
      }

      console.log(`✅ Atendimento realocado com sucesso:`, data);
      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('❌ Erro no serviço realocarAtendimento:', error);
      throw error;
    }
  },

  // Aceitar novo atendimento
  async aceitarAtendimento(atendimentoId, operadorId) {
    try {
      const { data, error } = await supabase
        .rpc('aceitar_atendimento', { 
          p_atendimento_id: atendimentoId,
          p_operador_id: operadorId 
        });

      if (error) {
        console.error('Erro ao aceitar atendimento via SQL:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro no serviço aceitarAtendimento:', error);
      throw error;
    }
  },

  // Finalizar atendimento
  async finalizarAtendimento(atendimentoId, observacoes = '') {
    try {
      const { data, error } = await supabase
        .rpc('finalizar_atendimento', { 
          p_atendimento_id: atendimentoId,
          p_observacoes: observacoes 
        });

      if (error) {
        console.error('Erro ao finalizar atendimento via SQL:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro no serviço finalizarAtendimento:', error);
      throw error;
    }
  },

  // Buscar novos atendimentos (status = 'novo')
  async buscarNovosAtendimentos() {
    try {
      console.log('🔍 Buscando novos atendimentos...');
      
      const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .eq('status', 'novo')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar novos atendimentos:', error);
        throw error;
      }

      console.log('📊 Novos atendimentos encontrados:', data?.length || 0);

      // Para cada atendimento, buscar a primeira mensagem
      const novosComMensagens = await Promise.all(
        (data || []).map(async (atendimento) => {
          // Buscar primeira mensagem do atendimento
          const { data: primeiraMensagem } = await supabase
            .from('mensagens')
            .select('conteudo, created_at')
            .eq('atendimento_id', atendimento.id)
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

          return {
            id: atendimento.id,
            codigo: atendimento.codigo,
            nome: atendimento.cliente_nome || `Cliente ${atendimento.codigo}`,
            telefone: atendimento.cliente_telefone || '',
            email: atendimento.cliente_email || '',
            avatar: this.gerarAvatar(atendimento.cliente_nome || `Cliente ${atendimento.codigo}`),
            ultima_mensagem: primeiraMensagem?.conteudo || 'Novo atendimento',
            horario: new Date(atendimento.created_at).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            status: atendimento.status,
            prioridade: atendimento.prioridade,
            categoria_id: atendimento.categoria_id,
            created_at: atendimento.created_at
          };
        })
      );

      console.log('✅ Novos atendimentos formatados:', novosComMensagens);
      return novosComMensagens;
    } catch (error) {
      console.error('❌ Erro no serviço buscarNovosAtendimentos:', error);
      throw error;
    }
  },

  // Configurar subscription para atendimentos em tempo real
  subscribeToAtendimentos(callback) {
    const subscription = supabase
      .channel('atendimentos_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'atendimentos' 
        }, 
        (payload) => {
          console.log('Mudança nos atendimentos:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return subscription;
  },

  // Configurar subscription para conversas em tempo real
  subscribeToConversas(atendimentoId, callback) {
    const subscription = supabase
      .channel(`conversas_${atendimentoId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'conversas',
          filter: `atendimento_id=eq.${atendimentoId}`
        }, 
        (payload) => {
          console.log('Nova mensagem:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return subscription;
  },

  // Remover subscription
  unsubscribe(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  },

  // Atualizar nome do cliente
  async atualizarNomeCliente(atendimentoId, novoNome) {
    try {
      console.log('🔄 Atualizando nome do cliente para atendimento:', atendimentoId, 'novo nome:', novoNome);
      
      const { data, error } = await supabase
        .from('atendimentos')
        .update({ cliente_nome: novoNome })
        .eq('id', atendimentoId)
        .select();

      if (error) {
        console.error('❌ Erro ao atualizar nome do cliente:', error);
        throw error;
      }

      console.log('✅ Nome do cliente atualizado com sucesso:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro no serviço atualizarNomeCliente:', error);
      throw error;
    }
  },

  // Atualizar email do cliente
  async atualizarEmailCliente(atendimentoId, novoEmail) {
    try {
      console.log('🔄 Atualizando email do cliente para atendimento:', atendimentoId, 'novo email:', novoEmail);
      
      const { data, error } = await supabase
        .from('atendimentos')
        .update({ cliente_email: novoEmail })
        .eq('id', atendimentoId)
        .select();

      if (error) {
        console.error('❌ Erro ao atualizar email do cliente:', error);
        throw error;
      }

      console.log('✅ Email do cliente atualizado com sucesso:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro no serviço atualizarEmailCliente:', error);
      throw error;
    }
  },

  // Métodos para integração com etapas (versão simplificada após remoção do Gerenciamento de Etapas)
  async buscarProgressoEtapas(atendimentoId) {
    try {
      console.log(`📊 Buscando progresso para atendimento ${atendimentoId} - funcionalidade simplificada`);
      // Retorna progresso básico já que o gerenciamento de etapas foi removido
      return { total: 0, concluidas: 0, percentual: 0 };
    } catch (error) {
      console.error('❌ Erro ao buscar progresso das etapas:', error);
      return { total: 0, concluidas: 0, percentual: 0 };
    }
  },

  async atualizarProgressoSubsessao(atendimentoId, subsessaoId, concluida) {
    try {
      console.log(`📝 Atualizando subsessão ${subsessaoId} para atendimento ${atendimentoId} - funcionalidade simplificada`);
      
      // Recalcula o progresso geral (sempre retorna 0 após remoção do gerenciamento de etapas)
      const novoProgresso = await this.buscarProgressoEtapas(atendimentoId);
      
      console.log(`✅ Progresso da subsessão ${subsessaoId} atualizado (simplificado):`, { concluida, novoProgresso });
      return novoProgresso;
    } catch (error) {
      console.error('❌ Erro ao atualizar progresso da subsessão:', error);
      throw error;
    }
  },

  async buscarEtapasDoAtendimento(atendimentoId) {
    try {
      console.log(`🔍 Buscando etapas para atendimento ${atendimentoId} - funcionalidade simplificada`);
      
      // Retorna lista vazia já que o gerenciamento de etapas foi removido
      return [];
    } catch (error) {
      console.error('❌ Erro ao buscar etapas do atendimento:', error);
      return [];
    }
  },

  async iniciarEtapaAtendimento(atendimentoId, etapaId) {
    try {
      console.log(`🚀 Iniciando etapa ${etapaId} para atendimento ${atendimentoId}`);
      
      // Por enquanto, apenas registra o início da etapa
      // Futuramente, isso será salvo no banco de dados
      
      return {
        atendimentoId,
        etapaId,
        iniciadaEm: new Date().toISOString(),
        status: 'em_andamento'
      };
    } catch (error) {
      console.error('❌ Erro ao iniciar etapa do atendimento:', error);
      throw error;
    }
  },

  async concluirEtapaAtendimento(atendimentoId, etapaId) {
    try {
      console.log(`✅ Concluindo etapa ${etapaId} para atendimento ${atendimentoId} - funcionalidade simplificada`);
      
      // Versão simplificada já que o gerenciamento de etapas foi removido
      return {
        atendimentoId,
        etapaId,
        concluidaEm: new Date().toISOString(),
        status: 'concluida'
      };
    } catch (error) {
      console.error('❌ Erro ao concluir etapa do atendimento:', error);
      throw error;
    }
  },

  async obterResumoProgresso(atendimentoId) {
    try {
      const progresso = await this.buscarProgressoEtapas(atendimentoId);
      const etapas = await this.buscarEtapasDoAtendimento(atendimentoId);
      
      return {
        atendimentoId,
        progresso,
        totalEtapas: etapas.length,
        etapasDisponiveis: etapas.map(etapa => ({
          id: etapa.id,
          nome: etapa.nome,
          cor: etapa.cor,
          totalSessoes: etapa.sessoes?.length || 0,
          sessoesObrigatorias: etapa.sessoes?.filter(s => s.obrigatoria).length || 0
        }))
      };
    } catch (error) {
      console.error('❌ Erro ao obter resumo do progresso:', error);
      return {
        atendimentoId,
        progresso: { total: 0, concluidas: 0, percentual: 0 },
        totalEtapas: 0,
        etapasDisponiveis: []
      };
    }
  }
};

export default atendimentosService;