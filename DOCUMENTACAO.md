# Portal de Atendimentos AURAX

## Visão Geral

O Portal de Atendimentos AURAX é uma aplicação web desenvolvida em React para gerenciar atendimentos ao cliente, usuários e categorias de suporte. O sistema oferece uma interface moderna e intuitiva para operadores e administradores.

## Informações Técnicas

- **Versão:** 0.0.2
- **Framework:** React 19.1.0
- **Roteamento:** React Router DOM 7.7.1
- **Build Tool:** Vite 7.0.4
- **Linguagem:** JavaScript (ES6+)

## Estrutura do Projeto

```
portal-atendimentos/
├── public/
│   ├── _redirects          # Configuração de redirecionamento Netlify
│   └── aurax-logo.svg      # Logo da empresa
├── src/
│   ├── components/
│   │   ├── Layout.jsx      # Layout principal da aplicação
│   │   └── ProtectedRoute.jsx # Proteção de rotas
│   ├── context/
│   │   └── AuthContext.jsx # Contexto de autenticação
│   ├── pages/
│   │   ├── Dashboard.jsx   # Página principal de atendimentos
│   │   ├── Login.jsx       # Página de login
│   │   ├── ChangePassword.jsx # Mudança de senha
│   │   ├── Usuarios.jsx    # Gerenciamento de usuários
│   │   ├── Categorias.jsx  # Gerenciamento de categorias
│   │   ├── AtendimentosNaoFinalizados.jsx
│   │   └── PerguntasNaoRespondidas.jsx
│   └── App.jsx            # Componente raiz
├── netlify.toml           # Configuração de deploy Netlify
└── package.json           # Dependências e scripts
```

## Funcionalidades Principais

### 1. Sistema de Autenticação

#### Login
- **Credenciais de teste:**
  - Email: `joao.silva@aurax.com`
  - Senha: `123456`
- Validação de credenciais
- Redirecionamento automático após login
- Proteção de rotas privadas

#### Mudança de Senha
- Interface para alteração de senha
- Validação de nova senha
- Redirecionamento após mudança bem-sucedida

### 2. Dashboard de Atendimentos

#### Controle de Atendimento
- **Habilitação/Desabilitação:** Sistema de senha numérica de 6 dígitos para habilitar atendimentos
- **Pausa de Atendimento:** Funcionalidade para pausar atendimentos com timer de 40 minutos
- **Status em Tempo Real:** Indicadores visuais do status do atendimento (Habilitado/Pausado/Não Habilitado)

#### Gerenciamento de Atendimentos
- **Lista de Atendimentos:** Visualização de todos os atendimentos em andamento
- **Filtros:** Por status (todos, em andamento, aguardando, finalizado)
- **Busca:** Por nome do cliente ou ID do atendimento
- **Status dos Atendimentos:**
  - Em andamento
  - Aguardando
  - Finalizado
  - Novo

#### Novos Atendimentos
- **Notificações:** Modal para aceitar novos atendimentos
- **Timer de Aceitação:** 45 segundos para aceitar um novo atendimento
- **Informações do Cliente:** Nome, telefone, última mensagem

#### Chat de Atendimento
- **Interface de Conversa:** Visualização completa das mensagens
- **Histórico:** Todas as conversas anteriores
- **Status Online:** Indicador se o cliente está online
- **Tipos de Mensagem:** Cliente, Operador, IA

### 3. Atendimentos Não Finalizados

#### Monitoramento
- **Lista Completa:** Todos os atendimentos pendentes
- **Tempo sem Resposta:** Indicador de quanto tempo sem interação
- **Status Específicos:**
  - Não Atendido
  - Pausado
  - Abandonado
  - Aguardando Cliente

#### Realocação de Atendimentos
- **Modal de Realocação:** Interface para transferir atendimentos
- **Seleção de Operador:** Lista de operadores disponíveis
- **Histórico de Realocações:** Registro de transferências

#### Priorização
- **Níveis de Prioridade:** Alta, Média, Baixa
- **Indicadores Visuais:** Cores diferenciadas por prioridade
- **Ordenação:** Por prioridade e tempo de espera

### 4. Perguntas Não Respondidas

#### Gerenciamento de Perguntas
- **Lista de Perguntas:** Todas as perguntas sem resposta adequada
- **Categorização:** Por tipo de assunto (Seguros, Precatórios, Créditos)
- **Tentativas da IA:** Contador de tentativas de resposta automática
- **Informações Detalhadas:**
  - Data e hora da pergunta
  - Usuário que fez a pergunta
  - Categoria da pergunta
  - Status (pendente, em análise, respondida)

#### Resposta Manual
- **Interface de Resposta:** Campo para resposta do operador
- **Histórico:** Registro de todas as respostas
- **Aprovação:** Sistema de aprovação de respostas

### 5. Gerenciamento de Usuários

#### CRUD de Usuários
- **Criação:** Formulário para novos usuários
- **Edição:** Modificação de dados existentes
- **Visualização:** Lista completa de usuários
- **Bloqueio/Desbloqueio:** Controle de acesso

#### Informações do Usuário
- **Dados Pessoais:** Nome, email, CPF (com máscara)
- **Perfil:** Admin ou Operador
- **Status:** Ativo ou Bloqueado
- **Datas:** Criação e último acesso

#### Filtros e Busca
- **Busca por Nome/Email:** Campo de busca dinâmica
- **Filtro por Perfil:** Admin/Operador/Todos
- **Filtro por Status:** Ativo/Bloqueado/Todos

#### Permissões
- **Administradores:** Acesso completo a todas as funcionalidades
- **Operadores:** Acesso limitado às funcionalidades de atendimento

### 6. Gerenciamento de Categorias

#### Estrutura Hierárquica
- **Sistema de Índices:** Numeração automática (A, A1, A1.1, etc.)
- **Múltiplos Níveis:** Suporte a categorias e subcategorias
- **Navegação:** Interface em árvore para navegação

#### Categorias Pré-definidas
- **Suporte Técnico (A)**
  - Hardware (A1): Computadores, Impressoras, Periféricos
  - Software (A2): Sistema Operacional, Aplicativos
  - Redes (A3): Configuração, Conectividade

- **Atendimento ao Cliente (B)**
  - Vendas (B1): Produtos, Serviços, Consultoria
  - Pós-Venda (B2): Garantia, Troca/Devolução, Manutenção

- **Financeiro (C)**
  - Cobrança (C1): Boletos, Cartão de Crédito, PIX
  - Empréstimos (C2): Consignado, Pessoal, Imobiliário

#### Funcionalidades
- **Expansão/Colapso:** Interface interativa para navegação
- **Contadores:** Número de subcategorias por categoria
- **Busca:** Localização rápida de categorias

### 7. Layout e Navegação

#### Header Principal
- **Logo da Empresa:** Aurax com versão do sistema
- **Menu de Navegação:** Acesso rápido a todas as seções
- **Informações do Usuário:** Nome, perfil, email e status
- **Botão de Logout:** Saída segura do sistema

#### Navegação
- **Menu Horizontal:** Ícones e labels para cada seção
- **Indicador Ativo:** Destaque da página atual
- **Responsividade:** Adaptação para diferentes tamanhos de tela

#### Status do Atendimento
- **Indicador Visual:** Cores diferenciadas por status
- **Estados:**
  - Verde: Habilitado
  - Amarelo: Pausado
  - Vermelho: Não Habilitado

## Tecnologias Utilizadas

### Frontend
- **React 19.1.0:** Biblioteca principal
- **React Router DOM 7.7.1:** Roteamento
- **CSS3:** Estilização customizada
- **SVG:** Ícones vetoriais

### Build e Deploy
- **Vite 7.0.4:** Build tool e dev server
- **Netlify:** Plataforma de deploy
- **ESLint:** Linting de código

### Desenvolvimento
- **Hot Reload:** Desenvolvimento em tempo real
- **Source Maps:** Debug facilitado
- **Tree Shaking:** Otimização de bundle

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Deploy (build + incremento de versão)
npm run deploy

# Linting
npm run lint

# Preview do build
npm run preview
```

## Configuração de Deploy

### Netlify
- **Arquivo de Configuração:** `netlify.toml`
- **Redirects:** `public/_redirects` para SPA
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`

### Variáveis de Ambiente
- Configuração para diferentes ambientes (dev, staging, prod)
- Integração com APIs externas

## Dados Mock

O sistema utiliza dados simulados (mock) para demonstração:

### Usuários
- Administrador: `joao.silva@aurax.com`
- Operadores: Maria Santos, Pedro Costa

### Atendimentos
- Diversos status e situações
- Conversas simuladas
- Histórico de interações

### Categorias
- Estrutura hierárquica completa
- Índices automáticos
- Múltiplos níveis

## Funcionalidades Futuras

### Integrações
- **Supabase:** Banco de dados real
- **WhatsApp API:** Integração com WhatsApp Business
- **IA/Chatbot:** Respostas automáticas inteligentes

### Melhorias
- **Notificações Push:** Alertas em tempo real
- **Relatórios:** Dashboard de métricas
- **Exportação:** Dados em PDF/Excel
- **Temas:** Modo escuro/claro

### Segurança
- **2FA:** Autenticação de dois fatores
- **Logs de Auditoria:** Rastreamento de ações
- **Criptografia:** Proteção de dados sensíveis

## Suporte e Manutenção

### Logs
- Console do navegador para debug
- Monitoramento de erros
- Performance tracking

### Atualizações
- Versionamento semântico
- Changelog automático
- Deploy contínuo

---

**Desenvolvido por FF Consultoria TECH** | **Versão 0.0.2** | **2025**