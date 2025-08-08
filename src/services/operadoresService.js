import { supabase } from '../lib/supabase';

// Buscar todos os operadores
export const buscarTodos = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_all_operadores');

    if (error) {
      console.error('Erro ao buscar operadores via SQL:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro no serviço buscarTodos:', error);
    throw error;
  }
};

// Buscar operador por ID
export const buscarPorId = async (id) => {
  try {
    const { data, error } = await supabase
      .rpc('get_operador_by_id', { p_id: id });

    if (error) {
      console.error('Erro ao buscar operador por ID via SQL:', error);
      throw error;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Erro no serviço buscarPorId:', error);
    throw error;
  }
};

// Buscar operador por email
export const buscarPorEmail = async (email) => {
  try {
    const { data, error } = await supabase
      .rpc('get_operador_by_email', { p_email: email });

    if (error) {
      console.error('Erro ao buscar operador por email via SQL:', error);
      throw error;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Erro no serviço buscarPorEmail:', error);
    throw error;
  }
};

// Buscar operador por CPF
export const buscarPorCpf = async (cpf) => {
  try {
    const { data, error } = await supabase
      .rpc('get_operador_by_cpf', { p_cpf: cpf });

    if (error) {
      console.error('Erro ao buscar operador por CPF via SQL:', error);
      throw error;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Erro no serviço buscarPorCpf:', error);
    throw error;
  }
};

// Criar novo operador (Auth + Tabela)
export const criar = async (operadorData) => {
  try {
    const { nome, email, cpf, perfil = 'Operador' } = operadorData;
    
    // Gerar senha temporária
    const senhaTemporaria = gerarSenhaTemporaria();
    
    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: senhaTemporaria,
      options: {
        emailRedirectTo: undefined,
        data: {
          nome: nome,
          perfil: perfil
        }
      }
    });

    // 2. Tentar confirmar email automaticamente (se possível)
    if (authData.user && !authData.user.email_confirmed_at) {
      try {
        // Usar função RPC personalizada para confirmar email
        const { error: confirmError } = await supabase.rpc('confirm_user_email', {
          user_id: authData.user.id
        });
        
        if (confirmError) {
          console.warn('Aviso: Confirmação automática não disponível:', confirmError.message);
          // Continua mesmo se não conseguir confirmar automaticamente
        }
      } catch (confirmError) {
        console.warn('Aviso: Confirmação automática falhou:', confirmError.message);
        // Continua mesmo se não conseguir confirmar automaticamente
      }
    }

    if (authError) {
      console.error('Erro ao criar usuário no Auth:', authError);
      throw authError;
    }

    // 3. Criar registro na tabela operadores
    const { data, error } = await supabase
      .from('operadores')
      .insert({
        id: authData.user.id,
        nome: nome,
        email: email,
        cpf: cpf,
        perfil: perfil,
        status: 'Ativo',
        habilitado: true
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar operador na tabela:', error);
      // Se falhar ao criar na tabela, tentar remover do Auth
      try {
        await supabase.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Erro ao limpar usuário do Auth:', cleanupError);
      }
      throw error;
    }

    return {
      ...data,
      senhaTemporaria: senhaTemporaria
    };
  } catch (error) {
    console.error('Erro no serviço criar:', error);
    throw error;
  }
};

// Função auxiliar para gerar senha temporária
const gerarSenhaTemporaria = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let senha = '';
  for (let i = 0; i < 12; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return senha;
};

// Atualizar operador
export const atualizar = async (id, operadorData) => {
  try {
    const { nome, email, cpf, status, habilitado, perfil } = operadorData;
    
    // Preparar dados para atualização (apenas campos não nulos)
    const updateData = {};
    if (nome !== undefined) updateData.nome = nome;
    if (email !== undefined) updateData.email = email;
    if (cpf !== undefined) updateData.cpf = cpf;
    if (status !== undefined) updateData.status = status;
    if (habilitado !== undefined) updateData.habilitado = habilitado;
    if (perfil !== undefined) updateData.perfil = perfil;
    
    // Adicionar timestamp de atualização
    updateData.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('operadores')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar operador na tabela:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro no serviço atualizar:', error);
    throw error;
  }
};

// Alterar habilitação do operador
export const alterarHabilitacao = async (id, habilitado) => {
  try {
    const { data, error } = await supabase
      .rpc('update_operador', {
        p_id: id,
        p_nome: null,
        p_email: null,
        p_cpf: null,
        p_status: null,
        p_habilitado: habilitado
      });

    if (error) {
      console.error('Erro ao alterar habilitação via SQL:', error);
      throw error;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Erro no serviço alterarHabilitacao:', error);
    throw error;
  }
};

// Bloquear/Desbloquear operador (alterar status)
export const alterarStatus = async (id, status) => {
  try {
    const { data, error } = await supabase
      .from('operadores')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao alterar status do operador:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro no serviço alterarStatus:', error);
    throw error;
  }
};

// Deletar operador
export const deletar = async (id) => {
  try {
    const { data, error } = await supabase
      .rpc('delete_operador', { p_id: id });

    if (error) {
      console.error('Erro ao deletar operador via SQL:', error);
      throw error;
    }

    return data || false;
  } catch (error) {
    console.error('Erro no serviço deletar:', error);
    throw error;
  }
};

// Buscar operadores por status
export const buscarPorStatus = async (status) => {
  try {
    const { data, error } = await supabase
      .rpc('get_operadores_by_status', { p_status: status });

    if (error) {
      console.error('Erro ao buscar operadores por status via SQL:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro no serviço buscarPorStatus:', error);
    throw error;
  }
};

// Buscar operadores habilitados
export const buscarHabilitados = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_operadores_habilitados');

    if (error) {
      console.error('Erro ao buscar operadores habilitados via SQL:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro no serviço buscarHabilitados:', error);
    throw error;
  }
};

// Buscar operadores desabilitados
export const buscarDesabilitados = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_operadores_desabilitados');

    if (error) {
      console.error('Erro ao buscar operadores desabilitados via SQL:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro no serviço buscarDesabilitados:', error);
    throw error;
  }
};

// Contar total de operadores
export const contarTotal = async () => {
  try {
    const { data, error } = await supabase
      .rpc('count_operadores');

    if (error) {
      console.error('Erro ao contar operadores via SQL:', error);
      throw error;
    }

    return data || 0;
  } catch (error) {
    console.error('Erro no serviço contarTotal:', error);
    throw error;
  }
};

// Contar operadores por status
export const contarPorStatus = async (status) => {
  try {
    const { data, error } = await supabase
      .rpc('count_operadores_by_status', { p_status: status });

    if (error) {
      console.error('Erro ao contar operadores por status via SQL:', error);
      throw error;
    }

    return data || 0;
  } catch (error) {
    console.error('Erro no serviço contarPorStatus:', error);
    throw error;
  }
};

export default {
  buscarTodos,
  buscarPorId,
  buscarPorEmail,
  buscarPorCpf,
  criar,
  atualizar,
  alterarHabilitacao,
  alterarStatus,
  deletar,
  buscarPorStatus,
  buscarHabilitados,
  buscarDesabilitados,
  contarTotal,
  contarPorStatus
};