-- =====================================================
-- FUNÇÕES SQL PARA OPERADORES
-- =====================================================
-- Este arquivo contém todas as funções SQL necessárias
-- para o operadoresService.js funcionar corretamente
-- =====================================================

-- Remover funções existentes primeiro
DROP FUNCTION IF EXISTS get_all_operadores();
DROP FUNCTION IF EXISTS get_operadores_by_status(TEXT);
DROP FUNCTION IF EXISTS get_operadores_by_status(VARCHAR(255));
DROP FUNCTION IF EXISTS get_operadores_by_status(VARCHAR(20));
DROP FUNCTION IF EXISTS get_operadores_habilitados();
DROP FUNCTION IF EXISTS get_operadores_desabilitados();
DROP FUNCTION IF EXISTS count_operadores();
DROP FUNCTION IF EXISTS count_operadores_by_status(TEXT);
DROP FUNCTION IF EXISTS count_operadores_by_status(VARCHAR(20));
DROP FUNCTION IF EXISTS delete_operador(UUID);

-- 1. Função para buscar todos os operadores
CREATE OR REPLACE FUNCTION get_all_operadores()
RETURNS TABLE (
    id UUID,
    nome VARCHAR(255),
    email VARCHAR(255),
    cpf VARCHAR(14),
    status VARCHAR(20),
    habilitado BOOLEAN,
    online BOOLEAN,
    pos_token BIGINT,
    perfil TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.nome,
        o.email,
        o.cpf,
        o.status,
        o.habilitado,
        o.online,
        o.pos_token,
        o.perfil,
        o.created_at,
        o.updated_at
    FROM operadores o
    ORDER BY o.nome;
END;
$$;

-- 2. Função para buscar operadores por status
CREATE OR REPLACE FUNCTION get_operadores_by_status(p_status VARCHAR(20))
RETURNS TABLE (
    id UUID,
    nome VARCHAR(255),
    email VARCHAR(255),
    cpf VARCHAR(14),
    status VARCHAR(20),
    habilitado BOOLEAN,
    online BOOLEAN,
    pos_token BIGINT,
    perfil TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.nome,
        o.email,
        o.cpf,
        o.status,
        o.habilitado,
        o.online,
        o.pos_token,
        o.perfil,
        o.created_at,
        o.updated_at
    FROM operadores o
    WHERE o.status = p_status
    ORDER BY o.nome;
END;
$$;

-- 3. Função para buscar operadores habilitados
CREATE OR REPLACE FUNCTION get_operadores_habilitados()
RETURNS TABLE (
    id UUID,
    nome VARCHAR(255),
    email VARCHAR(255),
    cpf VARCHAR(14),
    status VARCHAR(20),
    habilitado BOOLEAN,
    online BOOLEAN,
    pos_token BIGINT,
    perfil TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.nome,
        o.email,
        o.cpf,
        o.status,
        o.habilitado,
        o.online,
        o.pos_token,
        o.perfil,
        o.created_at,
        o.updated_at
    FROM operadores o
    WHERE o.habilitado = true
    ORDER BY o.pos_token NULLS LAST, o.nome;
END;
$$;

-- 4. Função para buscar operadores desabilitados
CREATE OR REPLACE FUNCTION get_operadores_desabilitados()
RETURNS TABLE (
    id UUID,
    nome VARCHAR(255),
    email VARCHAR(255),
    cpf VARCHAR(14),
    status VARCHAR(20),
    habilitado BOOLEAN,
    online BOOLEAN,
    pos_token BIGINT,
    perfil TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.nome,
        o.email,
        o.cpf,
        o.status,
        o.habilitado,
        o.online,
        o.pos_token,
        o.perfil,
        o.created_at,
        o.updated_at
    FROM operadores o
    WHERE o.habilitado = false
    ORDER BY o.nome;
END;
$$;

-- 5. Função para contar total de operadores
CREATE OR REPLACE FUNCTION count_operadores()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count
    FROM operadores;
    
    RETURN total_count;
END;
$$;

-- 6. Função para contar operadores por status
CREATE OR REPLACE FUNCTION count_operadores_by_status(p_status VARCHAR(20))
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    status_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO status_count
    FROM operadores
    WHERE status = p_status;
    
    RETURN status_count;
END;
$$;

-- 7. Função para deletar operador
CREATE OR REPLACE FUNCTION delete_operador(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    operador_exists BOOLEAN;
BEGIN
    -- Verificar se o operador existe
    SELECT EXISTS(
        SELECT 1 FROM operadores WHERE id = p_id
    ) INTO operador_exists;
    
    IF NOT operador_exists THEN
        RAISE EXCEPTION 'Operador com ID % não encontrado', p_id;
    END IF;
    
    -- Deletar o operador
    DELETE FROM operadores WHERE id = p_id;
    
    -- Verificar se foi deletado
    IF FOUND THEN
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$;

-- =====================================================
-- PERMISSÕES
-- =====================================================

-- Conceder permissões para as funções
GRANT EXECUTE ON FUNCTION get_all_operadores() TO postgres;
GRANT EXECUTE ON FUNCTION get_all_operadores() TO service_role;
GRANT EXECUTE ON FUNCTION get_all_operadores() TO authenticated;

GRANT EXECUTE ON FUNCTION get_operadores_by_status(VARCHAR(20)) TO postgres;
GRANT EXECUTE ON FUNCTION get_operadores_by_status(VARCHAR(20)) TO service_role;
GRANT EXECUTE ON FUNCTION get_operadores_by_status(VARCHAR(20)) TO authenticated;

GRANT EXECUTE ON FUNCTION get_operadores_habilitados() TO postgres;
GRANT EXECUTE ON FUNCTION get_operadores_habilitados() TO service_role;
GRANT EXECUTE ON FUNCTION get_operadores_habilitados() TO authenticated;

GRANT EXECUTE ON FUNCTION get_operadores_desabilitados() TO postgres;
GRANT EXECUTE ON FUNCTION get_operadores_desabilitados() TO service_role;
GRANT EXECUTE ON FUNCTION get_operadores_desabilitados() TO authenticated;

GRANT EXECUTE ON FUNCTION count_operadores() TO postgres;
GRANT EXECUTE ON FUNCTION count_operadores() TO service_role;
GRANT EXECUTE ON FUNCTION count_operadores() TO authenticated;

GRANT EXECUTE ON FUNCTION count_operadores_by_status(VARCHAR(20)) TO postgres;
GRANT EXECUTE ON FUNCTION count_operadores_by_status(VARCHAR(20)) TO service_role;
GRANT EXECUTE ON FUNCTION count_operadores_by_status(VARCHAR(20)) TO authenticated;

GRANT EXECUTE ON FUNCTION delete_operador(UUID) TO postgres;
GRANT EXECUTE ON FUNCTION delete_operador(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION delete_operador(UUID) TO authenticated;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON FUNCTION get_all_operadores() IS 'Retorna todos os operadores ordenados por nome';
COMMENT ON FUNCTION get_operadores_by_status(VARCHAR(20)) IS 'Retorna operadores filtrados por status';
COMMENT ON FUNCTION get_operadores_habilitados() IS 'Retorna apenas operadores habilitados ordenados por posição na fila';
COMMENT ON FUNCTION get_operadores_desabilitados() IS 'Retorna apenas operadores desabilitados';
COMMENT ON FUNCTION count_operadores() IS 'Conta o total de operadores';
COMMENT ON FUNCTION count_operadores_by_status(VARCHAR(20)) IS 'Conta operadores por status específico';
COMMENT ON FUNCTION delete_operador(UUID) IS 'Deleta um operador por ID';