-- ============================================
-- CONFIGURAR REDIRECTS DO SUPABASE
-- ============================================
-- Este script configura as URLs de redirecionamento
-- no Supabase para funcionar corretamente em produção
-- ============================================

-- IMPORTANTE: Execute estas configurações no Supabase Dashboard
-- Authentication → URL Configuration

-- URLs de redirecionamento permitidas:
-- Desenvolvimento:
-- http://localhost:5173/dashboard
-- http://localhost:5173/login
-- http://localhost:5173/change-password

-- Produção:
-- https://auraxcred.netlify.app/dashboard
-- https://auraxcred.netlify.app/login
-- https://auraxcred.netlify.app/change-password

-- ============================================
-- CONFIGURAÇÕES NO SUPABASE DASHBOARD
-- ============================================

-- 1. Authentication → URL Configuration
-- Site URL: https://auraxcred.netlify.app
-- Redirect URLs: 
--   - https://auraxcred.netlify.app/dashboard
--   - https://auraxcred.netlify.app/login
--   - https://auraxcred.netlify.app/change-password
--   - http://localhost:5173/dashboard (para desenvolvimento)
--   - http://localhost:5173/login (para desenvolvimento)
--   - http://localhost:5173/change-password (para desenvolvimento)

-- 2. Authentication → Email Templates
-- Magic Link Template:
-- Subject: "Acesse sua conta - AURAX"
-- Body: Use a variável {{ .ConfirmationURL }} para o link

-- 3. Authentication → Settings
-- Enable email confirmations: ON
-- Enable phone confirmations: OFF (se não usar telefone)

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Após configurar, teste:
-- 1. Criar usuário em produção
-- 2. Enviar magic link
-- 3. Verificar se o link redireciona para https://auraxcred.netlify.app/dashboard
