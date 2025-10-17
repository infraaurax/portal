// Serviço para gerenciar observações dos atendimentos

// Mock data para observações
const mockObservacoes = [
  {
    id: 1,
    atendimento_id: 1,
    operador_id: 1,
    observacao: 'Cliente demonstrou interesse em produtos premium',
    data_criacao: '2024-01-15T10:30:00Z',
    tipo: 'info'
  },
  {
    id: 2,
    atendimento_id: 1,
    operador_id: 2,
    observacao: 'Necessário follow-up em 48 horas',
    data_criacao: '2024-01-15T14:20:00Z',
    tipo: 'importante'
  },
  {
    id: 3,
    atendimento_id: 2,
    operador_id: 1,
    observacao: 'Cliente relatou problema técnico resolvido',
    data_criacao: '2024-01-16T09:15:00Z',
    tipo: 'resolucao'
  }
];

let proximoId = 4;

const observacoesService = {
  // Buscar todas as observações de um atendimento
  async buscarPorAtendimento(atendimentoId) {
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const observacoes = mockObservacoes.filter(
        obs => obs.atendimento_id === parseInt(atendimentoId)
      );
      
      return {
        success: true,
        data: observacoes.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao))
      };
    } catch (error) {
      console.error('Erro ao buscar observações:', error);
      return {
        success: false,
        error: 'Erro ao carregar observações'
      };
    }
  },

  // Criar nova observação
  async criar(dadosObservacao) {
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const novaObservacao = {
        id: proximoId++,
        atendimento_id: dadosObservacao.atendimento_id,
        operador_id: dadosObservacao.operador_id,
        observacao: dadosObservacao.observacao,
        data_criacao: new Date().toISOString(),
        tipo: dadosObservacao.tipo || 'info'
      };
      
      mockObservacoes.push(novaObservacao);
      
      return {
        success: true,
        data: novaObservacao
      };
    } catch (error) {
      console.error('Erro ao criar observação:', error);
      return {
        success: false,
        error: 'Erro ao salvar observação'
      };
    }
  },

  // Atualizar observação existente
  async atualizar(id, dadosAtualizacao) {
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const index = mockObservacoes.findIndex(obs => obs.id === parseInt(id));
      
      if (index === -1) {
        return {
          success: false,
          error: 'Observação não encontrada'
        };
      }
      
      mockObservacoes[index] = {
        ...mockObservacoes[index],
        ...dadosAtualizacao,
        data_atualizacao: new Date().toISOString()
      };
      
      return {
        success: true,
        data: mockObservacoes[index]
      };
    } catch (error) {
      console.error('Erro ao atualizar observação:', error);
      return {
        success: false,
        error: 'Erro ao atualizar observação'
      };
    }
  },

  // Excluir observação
  async excluir(id) {
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const index = mockObservacoes.findIndex(obs => obs.id === parseInt(id));
      
      if (index === -1) {
        return {
          success: false,
          error: 'Observação não encontrada'
        };
      }
      
      const observacaoRemovida = mockObservacoes.splice(index, 1)[0];
      
      return {
        success: true,
        data: observacaoRemovida
      };
    } catch (error) {
      console.error('Erro ao excluir observação:', error);
      return {
        success: false,
        error: 'Erro ao excluir observação'
      };
    }
  },

  // Buscar observações por tipo
  async buscarPorTipo(atendimentoId, tipo) {
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const observacoes = mockObservacoes.filter(
        obs => obs.atendimento_id === parseInt(atendimentoId) && obs.tipo === tipo
      );
      
      return {
        success: true,
        data: observacoes.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao))
      };
    } catch (error) {
      console.error('Erro ao buscar observações por tipo:', error);
      return {
        success: false,
        error: 'Erro ao carregar observações'
      };
    }
  },

  // Contar observações por atendimento
  async contarPorAtendimento(atendimentoId) {
    try {
      const count = mockObservacoes.filter(
        obs => obs.atendimento_id === parseInt(atendimentoId)
      ).length;
      
      return {
        success: true,
        data: { count }
      };
    } catch (error) {
      console.error('Erro ao contar observações:', error);
      return {
        success: false,
        error: 'Erro ao contar observações'
      };
    }
  },

  // Buscar observações recentes (últimas 24 horas)
  async buscarRecentes(atendimentoId) {
    try {
      const agora = new Date();
      const vintEQuatroHorasAtras = new Date(agora.getTime() - (24 * 60 * 60 * 1000));
      
      const observacoes = mockObservacoes.filter(obs => {
        const dataObservacao = new Date(obs.data_criacao);
        return obs.atendimento_id === parseInt(atendimentoId) && 
               dataObservacao >= vintEQuatroHorasAtras;
      });
      
      return {
        success: true,
        data: observacoes.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao))
      };
    } catch (error) {
      console.error('Erro ao buscar observações recentes:', error);
      return {
        success: false,
        error: 'Erro ao carregar observações recentes'
      };
    }
  },

  // Validar dados da observação
  validarObservacao(dados) {
    const erros = [];
    
    if (!dados.observacao || dados.observacao.trim().length === 0) {
      erros.push('Observação é obrigatória');
    }
    
    if (dados.observacao && dados.observacao.length > 1000) {
      erros.push('Observação deve ter no máximo 1000 caracteres');
    }
    
    if (!dados.atendimento_id) {
      erros.push('ID do atendimento é obrigatório');
    }
    
    if (!dados.operador_id) {
      erros.push('ID do operador é obrigatório');
    }
    
    const tiposValidos = ['info', 'importante', 'resolucao', 'problema', 'followup'];
    if (dados.tipo && !tiposValidos.includes(dados.tipo)) {
      erros.push('Tipo de observação inválido');
    }
    
    return {
      valido: erros.length === 0,
      erros
    };
  },

  // Obter tipos de observação disponíveis
  getTiposObservacao() {
    return [
      { value: 'info', label: 'Informação', color: '#3b82f6' },
      { value: 'importante', label: 'Importante', color: '#f97316' },
      { value: 'resolucao', label: 'Resolução', color: '#10b981' },
      { value: 'problema', label: 'Problema', color: '#dc2626' },
      { value: 'followup', label: 'Follow-up', color: '#221C62' }
    ];
  }
};

export default observacoesService;