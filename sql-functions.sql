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
      WHEN a.status = 'transferindo' THEN 'Transferindo'
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

DROP TRIGGER IF EXISTS trigger_set_pos_token_on_enable ON public.operadores;
DROP FUNCTION IF EXISTS set_pos_token_on_habilitar();

DROP FUNCTION IF EXISTS get_atendimentos_completos();
DROP FUNCTION IF EXISTS get_atendimento_by_id(TEXT);
DROP FUNCTION IF EXISTS get_atendimentos_by_status(TEXT);
DROP FUNCTION IF EXISTS get_atendimentos_by_operador(UUID);
DROP FUNCTION IF EXISTS get_conversas_atendimento(TEXT);
DROP FUNCTION IF EXISTS get_atendimentos_nao_finalizados();
DROP FUNCTION IF EXISTS get_novos_atendimentos();
DROP FUNCTION IF EXISTS update_atendimento_status(TEXT, TEXT);
DROP FUNCTION IF EXISTS aceitar_atendimento(TEXT, UUID);
DROP FUNCTION IF EXISTS toggle_operador_habilitacao(UUID, BOOLEAN);
DROP FUNCTION IF EXISTS rejeitar_atendimento_aguardando(TEXT, UUID);

DROP FUNCTION IF EXISTS get_operador_by_id(UUID);
DROP FUNCTION IF EXISTS get_all_operadores();
DROP FUNCTION IF EXISTS get_operadores_desabilitados();
DROP FUNCTION IF EXISTS finalizar_atendimento_com_fila(UUID);
DROP FUNCTION IF EXISTS confirmar_user_email(UUID);
DROP FUNCTION IF EXISTS confirm_user_email(UUID);
DROP FUNCTION IF EXISTS distribuir_atendimento_simples();
DROP FUNCTION IF EXISTS status_fila_simples();
DROP FUNCTION IF EXISTS get_operador_by_email(TEXT);
DROP FUNCTION IF EXISTS get_operador_by_cpf(TEXT);
DROP TRIGGER IF EXISTS trigger_notificar_limpeza_memoria ON public.atendimentos;
DROP FUNCTION IF EXISTS on_finaliza_atendimento_notify();
DROP FUNCTION IF EXISTS notificar_limpeza_memoria(TEXT);

CREATE OR REPLACE FUNCTION create_operador_from_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.operadores (
    id,
    nome,
    email,
    cpf,
    perfil,
    status,
    habilitado,
    online,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
    COALESCE(NEW.raw_user_meta_data->>'perfil', 'Operador'),
    'ativo',
    false,
    false,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_operador ON auth.users;
CREATE TRIGGER trigger_create_operador
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_operador_from_auth_user();

CREATE OR REPLACE FUNCTION get_operador_by_id(p_id UUID)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  email TEXT,
  cpf TEXT,
  perfil TEXT,
  status TEXT,
  habilitado BOOLEAN,
  online BOOLEAN,
  pos_token INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.nome::text,
    o.email::text,
    o.cpf::text,
    o.perfil::text,
    o.status::text,
    o.habilitado,
    o.online,
    o.pos_token,
    o.created_at,
    o.updated_at
  FROM operadores o
  WHERE o.id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_operador_by_id(UUID) TO postgres;
GRANT EXECUTE ON FUNCTION get_operador_by_id(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_operador_by_id(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION get_all_operadores()
RETURNS TABLE (
  id UUID,
  nome TEXT,
  email TEXT,
  cpf TEXT,
  status TEXT,
  habilitado BOOLEAN,
  online BOOLEAN,
  pos_token INTEGER,
  perfil TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.nome::text,
    o.email::text,
    o.cpf::text,
    o.status::text,
    o.habilitado,
    o.online,
    o.pos_token,
    o.perfil::text,
    o.created_at,
    o.updated_at
  FROM operadores o
  ORDER BY o.nome;
END;
$$;

GRANT EXECUTE ON FUNCTION get_all_operadores() TO postgres;
GRANT EXECUTE ON FUNCTION get_all_operadores() TO service_role;
GRANT EXECUTE ON FUNCTION get_all_operadores() TO authenticated;

CREATE OR REPLACE FUNCTION get_operadores_desabilitados()
RETURNS TABLE (
  id UUID,
  nome TEXT,
  email TEXT,
  cpf TEXT,
  status TEXT,
  habilitado BOOLEAN,
  online BOOLEAN,
  pos_token INTEGER,
  perfil TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.nome::text,
    o.email::text,
    o.cpf::text,
    o.status::text,
    o.habilitado,
    o.online,
    o.pos_token,
    o.perfil::text,
    o.created_at,
    o.updated_at
  FROM operadores o
  WHERE o.habilitado = false
  ORDER BY o.nome;
END;
$$;

GRANT EXECUTE ON FUNCTION get_operadores_desabilitados() TO postgres;
GRANT EXECUTE ON FUNCTION get_operadores_desabilitados() TO service_role;
GRANT EXECUTE ON FUNCTION get_operadores_desabilitados() TO authenticated;

CREATE OR REPLACE FUNCTION get_operador_by_email(p_email TEXT)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  email TEXT,
  cpf TEXT,
  perfil TEXT,
  status TEXT,
  habilitado BOOLEAN,
  online BOOLEAN,
  pos_token INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.nome::text,
    o.email::text,
    o.cpf::text,
    o.perfil::text,
    o.status::text,
    o.habilitado,
    o.online,
    o.pos_token,
    o.created_at,
    o.updated_at
  FROM operadores o
  WHERE LOWER(TRIM(o.email)) = LOWER(TRIM(p_email))
  ORDER BY o.updated_at DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_operador_by_email(TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION get_operador_by_email(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_operador_by_email(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION get_operador_by_cpf(p_cpf TEXT)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  email TEXT,
  cpf TEXT,
  perfil TEXT,
  status TEXT,
  habilitado BOOLEAN,
  online BOOLEAN,
  pos_token INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.nome::text,
    o.email::text,
    o.cpf::text,
    o.perfil::text,
    o.status::text,
    o.habilitado,
    o.online,
    o.pos_token,
    o.created_at,
    o.updated_at
  FROM operadores o
  WHERE o.cpf = p_cpf
  ORDER BY o.updated_at DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_operador_by_cpf(TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION get_operador_by_cpf(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_operador_by_cpf(TEXT) TO authenticated;


CREATE OR REPLACE FUNCTION confirm_user_email(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = user_id;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION confirm_user_email(UUID) TO postgres;
GRANT EXECUTE ON FUNCTION confirm_user_email(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION confirm_user_email(UUID) TO authenticated;
CREATE EXTENSION IF NOT EXISTS http;
CREATE OR REPLACE FUNCTION notificar_limpeza_memoria(p_cliente_telefone TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_cliente_telefone IS NULL OR LENGTH(TRIM(p_cliente_telefone)) = 0 THEN
    RETURN;
  END IF;
  PERFORM http_post(
    'https://webhook.ffconsultoria.tech/webhook/limpar_memoria',
    'text/plain',
    TRIM(p_cliente_telefone)
  );
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;
GRANT EXECUTE ON FUNCTION notificar_limpeza_memoria(TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION notificar_limpeza_memoria(TEXT) TO service_role;
CREATE OR REPLACE FUNCTION on_finaliza_atendimento_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'finalizado' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    IF NEW.cliente_telefone IS NOT NULL AND LENGTH(TRIM(NEW.cliente_telefone)) > 0 THEN
      PERFORM notificar_limpeza_memoria(NEW.cliente_telefone);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trigger_notificar_limpeza_memoria
AFTER UPDATE OF status ON public.atendimentos
FOR EACH ROW
EXECUTE FUNCTION on_finaliza_atendimento_notify();

ALTER TABLE public.atendimentos ADD COLUMN IF NOT EXISTS fila_status VARCHAR(20);
ALTER TABLE public.operadores ADD COLUMN IF NOT EXISTS pos_token INTEGER;
ALTER TABLE public.operadores ADD COLUMN IF NOT EXISTS habilitado BOOLEAN DEFAULT false;
ALTER TABLE public.operadores ADD COLUMN IF NOT EXISTS online BOOLEAN DEFAULT false;
ALTER TABLE public.operadores ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.operadores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Garantir integridade referencial correta para operador_id
ALTER TABLE public.atendimentos DROP CONSTRAINT IF EXISTS atendimentos_operador_id_fkey;
ALTER TABLE public.atendimentos
  ADD CONSTRAINT atendimentos_operador_id_fkey
  FOREIGN KEY (operador_id)
  REFERENCES public.operadores(id)
  ON DELETE SET NULL;

DROP FUNCTION IF EXISTS distribuir_atendimento_simples(UUID);

CREATE OR REPLACE FUNCTION set_pos_token_on_habilitar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.habilitado = true AND (OLD.habilitado IS DISTINCT FROM NEW.habilitado OR NEW.pos_token IS NULL) THEN
    SELECT COALESCE(MAX(pos_token), 0) + 1 INTO NEW.pos_token
    FROM public.operadores
    WHERE habilitado = true AND id <> NEW.id;
    IF NEW.pos_token IS NULL OR NEW.pos_token < 1 THEN
      NEW.pos_token := 1;
    END IF;
  ELSIF NEW.habilitado = false THEN
    NEW.pos_token := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_pos_token_on_enable ON public.operadores;
CREATE TRIGGER trigger_set_pos_token_on_enable
BEFORE UPDATE OF habilitado ON public.operadores
FOR EACH ROW
EXECUTE FUNCTION set_pos_token_on_habilitar();

DROP TRIGGER IF EXISTS trigger_atendimento_novo_fila ON public.atendimentos;
DROP TRIGGER IF EXISTS trigger_atendimento_para_fila ON public.atendimentos;
DROP FUNCTION IF EXISTS trigger_adicionar_fila();
DROP FUNCTION IF EXISTS trigger_adicionar_atendimento_fila();
DROP FUNCTION IF EXISTS adicionar_atendimento_fila(UUID);
DROP FUNCTION IF EXISTS adicionar_atendimento_fila(UUID, INTEGER);
DROP FUNCTION IF EXISTS distribuir_atendimentos_inteligente();
DROP FUNCTION IF EXISTS processar_rejeicao_inteligente(UUID, UUID);
DROP FUNCTION IF EXISTS processar_rejeicao_fila(UUID, UUID);
DROP FUNCTION IF EXISTS aceitar_atendimento_fila(UUID, UUID);
DROP FUNCTION IF EXISTS limpar_fila_expirada();
DROP FUNCTION IF EXISTS limpar_oferecimentos_expirados();
DROP FUNCTION IF EXISTS executar_distribuicao_automatica();
DROP FUNCTION IF EXISTS visualizar_status_fila();
DROP TRIGGER IF EXISTS trigger_adicionar_fila_aguardando ON public.atendimentos;
DROP FUNCTION IF EXISTS trigger_adicionar_fila_aguardando();

DO $$
DECLARE rec RECORD;
BEGIN
  FOR rec IN 
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE t.tgrelid = 'public.atendimentos'::regclass
      AND (
        pg_get_functiondef(p.oid) ILIKE '%fila_atendimentos%' OR
        pg_get_functiondef(p.oid) ILIKE '%distribuir_atendimento_simples(%'
      )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.atendimentos', rec.tgname);
  END LOOP;
END;
$$;

-- 13. Função para distribuir atendimentos simples
CREATE OR REPLACE FUNCTION distribuir_atendimento_simples()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_atendimento RECORD;
  v_operador RECORD;
  v_result JSON;
BEGIN
  -- Limpar oferecimentos expirados (45s sem ação)
  UPDATE atendimentos
  SET operador_id = NULL,
      fila_status = 'na_fila',
      updated_at = NOW()
  WHERE status = 'aguardando'
    AND fila_status = 'oferecido'
    AND updated_at <= NOW() - INTERVAL '45 seconds';

  SELECT a.*
  INTO v_atendimento
  FROM atendimentos a
  WHERE a.status = 'aguardando'
    AND (a.fila_status IS NULL OR a.fila_status = 'na_fila')
    AND a.operador_id IS NULL
  ORDER BY a.created_at ASC
  LIMIT 1;

  IF v_atendimento.id IS NULL THEN
    v_result := json_build_object('success', false, 'message', 'Nenhum atendimento aguardando');
    RETURN v_result;
  END IF;

  SELECT o.id, o.email, o.pos_token
  INTO v_operador
  FROM operadores o
  WHERE o.habilitado = true
    AND o.online = true
    AND o.pos_token IS NOT NULL
    AND o.pos_token > 0
  ORDER BY o.pos_token ASC
  LIMIT 1;

  IF v_operador.id IS NULL THEN
    v_result := json_build_object('success', false, 'message', 'Nenhum operador disponível');
    RETURN v_result;
  END IF;

  UPDATE atendimentos
  SET operador_id = v_operador.id,
      fila_status = 'oferecido',
      updated_at = NOW()
  WHERE id = v_atendimento.id;

  v_result := json_build_object(
    'success', true,
    'atendimento_id', v_atendimento.id,
    'operador_id', v_operador.id,
    'operador_email', v_operador.email,
    'pos_token', v_operador.pos_token
  );
  RETURN v_result;
END;
$$;

-- 14. Função para status da fila simples
CREATE OR REPLACE FUNCTION status_fila_simples()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_aguardando INTEGER;
  v_na_fila INTEGER;
  v_oferecido INTEGER;
  v_em_risco INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_aguardando FROM atendimentos WHERE status = 'aguardando';
  SELECT COUNT(*) INTO v_na_fila FROM atendimentos WHERE status = 'aguardando' AND (fila_status IS NULL OR fila_status = 'na_fila') AND operador_id IS NULL;
  SELECT COUNT(*) INTO v_oferecido FROM atendimentos WHERE status = 'aguardando' AND fila_status = 'oferecido';
  SELECT COUNT(*) INTO v_em_risco FROM atendimentos WHERE status = 'aguardando' AND created_at < NOW() - INTERVAL '30 minutes';

  RETURN json_build_object(
    'aguardando', v_aguardando,
    'na_fila', v_na_fila,
    'oferecido', v_oferecido,
    'em_risco', v_em_risco,
    'media_rejeicoes', 0,
    'timestamp', NOW()
  );
END;
$$;
CREATE OR REPLACE FUNCTION distribuir_atendimento_simples_para(p_atendimento_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_operador RECORD;
  v_result JSON;
BEGIN
  SELECT o.id, o.email, o.pos_token
  INTO v_operador
  FROM operadores o
  WHERE o.habilitado = true
    AND o.online = true
    AND o.pos_token IS NOT NULL
    AND o.pos_token > 0
  ORDER BY o.pos_token ASC
  LIMIT 1;
  IF v_operador.id IS NULL THEN
    v_result := json_build_object('success', false, 'message', 'Nenhum operador disponível');
    RETURN v_result;
  END IF;
  UPDATE atendimentos
  SET operador_id = v_operador.id,
      fila_status = 'oferecido',
      updated_at = NOW()
  WHERE id = p_atendimento_id
    AND status = 'aguardando'
    AND operador_id IS NULL
    AND (fila_status IS NULL OR fila_status = 'na_fila');
  IF NOT FOUND THEN
    v_result := json_build_object('success', false, 'message', 'Atendimento inválido para distribuição');
    RETURN v_result;
  END IF;
  v_result := json_build_object(
    'success', true,
    'atendimento_id', p_atendimento_id,
    'operador_id', v_operador.id,
    'operador_email', v_operador.email,
    'pos_token', v_operador.pos_token
  );
  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION distribuir_atendimento_simples_para(UUID) TO postgres;
GRANT EXECUTE ON FUNCTION distribuir_atendimento_simples_para(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION distribuir_atendimento_simples_para(UUID) TO authenticated;
CREATE TABLE IF NOT EXISTS fila_config (
  id INTEGER PRIMARY KEY,
  auto_ativo BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO fila_config (id, auto_ativo) VALUES (1, true)
ON CONFLICT (id) DO NOTHING;
CREATE OR REPLACE FUNCTION set_auto_distribuicao(p_ativo BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE fila_config SET auto_ativo = p_ativo, updated_at = NOW() WHERE id = 1;
  IF NOT FOUND THEN
    INSERT INTO fila_config (id, auto_ativo, updated_at) VALUES (1, p_ativo, NOW());
  END IF;
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION set_auto_distribuicao(BOOLEAN) TO postgres;
GRANT EXECUTE ON FUNCTION set_auto_distribuicao(BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION set_auto_distribuicao(BOOLEAN) TO authenticated;
CREATE OR REPLACE FUNCTION get_auto_distribuicao()
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE v BOOLEAN;
BEGIN
  SELECT COALESCE((SELECT auto_ativo FROM fila_config WHERE id = 1), true) INTO v;
  RETURN v;
END;
$$;
GRANT EXECUTE ON FUNCTION get_auto_distribuicao() TO postgres;
GRANT EXECUTE ON FUNCTION get_auto_distribuicao() TO service_role;
GRANT EXECUTE ON FUNCTION get_auto_distribuicao() TO authenticated;
CREATE OR REPLACE FUNCTION verificar_e_distribuir_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_auto BOOLEAN;
BEGIN
  SELECT COALESCE((SELECT auto_ativo FROM fila_config WHERE id = 1), true) INTO v_auto;
  IF NOT v_auto THEN
    RETURN NEW;
  END IF;
  IF NEW.status = 'aguardando'
     AND NEW.operador_id IS NULL
     AND (NEW.fila_status IS NULL OR NEW.fila_status = 'na_fila') THEN
    BEGIN
      PERFORM distribuir_atendimento_simples_para(NEW.id);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trigger_verificar_distribuicao_on_atendimentos ON public.atendimentos;
CREATE TRIGGER trigger_verificar_distribuicao_on_atendimentos
AFTER INSERT OR UPDATE OF status, operador_id, fila_status ON public.atendimentos
FOR EACH ROW
EXECUTE FUNCTION verificar_e_distribuir_trigger();

CREATE OR REPLACE FUNCTION finalizar_atendimento_com_fila(p_atendimento_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dist JSON;
BEGIN
  UPDATE atendimentos
  SET status = 'finalizado',
      fila_status = NULL,
      updated_at = NOW()
  WHERE id = p_atendimento_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Atendimento não encontrado');
  END IF;

  BEGIN
    v_dist := distribuir_atendimento_simples();
  EXCEPTION WHEN OTHERS THEN
    v_dist := json_build_object('success', false, 'message', 'Distribuição não executada');
  END;

  RETURN json_build_object('success', true, 'message', 'Atendimento finalizado', 'redistribuicao', v_dist);
END;
$$;

GRANT EXECUTE ON FUNCTION finalizar_atendimento_com_fila(UUID) TO postgres;
GRANT EXECUTE ON FUNCTION finalizar_atendimento_com_fila(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION finalizar_atendimento_com_fila(UUID) TO authenticated;

GRANT EXECUTE ON FUNCTION distribuir_atendimento_simples() TO postgres;
GRANT EXECUTE ON FUNCTION distribuir_atendimento_simples() TO service_role;
GRANT EXECUTE ON FUNCTION distribuir_atendimento_simples() TO authenticated;

GRANT EXECUTE ON FUNCTION status_fila_simples() TO postgres;
GRANT EXECUTE ON FUNCTION status_fila_simples() TO service_role;
GRANT EXECUTE ON FUNCTION status_fila_simples() TO authenticated;
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
      WHEN a.status = 'transferindo' THEN 'Transferindo'
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
      WHEN a.status = 'transferindo' THEN 'Transferindo'
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
      WHEN a.status = 'transferindo' THEN 'Transferindo'
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

-- 11. Função para alternar habilitação do operador (com gerenciamento de fila)
-- PRIMEIRO: Remover a função existente (se houver)
DROP FUNCTION IF EXISTS toggle_operador_habilitacao(UUID, BOOLEAN);

-- SEGUNDO: Criar a nova versão da função
CREATE OR REPLACE FUNCTION toggle_operador_habilitacao(
  p_operador_id UUID,
  p_habilitar BOOLEAN
)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  email TEXT,
  cpf TEXT,
  perfil TEXT,
  status TEXT,
  habilitado BOOLEAN,
  online BOOLEAN,
  pos_token INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_novo_token INTEGER;
BEGIN
  -- Se estiver habilitando (TRUE)
  IF p_habilitar THEN
    -- Buscar o próximo token na fila (max + 1)
    SELECT COALESCE(MAX(pos_token), 0) + 1 INTO v_novo_token
    FROM operadores
    WHERE habilitado = true;
    
    -- Atualizar operador: habilitar, colocar online e adicionar à fila
    UPDATE operadores
    SET 
      habilitado = true,
      online = true,
      pos_token = v_novo_token,
      updated_at = NOW()
    WHERE operadores.id = p_operador_id;
    
    RAISE NOTICE 'Operador % habilitado com token % na fila', p_operador_id, v_novo_token;
  ELSE
    -- Se estiver desabilitando (FALSE)
    -- Atualizar operador: desabilitar, tirar de online e remover da fila
    UPDATE operadores
    SET 
      habilitado = false,
      online = false,
      pos_token = NULL,
      updated_at = NOW()
    WHERE operadores.id = p_operador_id;
    
    RAISE NOTICE 'Operador % desabilitado e removido da fila', p_operador_id;
  END IF;
  
  -- Retornar os dados atualizados do operador
  RETURN QUERY
  SELECT 
    o.id,
    o.nome,
    o.email,
    o.cpf,
    o.perfil,
    o.status,
    o.habilitado,
    o.online,
    o.pos_token,
    o.created_at,
    o.updated_at
  FROM operadores o
  WHERE o.id = p_operador_id;
END;
$$;

-- 12. Função para rejeitar atendimento aguardando (com lógica de fila)
DROP FUNCTION IF EXISTS rejeitar_atendimento_aguardando(TEXT, UUID);
DROP FUNCTION IF EXISTS rejeitar_atendimento_aguardando(UUID, UUID);

CREATE OR REPLACE FUNCTION rejeitar_atendimento_aguardando(
  p_atendimento_id TEXT,
  p_operador_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_total_operadores INTEGER;
  v_proximo_operador UUID;
  v_atendimento_uuid UUID;
BEGIN
  -- Converter ID do atendimento para UUID
  v_atendimento_uuid := p_atendimento_id::UUID;
  
  -- Contar quantos operadores habilitados existem na fila
  SELECT COUNT(*) INTO v_total_operadores
  FROM operadores
  WHERE habilitado = true AND online = true;
  
  -- Se houver apenas 1 operador na fila (o que está rejeitando)
  IF v_total_operadores <= 1 THEN
    -- Mudar status para abandonado e remover operador
    UPDATE atendimentos
    SET 
      status = 'abandonado',
      operador_id = NULL,
      updated_at = NOW()
    WHERE id = v_atendimento_uuid;
    
    v_result := json_build_object(
      'success', true,
      'action', 'abandoned',
      'message', 'Atendimento marcado como abandonado - apenas 1 operador na fila',
      'total_operadores', v_total_operadores,
      'novo_status', 'abandonado',
      'proximo_operador', NULL
    );
    
  ELSE
    -- Buscar o próximo operador da fila (que não seja o que está rejeitando)
    SELECT id INTO v_proximo_operador
    FROM operadores
    WHERE habilitado = true 
      AND online = true 
      AND id != p_operador_id
    ORDER BY pos_token ASC
    LIMIT 1;
    
    IF v_proximo_operador IS NULL THEN
      -- Se não encontrou próximo operador, abandonar
      UPDATE atendimentos
      SET 
        status = 'abandonado',
        operador_id = NULL,
        updated_at = NOW()
      WHERE id = v_atendimento_uuid;
      
      v_result := json_build_object(
        'success', true,
        'action', 'abandoned',
        'message', 'Nenhum operador disponível - atendimento abandonado',
        'total_operadores', v_total_operadores,
        'novo_status', 'abandonado',
        'proximo_operador', NULL
      );
    ELSE
      -- Passar atendimento para o próximo operador
      UPDATE atendimentos
      SET 
        status = 'aguardando',
        operador_id = v_proximo_operador,
        updated_at = NOW()
      WHERE id = v_atendimento_uuid;
      
      v_result := json_build_object(
        'success', true,
        'action', 'reassigned',
        'message', 'Atendimento passado para o próximo operador da fila',
        'total_operadores', v_total_operadores,
        'novo_status', 'aguardando',
        'proximo_operador', v_proximo_operador
      );
    END IF;
  END IF;
  
  RETURN v_result;
END;
$$;
