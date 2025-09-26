import { supabase } from '../lib/supabase.js'

/**
 * Serviço para gerenciar arquivos no Supabase Storage
 */

// Nome do bucket principal
const BUCKET_NAME = 'documents'

/**
 * Cria o bucket principal se não existir
 */
export const createBucketIfNotExists = async () => {
  try {
    // Verifica se o bucket já existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Erro ao listar buckets:', listError)
      return { success: false, error: listError }
    }

    const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME)
    
    if (!bucketExists) {
      // Cria o bucket privado
      const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        allowedMimeTypes: [
          'image/jpeg',
          'image/png', 
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain'
        ],
        fileSizeLimit: 10485760 // 10MB
      })
      
      if (error) {
        console.error('Erro ao criar bucket:', error)
        return { success: false, error }
      }
      
      console.log('Bucket criado com sucesso:', data)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Erro ao criar bucket:', error)
    return { success: false, error }
  }
}

/**
 * Faz upload de um arquivo para o storage
 * @param {File} file - Arquivo a ser enviado
 * @param {string} type - Tipo do arquivo ('images' ou 'documents')
 * @param {string} atendimentoId - ID do atendimento
 * @returns {Promise<{success: boolean, url?: string, error?: any}>}
 */
export const uploadFile = async (file, type, atendimentoId) => {
  try {
    // Gera um nome único para o arquivo
    const timestamp = Date.now()
    // Sanitiza o nome do arquivo removendo caracteres especiais
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Substitui caracteres especiais por underscore
      .replace(/_{2,}/g, '_') // Remove underscores duplos
      .replace(/^_|_$/g, '') // Remove underscores no início e fim
    const fileName = `${timestamp}_${sanitizedName}`
    
    // Define a pasta baseada no tipo: 'documents' vai para 'files', 'images' vai para 'images'
    const folder = type === 'documents' ? 'files' : 'images'
    const filePath = `${folder}/${atendimentoId}/${fileName}`
    
    // Faz o upload do arquivo
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) {
      console.error('Erro ao fazer upload:', error)
      return { success: false, error }
    }
    
    // Gera URL assinada para o arquivo (válida por 1 ano)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 31536000) // 1 ano em segundos
    
    if (urlError) {
      console.error('Erro ao gerar URL:', urlError)
      return { success: false, error: urlError }
    }
    
    return {
      success: true,
      url: urlData.signedUrl,
      path: filePath,
      fileName: file.name,
      fileSize: file.size || 0, // Garantir que sempre tenha um valor
      fileType: file.type || 'application/octet-stream' // Tipo padrão se não especificado
    }
  } catch (error) {
    console.error('Erro no upload:', error)
    return { success: false, error }
  }
}

/**
 * Deleta um arquivo do storage
 * @param {string} filePath - Caminho do arquivo no storage
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export const deleteFile = async (filePath) => {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])
    
    if (error) {
      console.error('Erro ao deletar arquivo:', error)
      return { success: false, error }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error)
    return { success: false, error }
  }
}

/**
 * Gera uma nova URL assinada para um arquivo
 * @param {string} filePath - Caminho do arquivo no storage
 * @param {number} expiresIn - Tempo de expiração em segundos (padrão: 1 hora)
 * @returns {Promise<{success: boolean, url?: string, error?: any}>}
 */
export const getSignedUrl = async (filePath, expiresIn = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn)
    
    if (error) {
      console.error('Erro ao gerar URL assinada:', error)
      return { success: false, error }
    }
    
    return { success: true, url: data.signedUrl }
  } catch (error) {
    console.error('Erro ao gerar URL assinada:', error)
    return { success: false, error }
  }
}

/**
 * Lista arquivos de um atendimento
 * @param {string} atendimentoId - ID do atendimento
 * @param {string} type - Tipo dos arquivos ('images' ou 'documents')
 * @returns {Promise<{success: boolean, files?: any[], error?: any}>}
 */
export const listFiles = async (atendimentoId, type) => {
  try {
    // Define a pasta baseada no tipo: 'document' vai para 'files', 'photo' vai para 'images'
    const folder = type === 'document' ? 'files' : 'images'
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(`${folder}/${atendimentoId}`)
    
    if (error) {
      console.error('Erro ao listar arquivos:', error)
      return { success: false, error }
    }
    
    return { success: true, files: data }
  } catch (error) {
    console.error('Erro ao listar arquivos:', error)
    return { success: false, error }
  }
}

export { BUCKET_NAME }