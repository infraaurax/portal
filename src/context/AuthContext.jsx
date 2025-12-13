import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { buscarPorEmail, alterarHabilitacao } from '../services/operadoresService'

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
  const [tokenExpirationTimer, setTokenExpirationTimer] = useState(null)

  useEffect(() => {
    console.log('🔄 [AuthContext] Inicializando AuthProvider com Supabase Auth...')

    // Verificar sessão atual
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session) {
        try {
          let operador = null
          let emailParaBusca = session.user.email

          // Tentar buscar operador pelo email da sessão
          console.log('🔍 [AuthContext] Buscando operador por email:', emailParaBusca)
          console.log('⏱️ [AuthContext] Iniciando busca...')
          operador = await buscarPorEmail(emailParaBusca)
          console.log('📊 [AuthContext] Resultado da busca por email da sessão:', operador)

          // Se não encontrou, tentar com email do localStorage
          if (!operador) {
            const emailLocalStorage = localStorage.getItem('operador_email')
            console.log('⚠️ [AuthContext] Operador não encontrado pelo email da sessão')
            console.log('💾 [AuthContext] Email do localStorage:', emailLocalStorage)
            console.log('📧 [AuthContext] Email da sessão:', emailParaBusca)
            console.log('🔄 [AuthContext] São diferentes?', emailLocalStorage !== emailParaBusca)

            if (emailLocalStorage && emailLocalStorage !== emailParaBusca) {
              console.log('🔍 [AuthContext] Tentando buscar com email do localStorage...')
              operador = await buscarPorEmail(emailLocalStorage)
              console.log('📊 [AuthContext] Resultado da busca por localStorage:', operador)
              if (operador) {
                console.log('✅ [AuthContext] Operador encontrado via localStorage!')
                emailParaBusca = emailLocalStorage
              } else {
                console.log('❌ [AuthContext] Operador não encontrado nem pelo localStorage')
              }
            } else if (!emailLocalStorage) {
              console.log('⚠️ [AuthContext] localStorage vazio, não há fallback disponível')
            } else {
              console.log('⚠️ [AuthContext] Emails são iguais, não faz sentido buscar novamente')
            }
          } else {
            console.log('✅ [AuthContext] Operador encontrado pelo email da sessão!')
          }

          const userFromOperador = operador ? {
            id: operador.id,
            email: operador.email,
            nome: operador.nome || emailParaBusca.split('@')[0],
            perfil: operador.perfil || 'Operador',
            status: operador.status || 'Ativo',
            habilitado: !!operador.habilitado
          } : {
            id: session.user.id,
            email: emailParaBusca,
            nome: emailParaBusca.split('@')[0],
            perfil: 'Operador',
            status: 'Ativo',
            habilitado: true
          }

          console.log('👤 [AuthContext] User final criado:', userFromOperador)

          // Salvar email no localStorage para uso futuro
          if (operador) {
            localStorage.setItem('operador_email', operador.email)
            console.log('💾 [AuthContext] Email salvo no localStorage:', operador.email)
          }

          setUser(userFromOperador)
          console.log('✅ [AuthContext] setUser executado')
        } catch (error) {
          console.error('❌ [AuthContext] Erro ao processar sessão:', error)
          console.error('❌ [AuthContext] Stack:', error.stack)
          // Fallback usando localStorage
          const emailLocalStorage = localStorage.getItem('operador_email')
          console.log('🔄 [AuthContext] Usando fallback com email do localStorage:', emailLocalStorage)
          setUser({
            id: session.user.id,
            email: emailLocalStorage || session.user.email,
            nome: 'Usuário',
            perfil: 'Operador',
            status: 'Ativo',
            habilitado: true
          })
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
          try {
            let operador = null
            let emailParaBusca = session.user.email
            const emailLocalStorage = localStorage.getItem('operador_email')

            console.log('🔍 [onAuthStateChange] Buscando operador por email:', emailParaBusca)

            // Timeout de 2 segundos para evitar travamento
            const timeoutPromise = new Promise((resolve) => {
              setTimeout(() => {
                console.log('⏰ [onAuthStateChange] Timeout da busca! Usando fallback...')
                resolve(null)
              }, 2000)
            })

            // Race entre busca e timeout
            operador = await Promise.race([
              buscarPorEmail(emailParaBusca),
              timeoutPromise
            ])

            console.log('📊 [onAuthStateChange] Resultado da busca:', operador)

            // Se não encontrou OU timeout, tentar com email do localStorage
            if (!operador && emailLocalStorage) {
              console.log('⚠️ [onAuthStateChange] Tentando com localStorage:', emailLocalStorage)

              if (emailLocalStorage !== emailParaBusca) {
                console.log('🔍 [onAuthStateChange] Buscando com email do localStorage...')
                operador = await Promise.race([
                  buscarPorEmail(emailLocalStorage),
                  new Promise((resolve) => setTimeout(() => resolve(null), 2000))
                ])
                console.log('📊 [onAuthStateChange] Resultado localStorage:', operador)
                if (operador) {
                  console.log('✅ [onAuthStateChange] Encontrado via localStorage!')
                  emailParaBusca = emailLocalStorage
                }
              }
            }

            // Se ainda não encontrou, criar user básico com email do localStorage
            const userFromOperador = operador ? {
              id: operador.id,
              email: operador.email,
              nome: operador.nome || emailParaBusca,
              perfil: operador.perfil || 'Operador',
              status: operador.status || 'Ativo',
              habilitado: !!operador.habilitado
            } : {
              id: session.user.id,
              email: emailLocalStorage || emailParaBusca,
              nome: emailLocalStorage || emailParaBusca,
              perfil: 'Operador',
              status: 'Ativo',
              habilitado: true
            }

            // Salvar email no localStorage
            if (operador) {
              localStorage.setItem('operador_email', operador.email)
              console.log('💾 [onAuthStateChange] Email salvo no localStorage')
            }

            setUser(userFromOperador)
            setIsAuthenticated(true)
            console.log('✅ [onAuthStateChange] User configurado:', userFromOperador.email)
          } catch (e) {
            console.error('❌ [onAuthStateChange] Erro:', e)
            const emailLocalStorage = localStorage.getItem('operador_email')
            setUser({
              id: session.user.id,
              email: emailLocalStorage || session.user.email,
              nome: emailLocalStorage || session.user.email,
              perfil: 'Operador',
              status: 'Ativo',
              habilitado: true
            })
            setIsAuthenticated(true)
          }
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
    }
  }

  // Função para login via Magic Link (OTP)
  const loginMagic = async (email) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false
        }
      })
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('[AuthContext] Erro no loginMagic:', error)
      return { success: false, error: error.message || 'Erro ao enviar código' }
    } finally {
      setLoading(false)
    }
  }

  // Função para verificar código OTP
  const verifyMagic = async (email, code) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email'
      })
      if (error) throw error
      if (data?.session) {
        setSession(data.session)
        const operador = await buscarPorEmail(email)
        if (operador) {
          setUser({
            id: operador.id,
            email: operador.email,
            nome: operador.nome || email.split('@')[0],
            perfil: operador.perfil || 'Operador',
            status: operador.status || 'Ativo',
            habilitado: !!operador.habilitado
          })
          // Salvar email no localStorage
          localStorage.setItem('operador_email', operador.email)
          console.log('💾 [AuthContext] Email salvo no localStorage após login OTP')
        }
        setIsAuthenticated(true)
      }
      return { success: true }
    } catch (error) {
      console.error('[AuthContext] Erro no verifyMagic:', error)
      return { success: false, error: error.message || 'Código inválido' }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    console.log('🚪 [AuthContext] Iniciando processo de logout...')

    try {
      console.log('🔓 [AuthContext] Desconectando do Supabase Auth')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ [AuthContext] Falha: Erro ao desconectar:', error)
        throw error
      }

      // Limpar estados
      setUser(null)
      setSession(null)
      setIsAuthenticated(false)
      setNeedsPasswordChange(false)
      setAtendimentoHabilitado(false)
      setAtendimentoPausado(false)

      // Limpar timer de expiração mesmo com erro
      limparTimerExpiracao()

      // Limpar email do localStorage
      localStorage.removeItem('operador_email')
      console.log('🧹 [AuthContext] Email removido do localStorage')

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
      // Limpar também o localStorage
      localStorage.removeItem('operador_email')
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

  // Função para configurar timer de expiração do token
  const configurarTimerExpiracao = (session) => {
    console.log('⏰ [AuthContext] Configurando timer de expiração do token');

    // Limpar timer anterior se existir
    if (tokenExpirationTimer) {
      clearTimeout(tokenExpirationTimer);
      setTokenExpirationTimer(null);
    }

    if (!session || !session.expires_at) {
      console.log('⚠️ [AuthContext] Sessão inválida ou sem data de expiração');
      return;
    }

    const expiresAt = new Date(session.expires_at * 1000); // Converter para milliseconds
    const now = new Date();
    const timeUntilExpiration = expiresAt.getTime() - now.getTime();

    console.log('⏰ [AuthContext] Token expira em:', expiresAt.toLocaleString());
    console.log('⏰ [AuthContext] Tempo até expiração:', Math.round(timeUntilExpiration / 1000 / 60), 'minutos');

    if (timeUntilExpiration > 0) {
      const timer = setTimeout(async () => {
        console.log('⏰ [AuthContext] Token expirado - desabilitando atendimentos');
        await desabilitarAtendimentoPorExpiracao();
      }, timeUntilExpiration);

      setTokenExpirationTimer(timer);
      console.log('✅ [AuthContext] Timer de expiração configurado');
    } else {
      console.log('⚠️ [AuthContext] Token já expirado');
      desabilitarAtendimentoPorExpiracao();
    }
  };

  // Função para desabilitar atendimento quando token expira
  const desabilitarAtendimentoPorExpiracao = async () => {
    console.log('🔒 [AuthContext] Desabilitando atendimento por expiração do token');

    try {
      // Desabilitar atendimento localmente
      setAtendimentoHabilitado(false);
      setAtendimentoPausado(false);

      // Se temos dados do usuário, desabilitar no banco também
      if (user && user.email) {
        console.log('🔄 [AuthContext] Desabilitando atendimento no banco para:', user.email);
        const operador = await buscarPorEmail(user.email);

        if (operador) {
          await alterarHabilitacao(operador.id, false);
          console.log('✅ [AuthContext] Atendimento desabilitado no banco');
        }
      }

      console.log('✅ [AuthContext] Atendimento desabilitado por expiração do token');

    } catch (error) {
      console.error('❌ [AuthContext] Erro ao desabilitar atendimento por expiração:', error);
    }
  };

  // Função para limpar timer de expiração
  const limparTimerExpiracao = () => {
    if (tokenExpirationTimer) {
      console.log('🧹 [AuthContext] Limpando timer de expiração');
      clearTimeout(tokenExpirationTimer);
      setTokenExpirationTimer(null);
    }
  };

  // Atualizar useEffect para configurar timer quando sessão mudar
  useEffect(() => {
    if (session) {
      configurarTimerExpiracao(session);
    } else {
      limparTimerExpiracao();
    }

    // Cleanup na desmontagem
    return () => {
      limparTimerExpiracao();
    };
  }, [session]);

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
    loginMagic,
    verifyMagic,
    logout,
    changePassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
