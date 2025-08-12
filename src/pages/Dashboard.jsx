import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './PageStyles.css';
import './Dashboard.css';

const Dashboard = () => {
  const { user, atendimentoHabilitado, setAtendimentoHabilitado, atendimentoPausado, setAtendimentoPausado } = useAuth();

  // Estados locais para modais e controles
  const [modalHabilitacao, setModalHabilitacao] = useState(false);
  const [senhaGerada, setSenhaGerada] = useState('');
  const [senhaDigitada, setSenhaDigitada] = useState(['', '', '', '', '', '']);
  const [verificandoSenha, setVerificandoSenha] = useState(false);
  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(40 * 60); // 40 minutos em segundos
  const [intervaloPausa, setIntervaloPausa] = useState(null);
  const [modalInformacoes, setModalInformacoes] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [modalNovoAtendimento, setModalNovoAtendimento] = useState(false);
  const [tempoRestanteAceitar, setTempoRestanteAceitar] = useState(45);
  const [novoAtendimentoData, setNovoAtendimentoData] = useState(null);
  const [intervalAceitar, setIntervalAceitar] = useState(null);
  const [modalEditarNome, setModalEditarNome] = useState(false);
  const [novoNomeCliente, setNovoNomeCliente] = useState('');
  const [novaObservacao, setNovaObservacao] = useState('');
  const [observacoes, setObservacoes] = useState([
    {
      id: 1,
      texto: 'Cliente relatou problema com pedido #12345. Verificado status do pedido e informado prazo de entrega. Cliente satisfeito com o atendimento.',
      data: new Date('2024-01-15T14:25:00'),
      operador: 'Carlos Santos'
    }
  ]);

  // Mock de novos atendimentos para aceitar
  const novosAtendimentosMock = [
    {
      id: 'ATD-2024-009',
      nome: 'Maria Fernanda',
      telefone: '+55 11 98888-7777',
      avatar: 'MF',
      status: 'novo',
      statusTexto: 'Novo',
      horario: '10:15',
      ultimaMensagem: 'Olá, preciso de ajuda com meu seguro',
      online: true,
      conversas: [
        { tipo: 'cliente', mensagem: 'Olá, preciso de ajuda com meu seguro', horario: '10:15' },
        { tipo: 'ia', mensagem: 'Olá Maria! Como posso ajudá-la com seu seguro?', horario: '10:16' }
      ]
    },
    {
      id: 'ATD-2024-010',
      nome: 'Roberto Santos',
      telefone: '+55 11 97777-6666',
      avatar: 'RS',
      status: 'aguardando',
      statusTexto: 'Aguardando',
      horario: '10:20',
      ultimaMensagem: 'Quero fazer um empréstimo urgente',
      online: false,
      conversas: [
        { tipo: 'cliente', mensagem: 'Quero fazer um empréstimo urgente', horario: '10:20' },
        { tipo: 'ia', mensagem: 'Olá Roberto! Vou te ajudar com o empréstimo. Qual valor precisa?', horario: '10:21' },
        { tipo: 'cliente', mensagem: 'Preciso de R$ 50.000 para quitar dívidas', horario: '10:22' }
      ]
    }
  ];

  // Mock de dados dos atendimentos
  const [atendimentos, setAtendimentos] = useState([
    {
      id: 'ATD-2024-001',
      nome: 'João da Silva',
      telefone: '+55 11 99999-9999',
      avatar: 'JS',
      ultimaMensagem: 'Gostaria de informações sobre meu seguro de vida',
      horario: '14:30',
      status: 'em-andamento',
      statusTexto: 'Em andamento',
      online: true,
      ativo: true
    },
    {
      id: 'ATD-2024-002',
      nome: 'Maria Santos',
      telefone: '+55 11 98888-8888',
      avatar: 'MS',
      ultimaMensagem: 'Perfeito! Muito obrigada pelo suporte. Problema resolvido! 😊',
      horario: '13:45',
      status: 'finalizado',
      statusTexto: 'Finalizado',
      online: false,
      ativo: false
    },
    {
      id: 'ATD-2024-003',
      nome: 'Ana Paula Rodrigues',
      telefone: '+55 11 97777-7777',
      avatar: 'AR',
      ultimaMensagem: 'Preciso de informações sobre crédito consignado',
      horario: '12:20',
      status: 'aguardando',
      statusTexto: 'Aguardando',
      online: true,
      ativo: false
    },
    {
      id: 'ATD-2024-004',
      nome: 'Carlos Oliveira',
      telefone: '+55 11 96666-6666',
      avatar: 'CO',
      ultimaMensagem: 'Bom dia! Gostaria de informações sobre precatório',
      horario: '11:15',
      status: 'novo',
      statusTexto: 'Novo',
      online: true,
      ativo: false
    },
    {
      id: 'ATD-2024-005',
      nome: 'Fernanda Costa Lima',
      telefone: '+55 11 95555-5555',
      avatar: 'FL',
      ultimaMensagem: 'Meu seguro auto foi recusado. Podem verificar?',
      horario: '10:30',
      status: 'em-andamento',
      statusTexto: 'Em andamento',
      online: false,
      ativo: false
    },
    {
      id: 'ATD-2024-006',
      nome: 'Roberto Mendes',
      telefone: '+55 11 94444-4444',
      avatar: 'RM',
      ultimaMensagem: 'Preciso de reembolso do meu precatório urgente',
      horario: '09:45',
      status: 'aguardando',
      statusTexto: 'Aguardando',
      online: true,
      ativo: false
    },
    {
      id: 'ATD-2024-007',
      nome: 'Juliana Pereira',
      telefone: '+55 11 93333-3333',
      avatar: 'JP',
      ultimaMensagem: 'Olá! Como faço para contratar crédito pessoal?',
      horario: '09:12',
      status: 'novo',
      statusTexto: 'Novo',
      online: true,
      ativo: false
    },
    {
      id: 'ATD-2024-008',
      nome: 'Eduardo Silva',
      telefone: '+55 11 92222-2222',
      avatar: 'ES',
      ultimaMensagem: 'Excelente atendimento! Recomendo a todos. Muito satisfeito.',
      horario: 'Ontem',
      status: 'finalizado',
      statusTexto: 'Finalizado',
      online: false,
      ativo: false
    }
  ]);

  // Mock de conversas para cada atendimento
  const conversas = {
    'ATD-2024-001': [
      { tipo: 'cliente', mensagem: 'Olá, gostaria de informações sobre meu seguro de vida', horario: '14:25' },
      { tipo: 'ia', mensagem: 'Olá! Sou a assistente virtual. Como posso ajudá-lo com seu seguro?', horario: '14:26' },
      { tipo: 'cliente', mensagem: 'Preciso saber sobre a cobertura e valores', horario: '14:27' },
      { tipo: 'ia', mensagem: 'Vou verificar os detalhes do seu seguro. Um momento...', horario: '14:28' },
      { tipo: 'operador', mensagem: 'Olá João! Sou o operador Carlos. Seu seguro tem cobertura completa de R$ 100.000. Posso detalhar?', horario: '14:30' },
      { tipo: 'cliente', mensagem: 'Sim, por favor. Quero entender melhor os benefícios', horario: '14:31' }
    ],
    'ATD-2024-002': [
      { tipo: 'cliente', mensagem: 'Gostaria de saber sobre o status do meu seguro', horario: '13:45' },
      { tipo: 'ia', mensagem: 'Olá Maria! Vou verificar o status do seu seguro.', horario: '13:46' },
      { tipo: 'cliente', mensagem: 'Fiz o pagamento ontem, quando fica ativo?', horario: '13:47' },
      { tipo: 'operador', mensagem: 'Olá Maria! Seu seguro já está ativo. O pagamento foi processado com sucesso.', horario: '13:50' },
      { tipo: 'cliente', mensagem: 'Perfeito! Obrigada pelo esclarecimento', horario: '13:51' }
    ],
    'ATD-2024-003': [
      { tipo: 'cliente', mensagem: 'Preciso de informações sobre crédito consignado', horario: '13:20' },
      { tipo: 'ia', mensagem: 'Olá! Posso ajudá-lo com informações sobre crédito consignado.', horario: '13:21' },
      { tipo: 'cliente', mensagem: 'Qual a taxa de juros atual?', horario: '13:22' },
      { tipo: 'ia', mensagem: 'Conectando você com um especialista em crédito...', horario: '13:23' },
      { tipo: 'operador', mensagem: 'Olá Ana Paula! As taxas variam de 1,2% a 2,1% ao mês. Posso simular para você?', horario: '13:25' }
    ],
    'ATD-2024-004': [
      { tipo: 'cliente', mensagem: 'Bom dia! Gostaria de informações sobre precatório', horario: '11:15' },
      { tipo: 'ia', mensagem: 'Bom dia! Posso ajudá-lo com informações sobre precatórios.', horario: '11:16' },
      { tipo: 'cliente', mensagem: 'Tenho um precatório do INSS, vocês fazem antecipação?', horario: '11:17' },
      { tipo: 'operador', mensagem: 'Sim Carlos! Fazemos antecipação de precatórios. Preciso de alguns dados para análise.', horario: '11:20' },
      { tipo: 'cliente', mensagem: 'Que documentos preciso enviar?', horario: '11:21' }
    ],
    'ATD-2024-005': [
      { tipo: 'cliente', mensagem: 'Meu seguro auto foi recusado. Podem verificar?', horario: '10:30' },
      { tipo: 'ia', mensagem: 'Olá Fernanda! Vou verificar o motivo da recusa do seu seguro auto.', horario: '10:31' },
      { tipo: 'cliente', mensagem: 'Não entendi o motivo, meu carro é novo', horario: '10:32' },
      { tipo: 'operador', mensagem: 'Fernanda, verifiquei aqui. Foi um erro no sistema. Vou reprocessar sua solicitação.', horario: '10:35' },
      { tipo: 'cliente', mensagem: 'Obrigada! Quando terei uma resposta?', horario: '10:36' },
      { tipo: 'operador', mensagem: 'Em até 24 horas você receberá a aprovação por email.', horario: '10:37' }
    ],
    'ATD-2024-006': [
      { tipo: 'cliente', mensagem: 'Preciso de reembolso do meu precatório urgente', horario: '09:45' },
      { tipo: 'ia', mensagem: 'Olá Roberto! Entendo a urgência. Vou conectá-lo com um especialista.', horario: '09:46' },
      { tipo: 'operador', mensagem: 'Roberto, analisei seu caso. O reembolso será processado em 2 dias úteis.', horario: '09:50' },
      { tipo: 'cliente', mensagem: 'Preciso mais rápido, é uma emergência médica', horario: '09:51' },
      { tipo: 'operador', mensagem: 'Entendo. Vou acelerar o processo. Será liberado ainda hoje.', horario: '09:52' },
      { tipo: 'cliente', mensagem: 'Muito obrigado! Vocês salvaram minha vida', horario: '09:53' }
    ],
    'ATD-2024-007': [
      { tipo: 'cliente', mensagem: 'Olá! Como faço para contratar crédito pessoal?', horario: '09:12' },
      { tipo: 'ia', mensagem: 'Olá Juliana! Posso ajudá-la com o crédito pessoal. Qual valor precisa?', horario: '09:13' },
      { tipo: 'cliente', mensagem: 'Preciso de R$ 15.000 para reformar minha casa', horario: '09:14' },
      { tipo: 'operador', mensagem: 'Juliana, temos opções excelentes! Taxa a partir de 2,5% ao mês. Quer simular?', horario: '09:17' },
      { tipo: 'cliente', mensagem: 'Sim, por favor! Qual documentação preciso?', horario: '09:18' }
    ],
    'ATD-2024-008': [
      { tipo: 'cliente', mensagem: 'Problema resolvido, obrigada!', horario: '08:45' },
      { tipo: 'operador', mensagem: 'Que bom Eduardo! Fico feliz em ter ajudado com seu seguro residencial.', horario: '08:46' },
      { tipo: 'cliente', mensagem: 'O atendimento foi excelente, muito obrigado', horario: '08:47' },
      { tipo: 'operador', mensagem: 'Obrigado pelo feedback! Estamos sempre à disposição.', horario: '08:48' }
    ]
  };

  // Função para selecionar atendimento
  const selecionarAtendimento = (atendimento) => {
    setAtendimentoSelecionado(atendimento);
  };

  // Função para salvar novo nome do cliente
  const salvarNomeCliente = () => {
    if (novoNomeCliente.trim() && atendimentoSelecionado) {
      console.log('Alterando nome do cliente', atendimentoSelecionado.id, 'para', novoNomeCliente);
      // Aqui seria a lógica para salvar o novo nome na API
      // Por enquanto, vamos atualizar localmente
      setAtendimentoSelecionado({
        ...atendimentoSelecionado,
        nome: novoNomeCliente
      });
      setModalEditarNome(false);
      setNovoNomeCliente('');
    }
  };

  // Função para cancelar edição de nome
  const cancelarEdicaoNome = () => {
    setModalEditarNome(false);
    setNovoNomeCliente('');
  };

  // Função para filtrar atendimentos
  const atendimentosFiltrados = atendimentos.filter(atendimento => {
    // Filtro por status
    const passaFiltroStatus = filtroStatus === 'todos' || atendimento.status === filtroStatus;

    // Filtro por busca de texto
    const passaFiltroBusca = !termoBusca || (() => {
      const termo = termoBusca.toLowerCase();
      return (
        atendimento.id.toLowerCase().includes(termo) ||
        atendimento.nome.toLowerCase().includes(termo) ||
        atendimento.telefone.toLowerCase().includes(termo) ||
        atendimento.status.toLowerCase().includes(termo) ||
        atendimento.statusTexto.toLowerCase().includes(termo)
      );
    })();

    return passaFiltroStatus && passaFiltroBusca;
  });

  // Resetar status de atendimento sempre que o usuário fizer login
  useEffect(() => {
    if (user) {
      setAtendimentoHabilitado(false);
    }
  }, [user]);

  // Selecionar o primeiro atendimento por padrão
  useEffect(() => {
    if (atendimentos.length > 0 && !atendimentoSelecionado) {
      setAtendimentoSelecionado(atendimentos[0]);
    }
  }, [atendimentos, atendimentoSelecionado]);

  // Efeito para gerenciar o timer de pausa
  useEffect(() => {
    if (atendimentoPausado && tempoRestante > 0) {
      const intervalo = setInterval(() => {
        setTempoRestante(prev => {
          if (prev <= 1) {
            // Tempo esgotado - desconectar usuário
            setAtendimentoHabilitado(false);
            setAtendimentoPausado(false);
            setModalConfirmacao(false);
            alert('Tempo esgotado! Você foi desconectado e precisará se habilitar novamente.');
            return 40 * 60; // Reset para 40 minutos
          }
          return prev - 1;
        });
      }, 1000);

      setIntervaloPausa(intervalo);
      return () => clearInterval(intervalo);
    }
  }, [atendimentoPausado]);

  // Função para gerar senha aleatória de 6 caracteres (garantindo pelo menos 1 letra e 1 número)
  const gerarSenhaAleatoria = () => {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numeros = '0123456789';
    const todosCaracteres = letras + numeros;

    let senha = '';

    // Garantir pelo menos 1 letra
    senha += letras.charAt(Math.floor(Math.random() * letras.length));

    // Garantir pelo menos 1 número
    senha += numeros.charAt(Math.floor(Math.random() * numeros.length));

    // Completar com 4 caracteres aleatórios
    for (let i = 2; i < 6; i++) {
      senha += todosCaracteres.charAt(Math.floor(Math.random() * todosCaracteres.length));
    }

    // Embaralhar a senha para não ter padrão fixo
    return senha.split('').sort(() => Math.random() - 0.5).join('');
  };

  // Função para abrir modal de habilitação
  const abrirModalHabilitacao = () => {
    const novaSenha = gerarSenhaAleatoria();
    setSenhaGerada(novaSenha);
    setSenhaDigitada(['', '', '', '', '', '']);
    setModalHabilitacao(true);
  };

  // Função para fechar modal de habilitação
  const fecharModalHabilitacao = () => {
    setModalHabilitacao(false);
    setSenhaGerada('');
    setSenhaDigitada(['', '', '', '', '', '']);
    setVerificandoSenha(false);
  };

  // Função para atualizar senha digitada
  const atualizarSenhaDigitada = (index, valor) => {
    if (valor.length <= 1 && /^[A-Z0-9]*$/.test(valor.toUpperCase())) {
      const novaSenha = [...senhaDigitada];
      novaSenha[index] = valor.toUpperCase();
      setSenhaDigitada(novaSenha);

      // Focar no próximo campo se não for o último
      if (valor && index < 5) {
        const proximoCampo = document.getElementById(`senha-${index + 1}`);
        if (proximoCampo) proximoCampo.focus();
      }
    }
  };

  // Função para verificar senha e habilitar atendimento
  const verificarSenha = async () => {
    const senhaCompleta = senhaDigitada.join('');

    if (senhaCompleta.length !== 6) {
      alert('Por favor, digite todos os 6 caracteres da senha.');
      return;
    }

    setVerificandoSenha(true);

    try {
      // Simular delay de verificação
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (senhaCompleta === senhaGerada) {
        setAtendimentoHabilitado(true);
        alert('Atendimento habilitado com sucesso!');
        fecharModalHabilitacao();
      } else {
        alert('Senha incorreta. Tente novamente.');
        setSenhaDigitada(['', '', '', '', '', '']);
        // Focar no primeiro campo
        const primeiroCampo = document.getElementById('senha-0');
        if (primeiroCampo) primeiroCampo.focus();
      }
    } catch (error) {
      alert('Erro ao verificar senha. Tente novamente.');
    } finally {
      setVerificandoSenha(false);
    }
  };

  // Função para pausar atendimentos
  const pausarAtendimentos = () => {
    setAtendimentoPausado(true);
    setTempoRestante(40 * 60); // Reset para 40 minutos
  };

  // Função para abrir modal de confirmação
  const abrirModalConfirmacao = () => {
    setModalConfirmacao(true);
  };

  // Função para retomar atendimentos
  const retomarAtendimentos = () => {
    setAtendimentoPausado(false);
    setModalConfirmacao(false);
    if (intervaloPausa) {
      clearInterval(intervaloPausa);
      setIntervaloPausa(null);
    }
  };

  // Função para fechar modal de confirmação
  const fecharModalConfirmacao = () => {
    setModalConfirmacao(false);
  };

  // Função para formatar tempo em MM:SS
  const formatarTempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  // Função para abrir modal de novo atendimento
  const abrirModalNovoAtendimento = () => {
    // Seleciona um atendimento aleatório dos mocks
    const atendimentoAleatorio = novosAtendimentosMock[Math.floor(Math.random() * novosAtendimentosMock.length)];
    setNovoAtendimentoData(atendimentoAleatorio);
    setModalNovoAtendimento(true);
    setTempoRestanteAceitar(45);

    // Inicia o timer
    const interval = setInterval(() => {
      setTempoRestanteAceitar(prev => {
        if (prev <= 1) {
          // Tempo esgotado - fecha a modal
          setModalNovoAtendimento(false);
          setNovoAtendimentoData(null);
          clearInterval(interval);
          setIntervalAceitar(null);
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    setIntervalAceitar(interval);
  };

  // Função para aceitar o atendimento
  const aceitarAtendimento = () => {
    if (novoAtendimentoData) {
      // Adiciona o novo atendimento à lista
      setAtendimentos(prev => [novoAtendimentoData, ...prev]);

      // Fecha a modal
      setModalNovoAtendimento(false);
      setNovoAtendimentoData(null);

      // Para o timer
      if (intervalAceitar) {
        clearInterval(intervalAceitar);
        setIntervalAceitar(null);
      }

      setTempoRestanteAceitar(45);
    }
  };

  // Função para adicionar nova observação
  const adicionarObservacao = () => {
    if (novaObservacao.trim()) {
      const novaObs = {
        id: observacoes.length + 1,
        texto: novaObservacao.trim(),
        data: new Date(),
        operador: user?.nome || 'Operador Atual'
      };
      setObservacoes(prev => [novaObs, ...prev]);
      setNovaObservacao('');
    }
  };

  // Função para formatar data e hora
  const formatarDataHora = (data) => {
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Função para lidar com Enter no input de observação
  const handleKeyPressObservacao = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      adicionarObservacao();
    }
  };

  // Função para rejeitar o atendimento
  const rejeitarAtendimento = () => {
    setModalNovoAtendimento(false);
    setNovoAtendimentoData(null);

    // Para o timer
    if (intervalAceitar) {
      clearInterval(intervalAceitar);
      setIntervalAceitar(null);
    }

    setTempoRestanteAceitar(45);
  };

  // Limpa o interval quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (intervalAceitar) {
        clearInterval(intervalAceitar);
      }
    };
  }, [intervalAceitar]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Atendimentos</h1>
            <p className="page-description">Gerencie todos os atendimentos do sistema</p>
          </div>
          <div className="header-actions">
            <div className="status-indicator">
            </div>
            <div className="action-buttons">
              <button
                className="btn-primary"
                onClick={abrirModalHabilitacao}
                disabled={atendimentoHabilitado}
              >
                Habilitar Atendimento
              </button>

              <button
                className="btn-aceitar-atendimento"
                onClick={abrirModalNovoAtendimento}
                disabled={!atendimentoHabilitado}
              >
                Aceitar Atendimento
              </button>

              {!atendimentoPausado ? (
                <button
                  className="btn-warning"
                  onClick={pausarAtendimentos}
                  disabled={!atendimentoHabilitado}
                >
                  Pausar Atendimentos
                </button>
              ) : (
                <button
                  className="btn-timer"
                  onClick={abrirModalConfirmacao}
                >
                  Atendimento Pausado {formatarTempo(tempoRestante)}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="page-content-dashboard">
        <div className="whatsapp-layout">
          {/* Coluna Esquerda - Lista de Atendimentos */}
          <div className={`atendimentos-sidebar ${!atendimentoHabilitado ? 'disabled' : ''}`}>
            <div className="sidebar-header">
              <h3>Atendimentos</h3>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Buscar por ID, número ou status..."
                  className="search-input"
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  disabled={!atendimentoHabilitado}
                />
              </div>
            </div>

            {/* Filtros de Status */}
            <div className="status-filters">
              <div className="filter-tabs">
                <button
                  className={`filter-tab ${filtroStatus === 'todos' ? 'active' : ''}`}
                  onClick={() => setFiltroStatus('todos')}
                  disabled={!atendimentoHabilitado}
                >
                  Todos
                </button>
                <button
                  className={`filter-tab ${filtroStatus === 'novo' ? 'active' : ''}`}
                  onClick={() => setFiltroStatus('novo')}
                  disabled={!atendimentoHabilitado}
                >
                  Novos
                </button>
                <button
                  className={`filter-tab ${filtroStatus === 'em-andamento' ? 'active' : ''}`}
                  onClick={() => setFiltroStatus('em-andamento')}
                  disabled={!atendimentoHabilitado}
                >
                  Em Andamento
                </button>
                <button
                  className={`filter-tab ${filtroStatus === 'aguardando' ? 'active' : ''}`}
                  onClick={() => setFiltroStatus('aguardando')}
                  disabled={!atendimentoHabilitado}
                >
                  Aguardando
                </button>
                <button
                  className={`filter-tab ${filtroStatus === 'finalizado' ? 'active' : ''}`}
                  onClick={() => setFiltroStatus('finalizado')}
                  disabled={!atendimentoHabilitado}
                >
                  Finalizados
                </button>
              </div>
            </div>

            {!atendimentoHabilitado && (
              <div className="atendimentos-disabled-overlay">
                <div className="disabled-message">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                  </svg>
                  <h4>Atendimentos Desabilitados</h4>
                  <p>Você precisa se habilitar para acessar a lista de atendimentos</p>
                </div>
              </div>
            )}

            <div className={`atendimentos-list ${!atendimentoHabilitado ? 'disabled' : ''}`}>
              {atendimentosFiltrados.length > 0 ? (
                atendimentosFiltrados.map((atendimento) => (
                  <div
                    key={atendimento.id}
                    className={`atendimento-item ${atendimentoSelecionado?.id === atendimento.id ? 'active' : ''}`}
                    onClick={() => selecionarAtendimento(atendimento)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="atendimento-avatar">
                      <span>{atendimento.avatar}</span>
                    </div>
                    <div className="atendimento-info">
                      <div className="atendimento-header">
                        <div className="atendimento-nome-id">
                          <span className="atendimento-nome">{atendimento.nome}</span>
                          <span className="atendimento-id">#{atendimento.id}</span>
                        </div>
                        <span className="atendimento-time">{atendimento.horario}</span>
                      </div>
                      <div className="atendimento-preview">
                        <span className="last-message">{atendimento.ultimaMensagem}</span>
                        <span className={`status-badge status-${atendimento.status}`}>{atendimento.statusTexto}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results">
                  <div className="no-results-content">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="M21 21l-4.35-4.35"></path>
                    </svg>
                    <h4>Nenhum atendimento encontrado</h4>
                    <p>Tente buscar por outro termo</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita - Chat */}
          <div className={`chat-container ${!atendimentoHabilitado ? 'disabled' : ''}`}>
            {!atendimentoHabilitado && (
              <div className="chat-disabled-overlay">
                <div className="disabled-message">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                  </svg>
                  <h4>Chat Desabilitado</h4>
                  <p>Habilite-se para iniciar conversas</p>
                </div>
              </div>
            )}
            <div className="chat-header">
              <div className="chat-user-info">
                <div className="chat-avatar">
                  <span>{atendimentoSelecionado?.avatar || 'JS'}</span>
                </div>
                <div className="chat-details">
                  <div className="chat-nome-id">
                    <div className="nome-container-dashboard">
                      <h4>{atendimentoSelecionado?.nome || 'João da Silva'}</h4>
                      <button 
                        className="btn-edit-nome-dashboard"
                        onClick={() => {
                          setNovoNomeCliente(atendimentoSelecionado?.nome || 'João da Silva');
                          setModalEditarNome(true);
                        }}
                        title="Editar nome do cliente"
                      >
                        ✏️
                      </button>
                    </div>
                    <span className="chat-atendimento-id">#{atendimentoSelecionado?.id || 'ATD-2024-001'}</span>
                  </div>
                  <span className="phone-number">{atendimentoSelecionado?.telefone || '+55 11 99999-9999'}</span>
                 
                </div>
              </div>
              <div className="chat-actions">
                <button className="btn-action btn-info" title="Informações" onClick={() => setModalInformacoes(true)}>
                  Informações
                </button>
                <button className="btn-action btn-encerrar" title="Encerrar Atendimento">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"></path>
                  </svg>
                  Encerrar
                </button>
              </div>
            </div>

            <div className="chat-messages">
              {/* Mensagens do chat */}
              {atendimentoSelecionado && conversas[atendimentoSelecionado.id] ? (
                conversas[atendimentoSelecionado.id].map((mensagem, index) => {
                  // Função para obter o label da role
                  const getRoleLabel = (tipo) => {
                    switch (tipo) {
                      case 'ia': return 'Agente IA';
                      case 'operador': return 'Operador';
                      case 'cliente': return 'Cliente';
                      default: return 'Sistema';
                    }
                  };

                  return (
                    <div key={index} className="message-group">
                      <div className={`message ${mensagem.tipo}`}>
                        <div className="message-content">
                          <div className={`message-role-label ${mensagem.tipo}`}>
                            {getRoleLabel(mensagem.tipo)}
                          </div>
                          <p>{mensagem.mensagem}</p>
                          <span className="message-time">{mensagem.horario}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-chat-selected">
                  <div className="no-chat-content">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <h4>Selecione um atendimento</h4>
                    <p>Escolha um atendimento da lista para visualizar a conversa</p>
                  </div>
                </div>
              )}
            </div>

            <div className="chat-input-container">
              <div className="input-actions">
                <button className="btn-attachment" title="Enviar arquivo">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"></path>
                  </svg>
                </button>
              </div>
              <div className="message-input-wrapper">
                <textarea
                  placeholder="Digite sua mensagem..."
                  className="message-input"
                  rows="1"
                ></textarea>
              </div>
              <button className="btn-send">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22,2 15,22 11,13 2,9"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Habilitar Atendimento */}
      {modalHabilitacao && (
        <div className="modal-overlay" onClick={fecharModalHabilitacao}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Habilitar Atendimento</h3>
              <button className="modal-close" onClick={fecharModalHabilitacao}>×</button>
            </div>
            <div className="modal-body">
              <div className="habilitacao-content">
                <div className="senha-gerada">
                  <h4>Senha de Acesso:</h4>
                  <div className="senha-display">
                    {senhaGerada.split('').map((char, index) => (
                      <span key={index} className="senha-char">{char}</span>
                    ))}
                  </div>
                  <p className="senha-instrucao">Digite a senha acima nos campos abaixo:</p>
                </div>

                <div className="senha-input">
                  <div className="passcode-container">
                    {senhaDigitada.map((char, index) => (
                      <input
                        key={index}
                        id={`senha-${index}`}
                        type="text"
                        className="passcode-field"
                        value={char}
                        onChange={(e) => atualizarSenhaDigitada(index, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !char && index > 0) {
                            const campoAnterior = document.getElementById(`senha-${index - 1}`);
                            if (campoAnterior) campoAnterior.focus();
                          }
                        }}
                        maxLength={1}
                        disabled={verificandoSenha}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-form-type="other"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={fecharModalHabilitacao}
                  disabled={verificandoSenha}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={verificarSenha}
                  disabled={verificandoSenha || senhaDigitada.join('').length !== 6}
                >
                  {verificandoSenha ? 'Verificando...' : 'Habilitar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Retomar Atendimentos */}
      {modalConfirmacao && (
        <div className="modal-overlay" onClick={fecharModalConfirmacao}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Retomar Atendimentos</h3>
              <button className="modal-close" onClick={fecharModalConfirmacao}>×</button>
            </div>
            <div className="modal-body">
              <div className="confirmacao-content">
                <div className="confirmacao-message">
                  <p className="confirmacao-texto">
                    Deseja retomar os atendimentos agora?
                  </p>
                  <p className="confirmacao-info">
                    Tempo restante: <strong>{formatarTempo(tempoRestante)}</strong>
                  </p>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={fecharModalConfirmacao}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={retomarAtendimentos}
                >
                  Retomar Atendimentos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Informações do Atendimento */}
      {modalInformacoes && (
        <div className="modal-overlay">
          <div className="modal-content-info modal-informacoes">
            <div className="modal-header">
              <h3>Informações do Atendimento</h3>
              <button
                className="modal-close"
                onClick={() => setModalInformacoes(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="info-container-split">
                <div className="info-section">
                  <h4>Dados do Cliente</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Nome:</label>
                      <span>João da Silva</span>
                    </div>
                    <div className="info-item">
                      <label>Telefone:</label>
                      <span>+55 11 99999-9999</span>
                    </div>
                    <div className="info-item">
                      <label>E-mail:</label>
                      <span>joao.silva@email.com</span>
                    </div>
                    <div className="info-item">
                      <label>Status:</label>
                      <span className="status-badge status-em-andamento">Em andamento</span>
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <h4>Detalhes do Atendimento</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>ID do Atendimento:</label>
                      <span>#ATD-2024-001</span>
                    </div>
                    <div className="info-item">
                      <label>Data de Início:</label>
                      <span>15/01/2024 às 14:25</span>
                    </div>
                    <div className="info-item">
                      <label>Operador Responsável:</label>
                      <span>Carlos Santos</span>
                    </div>
                    <div className="info-item">
                      <label>Categoria:</label>
                      <span>Seguro</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h4>Descrição do Atendimento</h4>
                <div className="descricao-atendimento">
                  <p>Cliente relatou problema com pedido #12345. Verificado status do pedido e informado prazo de entrega. Cliente satisfeito com o atendimento.</p>
                </div>
              </div>

              <div className="info-section">
                <h4>Observações</h4>
                <div className="observacoes-input-container">
                  <div className="input-group">
                    <textarea
                      value={novaObservacao}
                      onChange={(e) => setNovaObservacao(e.target.value)}
                      onKeyPress={handleKeyPressObservacao}
                      placeholder="Digite uma nova observação..."
                      className="observacao-input"
                      spellCheck={true}
                      autoCorrect="on"
                      autoComplete="on"
                      lang="pt-BR"
                      rows="3"
                    />
                    <button
                      onClick={adicionarObservacao}
                      className="btn-adicionar-observacao"
                      disabled={!novaObservacao.trim()}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
                
                <div className="observacoes-timeline">
                  {observacoes.length > 0 ? (
                    observacoes.map((obs) => (
                      <div key={obs.id} className="timeline-item">
                        <div className="timeline-content">
                          <div className="timeline-header">
                            <span className="timeline-operador">{obs.operador}</span>
                            <span className="timeline-data">{formatarDataHora(obs.data)}</span>
                          </div>
                          <div className="timeline-texto">{obs.texto}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-observacoes">
                      <p>Nenhuma observação registrada ainda.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setModalInformacoes(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Novo Atendimento */}
      {modalNovoAtendimento && novoAtendimentoData && (
        <div className="modal-overlay">
          <div className="modal-aceitar-atendimento">
            <div className="modal-header">
              <h3>Novo Atendimento Disponível</h3>
              <div className="timer-aceitar">
                <span className="timer-text">Tempo restante: {tempoRestanteAceitar}s</span>
                <div className="timer-bar">
                  <div
                    className="timer-progress"
                    style={{ width: `${(tempoRestanteAceitar / 45) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="modal-body">
              <div className="cliente-info">
                <div className="cliente-avatar">{novoAtendimentoData.avatar}</div>
                <div className="cliente-dados">
                  <h4>{novoAtendimentoData.nome}</h4>
                  <p>{novoAtendimentoData.telefone}</p>
                  <span className={`status-badge ${novoAtendimentoData.status}`}>
                    {novoAtendimentoData.statusTexto}
                  </span>
                </div>
              </div>

              <div className="ultima-mensagem">
                <strong>Última mensagem:</strong>
                <p>"{novoAtendimentoData.ultimaMensagem}"</p>
                <span className="horario">{novoAtendimentoData.horario}</span>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn-rejeitar"
                onClick={rejeitarAtendimento}
              >
                Rejeitar
              </button>
              <button
                className="btn-aceitar"
                onClick={aceitarAtendimento}
              >
                Aceitar Atendimento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Nome do Cliente */}
      {modalEditarNome && (
        <div className="modal-overlay">
          <div className="modal-editar-nome-dashboard">
            <div className="modal-header">
              <h3>Editar Nome do Cliente</h3>
              <button 
                className="btn-close"
                onClick={cancelarEdicaoNome}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="cliente-info">
                <p><strong>Atendimento:</strong> {atendimentoSelecionado?.id || 'ATD-2024-001'}</p>
                <p><strong>Telefone:</strong> {atendimentoSelecionado?.telefone || '+55 11 99999-9999'}</p>
              </div>
              
              <div className="form-group">
                <label htmlFor="novoNomeCliente">Nome do Cliente:</label>
                <input
                  type="text"
                  id="novoNomeCliente"
                  value={novoNomeCliente}
                  onChange={(e) => setNovoNomeCliente(e.target.value)}
                  placeholder="Digite o novo nome"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-cancelar"
                onClick={cancelarEdicaoNome}
              >
                Cancelar
              </button>
              <button 
                className="btn-salvar"
                onClick={salvarNomeCliente}
                disabled={!novoNomeCliente.trim()}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;