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

  // Resetar status de atendimento sempre que o usuário fizer login
  useEffect(() => {
    if (user) {
      setAtendimentoHabilitado(false);
      setAtendimentoPausado(false);
      if (intervaloPausa) {
        clearInterval(intervaloPausa);
        setIntervaloPausa(null);
      }
    }
  }, [user, setAtendimentoHabilitado, setAtendimentoPausado]);

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
      
      <div className="page-content">
        <div className="content-placeholder">
          <div className="placeholder-icon">📞</div>
          <h3>Página em Desenvolvimento</h3>
          <p>Esta página será implementada em breve com todas as funcionalidades de atendimento.</p>
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
    </div>
  );
};

export default Dashboard;