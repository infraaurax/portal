-- Script para verificar e criar políticas RLS para o bucket 'documents'
-- Execute este script no Supabase SQL Editor

-- 1. Verificar políticas existentes
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

-- 2. Remover políticas existentes se houver conflito
DROP POLICY IF EXISTS "documents_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "documents_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "documents_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "documents_delete_policy" ON storage.objects;

-- 3. Criar política para INSERT (upload de arquivos)
CREATE POLICY "documents_insert_policy" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- 4. Criar política para SELECT (download/visualização de arquivos)
CREATE POLICY "documents_select_policy" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'documents');

-- 5. Criar política para UPDATE (atualização de metadados)
CREATE POLICY "documents_update_policy" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');

-- 6. Criar política para DELETE (remoção de arquivos)
CREATE POLICY "documents_delete_policy" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');

-- 7. Verificar se as políticas foram criadas
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%documents%'
ORDER BY policyname;

-- 8. Verificar se o bucket existe e está configurado corretamente
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

-- IMPORTANTE: Após executar este script:
-- 1. Verifique se todas as 4 políticas foram criadas
-- 2. Teste o upload no frontend
-- 3. Se ainda houver problemas, verifique os logs do Supabase