import { supabase } from '../lib/supabase';

export const mensagensService = {
  // Buscar todas as mensagens de um atendimento
  async buscarPorAtendimento(atendimentoId) {
    try {
      console.log('🔍 Buscando mensagens do atendimento:', atendimentoId);
      
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('atendimento_id', atendimentoId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar mensagens:', error);
        throw error;
      }

      console.log('📊 Mensagens encontradas:', data?.length || 0);
      
      // Formatar mensagens para o formato esperado pelo chat
      const mensagensFormatadas = (data || []).map(mensagem => {
        // Normalizar role para garantir compatibilidade com CSS
        let roleNormalizada = mensagem.role?.toLowerCase() || 'cliente';
        
        // Mapear roles específicas
        if (roleNormalizada === 'agente ia' || roleNormalizada === 'agente_ia') {
          roleNormalizada = 'agente';
        }
        
        return {
          id: mensagem.id,
          tipo: roleNormalizada,
          mensagem: mensagem.conteudo,
          timestamp: new Date(mensagem.created_at).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          status: 'entregue',
          created_at: mensagem.created_at,
          role: roleNormalizada,
          type: mensagem.type || 'text',
          document_name: mensagem.document_name,
          file_size: mensagem.file_size,
          file_type: mensagem.file_type,
          conteudo: mensagem.conteudo
        };
      });

      console.log('✅ Mensagens formatadas:', mensagensFormatadas);
      return mensagensFormatadas;
    } catch (error) {
      console.error('❌ Erro no serviço buscarPorAtendimento:', error);
      throw error;
    }
  },

  // Criar nova mensagem
  async criar(mensagemData) {
    try {
      console.log('📝 Criando nova mensagem:', mensagemData);
      
      const mensagemParaInserir = {
        atendimento_id: mensagemData.atendimento_id,
        conteudo: mensagemData.conteudo,
        role: mensagemData.role || 'operador',
        remetente_id: mensagemData.remetente_id,
        created_at: new Date().toISOString()
      };
      
      // Adicionar campos opcionais se existirem
      if (mensagemData.type) mensagemParaInserir.type = mensagemData.type;
      if (mensagemData.document_name) mensagemParaInserir.document_name = mensagemData.document_name;
      if (mensagemData.file_size !== undefined && mensagemData.file_size !== null) {
        mensagemParaInserir.file_size = Number(mensagemData.file_size) || 0;
      }
      if (mensagemData.file_type) mensagemParaInserir.file_type = mensagemData.file_type;
      
      const { data, error } = await supabase
        .from('mensagens')
        .insert([mensagemParaInserir])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar mensagem:', error);
        throw error;
      }

      console.log('✅ Mensagem criada:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro no serviço criar:', error);
      throw error;
    }
  },

  // Enviar mensagem via WhatsApp através da EVO
  async enviarViaWhatsApp(clienteTelefone, mensagem) {
    try {
      console.log('📱 Enviando mensagem via WhatsApp:', { clienteTelefone, mensagem });
      
      const response = await fetch('https://evo.ffconsultoria.tech/message/sendText/Aurax - DEV', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'A1D3B3F1249B-49D0-9C0C-86636AC5B3DD'
        },
        body: JSON.stringify({
          number: clienteTelefone,
          text: mensagem
        })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Mensagem enviada via WhatsApp:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem via WhatsApp:', error);
      throw error;
    }
  },

  // Enviar documento via WhatsApp através da EVO
  async enviarDocumentoViaWhatsApp(clienteTelefone, documentoUrl, atendimentoId, nomeDocumento) {
    try {
      console.log('📄 Enviando documento via WhatsApp:', { 
        clienteTelefone, 
        documentoUrl, 
        atendimentoId, 
        nomeDocumento 
      });
      
      const response = await fetch('https://evo.ffconsultoria.tech/message/sendMedia/Aurax - DEV', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'A1D3B3F1249B-49D0-9C0C-86636AC5B3DD'
        },
        body: JSON.stringify({
          number: clienteTelefone,
          mediaUrl: documentoUrl,
          fileName: nomeDocumento,
          atendimento_id: atendimentoId
        })
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Documento enviado via WhatsApp:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao enviar documento via WhatsApp:', error);
      throw error;
    }
  },

  // Enviar documento via webhook específico
  async enviarDocumentoViaWebhook(clienteTelefone, documentoUrl, atendimentoId, nomeDocumento, fileSize, fileType) {
    try {
      console.log('📄 Enviando documento via webhook:', { 
        clienteTelefone, 
        documentoUrl, 
        atendimentoId, 
        nomeDocumento,
        fileSize,
        fileType
      });
      
      const payload = {
        number: clienteTelefone,
        mediaUrl: documentoUrl,
        fileName: nomeDocumento,
        atendimento_id: atendimentoId,
        fileSize: fileSize,
        fileType: fileType
      };
      
      const response = await fetch('https://webhook.ffconsultoria.tech/webhook/envio-documentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Documento enviado via webhook:', result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao enviar documento via webhook:', error);
      throw error;
    }
  },

  // Converter imagem para base64
  async converterImagemParaBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove o prefixo "data:image/...;base64," para obter apenas o base64
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Enviar imagem via webhook (convertida para base64)
  async enviarImagemViaWebhook(clienteTelefone, file, atendimentoId, nomeImagem, fileSize, fileType) {
    try {
      console.log('📸 Convertendo e enviando imagem via webhook:', { 
        clienteTelefone, 
        atendimentoId, 
        nomeImagem,
        fileSize,
        fileType
      });
      
      // Converter imagem para base64
      const base64 = await this.converterImagemParaBase64(file);
      
      const payload = {
        number: clienteTelefone,
        base64: base64,
        fileName: nomeImagem,
        atendimento_id: atendimentoId,
        fileSize: fileSize,
        fileType: fileType
      };
      
      const response = await fetch('https://webhook.ffconsultoria.tech/webhook/envio-documentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Imagem enviada via webhook (base64):', result);
      return result;
    } catch (error) {
      console.error('❌ Erro ao enviar imagem via webhook:', error);
      throw error;
    }
  },

  // Buscar a última mensagem de um atendimento
  async buscarUltima(atendimentoId) {
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('atendimento_id', atendimentoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Erro ao buscar última mensagem:', error);
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('❌ Erro no serviço buscarUltima:', error);
      throw error;
    }
  },

  // Formatar role para exibição
  formatarRole(role) {
    switch (role) {
      case 'cliente':
        return 'Cliente';
      case 'operador':
        return 'Operador';
      case 'ia':
      case 'agente':
        return 'Agente IA';
      case 'sistema':
        return 'Sistema';
      default:
        return role || 'Cliente';
    }
  }
};

export default mensagensService;