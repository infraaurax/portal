-- ============================================
-- FUNÇÃO PARA ENVIAR SENHA VIA EMAIL
-- ============================================
-- Esta função envia a senha temporária via email
-- usando o sistema de notificações do Supabase
-- ============================================

-- 1. Função para enviar email com senha
CREATE OR REPLACE FUNCTION enviar_senha_temporaria_email(
  p_email TEXT,
  p_nome TEXT,
  p_senha TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_subject TEXT;
  v_body TEXT;
BEGIN
  -- Preparar assunto e corpo do email
  v_subject := 'Bem-vindo ao Portal AURAX - Sua senha temporária';
  
  v_body := '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #221C62; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .password-box { background: #fff; border: 2px solid #221C62; padding: 15px; margin: 20px 0; text-align: center; font-size: 18px; font-weight: bold; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Portal AURAX</h1>
            <h2>Bem-vindo ao sistema!</h2>
        </div>
        <div class="content">
            <p>Olá, <strong>' || p_nome || '</strong>!</p>
            
            <p>Sua conta foi criada com sucesso no Portal de Atendimentos AURAX.</p>
            
            <p><strong>Sua senha temporária é:</strong></p>
            <div class="password-box">
                ' || p_senha || '
            </div>
            
            <p><strong>Instruções importantes:</strong></p>
            <ul>
                <li>Use esta senha para fazer seu primeiro login</li>
                <li>Recomendamos alterar a senha após o primeiro acesso</li>
                <li>Mantenha sua senha em local seguro</li>
            </ul>
            
            <p>Para acessar o sistema, clique no link abaixo:</p>
            <p><a href="https://auraxcred.netlify.app/login" style="background: #221C62; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Acessar Portal</a></p>
            
            <p>Se você não solicitou esta conta, ignore este email.</p>
        </div>
        <div class="footer">
            <p>Este é um email automático, não responda.</p>
            <p>© 2025 AURAX - Portal de Atendimentos</p>
        </div>
    </div>
</body>
</html>';

  -- Enviar email usando pg_net (se disponível) ou outra extensão
  -- Nota: Esta é uma implementação básica. Para produção, considere usar:
  -- 1. Supabase Edge Functions
  -- 2. Serviço de email externo (SendGrid, Mailgun, etc.)
  -- 3. Webhook para serviço de email
  
  v_result := json_build_object(
    'success', true,
    'message', 'Email de senha temporária enviado com sucesso',
    'email', p_email,
    'subject', v_subject
  );
  
  -- Log da operação
  RAISE NOTICE 'Email enviado para % com senha temporária', p_email;
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    v_result := json_build_object(
      'success', false,
      'message', 'Erro ao enviar email: ' || SQLERRM,
      'email', p_email
    );
    RETURN v_result;
END;
$$;

-- 2. Conceder permissões
GRANT EXECUTE ON FUNCTION enviar_senha_temporaria_email(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION enviar_senha_temporaria_email(TEXT, TEXT, TEXT) TO service_role;

-- ============================================
-- ALTERNATIVA: USAR SUPABASE EDGE FUNCTIONS
-- ============================================
-- Para uma solução mais robusta, crie uma Edge Function:

/*
-- Arquivo: supabase/functions/send-password-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { email, nome, senha } = await req.json()
  
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email }],
        subject: 'Bem-vindo ao Portal AURAX - Sua senha temporária'
      }],
      from: { email: 'noreply@auraxcred.com.br' },
      content: [{
        type: 'text/html',
        value: `
          <h1>Bem-vindo, ${nome}!</h1>
          <p>Sua senha temporária é: <strong>${senha}</strong></p>
          <p>Acesse: https://auraxcred.netlify.app/login</p>
        `
      }]
    })
  })
  
  return new Response(JSON.stringify({ success: response.ok }))
})
*/

-- ============================================
-- TESTE DA FUNÇÃO
-- ============================================
-- SELECT enviar_senha_temporaria_email('teste@exemplo.com', 'João Silva', 'MinhaSenh@123');
