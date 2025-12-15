import { supabase } from '../lib/supabase'

export const perguntasNaoRespondidasService = {
  // Listar todas as perguntas não respondidas
  async listar() {
    try {
      const { data, error } = await supabase
        .from('perguntas_nao_respondidas')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao listar perguntas não respondidas:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Erro no serviço de perguntas não respondidas:', error)
      throw error
    }
  },

  // Apagar resposta (voltar para pendente)
  async apagarResposta(id) {
    try {
      const { data: atual, error: buscarErro } = await supabase
        .from('perguntas_nao_respondidas')
        .select('*')
        .eq('id', id)
        .single();
      if (buscarErro) throw buscarErro;
      const updateData = {
        status: 'pendente',
        updated_at: new Date().toISOString()
      };
      const keys = atual ? Object.keys(atual) : [];
      if (keys.includes('resposta_manual')) updateData.resposta_manual = '';
      if (keys.includes('resposta')) updateData.resposta = '';
      if (keys.includes('resposta_texto')) updateData.resposta_texto = '';
      if (keys.includes('texto_resposta')) updateData.texto_resposta = '';
      if (keys.includes('data_resposta')) updateData.data_resposta = null;
      const { data, error } = await supabase
        .from('perguntas_nao_respondidas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Erro ao apagar resposta:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro ao apagar resposta:', error);
      throw error;
    }
  },

  // Criar pergunta manualmente
  async criarPerguntaManual({ textoPergunta, categoriaId = null, operadorId = null, usuarioTelefone = null }) {
    try {
      const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
      const insertData = {
        status: 'pendente',
        pergunta: textoPergunta,
        usuario_telefone: usuarioTelefone ?? '',
        created_at: new Date().toISOString()
      };
      if (operadorId && isUuid(String(operadorId))) insertData.operador_id = operadorId;
      if (categoriaId && isUuid(String(categoriaId))) {
        insertData.categoria_id = categoriaId;
      }
      
      const { error } = await supabase
        .from('perguntas_nao_respondidas')
        .insert(insertData)
      ;
      if (error) {
        console.error('Erro ao criar pergunta manual:', error);
        throw error;
      }
      return { success: true };
    } catch (error) {
      console.error('Erro ao criar pergunta manual:', error);
      throw error;
    }
  },

  // Buscar pergunta por ID
  async buscarPorId(id) {
    try {
      const { data, error } = await supabase
        .from('perguntas_nao_respondidas')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar pergunta:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar pergunta por ID:', error)
      throw error
    }
  },

  // Atualizar pergunta (marcar como respondida)
  async marcarComoRespondida(id, resposta, operadorId) {
    try {
      // Buscar registro atual para detectar colunas disponíveis
      const { data: atual, error: buscarErro } = await supabase
        .from('perguntas_nao_respondidas')
        .select('*')
        .eq('id', id)
        .single();
      if (buscarErro) throw buscarErro;
      
      const updateData = {
        status: 'respondida',
        operador_id: operadorId,
        updated_at: new Date().toISOString()
      };
      const keys = atual ? Object.keys(atual) : [];
      if (keys.includes('resposta_manual')) updateData.resposta_manual = resposta;
      else if (keys.includes('resposta')) updateData.resposta = resposta;
      else if (keys.includes('resposta_texto')) updateData.resposta_texto = resposta;
      else if (keys.includes('texto_resposta')) updateData.texto_resposta = resposta;
      if (keys.includes('data_resposta')) updateData.data_resposta = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('perguntas_nao_respondidas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao marcar pergunta como respondida:', error)
        throw error
      }
      
      // Fallback: se não houver coluna de resposta, tentar registrar em mensagens (se houver atendimento_id)
      if (!('resposta' in updateData || 'resposta_texto' in updateData || 'texto_resposta' in updateData)) {
        if (atual && atual.atendimento_id) {
          try {
            await supabase
              .from('mensagens')
              .insert({
                atendimento_id: atual.atendimento_id,
                conteudo: resposta,
                role: 'operador'
              });
          } catch (msgErr) {
            console.warn('Aviso: não foi possível salvar fallback da resposta em mensagens:', msgErr);
          }
        }
      }

      return data
    } catch (error) {
      console.error('Erro ao marcar pergunta como respondida:', error)
      throw error
    }
  },

  // Listar perguntas por status
  async listarPorStatus(status) {
    try {
      const { data, error } = await supabase
        .from('perguntas_nao_respondidas')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao listar perguntas por status:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Erro ao listar perguntas por status:', error)
      throw error
    }
  },

  // Listar perguntas por categoria
  async listarPorCategoria(categoria) {
    try {
      const { data, error } = await supabase
        .from('perguntas_nao_respondidas')
        .select('*')
        .eq('categoria', categoria)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao listar perguntas por categoria:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Erro ao listar perguntas por categoria:', error)
      throw error
    }
  }
}

export default perguntasNaoRespondidasService
