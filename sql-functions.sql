-- Funções SQL para o sistema de atendimentos
-- Execute estas funções no Supabase SQL Editor

-- 1. Função para buscar todos os atendimentos com dados relacionados
CREATE OR REPLACE FUNCTION get_atendimentos_completos()
RETURNS TABLE (
  id TEXT,
  nome TEXT,
  telefone TEXT,
  avatar TEXT,
  ultima_mensagem TEXT,
  horario TEXT,
  status TEXT,
  status_texto TEXT,
  online BOOLEAN,
  ativo BOOLEAN,
  operador_id UUID,
  operador_nome TEXT,
  cliente_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id::TEXT,
    c.nome,
    c.telefone,
    UPPER(LEFT(c.nome, 1)) || UPPER(LEFT(SPLIT_PART(c.nome, ' ', 2), 1)) as avatar,
    COALESCE(conv.mensagem, 'Sem mensagens') as ultima_mensagem,
    TO_CHAR(COALESCE(conv.created_at, a.created_at), 'HH24:MI') as horario,
    a.status,
    CASE 
      WHEN a.status = 'novo' THEN 'Novo'
      WHEN a.status = 'em-andamento' THEN 'Em andamento'
      WHEN a.status = 'aguardando' THEN 'Aguardando'
      WHEN a.status = 'pausado' THEN 'Pausado'
      WHEN a.status = 'finalizado' THEN 'Finalizado'
      WHEN a.status = 'abandonado' THEN 'Abandonado'
      ELSE 'Desconhecido'
    END as status_texto,
    COALESCE(c.online, false) as online,
    CASE WHEN a.operador_id IS NOT NULL THEN true ELSE false END as ativo,
    a.operador_id,
    o.nome as operador_nome,
    a.cliente_id,
    a.created_at,
    a.updated_at
  FROM atendimentos a
  LEFT JOIN clientes c ON a.cliente_id = c.id
  LEFT JOIN operadores o ON a.operador_id = o.id
  LEFT JOIN LATERAL (
    SELECT conteudo as mensagem, created_at
    FROM mensagens 
    WHERE atendimento_id = a.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) conv ON true
  ORDER BY a.updated_at DESC;
END;
$$;

-- 2. Função para buscar atendimento por ID
CREATE OR REPLACE FUNCTION get_atendimento_by_id(p_id TEXT)
RETURNS TABLE (
  id TEXT,
  nome TEXT,
  telefone TEXT,
  avatar TEXT,
  ultima_mensagem TEXT,
  horario TEXT,
  status TEXT,
  status_texto TEXT,
  online BOOLEAN,
  ativo BOOLEAN,
  operador_id UUID,
  operador_nome TEXT,
  cliente_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id::TEXT,
    c.nome,
    c.telefone,
    UPPER(LEFT(c.nome, 1)) || UPPER(LEFT(SPLIT_PART(c.nome, ' ', 2), 1)) as avatar,
    COALESCE(conv.mensagem, 'Sem mensagens') as ultima_mensagem,
    TO_CHAR(COALESCE(conv.created_at, a.created_at), 'HH24:MI') as horario,
    a.status,
    CASE 
      WHEN a.status = 'novo' THEN 'Novo'
      WHEN a.status = 'em-andamento' THEN 'Em andamento'
      WHEN a.status = 'aguardando' THEN 'Aguardando'
      WHEN a.status = 'pausado' THEN 'Pausado'
      WHEN a.status = 'finalizado' THEN 'Finalizado'
      WHEN a.status = 'abandonado' THEN 'Abandonado'
      ELSE 'Desconhecido'
    END as status_texto,
    COALESCE(c.online, false) as online,
    CASE WHEN a.operador_id IS NOT NULL THEN true ELSE false END as ativo,
    a.operador_id,
    o.nome as operador_nome,
    a.cliente_id,
    a.created_at,
    a.updated_at
  FROM atendimentos a
  LEFT JOIN clientes c ON a.cliente_id = c.id
  LEFT JOIN operadores o ON a.operador_id = o.id
  LEFT JOIN LATERAL (
    SELECT conteudo as mensagem, created_at
    FROM mensagens 
    WHERE atendimento_id = a.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) conv ON true
  WHERE a.id = p_id::UUID;
END;
$$;

-- 3. Função para buscar atendimentos por status
CREATE OR REPLACE FUNCTION get_atendimentos_by_status(p_status TEXT)
RETURNS TABLE (
  id TEXT,
  nome TEXT,
  telefone TEXT,
  avatar TEXT,
  ultima_mensagem TEXT,
  horario TEXT,
  status TEXT,
  status_texto TEXT,
  online BOOLEAN,
  ativo BOOLEAN,
  operador_id UUID,
  operador_nome TEXT,
  cliente_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id::TEXT,
    c.nome,
    c.telefone,
    UPPER(LEFT(c.nome, 1)) || UPPER(LEFT(SPLIT_PART(c.nome, ' ', 2), 1)) as avatar,
    COALESCE(conv.mensagem, 'Sem mensagens') as ultima_mensagem,
    TO_CHAR(COALESCE(conv.created_at, a.created_at), 'HH24:MI') as horario,
    a.status,
    CASE 
      WHEN a.status = 'novo' THEN 'Novo'
      WHEN a.status = 'em-andamento' THEN 'Em andamento'
      WHEN a.status = 'aguardando' THEN 'Aguardando'
      WHEN a.status = 'pausado' THEN 'Pausado'
      WHEN a.status = 'finalizado' THEN 'Finalizado'
      WHEN a.status = 'abandonado' THEN 'Abandonado'
      ELSE 'Desconhecido'
    END as status_texto,
    COALESCE(c.online, false) as online,
    CASE WHEN a.operador_id IS NOT NULL THEN true ELSE false END as ativo,
    a.operador_id,
    o.nome as operador_nome,
    a.cliente_id,
    a.created_at,
    a.updated_at
  FROM atendimentos a
  LEFT JOIN clientes c ON a.cliente_id = c.id
  LEFT JOIN operadores o ON a.operador_id = o.id
  LEFT JOIN LATERAL (
    SELECT conteudo as mensagem, created_at
    FROM mensagens 
    WHERE atendimento_id = a.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) conv ON true
  WHERE a.status = p_status
  ORDER BY a.updated_at DESC;
END;
$$;

-- 4. Função para buscar atendimentos por operador
CREATE OR REPLACE FUNCTION get_atendimentos_by_operador(p_operador_id UUID)
RETURNS TABLE (
  id TEXT,
  nome TEXT,
  telefone TEXT,
  avatar TEXT,
  ultima_mensagem TEXT,
  horario TEXT,
  status TEXT,
  status_texto TEXT,
  online BOOLEAN,
  ativo BOOLEAN,
  operador_id UUID,
  operador_nome TEXT,
  cliente_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id::TEXT,
    c.nome,
    c.telefone,
    UPPER(LEFT(c.nome, 1)) || UPPER(LEFT(SPLIT_PART(c.nome, ' ', 2), 1)) as avatar,
    COALESCE(conv.mensagem, 'Sem mensagens') as ultima_mensagem,
    TO_CHAR(COALESCE(conv.created_at, a.created_at), 'HH24:MI') as horario,
    a.status,
    CASE 
      WHEN a.status = 'novo' THEN 'Novo'
      WHEN a.status = 'em-andamento' THEN 'Em andamento'
      WHEN a.status = 'aguardando' THEN 'Aguardando'
      WHEN a.status = 'pausado' THEN 'Pausado'
      WHEN a.status = 'finalizado' THEN 'Finalizado'
      WHEN a.status = 'abandonado' THEN 'Abandonado'
      ELSE 'Desconhecido'
    END as status_texto,
    COALESCE(c.online, false) as online,
    CASE WHEN a.operador_id IS NOT NULL THEN true ELSE false END as ativo,
    a.operador_id,
    o.nome as operador_nome,
    a.cliente_id,
    a.created_at,
    a.updated_at
  FROM atendimentos a
  LEFT JOIN clientes c ON a.cliente_id = c.id
  LEFT JOIN operadores o ON a.operador_id = o.id
  LEFT JOIN LATERAL (
    SELECT conteudo as mensagem, created_at
    FROM mensagens 
    WHERE atendimento_id = a.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) conv ON true
  WHERE a.operador_id = p_operador_id
  ORDER BY a.updated_at DESC;
END;
$$;

-- 5. Função para buscar conversas de um atendimento
CREATE OR REPLACE FUNCTION get_conversas_atendimento(p_atendimento_id TEXT)
RETURNS TABLE (
  id UUID,
  tipo TEXT,
  mensagem TEXT,
  horario TEXT,
  created_at TIMESTAMPTZ,
  operador_nome TEXT,
  cliente_nome TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.role as tipo,
    m.conteudo as mensagem,
    TO_CHAR(m.created_at, 'HH24:MI') as horario,
    m.created_at,
    o.nome as operador_nome,
    cl.nome as cliente_nome
  FROM mensagens m
  LEFT JOIN operadores o ON m.remetente_id = o.id::text
  LEFT JOIN atendimentos a ON m.atendimento_id = a.id
  LEFT JOIN clientes cl ON a.cliente_id = cl.id
  WHERE m.atendimento_id = p_atendimento_id::UUID
  ORDER BY m.created_at ASC;
END;
$$;

-- 6. Função para buscar atendimentos não finalizados
CREATE OR REPLACE FUNCTION get_atendimentos_nao_finalizados()
RETURNS TABLE (
  id TEXT,
  nome TEXT,
  telefone TEXT,
  avatar TEXT,
  status TEXT,
  status_texto TEXT,
  operador_responsavel TEXT,
  operador_id UUID,
  ultima_mensagem TEXT,
  tempo_sem_resposta TEXT,
  horario_ultima_mensagem TEXT,
  prioridade TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id::TEXT,
    c.nome,
    c.telefone,
    UPPER(LEFT(c.nome, 1)) || UPPER(LEFT(SPLIT_PART(c.nome, ' ', 2), 1)) as avatar,
    a.status,
    CASE 
      WHEN a.status = 'nao_atendido' THEN 'Não Atendido'
      WHEN a.status = 'pausado' THEN 'Pausado'
      WHEN a.status = 'abandonado' THEN 'Abandonado'
      WHEN a.status = 'aguardando' THEN 'Aguardando Cliente'
      ELSE 'Pendente'
    END as status_texto,
    o.nome as operador_responsavel,
    a.operador_id,
    COALESCE(conv.mensagem, 'Sem mensagens') as ultima_mensagem,
    CASE 
      WHEN EXTRACT(EPOCH FROM (NOW() - COALESCE(conv.created_at, a.updated_at))) < 3600 THEN
        EXTRACT(EPOCH FROM (NOW() - COALESCE(conv.created_at, a.updated_at)))::INTEGER / 60 || 'min'
      WHEN EXTRACT(EPOCH FROM (NOW() - COALESCE(conv.created_at, a.updated_at))) < 86400 THEN
        EXTRACT(EPOCH FROM (NOW() - COALESCE(conv.created_at, a.updated_at)))::INTEGER / 3600 || 'h ' ||
        (EXTRACT(EPOCH FROM (NOW() - COALESCE(conv.created_at, a.updated_at)))::INTEGER % 3600) / 60 || 'min'
      ELSE
        EXTRACT(EPOCH FROM (NOW() - COALESCE(conv.created_at, a.updated_at)))::INTEGER / 86400 || ' dia ' ||
        (EXTRACT(EPOCH FROM (NOW() - COALESCE(conv.created_at, a.updated_at)))::INTEGER % 86400) / 3600 || 'h'
    END as tempo_sem_resposta,
    TO_CHAR(COALESCE(conv.created_at, a.updated_at), 'HH24:MI') as horario_ultima_mensagem,
    COALESCE(a.prioridade, 'media') as prioridade,
    a.created_at,
    a.updated_at
  FROM atendimentos a
  LEFT JOIN clientes c ON a.cliente_id = c.id
  LEFT JOIN operadores o ON a.operador_id = o.id
  LEFT JOIN LATERAL (
    SELECT conteudo as mensagem, created_at
    FROM mensagens 
    WHERE atendimento_id = a.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) conv ON true
  WHERE a.status IN ('nao_atendido', 'pausado', 'abandonado', 'aguardando')
  ORDER BY 
    CASE a.prioridade 
      WHEN 'alta' THEN 1 
      WHEN 'media' THEN 2 
      WHEN 'baixa' THEN 3 
      ELSE 2 
    END,
    a.updated_at ASC;
END;
$$;

-- 7. Função para buscar novos atendimentos
CREATE OR REPLACE FUNCTION get_novos_atendimentos()
RETURNS TABLE (
  id TEXT,
  nome TEXT,
  telefone TEXT,
  avatar TEXT,
  status TEXT,
  status_texto TEXT,
  horario TEXT,
  ultima_mensagem TEXT,
  online BOOLEAN,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id::TEXT,
    c.nome,
    c.telefone,
    UPPER(LEFT(c.nome, 1)) || UPPER(LEFT(SPLIT_PART(c.nome, ' ', 2), 1)) as avatar,
    a.status,
    'Novo' as status_texto,
    TO_CHAR(a.created_at, 'HH24:MI') as horario,
    COALESCE(conv.mensagem, 'Novo atendimento') as ultima_mensagem,
    COALESCE(c.online, false) as online,
    a.created_at
  FROM atendimentos a
  LEFT JOIN clientes c ON a.cliente_id = c.id
  LEFT JOIN LATERAL (
    SELECT conteudo as mensagem, created_at
    FROM mensagens 
    WHERE atendimento_id = a.id 
    ORDER BY created_at DESC 
    LIMIT 1
  ) conv ON true
  WHERE a.status = 'novo' AND a.operador_id IS NULL
  ORDER BY a.created_at ASC;
END;
$$;

-- 8. Função para atualizar status do atendimento
CREATE OR REPLACE FUNCTION update_atendimento_status(p_id TEXT, p_status TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE atendimentos 
  SET status = p_status, updated_at = NOW()
  WHERE id = p_id::UUID;
  
  RETURN FOUND;
END;
$$;

-- 9. Função para aceitar atendimento
CREATE OR REPLACE FUNCTION aceitar_atendimento(p_atendimento_id TEXT, p_operador_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE atendimentos 
  SET 
    operador_id = p_operador_id,
    status = 'em-andamento',
    updated_at = NOW()
  WHERE id = p_atendimento_id::UUID AND status = 'novo';
  
  RETURN FOUND;
END;
$$;

-- 10. Função para finalizar atendimento
CREATE OR REPLACE FUNCTION finalizar_atendimento(p_atendimento_id TEXT, p_observacoes TEXT DEFAULT '')
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE atendimentos 
  SET 
    status = 'finalizado',
    observacoes = p_observacoes,
    finalizado_em = NOW(),
    updated_at = NOW()
  WHERE id = p_atendimento_id::UUID;
  
  RETURN FOUND;
END;
$$;