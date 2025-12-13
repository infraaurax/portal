import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas')
}

// Função para detectar a URL base correta
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname === 'localhost') {
      return 'http://localhost:5173'
    } else if (hostname.includes('auraxcred.netlify.app')) {
      return 'https://auraxcred.netlify.app'
    } else {
      return window.location.origin
    }
  }
  return 'https://auraxcred.netlify.app' // fallback para produção
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Configurar URL base para redirecionamentos
    flowType: 'pkce'
  }
})

// Função para obter URL de redirecionamento correta
export const getRedirectUrl = (path = '/dashboard') => {
  const baseUrl = getBaseUrl()
  return `${baseUrl}${path}`
}

// Disponibilizar globalmente para scripts de debug
if (typeof window !== 'undefined') {
  window.supabase = supabase
}

// Tipos de dados
export const PERFIS = {
  ADMIN: 'Admin',
  OPERADOR: 'Operador'
}

export const STATUS_USUARIO = {
  ATIVO: 'Ativo',
  BLOQUEADO: 'Bloqueado'
}

export const STATUS_ATENDIMENTO = {
  NOVO: 'novo',
  EM_ANDAMENTO: 'em-andamento',
  ATENDIMENTO_IA: 'atendimento_ia',
  AGUARDANDO: 'aguardando',
  PAUSADO: 'pausado',
  FINALIZADO: 'finalizado',
  ABANDONADO: 'abandonado',
  NAO_ATENDIDO: 'nao_atendido'
}

export const PRIORIDADES = {
  BAIXA: 'baixa',
  MEDIA: 'media',
  ALTA: 'alta'
}
