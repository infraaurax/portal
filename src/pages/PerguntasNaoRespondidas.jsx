import React, { useState, useEffect, useRef } from 'react';
import './PageStyles.css';
import './PerguntasNaoRespondidas.css';
import { perguntasNaoRespondidasService } from '../services/perguntasNaoRespondidasService';
import { categoriasService } from '../services/categoriasService';
import operadoresService from '../services/operadoresService';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPhone, faCalendar, faTag } from '@fortawesome/free-solid-svg-icons';

const PerguntasNaoRespondidas = () => {
  const { user } = useAuth();
  const [perguntas, setPerguntas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [perguntaSelecionada, setPerguntaSelecionada] = useState(null);
  const [respostaHtml, setRespostaHtml] = useState('');
  const [salvandoResposta, setSalvandoResposta] = useState(false);
  const editorRef = useRef(null);
  const [modalCriarOpen, setModalCriarOpen] = useState(false);
  const [novaPergunta, setNovaPergunta] = useState('');
  const [novaCategoriaId, setNovaCategoriaId] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  const [buscaCategoria, setBuscaCategoria] = useState('');
  const [openCategoriaDropdown, setOpenCategoriaDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('pendentes');
  const [pagePendentes, setPagePendentes] = useState(1);
  const [pageRespondidas, setPageRespondidas] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar perguntas do Supabase
  useEffect(() => {
    carregarPerguntas();
  }, []);

  const carregarPerguntas = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const [dadosPerguntas, dadosCategorias, dadosOperadores] = await Promise.all([
        perguntasNaoRespondidasService.listar(),
        categoriasService.listar(),
        operadoresService.buscarTodos()
      ]);
      setPerguntas(dadosPerguntas);
      setCategorias(dadosCategorias);
      setOperadores(dadosOperadores);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setErro('Erro ao carregar dados. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const obterNomeCategoria = (categoriaId) => {
    if (!categoriaId) return 'Sem categoria';
    const categoria = categorias.find(cat => cat.id === categoriaId);
    return categoria ? categoria.nome : 'Categoria não encontrada';
  };

  const obterNomeOperador = (operadorId) => {
    if (!operadorId) return 'Usuário não identificado';
    const operador = operadores.find(op => op.id === operadorId);
    return operador ? operador.nome : 'Operador não encontrado';
  };

  const abrirModalResposta = (pergunta) => {
    setPerguntaSelecionada(pergunta);
    setRespostaHtml('');
    setModalOpen(true);
  };

  const fecharModal = () => {
    setModalOpen(false);
    setPerguntaSelecionada(null);
    setRespostaHtml('');
  };
  
  const abrirModalCriarPergunta = () => {
    setModalCriarOpen(true);
    setNovaPergunta('');
    setNovaCategoriaId('');
    setNovoTelefone('');
    setBuscaCategoria('');
    setOpenCategoriaDropdown(false);
  };
  
  const fecharModalCriarPergunta = () => {
    setModalCriarOpen(false);
    setNovaPergunta('');
    setNovaCategoriaId('');
    setNovoTelefone('');
    setBuscaCategoria('');
    setOpenCategoriaDropdown(false);
  };
  
  const salvarPerguntaNova = async (e) => {
    e.preventDefault();
    if (!novaPergunta.trim()) {
      alert('Digite a pergunta.');
      return;
    }
    try {
      let telefoneOperador = '';
      if (user?.email) {
        try {
          const op = await operadoresService.buscarPorEmail(user.email);
          telefoneOperador = op?.usuario_telefone || op?.telefone || op?.celular || op?.phone || op?.telefone_whatsapp || '';
        } catch (e) {
          console.warn('Aviso: não foi possível obter telefone do operador', e?.message);
        }
      }
      await perguntasNaoRespondidasService.criarPerguntaManual({
        textoPergunta: novaPergunta.trim(),
        categoriaId: novaCategoriaId || null,
        operadorId: user?.id || null,
        usuarioTelefone: (novoTelefone || telefoneOperador || '')
      });
      await carregarPerguntas();
      fecharModalCriarPergunta();
      alert('Pergunta criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar pergunta manual:', error);
      alert('Erro ao criar pergunta. Tente novamente.');
    }
  };

  const salvarResposta = async (e) => {
    e.preventDefault();
    
    const currentHtml = editorRef.current?.innerHTML || respostaHtml || '';
    const textoLimpo = currentHtml.replace(/<[^>]+>/g, '').trim();
    if (!textoLimpo) {
      alert('Por favor, digite uma resposta.');
      return;
    }

    setSalvandoResposta(true);
    
    try {
      // Salvar resposta no Supabase
      await perguntasNaoRespondidasService.marcarComoRespondida(
        perguntaSelecionada.id,
        currentHtml,
        user?.id
      );
      
      // Recarregar a lista de perguntas
      await carregarPerguntas();
      
      // Fechar modal e limpar formulário
      setModalOpen(false);
      setPerguntaSelecionada(null);
      setRespostaHtml('');
      
      alert('Resposta salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar resposta:', error);
      alert('Erro ao salvar resposta. Tente novamente.');
    } finally {
      setSalvandoResposta(false);
    }
  };
  
  const apagarResposta = async (id) => {
    if (!id) return;
    const confirmar = window.confirm('Deseja apagar a resposta desta pergunta e voltar para pendente?');
    if (!confirmar) return;
    try {
      await perguntasNaoRespondidasService.apagarResposta(id);
      await carregarPerguntas();
      alert('Resposta apagada e pergunta voltou para pendente.');
    } catch (error) {
      console.error('Erro ao apagar resposta:', error);
      alert('Erro ao apagar resposta. Tente novamente.');
    }
  };

  const perguntasPendentes = perguntas.filter(p => p.status === 'pendente' || !p.status);
  const perguntasRespondidas = perguntas.filter(p => p.status === 'respondida');
  const perPage = 8;
  const getDataPergunta = (p) => {
    const v = p?.created_at || p?.data_hora || p?.updated_at;
    const d = v ? new Date(v) : null;
    return d && !isNaN(d) ? d : new Date(0);
  };
  const getDataResposta = (p) => {
    const v = p?.data_resposta || p?.updated_at || p?.created_at || p?.data_hora;
    const d = v ? new Date(v) : null;
    return d && !isNaN(d) ? d : new Date(0);
  };
  const extractHtmlToText = (html) => (html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const getRespostaTexto = (p) => extractHtmlToText(p?.resposta_manual || p?.resposta || p?.resposta_texto || p?.texto_resposta || '');
  const getRespostaPreview = (p) => {
    const t = getRespostaTexto(p);
    if (t.length <= 60) return t;
    return t.slice(0, 60) + '...';
  };
  const normalize = (s) => (s || '').toString().toLowerCase();
  const matchesSearch = (p) => {
    const term = normalize(searchTerm);
    if (!term) return true;
    const qu = normalize(p?.pergunta || p?.texto);
    const cat = normalize(obterNomeCategoria(p?.categoria_id));
    const op = normalize(obterNomeOperador(p?.operador_id));
    const tel = normalize(p?.usuario_telefone || '');
    const ans = normalize(getRespostaTexto(p));
    return qu.includes(term) || cat.includes(term) || op.includes(term) || tel.includes(term) || ans.includes(term);
  };
  const pendentesFiltradas = perguntasPendentes.filter(matchesSearch);
  const respondidasFiltradas = perguntasRespondidas.filter(matchesSearch);
  const pendentesOrdenadas = [...pendentesFiltradas].sort((a, b) => getDataPergunta(b) - getDataPergunta(a));
  const respondidasOrdenadas = [...respondidasFiltradas].sort((a, b) => getDataResposta(b) - getDataResposta(a));
  const totalPaginasPendentes = Math.max(1, Math.ceil(pendentesOrdenadas.length / perPage));
  const totalPaginasRespondidas = Math.max(1, Math.ceil(respondidasOrdenadas.length / perPage));
  const paginaPendentesCorrigida = Math.min(pagePendentes, totalPaginasPendentes);
  const paginaRespondidasCorrigida = Math.min(pageRespondidas, totalPaginasRespondidas);
  const pendentesPagina = pendentesOrdenadas.slice((paginaPendentesCorrigida - 1) * perPage, paginaPendentesCorrigida * perPage);
  const respondidasPagina = respondidasOrdenadas.slice((paginaRespondidasCorrigida - 1) * perPage, paginaRespondidasCorrigida * perPage);
  useEffect(() => {
    setPagePendentes(1);
    setPageRespondidas(1);
  }, [searchTerm]);

  // Função para formatar data
  const formatarData = (dataString) => {
    if (!dataString) return 'Data não disponível';
    try {
      const data = new Date(dataString);
      return data.toLocaleString('pt-BR');
    } catch {
      return dataString;
    }
  };

 

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <h1 className="page-title">Perguntas não Respondidas</h1>
          
        </div>
        <p className="page-description">Gerencie perguntas que ainda aguardam resposta</p>
        <div style={{ marginTop: '10px' }}>
          <button className="btn-primary" onClick={abrirModalCriarPergunta}>➕ Criar Pergunta</button>
          <input 
            type="text" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            placeholder="Buscar perguntas e respostas..." 
            className="select-search" 
            style={{ maxWidth: '360px' }}
          />
        </div>
      </div>
      
      <div className="page-content">
        {carregando && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Carregando perguntas...</p>
          </div>
        )}

        {erro && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <h3>Erro ao carregar perguntas</h3>
            <p>{erro}</p>
            <button className="btn-primary" onClick={carregarPerguntas}>
              🔄 Tentar Novamente
            </button>
          </div>
        )}

        {!carregando && !erro && (
          <>
            <div style={{ display: 'flex', gap: '8px', margin: '10px 0' }}>
              <button 
                className={activeTab === 'pendentes' ? 'btn-primary' : 'btn-secondary'}
                onClick={() => { setActiveTab('pendentes'); setPagePendentes(1); }}
              >
                Pendentes
              </button>
              <button 
                className={activeTab === 'respondidas' ? 'btn-primary' : 'btn-secondary'}
                onClick={() => { setActiveTab('respondidas'); setPageRespondidas(1); }}
              >
                Respondidas
              </button>
            </div>
            {activeTab === 'pendentes' && (
              <div className="questions-section">
                <h2>Perguntas Pendentes</h2>
                {pendentesOrdenadas.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">✅</div>
                    <h3>Todas as perguntas foram respondidas!</h3>
                    <p>Não há perguntas pendentes no momento.</p>
                  </div>
                ) : (
                  <>
                    <div className="questions-list grid">
                      {pendentesPagina.map(pergunta => (
                        <div 
                          key={pergunta.id} 
                          className="question-card"
                          onClick={() => abrirModalResposta(pergunta)}
                        >
                          <div className="question-content">
                            <h3>{pergunta.pergunta || pergunta.texto}</h3>
                            <div className="question-inline-meta">
                              <span><FontAwesomeIcon icon={faUser} /> {obterNomeOperador(pergunta.operador_id)}</span>
                              <span><FontAwesomeIcon icon={faPhone} /> {pergunta.usuario_telefone || 'Telefone não informado'}</span>
                              <span><FontAwesomeIcon icon={faTag} /> {obterNomeCategoria(pergunta.categoria_id)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                      <button 
                        className="btn-secondary" 
                        onClick={() => setPagePendentes(Math.max(1, paginaPendentesCorrigida - 1))}
                        disabled={paginaPendentesCorrigida <= 1}
                      >
                        ◀ Anterior
                      </button>
                      <span>Página {paginaPendentesCorrigida} de {totalPaginasPendentes}</span>
                      <button 
                        className="btn-secondary" 
                        onClick={() => setPagePendentes(Math.min(totalPaginasPendentes, paginaPendentesCorrigida + 1))}
                        disabled={paginaPendentesCorrigida >= totalPaginasPendentes}
                      >
                        Próxima ▶
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            {activeTab === 'respondidas' && (
              <div className="questions-section">
                <h2>Perguntas Respondidas</h2>
                {respondidasOrdenadas.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">ℹ️</div>
                    <h3>Nenhuma resposta encontrada</h3>
                    <p>Assim que houver respostas, elas aparecerão aqui.</p>
                  </div>
                ) : (
                  <>
                    <div className="questions-list grid">
                      {respondidasPagina.map(pergunta => (
                        <div 
                          key={pergunta.id} 
                          className="question-card answered"
                          onClick={() => abrirModalResposta(pergunta)}
                        >
                          <div className="question-content">
                            <h3>{pergunta.pergunta || pergunta.texto}</h3>
                            <div className="question-inline-meta">
                              <span><FontAwesomeIcon icon={faUser} /> {obterNomeOperador(pergunta.operador_id)}</span>
                              <span><FontAwesomeIcon icon={faPhone} /> {pergunta.usuario_telefone || 'Telefone não informado'}</span>
                              <span><FontAwesomeIcon icon={faTag} /> {obterNomeCategoria(pergunta.categoria_id)}</span>
                            </div>
                            <div className="question-answer">
                              <strong>Resposta:</strong>
                              <div className="question-answer-content">{getRespostaPreview(pergunta)}</div>
                            </div>
                            <div className="question-actions">
                              <button className="btn-secondary btn-delete" onClick={(e) => { e.stopPropagation(); apagarResposta(pergunta.id); }}>
                                Apagar Resposta
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                      <button 
                        className="btn-secondary" 
                        onClick={() => setPageRespondidas(Math.max(1, paginaRespondidasCorrigida - 1))}
                        disabled={paginaRespondidasCorrigida <= 1}
                      >
                        ◀ Anterior
                      </button>
                      <span>Página {paginaRespondidasCorrigida} de {totalPaginasRespondidas}</span>
                      <button 
                        className="btn-secondary" 
                        onClick={() => setPageRespondidas(Math.min(totalPaginasRespondidas, paginaRespondidasCorrigida + 1))}
                        disabled={paginaRespondidasCorrigida >= totalPaginasRespondidas}
                      >
                        Próxima ▶
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal para Responder Pergunta */}
      {modalOpen && perguntaSelecionada && (
        <div className="modal-overlay">
          <div className="modal-content large responder-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Responder Pergunta</h3>
              
            </div>
              <div className="modal-body">
                <div className="modal-info-grid">
                  <div className="modal-question-panel">
                    <div className="modal-question-header">
                      <span className="modal-question-label">Pergunta:</span>
                    </div>
                    <div className="modal-question-text">
                      {perguntaSelecionada.pergunta || perguntaSelecionada.texto}
                    </div>
                  </div>
                  <div className="modal-meta-panel">
                    <div className="modal-meta-item"><FontAwesomeIcon icon={faUser} /> {obterNomeOperador(perguntaSelecionada.operador_id)}</div>
                    <div className="modal-meta-item"><FontAwesomeIcon icon={faPhone} /> {perguntaSelecionada.usuario_telefone || 'Telefone não informado'}</div>
                    <div className="modal-meta-item"><FontAwesomeIcon icon={faCalendar} /> {formatarData(perguntaSelecionada.created_at || perguntaSelecionada.data_hora)}</div>
                    <div className="modal-meta-item"><FontAwesomeIcon icon={faTag} /> {obterNomeCategoria(perguntaSelecionada.categoria_id)}</div>
                  </div>
                </div>

              {perguntaSelecionada.status === 'respondida' ? (
                <div className="modal-answer">
                  <strong>Resposta:</strong>
                  <div 
                    className="modal-answer-content" 
                    dangerouslySetInnerHTML={{ __html: (perguntaSelecionada.resposta_manual || perguntaSelecionada.resposta || perguntaSelecionada.resposta_texto || perguntaSelecionada.texto_resposta || '') }}
                  />
                </div>
              ) : (
                <form id="form-responder" onSubmit={salvarResposta}>
                  <div className="form-group">
                    <label>Sua Resposta *</label>
                    <div className="richtext-toolbar">
                      <button type="button" onClick={() => document.execCommand('bold', false)}><b>B</b></button>
                      <button type="button" onClick={() => document.execCommand('italic', false)}><i>I</i></button>
                      <button type="button" onClick={() => document.execCommand('underline', false)}><u>U</u></button>
                      <button type="button" onClick={() => document.execCommand('insertUnorderedList', false)}>• Lista</button>
                    </div>
                    <div
                      className="richtext-editor"
                      contentEditable
                      suppressContentEditableWarning={true}
                      ref={editorRef}
                      onInput={(e) => setRespostaHtml(e.currentTarget.innerHTML)}
                    />
                  </div>
                </form>
              )}
 
              
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary btn-cancel" 
                onClick={fecharModal}
                disabled={salvandoResposta}
              >
                Cancelar
              </button>
              {perguntaSelecionada.status === 'respondida' ? (
                <button 
                  type="button"
                  className="btn-secondary btn-delete"
                  onClick={() => apagarResposta(perguntaSelecionada.id)}
                  disabled={salvandoResposta}
                >
                  Apagar Resposta
                </button>
              ) : (
                <button 
                  type="submit"
                  form="form-responder"
                  className="btn-primary"
                  disabled={salvandoResposta}
                >
                  {salvandoResposta ? 'Salvando...' : 'Salvar Resposta'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para Criar Pergunta */}
      {modalCriarOpen && (
        <div className="modal-overlay" onClick={fecharModalCriarPergunta}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Criar Pergunta</h3>
              <button className="modal-close" onClick={fecharModalCriarPergunta}>×</button>
            </div>
            <form id="form-criar" className="modal-body" onSubmit={salvarPerguntaNova}>
              <div className="form-group">
                <label>Pergunta *</label>
                <textarea
                  value={novaPergunta}
                  onChange={(e) => setNovaPergunta(e.target.value)}
                  placeholder="Digite a pergunta do cliente..."
                  rows={4}
                  required
                />
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <div className="dropdown-select" onClick={() => setOpenCategoriaDropdown(prev => !prev)}>
                  <span className="dropdown-selected">
                    {novaCategoriaId ? obterNomeCategoria(parseInt(novaCategoriaId)) : 'Selecione (opcional)'}
                  </span>
                  <span className="dropdown-caret">▾</span>
                </div>
                {openCategoriaDropdown && (
                  <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={buscaCategoria}
                      onChange={(e) => setBuscaCategoria(e.target.value)}
                      placeholder="Buscar categoria..."
                      className="dropdown-search-input"
                    />
                    <div className="dropdown-items">
                      {(buscaCategoria ? categorias.filter(cat => (cat.nome || '').toLowerCase().includes(buscaCategoria.toLowerCase())) : categorias)
                        .map(cat => (
                          <div
                            key={cat.id}
                            className={`dropdown-item ${String(novaCategoriaId) === String(cat.id) ? 'selected' : ''}`}
                            onClick={() => { setNovaCategoriaId(String(cat.id)); setOpenCategoriaDropdown(false); }}
                          >
                            {cat.nome}
                          </div>
                        ))
                      }
                      {categorias.length === 0 && (
                        <div className="dropdown-empty">Nenhuma categoria</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Telefone do Cliente</label>
                <input
                  type="text"
                  value={novoTelefone}
                  onChange={(e) => setNovoTelefone(e.target.value)}
                  placeholder="(opcional)"
                />
              </div>
            </form>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={fecharModalCriarPergunta}>Cancelar</button>
              <button type="submit" className="btn-primary" form="form-criar">Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerguntasNaoRespondidas;
