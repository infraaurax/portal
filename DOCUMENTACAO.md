# Portal de Atendimentos AURAX

## Visão Geral

O Portal de Atendimentos AURAX é uma aplicação web desenvolvida em React para gerenciar atendimentos ao cliente em tempo real, com integração completa ao Supabase. O sistema oferece interfaces diferenciadas para operadores e administradores, com funcionalidades avançadas de chat, upload de arquivos e gerenciamento de usuários.

## Informações Técnicas

- **Versão:** 0.0.16
- **Framework:** React 19.1.0
- **Roteamento:** React Router DOM 7.7.1
- **Build Tool:** Vite 7.0.4
- **Linguagem:** JavaScript (ES6+)
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Autenticação:** Supabase Auth
- **Banco de Dados:** PostgreSQL via Supabase
- **Storage:** Supabase Storage para documentos/imagens

## Changelog

### Versão 0.0.16 (Atual)
- ✅ **Magic Link**: Implementado sistema de acesso sem senha via magic link
- ✅ **Trigger Automático**: Criado trigger para criar operador automaticamente quando usuário é criado no auth
- ✅ **URLs Dinâmicas**: Corrigido redirecionamento para produção (auraxcred.netlify.app)
- ✅ **Função de Rejeição**: Implementada lógica para marcar atendimentos como abandonados quando apenas 1 operador na fila
- ✅ **Correção de Status**: Corrigido mapeamento de status na interface de usuários
- ✅ **Logs Melhorados**: Adicionados logs detalhados para debug das funções

### Versão 0.0.15
- Funcionalidades anteriores do sistema

## Estrutura do Projeto

```
portal-atendimentos/
├── public/                # Arquivos públicos estáticos
│   ├── _redirects         # Configuração de redirecionamento Netlify
│   ├── aurax-logo.svg     # Logo da empresa
│   ├── icone.png          # Ícone da aplicação
│   ├── img_login.png      # Imagens de login
│   ├── img_login.svg      # SVG de login
│   ├── logo_image_login.svg # Logo SVG para login
│   ├── logo_xl.jpeg       # Logo em alta resolução
│   └── vite.svg           # Logo do Vite
├── src/
│   ├── components/        # Componentes reutilizáveis
│   │   ├── Layout.jsx     # Layout principal da aplicação
│   │   ├── Layout.css     # Estilos do layout
│   │   ├── ProtectedRoute.jsx # Proteção de rotas
│   │   └── RoleProtectedRoute.jsx # Proteção por perfil
│   ├── context/           # Contextos React
│   │   └── AuthContext.jsx # Contexto de autenticação
│   ├── lib/              # Configurações e utilitários
│   │   └── supabase.js   # Configuração do Supabase
│   ├── pages/            # Páginas da aplicação
│   │   ├── Dashboard.jsx # Página principal de atendimentos
│   │   ├── Dashboard.css # Estilos do dashboard
│   │   ├── Login.jsx     # Página de login
│   │   ├── Login.css     # Estilos de login
│   │   ├── ChangePassword.jsx # Mudança de senha
│   │   ├── ChangePassword.css # Estilos de mudança de senha
│   │   ├── Usuarios.jsx  # Gerenciamento de usuários
│   │   ├── Usuarios.css  # Estilos de usuários
│   │   ├── Categorias.jsx # Gerenciamento de categorias
│   │   ├── Categorias.css # Estilos de categorias
│   │   ├── AtendimentosNaoFinalizados.jsx # Lista de atendimentos pendentes
│   │   ├── AtendimentosNaoFinalizados.css # Estilos dos atendimentos
│   │   ├── PerguntasNaoRespondidas.jsx # Perguntas não respondidas
│   │   ├── PerguntasNaoRespondidas.css # Estilos das perguntas
│   │   └── PageStyles.css # Estilos globais de páginas
│   ├── services/         # Camada de serviços
│   │   ├── atendimentosService.js # Serviços de atendimentos
│   │   ├── categoriasService.js   # Serviços de categorias
│   │   ├── mensagensService.js    # Serviços de mensagens
│   │   ├── observacoesService.js  # Serviços de observações
│   │   ├── operadoresService.js   # Serviços de operadores
│   │   ├── perguntasNaoRespondidasService.js # Serviços de perguntas
│   │   ├── storageService.js      # Serviços de storage/upload
│   │   └── usuariosService.js     # Serviços de usuários
│   ├── App.jsx           # Componente raiz
│   ├── App.css           # Estilos globais
│   ├── main.jsx          # Entry point
│   └── index.css         # Estilos base
├── dist/                 # Build de produção (gerado)
├── Scripts SQL de Configuração:
├── ├── add-mensagens-columns.sql      # Script para colunas de mensagens
├── ├── create-documents-bucket.sql    # Criação do bucket de documentos
├── ├── fix-storage-policies.sql       # Correção de políticas de storage
├── ├── fix-storage-rls.sql           # Correção de RLS do storage
├── ├── sql-functions.sql             # Funções SQL customizadas
└── ├── storage-policies.sql          # Políticas de acesso ao storage
├── eslint.config.js      # Configuração do ESLint
├── netlify.toml          # Configuração de deploy Netlify
├── package.json          # Dependências e scripts
├── package-lock.json     # Lock de dependências
├── README.md            # Readme do projeto
├── DOCUMENTACAO.md      # Esta documentação
└── vite.config.js       # Configuração do Vite
```

## Funcionalidades Principais

### 1. Sistema de Autenticação

#### Autenticação Supabase
- **Integração completa com Supabase Auth**
- Validação de credenciais em tempo real
- Sessões persistentes
- Logout seguro

#### Perfis de Usuário
- **Operador**: Acesso aos próprios atendimentos
- **Admin**: Acesso completo a todos os atendimentos e filtros avançados

#### Proteção de Rotas
- `ProtectedRoute`: Proteção básica de autenticação
- `RoleProtectedRoute`: Proteção baseada em perfis de usuário
- Redirecionamento automático baseado em permissões

#### Mudança de Senha
- Interface segura para alteração de senha
- Validação robusta de nova senha
- Integração com Supabase Auth

### 2. Dashboard de Atendimentos

#### Interface Diferenciada por Perfil
- **Operadores**: Visualizam apenas seus atendimentos atribuídos
- **Administradores**: Visualizam todos os atendimentos do sistema

#### Controle de Atendimento
- **Habilitação/Desabilitação**: Sistema de senha numérica de 6 dígitos para habilitar atendimentos
- **Pausa de Atendimento**: Timer de 40 minutos com controle visual
- **Status em Tempo Real**: Indicadores visuais (Habilitado/Pausado/Não Habilitado)

#### Gerenciamento de Atendimentos (Operadores)
- **Lista Personalizada**: Apenas atendimentos do operador logado
- **Busca**: Por nome do cliente, telefone ou código do atendimento
- **Status dos Atendimentos**:
  - Em andamento
  - Aguardando
  - Pausado
  - Finalizado
  - Abandonado
  - Não Atendido

#### Gerenciamento Avançado (Administradores)
- **Visualização Global**: Todos os atendimentos do sistema
- **Filtros por Status**: Dropdown com todos os status disponíveis
  - **Todos**: Mostra todos os atendimentos carregados
  - **Novo**: Busca TODOS os atendimentos com status "novo" (independente do operador)
  - **Em andamento**: Busca TODOS os atendimentos com status "em-andamento" (independente do operador)
  - **Aguardando**: Busca TODOS os atendimentos com status "aguardando" (independente do operador)
  - **Pausado**: Busca TODOS os atendimentos com status "pausado" (independente do operador)
  - **Finalizado**: Busca TODOS os atendimentos com status "finalizado" (independente do operador)
  - **Abandonado**: Busca TODOS os atendimentos com status "abandonado" (independente do operador)
  - **Não Atendido**: Busca TODOS os atendimentos com status "nao_atendido" (independente do operador)
- **Busca Global**: Pesquisa em todos os atendimentos
- **Interface Específica**: Título "Todos os Atendimentos" e botão "🔍 Filtros"
- **Filtros Dinâmicos**: Cada filtro de status faz uma consulta direta ao banco de dados

#### Chat de Atendimento
- **Interface de Conversa**: WhatsApp-like para mensagens
- **Upload de Arquivos**: Suporte a documentos e imagens
- **Histórico Completo**: Todas as conversas armazenadas no Supabase
- **Tipos de Mensagem**: Cliente, Operador
- **Timestamps**: Data e hora das mensagens

### 3. Atendimentos Não Finalizados

#### Monitoramento Automatizado
- **Lista Inteligente**: Atendimentos com status não finalizado
- **Cálculo de Tempo**: Tempo sem resposta baseado na última mensagem
- **Atualização Automática**: Status abandonado após 40 minutos pausado
- **Status Específicos**:
  - Não Atendido
  - Pausado
  - Abandonado

#### Realocação de Atendimentos
- **Interface de Transferência**: Modal para realocar atendimentos
- **Seleção de Operador**: Lista de operadores habilitados
- **Atualização de Status**: Automaticamente muda para "aguardando"

#### Priorização Inteligente
- **Cálculo Automático**: Baseado no tempo sem resposta
  - Alta: > 2 horas sem resposta
  - Média: > 1 hora sem resposta  
  - Baixa: < 1 hora sem resposta
- **Indicadores Visuais**: Cores diferenciadas por prioridade
- **Ordenação**: Por prioridade e tempo de espera

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
- **React 19.1.0**: Biblioteca principal
- **React Router DOM 7.7.1**: Roteamento e navegação
- **CSS3**: Estilização moderna e responsiva
- **JavaScript ES6+**: Programação moderna

### Backend e Banco de Dados
- **Supabase**: Platform-as-a-Service completa
  - **PostgreSQL**: Banco de dados relacional
  - **Supabase Auth**: Sistema de autenticação
  - **Supabase Storage**: Armazenamento de arquivos
  - **Row Level Security (RLS)**: Segurança de dados
  - **Real-time Subscriptions**: Atualizações em tempo real

### Camada de Serviços
- **atendimentosService**: Gerenciamento de atendimentos
- **mensagensService**: Sistema de mensagens e chat
- **operadoresService**: Controle de operadores e permissões
- **usuariosService**: Gerenciamento de usuários
- **storageService**: Upload e gerenciamento de arquivos
- **categoriasService**: Sistema de categorização
- **observacoesService**: Anotações e observações
- **perguntasNaoRespondidasService**: Controle de perguntas

### Build e Deploy
- **Vite 7.0.4**: Build tool otimizada e dev server
- **Netlify**: Plataforma de deploy com CI/CD
- **ESLint**: Linting e padronização de código

### Desenvolvimento
- **Hot Module Replacement**: Desenvolvimento em tempo real
- **Source Maps**: Debug facilitado
- **Tree Shaking**: Otimização automática de bundle
- **Integração SQL**: Scripts de configuração do banco

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

## Funcionalidades Implementadas

### Integração com Banco de Dados
- ✅ **Supabase**: Integração completa implementada
- ✅ **PostgreSQL**: Banco de dados relacional em produção
- ✅ **Autenticação Real**: Supabase Auth implementado
- ✅ **Storage**: Upload de arquivos e documentos
- ✅ **RLS**: Row Level Security configurado

### Sistema de Atendimentos
- ✅ **Chat em Tempo Real**: Interface estilo WhatsApp
- ✅ **Upload de Arquivos**: Documentos e imagens
- ✅ **Filtros Avançados**: Para administradores
- ✅ **Perfis de Usuário**: Operador vs Admin
- ✅ **Realocação**: Transferência de atendimentos
- ✅ **Priorização**: Automática baseada em tempo

## Funcionalidades Futuras

### Integrações Planejadas
- **WhatsApp API**: Integração com WhatsApp Business
- **IA/Chatbot**: Respostas automáticas inteligentes
- **Webhooks**: Notificações externas

### Melhorias Planejadas
- **Notificações Push**: Alertas em tempo real no navegador
- **Relatórios**: Dashboard de métricas e KPIs
- **Exportação**: Dados em PDF/Excel
- **Temas**: Modo escuro/claro
- **Mobile App**: Versão para dispositivos móveis

### Segurança Futura
- **2FA**: Autenticação de dois fatores
- **Logs de Auditoria**: Rastreamento completo de ações
- **Criptografia Avançada**: Proteção adicional de dados sensíveis

## Arquitetura de Serviços

### Camada de Abstração
O projeto utiliza uma arquitetura em camadas com serviços especializados:

#### Services Layer
- **Responsabilidade**: Comunicação com Supabase e lógica de negócio
- **Localização**: `src/services/`
- **Padrão**: Cada entidade possui seu próprio service

#### Principais Serviços

1. **atendimentosService.js**
   - CRUD de atendimentos
   - Busca por operador (filtrada) ou global (admin)
   - Busca por status específico para administradores (independente do operador)
   - Cálculo automático de prioridades
   - Gerenciamento de status

2. **mensagensService.js**
   - Envio e recebimento de mensagens
   - Upload de arquivos com integração ao Storage
   - Histórico de conversas
   - Webhooks para WhatsApp

3. **operadoresService.js**
   - Gerenciamento de operadores
   - Validação de senhas de habilitação
   - Controle de perfis (Admin/Operador)

4. **storageService.js**
   - Upload de arquivos para Supabase Storage
   - Políticas de segurança (RLS)
   - Suporte a imagens e documentos
   - URLs públicas seguras

### Integração com Supabase

#### Configuração
- **Arquivo**: `src/lib/supabase.js`
- **Funcionalidades**: Cliente Supabase configurado
- **Segurança**: Variáveis de ambiente para credenciais

#### Scripts SQL
Scripts de configuração do banco localizados na raiz:
- `sql-functions.sql`: Funções customizadas
- `storage-policies.sql`: Políticas de acesso
- `add-mensagens-columns.sql`: Estrutura de mensagens

## Suporte e Manutenção

### Logs e Debug
- Console detalhado para debug de desenvolvimento
- Logs estruturados por serviço
- Monitoramento de erros de Supabase

### Performance
- Queries otimizadas com indexação
- Upload assíncrono de arquivos
- Carregamento lazy de dados

### Atualizações
- Versionamento semântico
- Scripts SQL de migração
- Deploy automatizado via Netlify

### Configuração Requerida

#### Variáveis de Ambiente
```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_supabase
```

#### Banco de Dados
Execute os scripts SQL na seguinte ordem:
1. `sql-functions.sql`
2. `storage-policies.sql`  
3. `add-mensagens-columns.sql`

---

**Desenvolvido por FF Consultoria TECH** | **Versão 0.0.16** | **2025**

*Documentação atualizada em: Janeiro 2025*  
*Última funcionalidade adicionada: Magic Link e Trigger Automático*