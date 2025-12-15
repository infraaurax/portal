import { supabase } from '../lib/supabase'

export const categoriasService = {
  // Listar todas as categorias
  async listar() {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('ativo', true)
        .order('indice', { ascending: true })

      if (error) {
        console.error('Erro ao listar categorias:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Erro no serviço de categorias:', error)
      throw error
    }
  },

  // Listar categorias hierárquicas (organizadas por nível)
  async listarHierarquicas() {
    try {
      const categorias = await this.listar()
      
      // Organizar em estrutura hierárquica
      const categoriasMap = new Map()
      const raizes = []

      // Primeiro, criar o mapa de todas as categorias
      categorias.forEach(categoria => {
        categoriasMap.set(categoria.id, { ...categoria, filhos: [] })
      })

      // Depois, organizar a hierarquia
      categorias.forEach(categoria => {
        const categoriaComFilhos = categoriasMap.get(categoria.id)
        
        if (categoria.pai_id) {
          // É uma subcategoria
          const pai = categoriasMap.get(categoria.pai_id)
          if (pai) {
            pai.filhos.push(categoriaComFilhos)
          }
        } else {
          // É uma categoria raiz
          raizes.push(categoriaComFilhos)
        }
      })

      return raizes
    } catch (error) {
      console.error('Erro ao listar categorias hierárquicas:', error)
      throw error
    }
  },

  // Buscar categoria por ID
  async buscarPorId(id) {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erro ao buscar categoria:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro ao buscar categoria por ID:', error)
      throw error
    }
  },

  // Criar nova categoria
  async criar(dadosCategoria) {
    try {
      // Gerar próximo índice
      const indice = await this.gerarProximoIndice(dadosCategoria.pai_id)
      
      const { data, error } = await supabase
        .from('categorias')
        .insert({
          nome: dadosCategoria.nome,
          nivel: dadosCategoria.pai_id ? 1 : 0, // Se tem pai, é nível 1, senão é 0
          pai_id: dadosCategoria.pai_id || null,
          indice: indice,
          ativo: true
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar categoria:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      throw error
    }
  },

  // Atualizar categoria
  async atualizar(id, dadosCategoria) {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .update({
          nome: dadosCategoria.nome,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar categoria:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error)
      throw error
    }
  },

  // Desativar categoria (soft delete)
  async desativar(id) {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .update({ 
          ativo: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao desativar categoria:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro ao desativar categoria:', error)
      throw error
    }
  },
  
  async desativarRecursivo(id) {
    try {
      const { data: filhos, error: filhosError } = await supabase
        .from('categorias')
        .select('id')
        .eq('pai_id', id)
        .eq('ativo', true);
      if (filhosError) {
        console.error('Erro ao buscar subcategorias para exclusão:', filhosError);
        throw filhosError;
      }
      for (const filho of filhos || []) {
        await this.desativarRecursivo(filho.id);
      }
      return await this.desativar(id);
    } catch (error) {
      console.error('Erro ao desativar categoria em cascata:', error);
      throw error;
    }
  },
  
  // Excluir categoria sem cascata: promove filhos para o pai da categoria
  async excluirPromovendoFilhos(id) {
    try {
      const { data: categoria, error: catError } = await supabase
        .from('categorias')
        .select('id, pai_id')
        .eq('id', id)
        .single();
      if (catError) throw catError;
      const novoPaiId = categoria?.pai_id || null;
      
      const { error: upError } = await supabase
        .from('categorias')
        .update({ pai_id: novoPaiId, updated_at: new Date().toISOString() })
        .eq('pai_id', id)
        .eq('ativo', true);
      if (upError) throw upError;
      
      return await this.desativar(id);
    } catch (error) {
      console.error('Erro ao excluir promovendo filhos:', error);
      throw error;
    }
  },
  
  // Propagar novo índice recursivamente para filhos
  async propagarIndice(categoriaId, novoIndice) {
    try {
      const { error: updError } = await supabase
        .from('categorias')
        .update({ indice: novoIndice, updated_at: new Date().toISOString() })
        .eq('id', categoriaId);
      if (updError) throw updError;
      
      const { data: filhos, error: filhosError } = await supabase
        .from('categorias')
        .select('id, indice')
        .eq('pai_id', categoriaId)
        .eq('ativo', true)
        .order('indice', { ascending: true });
      if (filhosError) throw filhosError;
      
      for (let i = 0; i < (filhos || []).length; i++) {
        const filho = filhos[i];
        const novoIndiceFilho = `${novoIndice}.${i + 1}`;
        await this.propagarIndice(filho.id, novoIndiceFilho);
      }
    } catch (error) {
      console.error('Erro ao propagar índice:', error);
      throw error;
    }
  },
  
  // Reordenar índices dos irmãos após exclusão (preencher buraco)
  async renumerarAposExclusao(paiId = null) {
    try {
      if (!paiId) {
        // Reordenar categorias raiz de A, B, C...
        const { data: raizes, error } = await supabase
          .from('categorias')
          .select('id, indice')
          .is('pai_id', null)
          .eq('ativo', true)
          .order('indice', { ascending: true });
        if (error) throw error;
        
        for (let i = 0; i < (raizes || []).length; i++) {
          const categoria = raizes[i];
          const novaLetra = String.fromCharCode('A'.charCodeAt(0) + i);
          await this.propagarIndice(categoria.id, novaLetra);
        }
      } else {
        // Reordenar subcategorias 1, 2, 3...
        const { data: pai, error: paiError } = await supabase
          .from('categorias')
          .select('id, indice')
          .eq('id', paiId)
          .single();
        if (paiError) throw paiError;
        
        const { data: irmãos, error: irmError } = await supabase
          .from('categorias')
          .select('id, indice')
          .eq('pai_id', paiId)
          .eq('ativo', true)
          .order('indice', { ascending: true });
        if (irmError) throw irmError;
        
        for (let i = 0; i < (irmãos || []).length; i++) {
          const cat = irmãos[i];
          const novoIndice = `${pai.indice}.${i + 1}`;
          await this.propagarIndice(cat.id, novoIndice);
        }
      }
    } catch (error) {
      console.error('Erro ao renumerar após exclusão:', error);
      throw error;
    }
  },

  // Reativar categoria
  async reativar(id) {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .update({ 
          ativo: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao reativar categoria:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Erro ao reativar categoria:', error)
      throw error
    }
  },

  // Gerar próximo índice para categoria
  async gerarProximoIndice(paiId = null) {
    try {
      if (!paiId) {
        // Categoria raiz - buscar próxima letra
        const { data, error } = await supabase
          .from('categorias')
          .select('indice')
          .is('pai_id', null)
          .order('indice', { ascending: false })
          .limit(1)

        if (error) throw error

        if (!data || data.length === 0) {
          return 'A' // Primeira categoria
        }

        const ultimoIndice = data[0].indice
        const proximaLetra = String.fromCharCode(ultimoIndice.charCodeAt(0) + 1)
        return proximaLetra
      } else {
        // Subcategoria - buscar próximo número
        const { data: pai } = await supabase
          .from('categorias')
          .select('indice')
          .eq('id', paiId)
          .single()

        if (!pai) throw new Error('Categoria pai não encontrada')

        const { data, error } = await supabase
          .from('categorias')
          .select('indice')
          .eq('pai_id', paiId)
          .order('indice', { ascending: false })
          .limit(1)

        if (error) throw error

        if (!data || data.length === 0) {
          return `${pai.indice}.1` // Primeira subcategoria
        }

        const ultimoIndice = data[0].indice
        const partes = ultimoIndice.split('.')
        const proximoNumero = parseInt(partes[partes.length - 1]) + 1
        return `${pai.indice}.${proximoNumero}`
      }
    } catch (error) {
      console.error('Erro ao gerar próximo índice:', error)
      throw error
    }
  },

  // Listar subcategorias de uma categoria
  async listarSubcategorias(paiId) {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('pai_id', paiId)
        .eq('ativo', true)
        .order('indice', { ascending: true })

      if (error) {
        console.error('Erro ao listar subcategorias:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Erro ao listar subcategorias:', error)
      throw error
    }
  },

  // Verificar se categoria tem subcategorias
  async temSubcategorias(id) {
    try {
      const { count, error } = await supabase
        .from('categorias')
        .select('*', { count: 'exact', head: true })
        .eq('pai_id', id)
        .eq('ativo', true)

      if (error) {
        console.error('Erro ao verificar subcategorias:', error)
        throw error
      }

      return count > 0
    } catch (error) {
      console.error('Erro ao verificar subcategorias:', error)
      throw error
    }
  }
}

export default categoriasService
