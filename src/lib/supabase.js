import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

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
  AGUARDANDO: 'aguardando',
  PAUSADO: 'pausado',
  FINALIZADO: 'finalizado',
  ABANDONADO: 'abandonado'
}

export const PRIORIDADES = {
  BAIXA: 'baixa',
  MEDIA: 'media',
  ALTA: 'alta'
}