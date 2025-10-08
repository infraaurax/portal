-- ============================================
-- TRIGGER PARA CRIAR OPERADOR AUTOMATICAMENTE
-- ============================================
-- Esta função cria um registro na tabela operadores
-- sempre que um usuário é criado no auth.users
-- ============================================

-- 1. Função que será executada pelo trigger
CREATE OR REPLACE FUNCTION create_operador_from_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir registro na tabela operadores
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
    NEW.id,                    -- ID do usuário do auth
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'), -- Nome do metadata
    NEW.email,                 -- Email do usuário
    COALESCE(NEW.raw_user_meta_data->>'cpf', ''), -- CPF do metadata
    COALESCE(NEW.raw_user_meta_data->>'perfil', 'Operador'), -- Perfil do metadata
    'ativo',                   -- Status inicial
    false,                     -- Habilitado inicialmente (false)
    false,                     -- Online inicialmente (false)
    NOW(),                     -- Created_at
    NOW()                      -- Updated_at
  );
  
  RAISE NOTICE 'Operador criado automaticamente para usuário: %', NEW.email;
  
  RETURN NEW;
END;
$$;

-- 2. Criar o trigger
DROP TRIGGER IF EXISTS trigger_create_operador ON auth.users;

CREATE TRIGGER trigger_create_operador
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_operador_from_auth_user();

-- 3. Conceder permissões necessárias
GRANT EXECUTE ON FUNCTION create_operador_from_auth_user() TO postgres;
GRANT EXECUTE ON FUNCTION create_operador_from_auth_user() TO service_role;

-- ============================================
-- TESTE DO TRIGGER
-- ============================================
-- Para testar, você pode criar um usuário via Supabase Auth
-- e verificar se o registro foi criado automaticamente na tabela operadores

-- ============================================
-- VERIFICAR SE O TRIGGER FOI CRIADO
-- ============================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_create_operador';
