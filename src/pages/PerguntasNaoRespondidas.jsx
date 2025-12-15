import React, { useState, useEffect, useRef } from 'react';
import './PageStyles.css';
import './PerguntasNaoRespondidas.css';
import { perguntasNaoRespondidasService } from '../services/perguntasNaoRespondidasService';
import { categoriasService } from '../services/categoriasService';
import operadoresService from '../services/operadoresService';
import { useAuth } from '../context/AuthContext';

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

  // Função para calcular tempo sem resposta
  const calcularTempoSemResposta = (dataString) => {
    if (!dataString) return 'Tempo indeterminado';
    try {
      const dataCriacao = new Date(dataString);
      const agora = new Date();
      const diferencaMs = agora - dataCriacao;
      
      const minutos = Math.floor(diferencaMs / (1000 * 60));
      const horas = Math.floor(minutos / 60);
      const dias = Math.floor(horas / 24);
      
      if (dias > 0) {
        return `${dias} dia${dias > 1 ? 's' : ''}`;
      } else if (horas > 0) {
        return `${horas} hora${horas > 1 ? 's' : ''}`;
      } else if (minutos > 0) {
        return `${minutos} minuto${minutos > 1 ? 's' : ''}`;
      } else {
        return 'Menos de 1 minuto';
      }
    } catch {
      return 'Tempo indeterminado';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Perguntas não Respondidas</h1>
        <p className="page-description">Gerencie perguntas que ainda aguardam resposta</p>
        <div style={{ marginTop: '10px' }}>
          <button className="btn-primary" onClick={abrirModalCriarPergunta}>➕ Criar Pergunta</button>
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
            <div className="questions-section">
              <h2>Perguntas Pendentes</h2>
              {perguntasPendentes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <h3>Todas as perguntas foram respondidas!</h3>
                  <p>Não há perguntas pendentes no momento.</p>
                </div>
              ) : (
                <div className="questions-list">
                  {perguntasPendentes.map(pergunta => (
                    <div key={pergunta.id} className="question-card">
                      <div className="question-header">
                        <div className="question-meta">
                          <span className="question-user">👤 {obterNomeOperador(pergunta.operador_id)}</span>
                          <span className="question-date">📅 {formatarData(pergunta.created_at || pergunta.data_hora)}</span>
                          <span className="question-category">🏷️ {obterNomeCategoria(pergunta.categoria_id)}</span>
                        </div>
                        <div className="question-time-pending">
                          <span className="time-pending">⏰ Sem resposta há {calcularTempoSemResposta(pergunta.created_at || pergunta.data_hora)}</span>
                        </div>
                      </div>
                      <div className="question-content">
                        <h3>{pergunta.pergunta || pergunta.texto}</h3>
                      </div>
                      <div className="question-actions">
                        <button 
                          className="btn-primary"
                          onClick={() => abrirModalResposta(pergunta)}
                        >
                          📝 Responder
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
        </div>

            {perguntasRespondidas.length > 0 && (
              <div className="questions-section">
                <h2>Perguntas Respondidas Recentemente</h2>
                <div className="questions-list">
                  {perguntasRespondidas.slice(0, 3).map(pergunta => (
                    <div key={pergunta.id} className="question-card answered">
                      <div className="question-header">
                        <div className="question-meta">
                          <span className="question-user">👤 {obterNomeOperador(pergunta.operador_id)}</span>
                          <span className="question-date">📅 {formatarData(pergunta.created_at || pergunta.data_hora)}</span>
                          <span className="question-category">🏷️ {obterNomeCategoria(pergunta.categoria_id)}</span>
                        </div>
                        <div className="question-status">
                          <span className="status-badge answered">✅ Respondida em {formatarData(pergunta.data_resposta || pergunta.updated_at)}</span>
                        </div>
                      </div>
                      <div className="question-content">
                        <h3>{pergunta.pergunta || pergunta.texto}</h3>
                        <div className="question-answer">
                          <strong>Resposta:</strong>
                          <div 
                            className="question-answer-content" 
                            dangerouslySetInnerHTML={{ __html: (pergunta.resposta_manual || pergunta.resposta || pergunta.resposta_texto || pergunta.texto_resposta || '') }}
                          />
                        </div>
                        <div className="question-actions">
                          <button className="btn-secondary" onClick={() => apagarResposta(pergunta.id)}>
                            Apagar Resposta
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal para Responder Pergunta */}
      {modalOpen && perguntaSelecionada && (
        <div className="modal-overlay" onClick={fecharModal}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Responder Pergunta</h3>
              <button className="modal-close" onClick={fecharModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="question-details">
                <div className="detail-row">
                  <strong>Usuário:</strong> {obterNomeOperador(perguntaSelecionada.operador_id)}
                </div>
                <div className="detail-row">
                  <strong>Telefone do Cliente:</strong> {perguntaSelecionada.usuario_telefone || 'Telefone não informado'}
                </div>
                <div className="detail-row">
                  <strong>Data/Hora:</strong> {formatarData(perguntaSelecionada.created_at || perguntaSelecionada.data_hora)}
                </div>
                <div className="detail-row">
                  <strong>Categoria:</strong> {obterNomeCategoria(perguntaSelecionada.categoria_id)}
                </div>
              </div>
              
              <div className="question-text">
                <h4>Pergunta:</h4>
                <p>{perguntaSelecionada.pergunta || perguntaSelecionada.texto}</p>
              </div>

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
 
              
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={fecharModal}
                disabled={salvandoResposta}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="form-responder"
                className="btn-primary"
                disabled={salvandoResposta}
              >
                {salvandoResposta ? '💾 Salvando...' : '💾 Salvar Resposta'}
              </button>
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
