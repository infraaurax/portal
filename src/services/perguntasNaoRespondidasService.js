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
      const { data, error } = await supabase
        .from('perguntas_nao_respondidas')
        .update({
          status: 'respondida',
          resposta: resposta,
          operador_id: operadorId,
          data_resposta: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao marcar pergunta como respondida:', error)
        throw error
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