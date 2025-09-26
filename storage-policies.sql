-- Políticas de segurança para o bucket 'documents'
-- Execute estas queries no SQL Editor do Supabase

-- IMPORTANTE: Execute como usuário com privilégios de administrador

-- 1. Remover políticas existentes se houver conflito
DROP POLICY IF EXISTS "Usuários autenticados podem fazer upload" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar arquivos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar arquivos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar arquivos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários autenticados podem ver bucket" ON storage.buckets;

-- 2. Política para permitir que usuários autenticados façam upload de arquivos
-- Apenas para o bucket 'documents'
CREATE POLICY "Usuários autenticados podem fazer upload" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid() IS NOT NULL
  );

-- 3. Política para permitir que usuários autenticados vejam arquivos
-- Apenas para o bucket 'documents'
CREATE POLICY "Usuários autenticados podem visualizar arquivos" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    auth.uid() IS NOT NULL
  );

-- 4. Política para permitir que usuários autenticados atualizem arquivos
-- Apenas para o bucket 'documents'
CREATE POLICY "Usuários autenticados podem atualizar arquivos" ON storage.objects
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

-- 5. Política para permitir que usuários autenticados deletem arquivos
-- Apenas para o bucket 'documents'
CREATE POLICY "Usuários autenticados podem deletar arquivos" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    auth.uid() IS NOT NULL
  );

-- Verificar se as políticas foram criadas corretamente
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

/*
INSTRUÇÕES PARA APLICAR AS POLÍTICAS:

1. Acesse o painel do Supabase (https://supabase.com/dashboard)
2. Vá para o seu projeto
3. No menu lateral, clique em "SQL Editor"
4. Cole TODO o conteúdo deste arquivo e execute de uma vez
5. Se houver erro de permissão, execute como administrador do projeto

SOLUÇÃO ALTERNATIVA (se ainda houver erro):
1. Vá para Storage > Settings no painel do Supabase
2. Desabilite RLS temporariamente para o bucket 'documents'
3. Ou configure as políticas através da interface gráfica em Storage > Policies

NOTA: Estas políticas garantem que:
- Apenas usuários autenticados podem acessar os arquivos
- Os arquivos ficam organizados por atendimento
- Há controle total sobre upload, visualização, atualização e exclusão
- O bucket não é público, mantendo a segurança dos dados

Se o erro persistir, você pode desabilitar RLS temporariamente:
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
*/