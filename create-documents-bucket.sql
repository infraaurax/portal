-- Script para criar o bucket 'documents' no Supabase Storage
-- Execute este script no Supabase SQL Editor

-- 1. Primeiro, vamos verificar se o bucket já existe
SELECT id, name, public, file_size_limit, allowed_mime_types, created_at
FROM storage.buckets 
WHERE id = 'documents';

-- 2. Se o bucket não existir, execute este INSERT
-- IMPORTANTE: Se o bucket já existir, este comando será ignorado devido ao ON CONFLICT
INSERT INTO storage.buckets (
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types,
  avif_autodetection,
  created_at,
  updated_at
)
VALUES (
  'documents',
  'documents', 
  true, -- Bucket público
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ],
  false, -- avif_autodetection
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

-- 3. Verificar se o bucket foi criado/atualizado
SELECT 
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets 
WHERE id = 'documents';

-- 4. Verificar se existem políticas RLS para o bucket
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%documents%';

-- IMPORTANTE: Após executar este script, você DEVE criar as políticas RLS manualmente
-- Vá para Storage > Settings > Policies e crie:

-- POLÍTICA 1: documents_insert_policy
-- Operação: INSERT
-- Target roles: authenticated
-- USING expression: (deixe vazio)
-- WITH CHECK expression: bucket_id = 'documents'

-- POLÍTICA 2: documents_select_policy  
-- Operação: SELECT
-- Target roles: public
-- USING expression: bucket_id = 'documents'
-- WITH CHECK expression: (deixe vazio)

-- TESTE: Após criar as políticas, teste com:
-- window.testUploadDebug.runAllTests()

-- DEBUG: Se ainda houver problemas, execute no console do navegador:
-- window.testUploadDebug.testBucketExists()
-- Isso mostrará todos os buckets disponíveis