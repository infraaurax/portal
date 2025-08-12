import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { buscarPorEmail } from '../services/operadoresService'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false)
  
  // Estados para atendimento
  const [atendimentoHabilitado, setAtendimentoHabilitado] = useState(false)
  const [atendimentoPausado, setAtendimentoPausado] = useState(false)

  useEffect(() => {
    console.log('🔄 [AuthContext] Inicializando AuthProvider com Supabase Auth...')
    
    // Verificar sessão atual
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session) {
        try {
          // Temporariamente usando dados básicos para evitar problemas com RPC
          const basicUser = {
            id: session.user.id,
            email: session.user.email,
            nome: session.user.email.split('@')[0], // Nome temporário baseado no email
            perfil: 'Operador',
            status: 'Ativo',
            habilitado: true
          }
          setUser(basicUser)
          console.log('✅ [AuthContext] Sessão restaurada com dados básicos (modo temporário)')
        } catch (error) {
          console.error('❌ [AuthContext] Erro ao processar sessão:', error)
          // Fallback para dados básicos em caso de erro
          const basicUser = {
            id: session.user.id,
            email: session.user.email,
            nome: 'Usuário',
            perfil: 'Operador',
            status: 'Ativo',
            habilitado: true
          }
          setUser(basicUser)
        }
        setIsAuthenticated(true)
      }
      setLoading(false)
    })

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 [AuthContext] Auth state changed:', event)
        setSession(session)
        if (session) {
          // Criar usuário básico apenas com dados do auth
          const basicUser = {
            id: session.user.id,
            email: session.user.email,
            nome: session.user.nome,
            status: 'Ativo',
            habilitado: true
          }
          setUser(basicUser)
          setIsAuthenticated(true)
        } else {
          setUser(null)
          setIsAuthenticated(false)
          setNeedsPasswordChange(false)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])



  const login = async (email, password, isPasswordless = false) => {
    console.log('🚀 [AuthContext] Iniciando processo de login para:', email)
    
    try {
      setLoading(true)
      
      console.log('🚀 [AuthContext] Iniciando processo de login')
      
      // Se for login sem senha, pular a validação de credenciais do Supabase
      if (!isPasswordless) {
        console.log('📧 [AuthContext] Passo 1: Validando credenciais no Supabase Auth')
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) {
          console.error('❌ [AuthContext] Passo 1 - Falha: Credenciais inválidas:', error)
          throw error
        }
        
        console.log('✅ [AuthContext] Passo 1 - Sucesso: Credenciais validadas')
      } else {
        console.log('🔓 [AuthContext] Login sem senha - pulando validação de credenciais')
      }
      
      // Passo 2: Verificar status do operador e capturar dados completos
      console.log('🔍 [AuthContext] Passo 2: Verificando status do operador e capturando dados')
      let operadorCompleto = null
      try {
        const operador = await buscarPorEmail(email)
        
        if (!operador) {
          console.error('❌ [AuthContext] Passo 2 - Falha: Operador não encontrado na tabela')
          // Fazer logout do Supabase Auth já que o usuário não deveria estar autenticado
          await supabase.auth.signOut()
          throw new Error('Usuário não encontrado no sistema')
        }
        
        if (operador.status && operador.status.toLowerCase() === 'inativo') {
          console.error('❌ [AuthContext] Passo 2 - Falha: Operador com status inativo')
          // Fazer logout do Supabase Auth já que o usuário não deveria estar autenticado
          await supabase.auth.signOut()
          throw new Error('Usuário inativo. Entre em contato com o administrador.')
        }
        
        // Armazenar dados completos do operador para uso posterior
        operadorCompleto = {
          id: operador.id,
          nome: operador.nome,
          email: operador.email,
          perfil: operador.perfil,
          status: operador.status,
          habilitado: operador.habilitado
        }
        
        console.log('✅ [AuthContext] Passo 2 - Sucesso: Status validado e dados capturados')
        console.log('📋 [AuthContext] Dados do operador:', { nome: operadorCompleto.nome, perfil: operadorCompleto.perfil, habilitado: operadorCompleto.habilitado })
        
      } catch (operadorError) {
        console.error('❌ [AuthContext] Passo 2 - Erro ao verificar operador:', operadorError)
        // Se for um erro de validação (usuário inativo ou não encontrado), propagar
        if (operadorError.message.includes('inativo') || operadorError.message.includes('não encontrado')) {
          throw operadorError
        }
        // Para outros erros, permitir login mas logar o erro
        console.warn('⚠️ [AuthContext] Continuando login apesar do erro na verificação do operador')
      }
      
      console.log('✅ [AuthContext] Login realizado com sucesso')
      return { 
        success: true, 
        data,
        operador: operadorCompleto // Incluir dados completos do operador
      }
      
    } catch (error) {
      console.error('💥 [AuthContext] Erro crítico no processo de login:', error)
      return { 
        success: false, 
        error: error.message || 'Erro ao fazer login' 
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    console.log('🚪 [AuthContext] Iniciando processo de logout...')
    
    try {
      console.log('🚪 [AuthContext] Iniciando processo de logout')
      console.log('🔓 [AuthContext] Passo 1: Desconectando do Supabase Auth')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ [AuthContext] Passo 1 - Falha: Erro ao desconectar:', error)
        throw error
      }
      
      // Limpar estados
      setUser(null)
      setSession(null)
      setIsAuthenticated(false)
      setNeedsPasswordChange(false)
      setAtendimentoHabilitado(false)
      setAtendimentoPausado(false)
      
      console.log('✅ [AuthContext] Passo 1 - Sucesso: Desconectado do Supabase Auth')
      console.log('🧹 [AuthContext] Passo 2: Limpeza automática do estado será executada')
    } catch (error) {
      console.error('💥 [AuthContext] Erro crítico no processo de logout:', error)
      
      // Mesmo com erro, limpar estados locais
      setUser(null)
      setSession(null)
      setIsAuthenticated(false)
      setNeedsPasswordChange(false)
      setAtendimentoHabilitado(false)
      setAtendimentoPausado(false)
    }
  }

  const changePassword = async (newPassword) => {
    console.log('🔑 [AuthContext] Iniciando alteração de senha...')
    
    try {
      if (!session) {
        throw new Error('Usuário não autenticado')
      }

      console.log('🔐 [AuthContext] Iniciando processo de alteração de senha')
      console.log('🔄 [AuthContext] Passo 1: Atualizando senha no Supabase Auth')
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        console.error('❌ [AuthContext] Passo 1 - Falha: Erro ao atualizar senha:', error)
        throw error
      }

      // Senha alterada com sucesso - não há campo primeiro_login na tabela operadores
      console.log('✅ [AuthContext] Passo 1 - Sucesso: Senha atualizada no Supabase Auth')
      console.log('🎯 [AuthContext] Passo 2: Atualizando estado local')
      setNeedsPasswordChange(false)
      console.log('🏁 [AuthContext] Processo de alteração de senha concluído com sucesso')
      return { success: true }
    } catch (error) {
      console.error('💥 [AuthContext] Erro crítico na alteração de senha:', error)
      return { 
        success: false, 
        message: error.message || 'Erro ao alterar senha' 
      }
    }
  }

  const value = {
    user,
    session,
    loading,
    isAuthenticated,
    needsPasswordChange,
    atendimentoHabilitado,
    setAtendimentoHabilitado,
    atendimentoPausado,
    setAtendimentoPausado,
    login,
    logout,
    changePassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}