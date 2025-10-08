# Como Testar a Habilitação de Operadores

## 🔍 **Passo 1: Teste no Console do Navegador**

1. **Abra o sistema** no navegador
2. **Pressione F12** para abrir as ferramentas de desenvolvedor
3. **Vá para a aba Console**
4. **Cole o código** do arquivo `debug-habilitacao-operador.js`
5. **Pressione Enter** para executar

## 🔍 **Passo 2: Verificar Logs**

O script vai mostrar:
- ✅ Conexão com Supabase
- ✅ Busca do operador
- ✅ Teste de atualização
- ❌ Detalhes de qualquer erro

## 🔍 **Passo 3: Teste Manual no Sistema**

1. **Vá para a página de Usuários**
2. **Clique no botão de habilitação** (🔓/🔒)
3. **Observe o console** para ver os logs detalhados
4. **Verifique se aparece erro 400**

## 🔍 **Passo 4: Verificar no Supabase**

Execute este SQL no Supabase SQL Editor:

```sql
-- Verificar se o operador existe
SELECT 
    id,
    nome,
    email,
    status,
    habilitado,
    online,
    pos_token
FROM operadores 
WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- Testar atualização manual
UPDATE operadores
SET 
    habilitado = true,
    online = true,
    updated_at = NOW()
WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';

-- Verificar resultado
SELECT 
    id,
    nome,
    habilitado,
    online,
    updated_at
FROM operadores 
WHERE id = 'fe66e131-e679-4efe-af22-e33d3b533e18';
```

## 🔍 **Passo 5: Possíveis Causas do Erro 400**

1. **Permissões RLS**: Tabela `operadores` pode ter políticas restritivas
2. **Campo inexistente**: Campo `habilitado` ou `online` pode não existir
3. **Tipo de dados**: Campo pode ter tipo diferente do esperado
4. **ID inválido**: UUID pode estar malformado

## 🔍 **Passo 6: Verificar Estrutura da Tabela**

Execute este SQL para ver a estrutura:

```sql
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'operadores' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
```

## 📋 **Próximos Passos**

Após executar os testes, me informe:
1. **Resultado do script de debug**
2. **Mensagens de erro específicas**
3. **Estrutura da tabela operadores**
4. **Se o teste manual no Supabase funcionou**

Com essas informações, posso identificar exatamente onde está o problema! 🎯
