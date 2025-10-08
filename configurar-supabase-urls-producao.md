# Configurar URLs de Produção no Supabase

## 🎯 Problema
Magic Link está redirecionando para `localhost:3000` em vez de `https://auraxcred.netlify.app`

## ✅ Solução: Configurar URLs no Supabase Dashboard

### 1. Acesse o Supabase Dashboard
- Vá para seu projeto no Supabase
- Authentication → URL Configuration

### 2. Configure as URLs
**Site URL:**
```
https://auraxcred.netlify.app
```

**Redirect URLs (adicione todas):**
```
https://auraxcred.netlify.app/dashboard
https://auraxcred.netlify.app/login
https://auraxcred.netlify.app/change-password
http://localhost:5173/dashboard
http://localhost:5173/login
http://localhost:5173/change-password
```

### 3. Salvar Configurações
- Clique em "Save" para aplicar as mudanças

## 🔧 Código Atualizado

Já atualizei o código para usar URLs fixas de produção:

- ✅ `src/pages/Usuarios.jsx` - Botão de email
- ✅ `src/pages/Login.jsx` - Esqueci minha senha
- ✅ `src/services/usuariosService.js` - Serviço de usuários

## 📋 Resultado

Após configurar no Supabase Dashboard:
- ✅ Magic Links vão redirecionar para `https://auraxcred.netlify.app/dashboard`
- ✅ Não mais `localhost:3000`
- ✅ Funciona em produção

## 🚨 Importante

**Execute a configuração no Supabase Dashboard** para que as mudanças tenham efeito completo.
