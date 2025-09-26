-- Script para corrigir problemas de RLS no Supabase Storage
-- Execute este script no Supabase SQL Editor

-- 1. Criar o bucket 'documents' se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Habilitar RLS na tabela storage.objects se não estiver habilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "documents_policy_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_policy_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_policy_update" ON storage.objects;
DROP POLICY IF EXISTS "documents_policy_delete" ON storage.objects;

-- 4. Criar políticas específicas para o bucket 'documents'

-- Política para INSERT (upload de arquivos)
CREATE POLICY "documents_policy_insert" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid() IS NOT NULL
  );

-- Política para SELECT (visualização de arquivos)
CREATE POLICY "documents_policy_select" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    auth.uid() IS NOT NULL
  );

-- Política para UPDATE (atualização de metadados)
CREATE POLICY "documents_policy_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    auth.uid() IS NOT NULL
  )
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid() IS NOT NULL
  );

-- Política para DELETE (exclusão de arquivos)
CREATE POLICY "documents_policy_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    auth.uid() IS NOT NULL
  );

-- 5. Verificar se as políticas foram criadas
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
AND schemaname = 'storage'
AND policyname LIKE 'documents_policy_%';

-- 6. Verificar se o bucket foi criado
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets 
WHERE id = 'documents';

-- NOTA: Se ainda houver problemas, execute este comando para desabilitar RLS temporariamente:
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
-- Mas lembre-se de reabilitar depois: ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;