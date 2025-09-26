import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { validarSenhaEHabilitar, listarTodosOperadores, buscarPorEmail, buscarPorId } from '../services/operadoresService';
import atendimentosService from '../services/atendimentosService';
import mensagensService from '../services/mensagensService';
import { categoriasService } from '../services/categoriasService';
import observacoesService from '../services/observacoesService';
import { uploadFile, createBucketIfNotExists } from '../services/storageService';
import { supabase } from '../lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip, faPaperPlane, faImage, faFile, faFilePdf, faDownload, faFileWord, faFileExcel, faFilePowerpoint, faFileArchive, faFileCode, faFileVideo, faFileAudio, faList, faPause, faClock, faCheck, faXmark, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
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
  const [modalNovoAtendimento, setModalNovoAtendimento] = useState(false);
  const [tempoRestanteAceitar, setTempoRestanteAceitar] = useState(45);
  const [novoAtendimentoData, setNovoAtendimentoData] = useState(null);
  const [intervalAceitar, setIntervalAceitar] = useState(null);
  const [modalEditarNome, setModalEditarNome] = useState(false);
  const [novoNomeCliente, setNovoNomeCliente] = useState('');
  
  // Estados para dados do banco
  const [atendimentos, setAtendimentos] = useState([]);
  const [atendimentosFiltrados, setAtendimentosFiltrados] = useState([]);
  const [mensagens, setMensagens] = useState({});
  const [novosAtendimentos, setNovosAtendimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [operadoresNomes, setOperadoresNomes] = useState({});
  const [categoriasNomes, setCategoriasNomes] = useState({});
  
  // Estados para filtros (apenas para Admin)
  const [isAdmin, setIsAdmin] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Estados para observações
  const [observacoes, setObservacoes] = useState([]);
  const [novaObservacao, setNovaObservacao] = useState('');
  const [carregandoObservacoes, setCarregandoObservacoes] = useState(false);
  
  // Estado para controlar mensagens não lidas
  const [atendimentosComNovasMensagens, setAtendimentosComNovasMensagens] = useState(new Set());
  const [ultimasContagensMensagens, setUltimasContagensMensagens] = useState({});
  
  // Estados para edição de email
  const [modalEditarEmail, setModalEditarEmail] = useState(false);
  const [novoEmail, setNovoEmail] = useState('');
  
  // Estado para o input de mensagem
  const [mensagemInput, setMensagemInput] = useState('');
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  
  // Estado para menu de anexos
  const [menuAnexosAberto, setMenuAnexosAberto] = useState(false);
  
  // Referência para scroll automático
  const messagesEndRef = useRef(null);

  // Carregar atendimentos do banco de dados
  useEffect(() => {
    carregarAtendimentos();
    carregarNovosAtendimentos();
    
    // Disponibilizar funções de teste no console
    window.supabase = supabase;
    window.testUploadDebug = {
      testSupabaseConnection: async () => {
        console.log('🔍 Testando conexão com Supabase...');
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.error('❌ Erro na conexão:', error);
            return false;
          }
          console.log('✅ Conexão com Supabase OK');
          return true;
        } catch (error) {
          console.error('❌ Erro na conexão:', error);
          return false;
        }
      },
      testBucketExists: async () => {
        console.log('🪣 Testando se bucket existe...');
        try {
          const { data: buckets, error } = await supabase.storage.listBuckets();
          if (error) {
            console.error('❌ Erro ao listar buckets:', error);
            return false;
          }
          const bucketExists = buckets.some(bucket => bucket.name === 'documents');
          console.log('📋 Buckets disponíveis:', buckets.map(b => b.name));
          console.log(`🪣 Bucket 'documents' existe: ${bucketExists}`);
          return bucketExists;
        } catch (error) {
          console.error('❌ Erro ao verificar bucket:', error);
          return false;
        }
      },
      testMensagensTable: async () => {
        console.log('📊 Testando estrutura da tabela mensagens...');
        try {
          const { data, error } = await supabase
            .from('mensagens')
            .select('id, type, document_name, file_size, file_type')
            .limit(1);
          if (error) {
            console.error('❌ Erro na estrutura da tabela:', error);
            console.log('💡 Execute o script add-mensagens-columns.sql no Supabase SQL Editor');
            return false;
          }
          console.log('✅ Estrutura da tabela mensagens OK');
          return true;
        } catch (error) {
          console.error('❌ Erro ao testar tabela:', error);
          return false;
        }
      },
      testFileUpload: async () => {
        console.log('📁 Testando upload de arquivo...');
        try {
          const testContent = 'Este é um arquivo de teste';
          const testFile = new File([testContent], 'teste.txt', { type: 'text/plain' });
          const { data, error } = await supabase.storage
            .from('documents')
            .upload(`test/${Date.now()}_teste.txt`, testFile);
          if (error) {
            console.error('❌ Erro no upload:', error);
            console.log('💡 Execute o script fix-storage-rls.sql no Supabase SQL Editor');
            return false;
          }
          console.log('✅ Upload de teste OK:', data);
          await supabase.storage.from('documents').remove([data.path]);
          return true;
        } catch (error) {
          console.error('❌ Erro ao testar upload:', error);
          return false;
        }
      },
      runAllTests: async () => {
        console.log('🚀 Executando todos os testes...');
        const tests = [
          { name: 'Conexão Supabase', fn: window.testUploadDebug.testSupabaseConnection },
          { name: 'Bucket Storage', fn: window.testUploadDebug.testBucketExists },
          { name: 'Tabela Mensagens', fn: window.testUploadDebug.testMensagensTable },
          { name: 'Upload de Arquivo', fn: window.testUploadDebug.testFileUpload }
        ];
        for (const test of tests) {
          console.log(`\n--- ${test.name} ---`);
          const result = await test.fn();
          if (!result) {
            console.log(`❌ Teste ${test.name} falhou!`);
            return false;
          }
        }
        console.log('\n✅ Todos os testes passaram!');
        return true;
      }
    };
    
    console.log('🔧 Funções de debug disponíveis:');
    console.log('- window.testUploadDebug.runAllTests() - Executa todos os testes');
    console.log('- window.testUploadDebug.testSupabaseConnection() - Testa conexão');
    console.log('- window.testUploadDebug.testBucketExists() - Verifica bucket');
    console.log('- window.testUploadDebug.testMensagensTable() - Verifica tabela');
    console.log('- window.testUploadDebug.testFileUpload() - Testa upload');
  }, []);

  // Fechar menu de anexos ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuAnexosAberto && !event.target.closest('.attachment-container')) {
        setMenuAnexosAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuAnexosAberto]);

  // useEffect para aplicar filtros quando os atendimentos mudarem
  useEffect(() => {
    if (atendimentos.length > 0) {
      aplicarFiltroStatus(filtroStatus);
    }
  }, [atendimentos]);

  // useEffect para aplicar filtros quando o termo de busca muda
  useEffect(() => {
    aplicarFiltroStatus(filtroStatus);
  }, [termoBusca]);

  const carregarAtendimentos = async () => {
    try {
      console.log('🔄 Iniciando carregamento de atendimentos...');
      setLoading(true);
      setError(null);
      
      if (!user?.email) {
        console.log('❌ Usuário não logado ou email não disponível');
        setError('Usuário não autenticado');
        return;
      }

      // Buscar dados do operador logado pelo email
      const operadorLogado = await buscarPorEmail(user.email);
      if (!operadorLogado || !operadorLogado.id) {
        console.log('❌ Operador não encontrado na base de dados');
        setError('Operador não encontrado. Verifique seu cadastro.');
        return;
      }

      console.log('👤 OPERADOR LOGADO ENCONTRADO:');
      console.log('   - Nome:', operadorLogado.nome);
      console.log('   - Email:', operadorLogado.email);
      console.log('   - ID:', operadorLogado.id);
      console.log('   - Perfil:', operadorLogado.perfil);
      console.log('   - Habilitado:', operadorLogado.habilitado);

      // Verificar se é admin
      const userIsAdmin = operadorLogado.perfil && operadorLogado.perfil.toLowerCase() === 'admin';
      setIsAdmin(userIsAdmin);

      let dados;
      if (userIsAdmin) {
        console.log('🔍 ADMIN DETECTADO - CARREGANDO TODOS OS ATENDIMENTOS:');
        // Se for admin, carregar todos os atendimentos
        dados = await atendimentosService.buscarTodos();
        console.log('📊 ADMIN - Total de atendimentos encontrados:', dados.length);
      } else {
        console.log('🔍 OPERADOR - CARREGANDO ATENDIMENTOS DO OPERADOR:');
        console.log('   - Operador ID para filtro:', operadorLogado.id);
        // Se for operador, carregar apenas os atendimentos do operador
        dados = await atendimentosService.buscarPorOperador(operadorLogado.id);
        console.log('📊 OPERADOR - Total de atendimentos encontrados:', dados.length);
      }
      
      console.log('📊 RESULTADO DA BUSCA DE ATENDIMENTOS:');
      console.log('   - Total encontrado:', dados.length);
      console.log('   - Tipo de usuário:', userIsAdmin ? 'Admin' : 'Operador');
      
      if (dados.length === 0) {
        console.log('⚠️ NENHUM ATENDIMENTO ENCONTRADO!');
        if (!userIsAdmin) {
          console.log('   - Possíveis causas:');
          console.log('     1. Operador não tem atendimentos atribuídos');
          console.log('     2. Atendimentos não estão nos status corretos');
          console.log('     3. Problema na query de busca');
        }
      }
      setAtendimentos(dados);
      setAtendimentosFiltrados(dados); // Inicialmente, sem filtro
      
      // Carregar nomes dos operadores e categorias para os atendimentos
      await carregarNomesOperadores(dados);
      await carregarNomesCategorias(dados);
    } catch (err) {
      console.error('❌ Erro ao carregar atendimentos:', err);
      console.error('📋 Detalhes do erro:', err.message);
      setError('Erro ao carregar atendimentos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const carregarNovosAtendimentos = async () => {
    try {
      console.log('🔄 Iniciando carregamento de novos atendimentos...');
      const novos = await atendimentosService.buscarNovosAtendimentos();
      console.log('✅ Novos atendimentos carregados:', novos);
      console.log('📊 Total de novos atendimentos:', novos.length);
      setNovosAtendimentos(novos);
    } catch (err) {
      console.error('❌ Erro ao carregar novos atendimentos:', err);
      console.error('📋 Detalhes do erro:', err.message);
    }
  };

  // Carregar nomes dos operadores baseado nos IDs dos atendimentos
  const carregarNomesOperadores = async (atendimentosList) => {
    try {
      const operadoresIds = [...new Set(atendimentosList
        .filter(atendimento => atendimento.operador_id)
        .map(atendimento => atendimento.operador_id)
      )];
      
      console.log('🔄 Carregando nomes dos operadores para IDs:', operadoresIds);
      
      const nomesOperadores = {};
      
      for (const operadorId of operadoresIds) {
        try {
          const operador = await buscarPorId(operadorId);
          if (operador && operador.nome) {
            nomesOperadores[operadorId] = operador.nome;
            console.log(`✅ Operador ${operadorId}: ${operador.nome}`);
          }
        } catch (err) {
          console.error(`❌ Erro ao buscar operador ${operadorId}:`, err);
          nomesOperadores[operadorId] = 'Sem operador atribuído';
        }
      }
      
      setOperadoresNomes(nomesOperadores);
      console.log('✅ Nomes dos operadores carregados:', nomesOperadores);
    } catch (err) {
      console.error('❌ Erro ao carregar nomes dos operadores:', err);
    }
  };

  // Função para filtrar atendimentos por status (apenas para Admin)
  const aplicarFiltroStatus = async (status) => {
    setFiltroStatus(status);
    
    try {
      let atendimentosPorStatus;
      
      if (status === 'todos') {
        // Se for "todos", usar os atendimentos já carregados
        atendimentosPorStatus = atendimentos;
        console.log(`🔍 [Admin] Filtro "todos" - usando atendimentos já carregados: ${atendimentosPorStatus.length}`);
      } else {
        // Se for um status específico, buscar diretamente do banco
        console.log(`🔍 [Admin] Buscando atendimentos com status específico: ${status}`);
        atendimentosPorStatus = await atendimentosService.buscarPorStatusAdmin(status);
        console.log(`📊 [Admin] Atendimentos encontrados com status "${status}": ${atendimentosPorStatus.length}`);
      }
      
      // Depois aplicar filtro de busca
      const atendimentosFinais = filtrarPorBusca(atendimentosPorStatus);
      setAtendimentosFiltrados(atendimentosFinais);
      
      console.log(`🔍 [Admin] Filtro aplicado: ${status}`);
      console.log(`📊 [Admin] Atendimentos após filtro de status: ${atendimentosPorStatus.length}`);
      console.log(`📊 [Admin] Atendimentos após filtro de busca: ${atendimentosFinais.length}`);
    } catch (error) {
      console.error('❌ [Admin] Erro ao aplicar filtro de status:', error);
      // Em caso de erro, usar filtro local como fallback
      const atendimentosPorStatus = status === 'todos' 
        ? atendimentos 
        : atendimentos.filter(atendimento => atendimento.status === status);
      const atendimentosFinais = filtrarPorBusca(atendimentosPorStatus);
      setAtendimentosFiltrados(atendimentosFinais);
    }
  };

  // Carregar nomes das categorias baseado nos IDs dos atendimentos
   const carregarNomesCategorias = async (atendimentosList) => {
     try {
       const categoriasIds = [...new Set(atendimentosList
         .filter(atendimento => atendimento.categoria_id)
         .map(atendimento => atendimento.categoria_id)
       )];
       
       console.log('🔄 Carregando nomes das categorias para IDs:', categoriasIds);
       
       const nomesCategorias = {};
       
       for (const categoriaId of categoriasIds) {
         try {
           const categoria = await categoriasService.buscarPorId(categoriaId);
           if (categoria && categoria.nome) {
             nomesCategorias[categoriaId] = categoria.nome;
             console.log(`✅ Categoria ${categoriaId}: ${categoria.nome}`);
           }
         } catch (err) {
           console.error(`❌ Erro ao buscar categoria ${categoriaId}:`, err);
           nomesCategorias[categoriaId] = 'Categoria não encontrada';
         }
       }
       
       setCategoriasNomes(nomesCategorias);
       console.log('✅ Nomes das categorias carregados:', nomesCategorias);
     } catch (err) {
       console.error('❌ Erro ao carregar nomes das categorias:', err);
     }
   };

   // Carregar observações de um atendimento
    const carregarObservacoes = async (atendimentoId) => {
      try {
        setCarregandoObservacoes(true);
        console.log('🔄 Carregando observações para atendimento:', atendimentoId);
        
        const observacoesData = await observacoesService.listarPorAtendimento(atendimentoId);
        setObservacoes(observacoesData);
        
        console.log('✅ Observações carregadas:', observacoesData);
      } catch (error) {
        console.error('❌ Erro ao carregar observações:', error);
        setObservacoes([]);
      } finally {
        setCarregandoObservacoes(false);
      }
    };

    // Adicionar nova observação
    const adicionarObservacao = async () => {
      if (!novaObservacao.trim() || !atendimentoSelecionado || !user) {
        return;
      }

      try {
        console.log('🔄 Adicionando nova observação...');
        
        // Buscar o operador pelo email do usuário logado
        const operador = await buscarPorEmail(user.email);
        if (!operador) {
          console.error('❌ Operador não encontrado');
          return;
        }

        const observacaoData = {
          id_atendimento: atendimentoSelecionado.id,
          observacao: novaObservacao.trim(),
          operador_id: operador.id
        };

        const novaObservacaoSalva = await observacoesService.criar(observacaoData);
        
        // Atualizar lista de observações
        setObservacoes(prev => [novaObservacaoSalva, ...prev]);
        setNovaObservacao('');
        
        console.log('✅ Observação adicionada:', novaObservacaoSalva);
      } catch (error) {
        console.error('❌ Erro ao adicionar observação:', error);
      }
    };

    // Função para lidar com Enter no textarea
    const handleObservacaoKeyPress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        adicionarObservacao();
      }
    };

  // Carregar mensagens de um atendimento
  const carregarMensagens = async (atendimentoId) => {
    try {
      console.log('🔄 Carregando mensagens do atendimento:', atendimentoId);
      const mensagens = await mensagensService.buscarPorAtendimento(atendimentoId);
      console.log('✅ Mensagens carregadas:', mensagens);
      
      // Atualizar o estado de mensagens
      setMensagens(prev => ({
          ...prev,
          [atendimentoId]: mensagens
        }));
      
      return mensagens;
    } catch (err) {
      console.error('❌ Erro ao carregar mensagens:', err);
      console.error('📋 Detalhes do erro:', err.message);
      return [];
    }
  };

  // Função para enviar mensagem
  const enviarMensagem = async () => {
    if (!mensagemInput.trim() || !atendimentoSelecionado || enviandoMensagem) {
      return;
    }

    try {
      setEnviandoMensagem(true);
      console.log('📤 Enviando mensagem:', {
        atendimento_id: atendimentoSelecionado.id,
        conteudo: mensagemInput.trim(),
        role: 'operador',
        remetente_id: atendimentoSelecionado.telefone
      });

      // Criar mensagem no banco
      const novaMensagem = await mensagensService.criar({
        atendimento_id: atendimentoSelecionado.id,
        conteudo: mensagemInput.trim(),
        role: 'operador',
        remetente_id: atendimentoSelecionado.telefone
      });

      console.log('✅ Mensagem criada:', novaMensagem);

      // Enviar mensagem via WhatsApp através da EVO
      try {
        await mensagensService.enviarViaWhatsApp(
          atendimentoSelecionado.telefone,
          mensagemInput.trim()
        );
        console.log('✅ Mensagem enviada via WhatsApp');
      } catch (whatsappError) {
        console.error('❌ Erro ao enviar via WhatsApp:', whatsappError);
        // Não bloquear o fluxo se o WhatsApp falhar
      }

      // Limpar input
      setMensagemInput('');

      // Recarregar mensagens para atualizar a conversa
      await carregarMensagens(atendimentoSelecionado.id);

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setEnviandoMensagem(false);
    }
  };

  // Função para lidar com Enter no input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  // useEffect para carregar mensagens quando um atendimento for selecionado
  useEffect(() => {
    if (atendimentoSelecionado && atendimentoSelecionado.id) {
      carregarMensagens(atendimentoSelecionado.id);
    }
  }, [atendimentoSelecionado]);

  // Função para scroll automático
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // useEffect para scroll automático quando mensagens mudarem
  useEffect(() => {
    if (atendimentoSelecionado && mensagens[atendimentoSelecionado.id]) {
      scrollToBottom();
    }
  }, [mensagens, atendimentoSelecionado]);

  // useEffect para polling automático de mensagens (tempo real)
  useEffect(() => {
    let intervalId;
    
    if (atendimentoSelecionado && atendimentoSelecionado.id && atendimentoHabilitado) {
      // Função para verificar novas mensagens
      const verificarNovasMensagens = async () => {
        try {
          const mensagensAtuais = await mensagensService.buscarPorAtendimento(atendimentoSelecionado.id);
          const mensagensExistentes = mensagens[atendimentoSelecionado.id] || [];
          
          // Verificar se há novas mensagens comparando o tamanho dos arrays
           if (mensagensAtuais.length > mensagensExistentes.length) {
             console.log('🔔 Novas mensagens detectadas:', mensagensAtuais.length - mensagensExistentes.length);
             
             // Atualizar o estado de mensagens
             setMensagens(prev => ({
               ...prev,
               [atendimentoSelecionado.id]: mensagensAtuais
             }));
             
             // Marcar atendimento como tendo novas mensagens (apenas se não estiver selecionado)
             // Se o atendimento atual não estiver em foco, marcar como tendo novas mensagens
             setAtendimentosComNovasMensagens(prev => {
               const newSet = new Set(prev);
               newSet.add(atendimentoSelecionado.id);
               return newSet;
             });
           }
        } catch (err) {
          console.error('❌ Erro ao verificar novas mensagens:', err);
        }
      };
      
      // Configurar polling a cada 5 segundos
      intervalId = setInterval(verificarNovasMensagens, 5000);
      
      console.log('🔄 Polling de mensagens iniciado para atendimento:', atendimentoSelecionado.id);
    }
    
    // Cleanup: limpar o intervalo quando o componente for desmontado ou atendimento mudar
     return () => {
       if (intervalId) {
         clearInterval(intervalId);
         console.log('⏹️ Polling de mensagens interrompido');
       }
     };
   }, [atendimentoSelecionado, atendimentoHabilitado, mensagens]);



  // Função para selecionar atendimento
  const selecionarAtendimento = (atendimento) => {
    setAtendimentoSelecionado(atendimento);
    
    // Remover indicador de novas mensagens para este atendimento
    setAtendimentosComNovasMensagens(prev => {
      const newSet = new Set(prev);
      newSet.delete(atendimento.id);
      return newSet;
    });
  };

  // Função para salvar novo nome do cliente
  const salvarNomeCliente = async () => {
    if (novoNomeCliente.trim() && atendimentoSelecionado) {
      try {
        console.log('Alterando nome do cliente', atendimentoSelecionado.id, 'para', novoNomeCliente);
        
        // Atualizar nome do cliente na tabela atendimentos
        await atendimentosService.atualizarNomeCliente(atendimentoSelecionado.id, novoNomeCliente);
        
        // Atualizar estado local
        setAtendimentoSelecionado({
          ...atendimentoSelecionado,
          nome: novoNomeCliente
        });
        
        // Atualizar lista de atendimentos
        setAtendimentos(prevAtendimentos => 
          prevAtendimentos.map(atendimento => 
            atendimento.id === atendimentoSelecionado.id 
              ? { ...atendimento, nome: novoNomeCliente }
              : atendimento
          )
        );
        
        setModalEditarNome(false);
        setNovoNomeCliente('');
        
        console.log('✅ Nome do cliente atualizado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao salvar nome do cliente:', error);
        alert('Erro ao salvar o nome do cliente. Tente novamente.');
      }
    }
  };

  // Função para salvar novo email do cliente
  const salvarNovoEmail = async () => {
    if (novoEmail.trim() && atendimentoSelecionado) {
      try {
        console.log('Alterando email do cliente', atendimentoSelecionado.id, 'para', novoEmail);
        
        // Atualizar email do cliente na tabela atendimentos
        await atendimentosService.atualizarEmailCliente(atendimentoSelecionado.id, novoEmail.trim());
        
        // Atualizar estado local
        setAtendimentoSelecionado({
          ...atendimentoSelecionado,
          email: novoEmail.trim()
        });
        
        // Atualizar lista de atendimentos
        setAtendimentos(prevAtendimentos => 
          prevAtendimentos.map(atendimento => 
            atendimento.id === atendimentoSelecionado.id 
              ? { ...atendimento, email: novoEmail.trim() }
              : atendimento
          )
        );
        
        setModalEditarEmail(false);
        setNovoEmail('');
        
        console.log('✅ Email do cliente atualizado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao salvar email do cliente:', error);
        alert('Erro ao salvar o email do cliente. Tente novamente.');
      }
    }
  };

  // Função para cancelar edição de nome
  const cancelarEdicaoNome = () => {
    setModalEditarNome(false);
    setNovoNomeCliente('');
  };

  // Função para cancelar edição de email
  const cancelarEdicaoEmail = () => {
    setModalEditarEmail(false);
    setNovoEmail('');
  };

  // Funções para menu de anexos
  const toggleMenuAnexos = () => {
    setMenuAnexosAberto(!menuAnexosAberto);
  };

  const fecharMenuAnexos = () => {
    setMenuAnexosAberto(false);
  };

  const handleAnexarFoto = () => {
    console.log('📸 Anexar foto/imagem');
    
    if (!atendimentoSelecionado) {
      alert('Selecione um atendimento primeiro.');
      return;
    }
    
    // Criar input file invisível para imagens compatíveis com WhatsApp
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.jpg,.jpeg,.png,.gif,.webp';
    input.style.display = 'none';
    
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (file) {
        try {
          console.log('📸 Imagem selecionada:', file.name);
          
          // Garantir que o bucket existe
          await createBucketIfNotExists();
          
          // Fazer upload da imagem para o Supabase Storage
          const uploadResult = await uploadFile(file, 'images', atendimentoSelecionado.id);
          
          if (!uploadResult.success) {
            throw new Error('Erro ao fazer upload da imagem');
          }
          
          console.log('✅ Upload da imagem realizado com sucesso:', uploadResult.url);
          
          // Salvar mensagem no banco de dados
          const novaMensagem = {
            atendimento_id: atendimentoSelecionado.id,
            operador_id: user.id,
            remetente_id: atendimentoSelecionado.telefone, // Número de telefone do cliente
            conteudo: uploadResult.url, // URL da imagem no storage
            type: 'photo',
            document_name: uploadResult.fileName,
            file_size: uploadResult.fileSize,
            file_type: uploadResult.fileType
          };
          
          const mensagemSalva = await mensagensService.criar(novaMensagem);
          
          if (mensagemSalva) {
            console.log('✅ Mensagem de imagem salva no banco:', mensagemSalva);
            
            // Enviar imagem via WhatsApp através da EVO
            try {
              await mensagensService.enviarDocumentoViaWhatsApp(
                atendimentoSelecionado.telefone,
                uploadResult.url,
                atendimentoSelecionado.id,
                uploadResult.fileName
              );
              console.log('✅ Imagem enviada via WhatsApp');
            } catch (whatsappError) {
              console.error('❌ Erro ao enviar imagem via WhatsApp:', whatsappError);
              // Não bloquear o fluxo se o WhatsApp falhar
            }
            
            // Enviar imagem via webhook (convertida para base64)
            try {
              await mensagensService.enviarImagemViaWebhook(
                atendimentoSelecionado.telefone,
                file,
                atendimentoSelecionado.id,
                uploadResult.fileName,
                uploadResult.fileSize,
                uploadResult.fileType
              );
              console.log('✅ Imagem enviada via webhook (base64)');
            } catch (webhookError) {
              console.error('❌ Erro ao enviar imagem via webhook:', webhookError);
              // Não bloquear o fluxo se o webhook falhar
            }
            
            alert('Imagem enviada com sucesso!');
            
            // Recarregar mensagens para mostrar a nova imagem
            await carregarMensagens(atendimentoSelecionado.id);
          } else {
            throw new Error('Erro ao salvar mensagem no banco');
          }
          
        } catch (error) {
          console.error('❌ Erro ao processar imagem:', error);
          alert('Erro ao processar a imagem. Tente novamente.');
        }
      }
    };
    
    // Adicionar ao DOM e clicar
    document.body.appendChild(input);
    input.click();
    
    // Remover do DOM após uso
    setTimeout(() => {
      document.body.removeChild(input);
    }, 1000);
    
    fecharMenuAnexos();
  };

  const handleAnexarVideo = () => {
    console.log('🎥 Anexar vídeo');
    // Implementar lógica para anexar vídeo
    fecharMenuAnexos();
  };

  const handleAnexarDocumento = () => {
    console.log('📄 Anexar documento');
    
    if (!atendimentoSelecionado) {
      alert('Selecione um atendimento primeiro.');
      return;
    }
    
    // Criar input file invisível para documentos
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip,.rar';
    input.style.display = 'none';
    
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (file) {
        try {
          console.log('📄 Arquivo selecionado:', file.name);
          
          // Garantir que o bucket existe
          await createBucketIfNotExists();
          
          // Determinar o tipo de arquivo (document ou image)
          const isImage = file.type.startsWith('image/');
          const fileType = isImage ? 'images' : 'documents';
          const messageType = isImage ? 'photo' : 'document';
          
          // Fazer upload do arquivo para o Supabase Storage
          const uploadResult = await uploadFile(file, fileType, atendimentoSelecionado.id);
          
          if (!uploadResult.success) {
            throw new Error('Erro ao fazer upload do arquivo');
          }
          
          console.log('✅ Upload realizado com sucesso:', uploadResult.url);
          
          // Salvar mensagem no banco de dados
          const novaMensagem = {
            atendimento_id: atendimentoSelecionado.id,
            operador_id: user.id,
            remetente_id: atendimentoSelecionado.telefone, // Número de telefone do cliente
            conteudo: uploadResult.url, // URL do arquivo no storage
            type: messageType, // 'document' ou 'photo'
            document_name: uploadResult.fileName,
            file_size: uploadResult.fileSize,
            file_type: uploadResult.fileType
          };
          
          const mensagemSalva = await mensagensService.criar(novaMensagem);
          
          if (mensagemSalva) {
            console.log('✅ Mensagem salva no banco:', mensagemSalva);
            
            // Enviar documento via WhatsApp através da EVO
            try {
              await mensagensService.enviarDocumentoViaWhatsApp(
                atendimentoSelecionado.telefone,
                uploadResult.url,
                atendimentoSelecionado.id,
                uploadResult.fileName
              );
              console.log('✅ Documento enviado via WhatsApp');
            } catch (whatsappError) {
              console.error('❌ Erro ao enviar documento via WhatsApp:', whatsappError);
              // Não bloquear o fluxo se o WhatsApp falhar
            }
            
            // Enviar documento via webhook específico
            try {
              await mensagensService.enviarDocumentoViaWebhook(
                atendimentoSelecionado.telefone,
                uploadResult.url,
                atendimentoSelecionado.id,
                uploadResult.fileName,
                uploadResult.fileSize,
                uploadResult.fileType
              );
              console.log('✅ Documento enviado via webhook');
            } catch (webhookError) {
              console.error('❌ Erro ao enviar documento via webhook:', webhookError);
              // Não bloquear o fluxo se o webhook falhar
            }
            
            alert(`${isImage ? 'Imagem' : 'Documento'} enviado com sucesso!`);
            
            // Recarregar mensagens para mostrar o novo arquivo
            await carregarMensagens(atendimentoSelecionado.id);
          } else {
            throw new Error('Erro ao salvar mensagem no banco');
          }
          
        } catch (error) {
          console.error('❌ Erro ao processar documento:', error);
          alert('Erro ao processar o arquivo. Tente novamente.');
        }
      }
    };
    
    // Adicionar ao DOM e clicar
    document.body.appendChild(input);
    input.click();
    
    // Remover do DOM após uso
    setTimeout(() => {
      document.body.removeChild(input);
    }, 1000);
    
    fecharMenuAnexos();
  };
  




  const abrirModalInformacoes = (atendimento) => {
    console.log('🔍 Dados do atendimento selecionado:', atendimento);
    console.log('📝 Descrição do atendimento:', atendimento.descricao);
    setAtendimentoSelecionado(atendimento);
    setModalInformacoes(true);
    
    // Carregar observações do atendimento
    carregarObservacoes(atendimento.id);
  };

  const fecharModalInformacoes = () => {
    setModalInformacoes(false);
  };

  // Filtrar por termo de busca (integrado com filtros de status)
  const filtrarPorBusca = (atendimentosParaFiltrar) => {
    if (!termoBusca) return atendimentosParaFiltrar;
    
    const termo = termoBusca.toLowerCase();
    return atendimentosParaFiltrar.filter(atendimento =>
      (atendimento.codigo && atendimento.codigo.toString().toLowerCase().includes(termo)) ||
      (atendimento.nome && atendimento.nome.toLowerCase().includes(termo)) ||
      (atendimento.telefone && atendimento.telefone.toLowerCase().includes(termo)) ||
      (atendimento.status && atendimento.status.toLowerCase().includes(termo))
    );
  };

  // Verificar status de habilitação no banco de dados
  useEffect(() => {
    const verificarHabilitacaoOperador = async () => {
      if (user?.email) {
        try {
          const operador = await buscarPorEmail(user.email);
          if (operador) {
            setAtendimentoHabilitado(operador.habilitado === true);
          } else {
            setAtendimentoHabilitado(false);
          }
        } catch (error) {
          console.error('Erro ao verificar habilitação do operador:', error);
          setAtendimentoHabilitado(false);
        }
      } else {
        setAtendimentoHabilitado(false);
      }
    };
    
    if (user) {
      verificarHabilitacaoOperador();
    }
  }, [user, setAtendimentoHabilitado]);

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
            setAtendimentoHabilitado(false);
            setAtendimentoPausado(false);
            setModalConfirmacao(false);
            alert('Tempo esgotado! Você foi desconectado e precisará se habilitar novamente.');
            return 40 * 60;
          }
          return prev - 1;
        });
      }, 1000);

      setIntervaloPausa(intervalo);
      return () => clearInterval(intervalo);
    }
  }, [atendimentoPausado]);

  // Função para gerar senha aleatória
  const gerarSenhaAleatoria = () => {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numeros = '0123456789';
    const todosCaracteres = letras + numeros;
    let senha = '';
    senha += letras.charAt(Math.floor(Math.random() * letras.length));
    senha += numeros.charAt(Math.floor(Math.random() * numeros.length));
    for (let i = 2; i < 6; i++) {
      senha += todosCaracteres.charAt(Math.floor(Math.random() * todosCaracteres.length));
    }
    return senha.split('').sort(() => Math.random() - 0.5).join('');
  };

  const abrirModalHabilitacao = () => {
    const novaSenha = gerarSenhaAleatoria();
    setSenhaGerada(novaSenha);
    setSenhaDigitada(['', '', '', '', '', '']);
    setModalHabilitacao(true);
  };

  const fecharModalHabilitacao = () => {
    setModalHabilitacao(false);
    setSenhaGerada('');
    setSenhaDigitada(['', '', '', '', '', '']);
    setVerificandoSenha(false);
  };

  const atualizarSenhaDigitada = (index, valor) => {
    if (valor.length <= 1 && /^[A-Z0-9]*$/.test(valor.toUpperCase())) {
      const novaSenha = [...senhaDigitada];
      novaSenha[index] = valor.toUpperCase();
      setSenhaDigitada(novaSenha);
      if (valor && index < 5) {
        const proximoCampo = document.getElementById(`senha-${index + 1}`);
        if (proximoCampo) proximoCampo.focus();
      }
    }
  };

  const verificarSenha = async () => {
    const senhaCompleta = senhaDigitada.join('');
    if (senhaCompleta.length !== 6) {
      alert('Por favor, digite todos os 6 caracteres da senha.');
      return;
    }
    if (senhaCompleta !== senhaGerada) {
      alert('Senha incorreta. Tente novamente.');
      setSenhaDigitada(['', '', '', '', '', '']);
      return;
    }
    setVerificandoSenha(true);
    try {
      const resultado = await validarSenhaEHabilitar(user.email, senhaCompleta, senhaGerada);
      if (resultado.sucesso) {
        setAtendimentoHabilitado(true);
        setModalHabilitacao(false);
        alert('Atendimentos habilitados com sucesso!');
      } else {
        alert(resultado.mensagem || 'Erro ao habilitar atendimentos.');
      }
    } catch (error) {
      console.error('Erro ao verificar senha:', error);
      alert('Erro interno. Tente novamente.');
    } finally {
      setVerificandoSenha(false);
    }
  };

  const pausarAtendimentos = () => {
    setAtendimentoPausado(true);
    setModalConfirmacao(true);
  };

  const abrirModalConfirmacao = () => {
    setModalConfirmacao(true);
  };

  const retomarAtendimentos = () => {
    setAtendimentoPausado(false);
    setModalConfirmacao(false);
    setTempoRestante(40 * 60);
    if (intervaloPausa) {
      clearInterval(intervaloPausa);
      setIntervaloPausa(null);
    }
  };

  const fecharModalConfirmacao = () => {
    setModalConfirmacao(false);
  };

  const formatarTempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };



  const formatarDataHora = (data) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  };

  const handleKeyPressObservacao = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      adicionarObservacao();
    }
  };

  const rejeitarAtendimento = () => {
    if (novoAtendimentoData) {
      console.log('Rejeitando atendimento:', novoAtendimentoData.id);
      setModalNovoAtendimento(false);
      setNovoAtendimentoData(null);
      if (intervalAceitar) {
        clearInterval(intervalAceitar);
        setIntervalAceitar(null);
      }
      setTempoRestanteAceitar(45);
    }
  };

  const getRoleLabel = (tipo) => {
    switch (tipo) {
      case 'admin': return 'Administrador';
      case 'operador': return 'Operador';
      case 'supervisor': return 'Supervisor';
      default: return tipo;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Dashboard de Atendimentos</h1>
            <p className="page-description">
              Bem-vindo, {user?.nome}! Gerencie seus atendimentos em tempo real.
            </p>
          </div>
          <div className="header-actions">
           
            <div className="action-buttons">
              {!atendimentoHabilitado ? (
                <button 
                  className="btn-warning" 
                  onClick={abrirModalHabilitacao}
                >
                  🔓 Habilitar Atendimentos
                </button>
              ) : (
                <>
                  {!atendimentoPausado ? (
                    <button 
                      className="btn-warning" 
                      onClick={pausarAtendimentos}
                    >
                      ⏸️ Pausar Atendimentos
                    </button>
                  ) : (
                    <button 
                      className="btn-timer" 
                      onClick={abrirModalConfirmacao}
                    >
                      ⏱️ Pausado - {formatarTempo(tempoRestante)}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="page-content-dashboard">
        <div className="whatsapp-layout">
          <div className="atendimentos-sidebar">
            <div className="sidebar-header">
              <h3>{isAdmin ? 'Todos os Atendimentos' : 'Meus Atendimentos'}</h3>
              <div className='sidebar-content'>
              <div className="search-filter-container">
                <div className="search-container">
                  <input
                    type="text"
                    className="search-input"
                    placeholder={isAdmin ? "Buscar em todos os atendimentos..." : "Buscar nos meus atendimentos..."}
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                  />
                </div>
                {isAdmin && (
                  <div className="filter-container">
                    <button 
                      className="filter-toggle-btn"
                      onClick={() => setMostrarFiltros(!mostrarFiltros)}
                    >
                      🔍 Filtros
                    </button>
                    {mostrarFiltros && (
                      <div className="filter-dropdown">
                        <div className="filter-option">
                          <button 
                            className={`filter-btn ${filtroStatus === 'todos' ? 'active' : ''}`}
                            onClick={() => aplicarFiltroStatus('todos')}
                          >
                            Todos
                          </button>
                        </div>
                        <div className="filter-option">
                          <button 
                            className={`filter-btn ${filtroStatus === 'novo' ? 'active' : ''}`}
                            onClick={() => aplicarFiltroStatus('novo')}
                          >
                            Novo
                          </button>
                        </div>
                        <div className="filter-option">
                          <button 
                            className={`filter-btn ${filtroStatus === 'em-andamento' ? 'active' : ''}`}
                            onClick={() => aplicarFiltroStatus('em-andamento')}
                          >
                            Em andamento
                          </button>
                        </div>
                        <div className="filter-option">
                          <button 
                            className={`filter-btn ${filtroStatus === 'aguardando' ? 'active' : ''}`}
                            onClick={() => aplicarFiltroStatus('aguardando')}
                          >
                            Aguardando
                          </button>
                        </div>
                        <div className="filter-option">
                          <button 
                            className={`filter-btn ${filtroStatus === 'pausado' ? 'active' : ''}`}
                            onClick={() => aplicarFiltroStatus('pausado')}
                          >
                            Pausado
                          </button>
                        </div>
                        <div className="filter-option">
                          <button 
                            className={`filter-btn ${filtroStatus === 'finalizado' ? 'active' : ''}`}
                            onClick={() => aplicarFiltroStatus('finalizado')}
                          >
                            Finalizado
                          </button>
                        </div>
                        <div className="filter-option">
                          <button 
                            className={`filter-btn ${filtroStatus === 'abandonado' ? 'active' : ''}`}
                            onClick={() => aplicarFiltroStatus('abandonado')}
                          >
                            Abandonado
                          </button>
                        </div>
                        <div className="filter-option">
                          <button 
                            className={`filter-btn ${filtroStatus === 'nao_atendido' ? 'active' : ''}`}
                            onClick={() => aplicarFiltroStatus('nao_atendido')}
                          >
                            Não Atendido
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              </div>
            </div>
            
            <div className="atendimentos-list">
              {!atendimentoHabilitado ? (
                <div className="disabled-state">
                  <div className="disabled-icon">🚫</div>
                  <h3>Atendimentos Desabilitados</h3>
                  <p>Você precisa se habilitar para acessar a lista de atendimentos</p>
                </div>
              ) : loading ? (
                <div className="loading-state">
                  <p>Carregando atendimentos...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <p>{error}</p>
                  <button onClick={carregarAtendimentos} className="btn-secondary">
                    Tentar Novamente
                  </button>
                </div>
              ) : atendimentosFiltrados.length === 0 ? (
                <div className="empty-state">
                  {atendimentos.length === 0 ? (
                    <p>Nenhum atendimento disponível no momento.</p>
                  ) : (
                    <p>Nenhum resultado encontrado para os filtros aplicados.</p>
                  )}
                </div>
              ) : (
                atendimentosFiltrados.map(atendimento => (
                  <div 
                    key={atendimento.id}
                    className={`atendimento-item ${atendimentoSelecionado?.id === atendimento.id ? 'active' : ''} ${atendimentosComNovasMensagens.has(atendimento.id) ? 'has-new-messages' : ''}`}
                    onClick={() => selecionarAtendimento(atendimento)}
                  >
                    <div className="atendimento-avatar">
                      {(() => {
                        const nomes = atendimento.nome.split(' ');
                        const iniciais = nomes.length > 1 
                          ? nomes[0].charAt(0).toUpperCase() + nomes[nomes.length - 1].charAt(0).toUpperCase()
                          : nomes[0].charAt(0).toUpperCase();
                        return iniciais;
                      })()}
                    </div>
                    <div className="atendimento-info">
                      <div className="atendimento-header">
                        <div className="atendimento-nome-time">
                          <span className="atendimento-nome">{atendimento.nome}</span>
                          <span className="atendimento-time">{atendimento.horario}</span>
                        </div>
                        <div className="atendimento-codigo">
                          <span className="codigo-valor">#{atendimento.codigo}</span>
                        </div>
                      </div>
                      <div className="atendimento-preview">
                        <div className="status-message-column">
                          <span className={`status-badge status-${atendimento.status ? atendimento.status.replace('_', '-') : 'pendente'}`}>
                            {atendimento.status || 'Pendente'}
                          </span>
                          <span className="last-message">{atendimento.ultima_mensagem}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="chat-container">
            {!atendimentoHabilitado ? (
              <div className="content-placeholder disabled-chat">
                <div className="placeholder-icon">💬</div>
                <h3>Chat Desabilitado</h3>
                <p>Habilite-se para iniciar conversas</p>
              </div>
            ) : atendimentoSelecionado ? (
              <>
                <div className="chat-header">
                  <div className="chat-user-info">
                    <div className="chat-avatar">
                      {atendimentoSelecionado.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="chat-details">
                      <div className="nome-container-dashboard">
                        <h4>{atendimentoSelecionado.nome}</h4>
                        <button 
                          className="btn-edit-nome-dashboard"
                          onClick={() => {
                            setNovoNomeCliente(atendimentoSelecionado.nome);
                            setModalEditarNome(true);
                          }}
                          title="Editar nome do cliente"
                        >
                          ✏️
                        </button>
                      </div>
                      
                      
                    </div>
                  </div>
                  <div className="chat-actions">
                    <button 
                      className="btn-action btn-info"
                      onClick={() => abrirModalInformacoes(atendimentoSelecionado)}
                    >
                       Informações
                    </button>
                  </div>
                </div>

                <div className="chat-messages">
                   {mensagens[atendimentoSelecionado.id]?.map(mensagem => {
                     const getRoleDisplayName = (role) => {
                       switch(role) {
                         case 'cliente': return 'CLIENTE';
                         case 'agente': return 'AGENTE IA';
                         case 'operador': return 'OPERADOR';
                         default: return role?.toUpperCase() || 'CLIENTE';
                       }
                     };
                     
                     // Função para renderizar conteúdo da mensagem baseado no tipo
                     const renderMessageContent = (mensagem) => {
                       const { mensagem: text, type, document_name, conteudo } = mensagem;
                       
                       // Se for uma mensagem de texto (padrão)
                       if (!type || type === 'text') {
                         if (!text) return null;
                         
                         // Dividir o texto em linhas
                         const lines = text.split('\n');
                         
                         return lines.map((line, index) => {
                           // Processar formatação markdown básica
                           let processedLine = line
                             // Negrito **texto**
                             .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                             // Itálico *texto*
                             .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
                             // Links [texto](url)
                             .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
                           
                           // Se a linha está vazia, renderizar como quebra de linha
                           if (line.trim() === '') {
                             return <br key={index} />;
                           }
                           
                           // Se a linha começa com -, renderizar como item de lista
                           if (line.trim().startsWith('- ')) {
                             const listItem = line.replace(/^\s*-\s*/, '');
                             const processedItem = listItem
                               .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                               .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
                               .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
                             
                             return (
                               <div key={index} className="message-list-item">
                                 <span className="list-bullet">•</span>
                                 <span dangerouslySetInnerHTML={{ __html: processedItem }} />
                               </div>
                             );
                           }
                           
                           // Renderizar linha normal
                           return (
                             <div key={index} className="message-line">
                               <span dangerouslySetInnerHTML={{ __html: processedLine }} />
                             </div>
                           );
                         });
                       }
                       
                       // Se for uma imagem
                       if (type === 'photo') {
                         return (
                           <div className="message-image">
                             <img 
                               src={conteudo} 
                               alt={document_name || 'Imagem'}
                               className="chat-image"
                               onClick={() => window.open(conteudo, '_blank')}
                               onError={(e) => {
                                 e.target.style.display = 'none';
                                 e.target.nextSibling.style.display = 'block';
                               }}
                             />
                             <div className="image-error" style={{display: 'none'}}>
                               <FontAwesomeIcon icon={faImage} className="photo-icon" />
                               <span>Erro ao carregar imagem</span>
                             </div>
                             {document_name && (
                               <div className="file-info">
                                 <span className="file-name">{document_name}</span>
                               </div>
                             )}
                           </div>
                         );
                       }
                       
                       // Se for um documento
                       if (type === 'document') {
                         const fileType = mensagem.file_type || '';
                         const fileName = document_name || '';
                         
                         const getDocumentIcon = () => {
                           const lowerFileType = fileType.toLowerCase();
                           const lowerFileName = fileName.toLowerCase();
                           
                           // Verificar primeiro pelo MIME type
                           if (lowerFileType.includes('pdf') || lowerFileType === 'application/pdf') return faFilePdf;
                           if (lowerFileType.includes('word') || lowerFileType.includes('msword') || lowerFileType.includes('wordprocessingml')) return faFileWord;
                           if (lowerFileType.includes('excel') || lowerFileType.includes('spreadsheet')) return faFileExcel;
                           if (lowerFileType.includes('powerpoint') || lowerFileType.includes('presentation')) return faFilePowerpoint;
                           if (lowerFileType.includes('zip') || lowerFileType.includes('rar') || lowerFileType.includes('archive')) return faFileArchive;
                           if (lowerFileType.includes('video')) return faFileVideo;
                           if (lowerFileType.includes('audio')) return faFileAudio;
                           if (lowerFileType.includes('javascript') || lowerFileType.includes('json') || lowerFileType.includes('xml') || lowerFileType.includes('html')) return faFileCode;
                           
                           // Fallback para extensão do arquivo
                           if (lowerFileName.endsWith('.pdf')) return faFilePdf;
                           if (lowerFileName.endsWith('.doc') || lowerFileName.endsWith('.docx')) return faFileWord;
                           if (lowerFileName.endsWith('.xls') || lowerFileName.endsWith('.xlsx')) return faFileExcel;
                           if (lowerFileName.endsWith('.ppt') || lowerFileName.endsWith('.pptx')) return faFilePowerpoint;
                           if (lowerFileName.endsWith('.zip') || lowerFileName.endsWith('.rar') || lowerFileName.endsWith('.7z')) return faFileArchive;
                           if (lowerFileName.endsWith('.mp4') || lowerFileName.endsWith('.avi') || lowerFileName.endsWith('.mov')) return faFileVideo;
                           if (lowerFileName.endsWith('.mp3') || lowerFileName.endsWith('.wav') || lowerFileName.endsWith('.flac')) return faFileAudio;
                           if (lowerFileName.endsWith('.js') || lowerFileName.endsWith('.json') || lowerFileName.endsWith('.xml') || lowerFileName.endsWith('.html')) return faFileCode;
                           
                           return faFile;
                         };
                         
                         const getDocumentClass = () => {
                           const lowerFileType = fileType.toLowerCase();
                           const lowerFileName = fileName.toLowerCase();
                           
                           // Verificar primeiro pelo MIME type
                           if (lowerFileType.includes('pdf') || lowerFileType === 'application/pdf') return 'pdf-icon';
                           if (lowerFileType.includes('word') || lowerFileType.includes('msword') || lowerFileType.includes('wordprocessingml')) return 'word-icon';
                           if (lowerFileType.includes('excel') || lowerFileType.includes('spreadsheet')) return 'excel-icon';
                           if (lowerFileType.includes('powerpoint') || lowerFileType.includes('presentation')) return 'powerpoint-icon';
                           if (lowerFileType.includes('zip') || lowerFileType.includes('rar') || lowerFileType.includes('archive')) return 'archive-icon';
                           if (lowerFileType.includes('video')) return 'video-icon';
                           if (lowerFileType.includes('audio')) return 'audio-icon';
                           if (lowerFileType.includes('javascript') || lowerFileType.includes('json') || lowerFileType.includes('xml') || lowerFileType.includes('html')) return 'code-icon';
                           
                           // Fallback para extensão do arquivo
                           if (lowerFileName.endsWith('.pdf')) return 'pdf-icon';
                           if (lowerFileName.endsWith('.doc') || lowerFileName.endsWith('.docx')) return 'word-icon';
                           if (lowerFileName.endsWith('.xls') || lowerFileName.endsWith('.xlsx')) return 'excel-icon';
                           if (lowerFileName.endsWith('.ppt') || lowerFileName.endsWith('.pptx')) return 'powerpoint-icon';
                           if (lowerFileName.endsWith('.zip') || lowerFileName.endsWith('.rar') || lowerFileName.endsWith('.7z')) return 'archive-icon';
                           if (lowerFileName.endsWith('.mp4') || lowerFileName.endsWith('.avi') || lowerFileName.endsWith('.mov')) return 'video-icon';
                           if (lowerFileName.endsWith('.mp3') || lowerFileName.endsWith('.wav') || lowerFileName.endsWith('.flac')) return 'audio-icon';
                           if (lowerFileName.endsWith('.js') || lowerFileName.endsWith('.json') || lowerFileName.endsWith('.xml') || lowerFileName.endsWith('.html')) return 'code-icon';
                           
                           return 'file-icon';
                         };
                         
                         const getDocumentType = () => {
                           const lowerFileType = fileType.toLowerCase();
                           const lowerFileName = fileName.toLowerCase();
                           
                           // Verificar primeiro pelo MIME type
                           if (lowerFileType.includes('pdf') || lowerFileType === 'application/pdf') return 'PDF';
                           if (lowerFileType.includes('word') || lowerFileType.includes('msword') || lowerFileType.includes('wordprocessingml')) return 'WORD';
                           if (lowerFileType.includes('excel') || lowerFileType.includes('spreadsheet')) return 'EXCEL';
                           if (lowerFileType.includes('powerpoint') || lowerFileType.includes('presentation')) return 'POWERPOINT';
                           if (lowerFileType.includes('zip') || lowerFileType.includes('rar') || lowerFileType.includes('archive')) return 'ARQUIVO';
                           if (lowerFileType.includes('video')) return 'VÍDEO';
                           if (lowerFileType.includes('audio')) return 'ÁUDIO';
                           if (lowerFileType.includes('javascript') || lowerFileType.includes('json') || lowerFileType.includes('xml') || lowerFileType.includes('html')) return 'CÓDIGO';
                           
                           // Fallback para extensão do arquivo
                           if (lowerFileName.endsWith('.pdf')) return 'PDF';
                           if (lowerFileName.endsWith('.doc') || lowerFileName.endsWith('.docx')) return 'WORD';
                           if (lowerFileName.endsWith('.xls') || lowerFileName.endsWith('.xlsx')) return 'EXCEL';
                           if (lowerFileName.endsWith('.ppt') || lowerFileName.endsWith('.pptx')) return 'POWERPOINT';
                           if (lowerFileName.endsWith('.zip') || lowerFileName.endsWith('.rar') || lowerFileName.endsWith('.7z')) return 'ARQUIVO';
                           if (lowerFileName.endsWith('.mp4') || lowerFileName.endsWith('.avi') || lowerFileName.endsWith('.mov')) return 'VÍDEO';
                           if (lowerFileName.endsWith('.mp3') || lowerFileName.endsWith('.wav') || lowerFileName.endsWith('.flac')) return 'ÁUDIO';
                           if (lowerFileName.endsWith('.js') || lowerFileName.endsWith('.json') || lowerFileName.endsWith('.xml') || lowerFileName.endsWith('.html')) return 'CÓDIGO';
                           
                           return 'DOCUMENTO';
                         };
                         
                         const handleDocumentClick = () => {
                           // Todos os documentos agora abrem em nova guia
                           window.open(conteudo, '_blank');
                         };
                         
                         return (
                           <div className="message-document">
                             <div className="document-container" onClick={handleDocumentClick} style={{cursor: 'pointer'}}>
                               <div className="document-icon">
                                 <FontAwesomeIcon 
                                   icon={getDocumentIcon()} 
                                   className={getDocumentClass()}
                                 />
                               </div>
                               <div className="document-info">
                                 <div className="document-name">{document_name || 'Documento'}</div>
                                 <div className="document-type">
                                   {getDocumentType()} • {mensagem.file_size ? `${Math.round(mensagem.file_size / 1024)} KB` : ''}
                                 </div>
                               </div>
                               <div className="document-action-icon">
                                 <FontAwesomeIcon icon={fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf') ? faFile : faDownload} />
                               </div>
                             </div>
                           </div>
                         );
                       }
                       
                       // Fallback para tipos desconhecidos
                       return (
                         <div className="message-unknown">
                           <span>Tipo de mensagem não suportado: {type}</span>
                         </div>
                       );
                     };

                     return (
                        <div key={mensagem.id} className={`message ${mensagem.role}`}>
                          <div className="message-content">
                            <span className={`message-role-label ${mensagem.role}`}>
                              {getRoleDisplayName(mensagem.role)}
                            </span>
                            <div className="message-text">
                              {renderMessageContent(mensagem)}
                            </div>
                            <span className="message-time">{new Date(mensagem.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      );
                   }) || (
                    <div className="no-messages">
                      <p>Nenhuma mensagem ainda.</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-container">
                  <div className="attachment-container">
                    <button 
                      className="btn-attachment"
                      disabled={!atendimentoHabilitado}
                      title="Anexar arquivo"
                      onClick={toggleMenuAnexos}
                    >
                      <FontAwesomeIcon icon={faPaperclip} />
                    </button>
                    
                    {/* Menu de anexos */}
                     {menuAnexosAberto && (
                       <div className="attachment-menu">
                         <div className="attachment-menu-item" onClick={handleAnexarFoto}>
                           <div className="attachment-icon photo">
                             <FontAwesomeIcon icon={faImage} />
                           </div>
                           <span>Fotos e vídeos</span>
                         </div>
                         
                         <div className="attachment-menu-item" onClick={handleAnexarDocumento}>
                           <div className="attachment-icon document">
                             <FontAwesomeIcon icon={faFile} />
                           </div>
                           <span>Documento</span>
                         </div>
                       </div>
                     )}
                  </div>
                  <div className="message-input-wrapper">
                    <input 
                      type="text" 
                      className="message-input"
                      placeholder="Digite sua mensagem..."
                      value={mensagemInput}
                      onChange={(e) => setMensagemInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={!atendimentoHabilitado || enviandoMensagem}
                    />
                  </div>
                  <button 
                    className="btn-send"
                    onClick={enviarMensagem}
                    disabled={!atendimentoHabilitado || enviandoMensagem || !mensagemInput.trim()}
                    title="Enviar mensagem"
                  >
                    <FontAwesomeIcon icon={faPaperPlane} />
                  </button>
                </div>
              </>
            ) : (
              <div className="content-placeholder">
                <div className="placeholder-icon">💬</div>
                <h3>Selecione um atendimento</h3>
                <p>Escolha um atendimento da lista para visualizar a conversa</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Habilitação */}
      {modalHabilitacao && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Habilitar Atendimentos</h3>
              <button className="modal-close" onClick={fecharModalHabilitacao}>×</button>
            </div>
            <div className="modal-body">
              <div className="habilitacao-content">
                <div className="senha-gerada">
                  <h4>Senha Gerada:</h4>
                  <div className="senha-display">
                    {senhaGerada.split('').map((char, index) => (
                      <span key={index} className="senha-char">{char}</span>
                    ))}
                  </div>
                </div>
                <p className="senha-instrucao">
                  Digite a senha acima para habilitar os atendimentos:
                </p>
                <div className="senha-input">
                  <div className="passcode-container">
                    {senhaDigitada.map((digito, index) => (
                      <input
                        key={index}
                        id={`senha-${index}`}
                        type="text"
                        className="passcode-field"
                        value={digito}
                        onChange={(e) => atualizarSenhaDigitada(index, e.target.value)}
                        maxLength="1"
                        disabled={verificandoSenha}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                className="btn-secondary" 
                onClick={fecharModalHabilitacao}
                disabled={verificandoSenha}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary" 
                onClick={verificarSenha}
                disabled={verificandoSenha || senhaDigitada.join('').length !== 6}
              >
                {verificandoSenha ? 'Verificando...' : 'Habilitar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Pausa */}
      {modalConfirmacao && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Atendimentos Pausados</h3>
              <button className="modal-close" onClick={fecharModalConfirmacao}>×</button>
            </div>
            <div className="modal-body">
              <div className="confirmacao-content">
                <div className="confirmacao-message">
                  <p className="confirmacao-texto">
                    Seus atendimentos estão pausados.
                  </p>
                  <p className="confirmacao-info">
                    Tempo restante: <strong>{formatarTempo(tempoRestante)}</strong>
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={fecharModalConfirmacao}>
                Fechar
              </button>
              <button className="btn-primary" onClick={retomarAtendimentos}>
                Retomar Atendimentos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Informações */}
      {modalInformacoes && atendimentoSelecionado && (
        <div className="modal-overlay">
          <div className="modal-content modal-informacoes">
            <div className="modal-header">
              <h3>Informações do Atendimento</h3>
              <button className="modal-close" onClick={fecharModalInformacoes}>×</button>
            </div>
            <div className="modal-body">
              <div className="info-section">
                <h4>Dados do Cliente</h4>
                <div className="info-container-split">
                  <div className="info-section-50">
                    <div className="info-item">
                      <label>NOME:</label>
                      <span>{atendimentoSelecionado.nome}</span>
                    </div>
                    <div className="info-item">
                      <label>E-MAIL:</label>
                      <div className="info-item-with-edit">
                        <span>{atendimentoSelecionado.email || 'joao.silva@email.com'}</span>
                        <button 
                          className="btn-edit-field"
                          onClick={() => {
                            setNovoEmail(atendimentoSelecionado.email || '');
                            setModalEditarEmail(true);
                          }}
                          title="Editar email"
                        >
                          ✏️
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="info-section-50">
                    <div className="info-item">
                      <label>TELEFONE:</label>
                      <span>{atendimentoSelecionado.telefone}</span>
                    </div>
                    <div className="info-item">
                      <label>STATUS:</label>
                      <span className={`status-badge status-${atendimentoSelecionado.status ? atendimentoSelecionado.status.replace('_', '-') : 'pendente'}`}>
                        {atendimentoSelecionado.status || 'EM ANDAMENTO'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="info-section">
                <h4>Detalhes do Atendimento</h4>
                <div className="info-container-split">
                  <div className="info-section-50">
                    <div className="info-item">
                      <label>ID DO ATENDIMENTO:</label>
                      <span>#{atendimentoSelecionado.codigo}</span>
                    </div>
                    <div className="info-item">
                      <label>OPERADOR RESPONSÁVEL:</label>
                      <span>
                        {atendimentoSelecionado.operador_id 
                          ? (operadoresNomes[atendimentoSelecionado.operador_id] || 'Carregando...') 
                          : 'Sem operador atribuído'
                        }
                      </span>
                    </div>
                  </div>
                  <div className="info-section-50">
                    <div className="info-item">
                      <label>DATA DE INÍCIO:</label>
                      <span>{formatarDataHora(new Date(atendimentoSelecionado.created_at))}</span>
                    </div>
                    <div className="info-item">
                      <label>CATEGORIA:</label>
                      <span>
                        {atendimentoSelecionado.categoria_id 
                          ? (categoriasNomes[atendimentoSelecionado.categoria_id] || 'Carregando...')
                          : 'Categoria não definida'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h4>Descrição do Atendimento</h4>
                <div className="descricao-atendimento">
                  <p>{atendimentoSelecionado.descricao || 'Nenhuma descrição disponível para este atendimento.'}</p>
                </div>
              </div>

               <div className="info-section">
                 <h4>Observações</h4>
                 <div className="observacoes-container">
                   <div className="nova-observacao">
                     <textarea
                       className="observacoes-textarea"
                       placeholder="Digite uma nova observação..."
                       value={novaObservacao}
                       onChange={(e) => setNovaObservacao(e.target.value)}
                       onKeyPress={handleKeyPressObservacao}
                       rows={3}
                     />
                     <button 
                       className="btn-adicionar-observacao"
                       onClick={adicionarObservacao}
                       disabled={!novaObservacao.trim()}
                     >
                       Adicionar
                     </button>
                   </div>
                   
                   <div className="observacoes-lista">
                     {carregandoObservacoes ? (
                       <div className="observacoes-loading">
                         <p>Carregando observações...</p>
                       </div>
                     ) : observacoes.length > 0 ? (
                       observacoes.map((obs, index) => (
                         <div key={obs.id || index} className="observacao-item">
                           <div className="observacao-content">
                             <p className="observacao-texto">{obs.observacao}</p>
                           </div>
                           <div className="observacao-meta">
                             <span className="observacao-operador">
                               {operadoresNomes[obs.operador_id] || 'Operador não encontrado'}
                             </span>
                             <span className="observacao-data">
                               {formatarDataHora(new Date(obs.created_time))}
                             </span>
                           </div>
                         </div>
                       ))
                     ) : (
                       <div className="observacoes-vazio">
                         <p>Nenhuma observação registrada para este atendimento.</p>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={fecharModalInformacoes}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Nome */}
      {modalEditarNome && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Editar Nome do Cliente</h3>
              <button className="modal-close" onClick={cancelarEdicaoNome}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Novo nome:</label>
                <input
                  type="text"
                  value={novoNomeCliente}
                  onChange={(e) => setNovoNomeCliente(e.target.value)}
                  placeholder="Digite o novo nome do cliente"
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={cancelarEdicaoNome}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={salvarNomeCliente}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar email */}
      {modalEditarEmail && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Editar Email</h3>
              <button className="modal-close" onClick={cancelarEdicaoEmail}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Novo email:</label>
                <input
                  type="email"
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  placeholder="Digite o novo email"
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn-secondary" 
                onClick={cancelarEdicaoEmail}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary" 
                onClick={salvarNovoEmail}
                disabled={!novoEmail.trim()}
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