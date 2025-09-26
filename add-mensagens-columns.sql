-- Script para adicionar colunas necessárias na tabela mensagens
-- Execute este script no Supabase SQL Editor

-- Adicionar colunas para suporte a arquivos e documentos
ALTER TABLE mensagens 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'text',
ADD COLUMN IF NOT EXISTS document_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS file_type VARCHAR(100);

-- Comentários para documentar as colunas
COMMENT ON COLUMN mensagens.type IS 'Tipo da mensagem: text, document, photo';
COMMENT ON COLUMN mensagens.document_name IS 'Nome do arquivo/documento anexado';
COMMENT ON COLUMN mensagens.file_size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN mensagens.file_type IS 'Tipo MIME do arquivo (ex: application/pdf, image/jpeg)';

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'mensagens' 
AND column_name IN ('type', 'document_name', 'file_size', 'file_type')
ORDER BY ordinal_position;