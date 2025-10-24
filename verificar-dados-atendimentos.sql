-- Verificar estrutura da tabela atendimentos
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'atendimentos' 
ORDER BY ordinal_position;

-- Verificar se há dados na tabela
SELECT COUNT(*) as total_registros FROM atendimentos;

-- Verificar dados por status
SELECT status, COUNT(*) as quantidade 
FROM atendimentos 
GROUP BY status 
ORDER BY quantidade DESC;

-- Verificar os primeiros 5 registros
SELECT id, status, cliente_nome, created_at 
FROM atendimentos 
ORDER BY created_at DESC 
LIMIT 5;

-- Verificar especificamente os não finalizados
SELECT id, status, cliente_nome, created_at 
FROM atendimentos 
WHERE status IN ('novo', 'em-andamento', 'aguardando')
ORDER BY created_at DESC;