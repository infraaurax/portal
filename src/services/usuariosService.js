import { supabase, getRedirectUrl } from '../lib/supabase'

export const usuariosService = {
  // Listar usuários
  async listar(filtros = {}) {
    try {
      let query = supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false })

      if (filtros.perfil && filtros.perfil !== 'all') {
        query = query.eq('perfil', filtros.perfil)
      }

      if (filtros.status && filtros.status !== 'all') {
        query = query.eq('status', filtros.status)
      }

      if (filtros.busca) {
        query = query.or(`nome.ilike.%${filtros.busca}%,email.ilike.%${filtros.busca}%,cpf.ilike.%${filtros.busca}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao listar usuários:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Erro no serviço de usuários:', error)
      throw error
    }
  },

  // Buscar usuário por ID
  async buscarPorId(id) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar usuário:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error)
      throw error
    }
  },

  // Criar usuário
  async criar(dadosUsuario) {
    try {
      // Primeiro criar no auth do Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: dadosUsuario.email,
        password: dadosUsuario.senha, // Senha obrigatória
        options: {
          data: {
            nome: dadosUsuario.nome,
            perfil: dadosUsuario.perfil || 'Operador'
          }
        }
      })

      if (authError) {
        console.error('Erro ao criar usuário no auth:', authError)
        throw authError
      }

      // Depois criar na tabela usuarios
      const { data, error } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user.id,
          nome: dadosUsuario.nome,
          email: dadosUsuario.email,
          cpf: dadosUsuario.cpf,
          perfil: dadosUsuario.perfil || 'Operador',
          status: 'Ativo',
          primeiro_login: true
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar usuário na tabela:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      throw error
    }
  },

  // Atualizar usuário
  async atualizar(id, dadosUsuario) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({
          nome: dadosUsuario.nome,
          cpf: dadosUsuario.cpf,
          perfil: dadosUsuario.perfil,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar usuário:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      throw error
    }
  },

  // Bloquear/Desbloquear usuário
  async alterarStatus(id, novoStatus) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({ 
          status: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao alterar status do usuário:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      throw error
    }
  },

  // Deletar usuário (soft delete - apenas bloquear)
  async deletar(id) {
    try {
      return await this.alterarStatus(id, 'Bloqueado')
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
      throw error
    }
  },

  // Enviar magic link para o usuário
  async enviarMagicLink(email) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: getRedirectUrl('/dashboard')
        }
      })

      if (error) {
        console.error('Erro ao enviar magic link:', error)
        throw error
      }

      return { success: true, message: 'Magic link enviado com sucesso' }
    } catch (error) {
      console.error('Erro ao enviar magic link:', error)
      throw error
    }
  },

  // Atualizar último acesso
  async atualizarUltimoAcesso(id) {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ 
          ultimo_acesso: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Erro ao atualizar último acesso:', error)
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao atualizar último acesso:', error)
      throw error
    }
  },

  // Marcar primeiro login como concluído
  async concluirPrimeiroLogin(id) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update({ 
          primeiro_login: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao concluir primeiro login:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro ao concluir primeiro login:', error)
      throw error
    }
  }
}

export default usuariosService