-- ============================================================================
-- VERIFICAR FUNÇÕES DUPLICADAS NO BANCO
-- ============================================================================

-- Verificar todas as versões da função adicionar_atendimento_fila
SELECT 
    'FUNÇÕES adicionar_atendimento_fila ENCONTRADAS:' as titulo,
    proname as nome_funcao,
    pg_get_function_arguments(oid) as parametros,
    pg_get_function_result(oid) as retorno,
    oid
FROM pg_proc 
WHERE proname LIKE '%adicionar_atendimento_fila%'
ORDER BY proname, oid;

-- Verificar todas as funções relacionadas à fila
SELECT 
    'TODAS AS FUNÇÕES DA FILA:' as titulo,
    proname as nome_funcao,
    pg_get_function_arguments(oid) as parametros
FROM pg_proc 
WHERE proname LIKE '%fila%' 
   OR proname LIKE '%atendimento%'
   OR proname LIKE '%processar%'
   OR proname LIKE '%aceitar%'
   OR proname LIKE '%rejeitar%'
   OR proname LIKE '%finalizar%'
ORDER BY proname;

-- Verificar triggers relacionados
SELECT 
    'TRIGGERS RELACIONADOS:' as titulo,
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%fila%' 
   OR trigger_name LIKE '%atendimento%'
   OR action_statement LIKE '%adicionar_atendimento_fila%'
ORDER BY trigger_name;