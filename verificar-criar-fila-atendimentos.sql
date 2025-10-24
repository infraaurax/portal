-- ============================================
-- VERIFICAR E CRIAR TABELA FILA_ATENDIMENTOS
-- ============================================

-- 1. Verificar se a tabela fila_atendimentos existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'fila_atendimentos' 
AND table_schema = 'public';

-- 2. Criar tabela fila_atendimentos se não existir
CREATE TABLE IF NOT EXISTS fila_atendimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    atendimento_id UUID NOT NULL REFERENCES atendimentos(id) ON DELETE CASCADE,
    operador_id UUID REFERENCES operadores(id) ON DELETE SET NULL,
    posicao_fila INTEGER NOT NULL DEFAULT 1,
    status_fila VARCHAR(20) NOT NULL DEFAULT 'aguardando',
    tentativas_rejeicao INTEGER DEFAULT 0,
    max_tentativas INTEGER DEFAULT 3,
    oferecido_em TIMESTAMPTZ,
    aceito_em TIMESTAMPTZ,
    rejeitado_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fila_atendimentos_status_check 
    CHECK (status_fila IN ('aguardando', 'oferecido', 'aceito', 'rejeitado', 'abandonado'))
);

-- 3. Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_fila_atendimentos_status ON fila_atendimentos(status_fila);
CREATE INDEX IF NOT EXISTS idx_fila_atendimentos_posicao ON fila_atendimentos(posicao_fila);
CREATE INDEX IF NOT EXISTS idx_fila_atendimentos_operador ON fila_atendimentos(operador_id);
CREATE INDEX IF NOT EXISTS idx_fila_atendimentos_atendimento ON fila_atendimentos(atendimento_id);

-- 4. Verificar se a tabela foi criada com sucesso
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'fila_atendimentos' 
AND table_schema = 'public';

-- 5. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'fila_atendimentos' 
AND table_schema = 'public'
ORDER BY ordinal_position;