# Trigger de Reorganização da Fila de Operadores

## Descrição
Este trigger reorganiza automaticamente a fila de operadores (`pos_token`) quando um operador muda seu status para indisponível (`habilitado = false` ou `online = false`).

## Como Funciona

### Cenário de Exemplo:
- **Antes**: Fernando (pos_token = 1), Enzo (pos_token = 2), João (pos_token = 3)
- **Ação**: Fernando fica `online = false`
- **Depois**: Fernando (pos_token = NULL), Enzo (pos_token = 1), João (pos_token = 2)

## Instalação

1. Execute o arquivo SQL no Supabase:
```sql
-- Execute o conteúdo do arquivo trigger-reorganizar-fila.sql
```

2. O trigger será criado automaticamente e ficará ativo.

## Funcionalidades

### 1. Reorganização Automática
- **Quando**: Operador muda `habilitado` ou `online` para `false`
- **Ação**: Remove da fila (pos_token = NULL) e move outros operadores para cima

### 2. Adição Automática à Fila
- **Quando**: Operador volta a ficar `habilitado = true` E `online = true`
- **Ação**: Adiciona na última posição da fila

### 3. Função Manual de Reorganização
```sql
SELECT reorganizar_fila_completa();
```
Esta função reorganiza toda a fila do zero, útil para manutenção.

## Regras do Trigger

1. **Saída da Fila**: Operador sai quando `habilitado = false` OU `online = false`
2. **Entrada na Fila**: Operador entra quando `habilitado = true` E `online = true`
3. **Ordem**: Mantém ordem cronológica de criação dos operadores
4. **Posições**: Sempre sequenciais (1, 2, 3, ...) sem lacunas
5. **Importante**: `pos_token` nunca é 0, sempre NULL quando fora da fila ou >= 1 quando na fila

## Logs
O trigger gera logs informativos:
- `Fila reorganizada: operador X removido da posição Y`
- `Operador X adicionado à fila na posição Y`

## Teste Manual

Para testar o funcionamento:

```sql
-- 1. Verificar fila atual
SELECT nome, pos_token, habilitado, online 
FROM operadores 
WHERE pos_token > 0 
ORDER BY pos_token;

-- 2. Remover operador da fila
UPDATE operadores 
SET habilitado = false 
WHERE nome = 'Fernando';

-- 3. Verificar reorganização (pos_token sempre sequencial: 1, 2, 3...)
SELECT nome, pos_token, habilitado, online 
FROM operadores 
ORDER BY COALESCE(pos_token, 999), nome;
```

## Permissões
O trigger tem permissões para:
- `postgres`
- `service_role` 
- `authenticated`

## Compatibilidade
- ✅ Funciona com Supabase Realtime
- ✅ Compatível com RLS (Row Level Security)
- ✅ Não interfere com outros triggers existentes