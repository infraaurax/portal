# Cenários de Teste e Casos de Uso - Fila Inteligente

## 1. Casos de Uso Principais

### CU001 - Monitoramento de Fila em Tempo Real
**Ator:** Supervisor/Administrador  
**Objetivo:** Monitorar o status da fila de atendimentos em tempo real

**Fluxo Principal:**
1. Supervisor acessa a página de Monitoramento de Operadores
2. Visualiza o componente Fila Inteligente
3. Observa atendimentos organizados em cards
4. Monitora estatísticas em tempo real
5. Identifica atendimentos de risco

**Fluxos Alternativos:**
- **FA001:** Fila vazia - Sistema exibe mensagem apropriada
- **FA002:** Erro de conexão - Sistema exibe mensagem de erro e permite retry

### CU002 - Distribuição Manual de Atendimentos
**Ator:** Supervisor/Administrador  
**Objetivo:** Executar distribuição manual quando necessário

**Fluxo Principal:**
1. Supervisor identifica necessidade de distribuição
2. Clica no botão "Distribuir"
3. Sistema executa distribuição automática
4. Fila é atualizada com novos status
5. Supervisor confirma distribuição realizada

**Fluxos Alternativos:**
- **FA001:** Falha na distribuição - Sistema exibe erro e mantém estado anterior
- **FA002:** Sem atendimentos para distribuir - Sistema informa situação

### CU003 - Gestão de Atendimentos de Risco
**Ator:** Supervisor/Administrador  
**Objetivo:** Identificar e gerenciar atendimentos com múltiplas rejeições

**Fluxo Principal:**
1. Sistema identifica atendimentos com 2+ rejeições
2. Exibe seção de alertas de risco
3. Supervisor visualiza detalhes dos atendimentos
4. Toma ações corretivas necessárias

## 2. Cenários de Teste Detalhados

### Cenário 1: Primeira Visualização da Fila

**Contexto:** Usuário acessa pela primeira vez a página de Monitoramento de Operadores

**Dados de Teste:**
- 15 atendimentos na fila
- 3 atendimentos com status "na_fila"
- 5 atendimentos com status "oferecido"
- 4 atendimentos com status "aceito"
- 3 atendimentos com status "rejeitado"
- 2 atendimentos com múltiplas rejeições

**Passos de Teste:**
1. **Dado** que o usuário está logado no sistema
2. **Quando** navega para a página de Monitoramento de Operadores
3. **Então** deve visualizar o componente Fila Inteligente
4. **E** deve ver 15 cards de atendimentos organizados em grid
5. **E** deve ver as estatísticas: Total (15), Aceitos (4), etc.
6. **E** deve ver a seção de alertas de risco com 2 atendimentos
7. **E** deve ver o timestamp da última atualização

**Resultado Esperado:**
- ✅ Componente carrega em menos de 3 segundos
- ✅ Todos os 15 atendimentos são exibidos
- ✅ Estatísticas estão corretas
- ✅ Alertas de risco são mostrados
- ✅ Layout é responsivo

### Cenário 2: Auto-refresh em Funcionamento

**Contexto:** Sistema com auto-refresh ativado e mudanças na fila

**Dados de Teste:**
- Fila inicial com 10 atendimentos
- Após 10 segundos: 2 novos atendimentos adicionados
- Após 20 segundos: 1 atendimento muda status para "aceito"

**Passos de Teste:**
1. **Dado** que a fila está carregada com 10 atendimentos
2. **E** auto-refresh está ativado (padrão)
3. **Quando** aguarda 10 segundos
4. **Então** deve ver a fila atualizada com 12 atendimentos
5. **Quando** aguarda mais 10 segundos
6. **Então** deve ver o status atualizado do atendimento
7. **E** estatísticas devem refletir as mudanças

**Resultado Esperado:**
- ✅ Atualizações ocorrem automaticamente a cada 10s
- ✅ Novos atendimentos aparecem sem refresh manual
- ✅ Mudanças de status são refletidas
- ✅ Timestamp de última atualização é atualizado

### Cenário 3: Distribuição Manual com Sucesso

**Contexto:** Supervisor precisa executar distribuição manual

**Dados de Teste:**
- 8 atendimentos com status "na_fila"
- 3 operadores online e disponíveis
- Sistema de distribuição funcionando

**Passos de Teste:**
1. **Dado** que existem 8 atendimentos "na_fila"
2. **E** existem operadores disponíveis
3. **Quando** clica no botão "Distribuir"
4. **Então** deve ver o botão desabilitado
5. **E** deve ver o ícone de loading girando
6. **Quando** a distribuição é concluída
7. **Então** deve ver alguns atendimentos mudarem para "oferecido"
8. **E** estatísticas devem ser atualizadas
9. **E** botão deve voltar ao estado normal

**Resultado Esperado:**
- ✅ Distribuição executa sem erros
- ✅ Status dos atendimentos são atualizados
- ✅ Interface fornece feedback visual adequado
- ✅ Operação completa em menos de 5 segundos

### Cenário 4: Tratamento de Erro na Distribuição

**Contexto:** Falha no sistema durante distribuição manual

**Dados de Teste:**
- Atendimentos na fila
- Simulação de erro no backend

**Passos de Teste:**
1. **Dado** que existem atendimentos na fila
2. **Quando** clica no botão "Distribuir"
3. **E** ocorre um erro no backend
4. **Então** deve ver uma mensagem de erro
5. **E** botão deve voltar ao estado normal
6. **E** dados da fila devem permanecer inalterados

**Resultado Esperado:**
- ✅ Erro é tratado graciosamente
- ✅ Mensagem de erro é clara e útil
- ✅ Interface não trava ou quebra
- ✅ Usuário pode tentar novamente

### Cenário 5: Responsividade em Dispositivos Móveis

**Contexto:** Acesso via dispositivo móvel (375x667px)

**Dados de Teste:**
- 20 atendimentos na fila
- Diferentes tamanhos de nome de cliente

**Passos de Teste:**
1. **Dado** que o usuário acessa via mobile
2. **Quando** visualiza a fila inteligente
3. **Então** cards devem se organizar em coluna única
4. **E** todos os textos devem ser legíveis
5. **E** botões devem ser facilmente clicáveis
6. **E** scrolling deve ser suave

**Resultado Esperado:**
- ✅ Layout se adapta perfeitamente ao mobile
- ✅ Textos não são cortados
- ✅ Botões têm tamanho adequado para toque
- ✅ Performance permanece boa

### Cenário 6: Fila com Alto Volume de Dados

**Contexto:** Sistema com muitos atendimentos simultâneos

**Dados de Teste:**
- 100+ atendimentos na fila
- Diferentes status e prioridades
- Múltiplos atendimentos de risco

**Passos de Teste:**
1. **Dado** que existem 100+ atendimentos na fila
2. **Quando** carrega o componente
3. **Então** deve renderizar em tempo aceitável
4. **E** scrolling deve ser suave
5. **E** filtros de risco devem funcionar
6. **E** estatísticas devem ser precisas

**Resultado Esperado:**
- ✅ Carregamento em menos de 5 segundos
- ✅ Interface permanece responsiva
- ✅ Memória não cresce excessivamente
- ✅ Todas as funcionalidades funcionam

## 3. Casos de Teste de Borda

### CT001 - Fila Completamente Vazia
**Entrada:** Nenhum atendimento na fila  
**Ação:** Carregar componente  
**Resultado:** Mensagem "Nenhum atendimento na fila" com ícone

### CT002 - Atendimento com Dados Incompletos
**Entrada:** Atendimento sem nome de cliente  
**Ação:** Exibir card  
**Resultado:** "Cliente não identificado" é exibido

### CT003 - Múltiplas Rejeições Extremas
**Entrada:** Atendimento com 10+ rejeições  
**Ação:** Exibir alertas  
**Resultado:** Destaque especial para risco crítico

### CT004 - Tempo de Expiração Muito Próximo
**Entrada:** Atendimento expira em 5 segundos  
**Ação:** Exibir alerta  
**Resultado:** Contagem regressiva em vermelho

### CT005 - Falha de Conectividade
**Entrada:** Perda de conexão durante auto-refresh  
**Ação:** Tentar atualizar  
**Resultado:** Mensagem de erro, retry automático

## 4. Testes de Integração

### TI001 - Integração com Monitoramento de Operadores
**Objetivo:** Verificar se o componente se integra bem à página existente

**Validações:**
- ✅ Não interfere com outros componentes
- ✅ Mantém consistência visual
- ✅ Compartilha estado quando necessário
- ✅ Performance não é impactada

### TI002 - Integração com Sistema de Notificações
**Objetivo:** Verificar se alertas são propagados corretamente

**Validações:**
- ✅ Atendimentos de risco geram notificações
- ✅ Mudanças críticas são comunicadas
- ✅ Não há spam de notificações

## 5. Critérios de Performance

### Métricas Alvo:
- **Carregamento inicial:** < 3 segundos
- **Auto-refresh:** < 1 segundo
- **Distribuição manual:** < 5 segundos
- **Uso de memória:** < 50MB adicional
- **CPU durante idle:** < 5%

### Limites Aceitáveis:
- **Carregamento inicial:** < 5 segundos
- **Auto-refresh:** < 2 segundos
- **Distribuição manual:** < 10 segundos
- **Uso de memória:** < 100MB adicional
- **CPU durante idle:** < 10%

## 6. Checklist de Validação Final

### Funcionalidade:
- [ ] Carregamento inicial funciona
- [ ] Auto-refresh funciona corretamente
- [ ] Distribuição manual executa
- [ ] Alertas de risco são exibidos
- [ ] Estatísticas são precisas
- [ ] Tratamento de erros funciona

### Interface:
- [ ] Layout responsivo em todos os dispositivos
- [ ] Cores e ícones consistentes
- [ ] Textos legíveis e bem formatados
- [ ] Animações suaves
- [ ] Feedback visual adequado

### Performance:
- [ ] Carregamento dentro dos limites
- [ ] Uso de memória controlado
- [ ] CPU não sobrecarregada
- [ ] Scrolling suave
- [ ] Sem vazamentos de memória

### Compatibilidade:
- [ ] Chrome (últimas 2 versões)
- [ ] Firefox (últimas 2 versões)
- [ ] Safari (últimas 2 versões)
- [ ] Edge (últimas 2 versões)
- [ ] Mobile iOS Safari
- [ ] Mobile Chrome Android

---

**Documento criado em:** Janeiro 2025  
**Versão:** 1.0  
**Responsável:** Equipe de QA