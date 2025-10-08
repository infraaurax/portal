-- ============================================
-- CONFIGURAR TEMPLATE DE EMAIL COM SENHA
-- ============================================
-- Instruções para configurar o template de email
-- no Supabase Dashboard para incluir a senha
-- ============================================

-- IMPORTANTE: Execute estas configurações no Supabase Dashboard
-- Authentication → Email Templates → Confirm signup

-- ============================================
-- TEMPLATE DE EMAIL PERSONALIZADO
-- ============================================

-- Subject: "Bem-vindo ao Portal AURAX - Sua senha temporária"

-- Body HTML:
/*
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; }
        .header { background: #221C62; color: white; padding: 30px 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .password-box { 
            background: #f8f9fa; 
            border: 2px solid #221C62; 
            border-radius: 8px;
            padding: 20px; 
            margin: 20px 0; 
            text-align: center; 
            font-size: 24px; 
            font-weight: bold; 
            color: #221C62;
            font-family: 'Courier New', monospace;
        }
        .button { 
            display: inline-block; 
            background: #221C62; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
            font-weight: bold;
        }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; background: #f8f9fa; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Portal AURAX</h1>
            <h2>Bem-vindo ao sistema!</h2>
        </div>
        <div class="content">
            <p>Olá, <strong>{{ .UserMetaData.nome }}</strong>!</p>
            
            <p>Sua conta foi criada com sucesso no Portal de Atendimentos AURAX.</p>
            
            <p><strong>Sua senha temporária é:</strong></p>
            <div class="password-box">
                {{ .UserMetaData.senha_temporaria }}
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong> Esta é sua senha temporária. 
                Recomendamos alterá-la após o primeiro acesso por segurança.
            </div>
            
            <p><strong>Próximos passos:</strong></p>
            <ol>
                <li>Clique no botão abaixo para acessar o sistema</li>
                <li>Use sua senha temporária para fazer login</li>
                <li>Altere sua senha na primeira oportunidade</li>
            </ol>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Acessar Portal AURAX</a>
            </div>
            
            <p><strong>Dados da sua conta:</strong></p>
            <ul>
                <li><strong>Email:</strong> {{ .Email }}</li>
                <li><strong>Perfil:</strong> {{ .UserMetaData.perfil }}</li>
                <li><strong>CPF:</strong> {{ .UserMetaData.cpf }}</li>
            </ul>
            
            <p>Se você não solicitou esta conta, ignore este email.</p>
        </div>
        <div class="footer">
            <p>Este é um email automático, não responda.</p>
            <p><strong>AURAX - Portal de Atendimentos</strong></p>
            <p>© 2025 - Todos os direitos reservados</p>
        </div>
    </div>
</body>
</html>
*/

-- ============================================
-- VARIÁVEIS DISPONÍVEIS NO TEMPLATE
-- ============================================
-- {{ .Email }} - Email do usuário
-- {{ .ConfirmationURL }} - Link de confirmação
-- {{ .UserMetaData.nome }} - Nome do usuário
-- {{ .UserMetaData.perfil }} - Perfil do usuário
-- {{ .UserMetaData.cpf }} - CPF do usuário
-- {{ .UserMetaData.senha_temporaria }} - Senha temporária

-- ============================================
-- CONFIGURAÇÕES ADICIONAIS
-- ============================================

-- 1. Authentication → Settings
-- - Enable email confirmations: ON
-- - Confirm email: ON

-- 2. Authentication → URL Configuration
-- - Site URL: https://auraxcred.netlify.app
-- - Redirect URLs: 
--   - https://auraxcred.netlify.app/dashboard
--   - https://auraxcred.netlify.app/login

-- 3. Authentication → Email Templates
-- - Confirm signup: Personalizar com o template acima
-- - Magic Link: Manter padrão ou personalizar

-- ============================================
-- TESTE
-- ============================================
-- Após configurar, teste criando um novo usuário
-- e verifique se o email é enviado com a senha
